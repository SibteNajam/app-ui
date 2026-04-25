'use client';
// @ts-nocheck
import { useRef, useMemo, useState, useEffect, useCallback } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

/*
  ╔══════════════════════════════════════════════════════════════╗
  ║  AIR TRAFFIC SYSTEM v2 — Cinema-quality Flyby Objects       ║
  ╠══════════════════════════════════════════════════════════════╣
  ║  • Fighter jets with afterburner particle trails             ║
  ║  • Commercial airliners with contrail vapor streams          ║
  ║  • Tumbling asteroids with debris particle clouds            ║
  ║  • Realistic perspective: tiny at 120+ units, fills view     ║
  ║    at closest approach (2-5 units from radar core)           ║
  ║  • Stochastic spawn with quiet/busy/normal traffic modes     ║
  ║  • Detection pulse when objects cross radar sweep field      ║
  ║  • BYTEBOOM livery on all aircraft                           ║
  ╚══════════════════════════════════════════════════════════════╝
*/

// ─── CONFIGURATION ─────────────────────────────────────────
const MAX_CONCURRENT = 3
const SPAWN_RANGE = 140        // how far objects spawn/despawn
const CLOSEST_APPROACH = 3     // minimum approach to radar center
const FAR_SCALE = 0.008        // scale multiplier at max distance
const NEAR_SCALE = 1.0         // scale multiplier at closest approach

// Spawn timing — irregular patterns that feel organic
const SPAWN_INTERVALS = {
  busy:   { min: 6,  max: 12 },   // bursts of traffic
  normal: { min: 14, max: 28 },   // moderate gaps
  quiet:  { min: 35, max: 75 },   // long silence — nothing at all
}

// Higher weight on quiet and normal = most of the time the sky is calm
const PATTERN_WEIGHTS = [
  { pattern: 'quiet',  weight: 0.40 },
  { pattern: 'normal', weight: 0.38 },
  { pattern: 'busy',   weight: 0.22 },
]

// Object type distribution
const OBJECT_TYPES = [
  { type: 'jet',      weight: 0.30 },
  { type: 'airliner', weight: 0.35 },
  { type: 'asteroid',  weight: 0.35 },
]

// ─── HELPERS ───────────────────────────────────────────────
function weightedRandom(items) {
  const total = items.reduce((s, i) => s + i.weight, 0)
  let r = Math.random() * total
  for (const item of items) {
    r -= item.weight
    if (r <= 0) return item
  }
  return items[items.length - 1]
}

function randomRange(min, max) {
  return min + Math.random() * (max - min)
}

function randomSpherePoint(radius, yBias = 0.3) {
  const theta = Math.random() * Math.PI * 2
  const phi = 0.3 + Math.random() * 2.4  // avoid poles
  return new THREE.Vector3(
    radius * Math.sin(phi) * Math.cos(theta),
    (Math.random() - yBias) * radius * 0.45,
    radius * Math.sin(phi) * Math.sin(theta)
  )
}

function generateFlightPath() {
  const entry = randomSpherePoint(SPAWN_RANGE, 0.3)
  
  // Exit on roughly opposite hemisphere with variance
  const exitTheta = Math.atan2(entry.z, entry.x) + Math.PI + (Math.random() - 0.5) * 1.4
  const exitPhi = 0.3 + Math.random() * 2.4
  const exit = new THREE.Vector3(
    SPAWN_RANGE * Math.sin(exitPhi) * Math.cos(exitTheta),
    (Math.random() - 0.3) * SPAWN_RANGE * 0.45,
    SPAWN_RANGE * Math.sin(exitPhi) * Math.sin(exitTheta)
  )

  // Waypoint determines how close the flyby gets to radar center
  const passDistance = CLOSEST_APPROACH + Math.random() * 18
  const wpAngle = Math.random() * Math.PI * 2
  const wpY = (Math.random() - 0.5) * 8
  const waypoint = new THREE.Vector3(
    Math.cos(wpAngle) * passDistance,
    wpY,
    Math.sin(wpAngle) * passDistance
  )

  // ── MAGNETIC FIELD BENDING ──
  // Bend waypoints tangentially along the radar's circular field lines
  // This creates gentle arcs instead of sharp straight cuts through the field
  const bendDir = Math.random() > 0.5 ? 1 : -1
  const tangent1 = new THREE.Vector3(-Math.sin(wpAngle), 0, Math.cos(wpAngle))
  const bendStrength1 = (0.3 + Math.random() * 0.6) * passDistance * 0.5
  waypoint.add(tangent1.clone().multiplyScalar(bendStrength1 * bendDir))

  // Second waypoint — also bent along same circular direction for smooth arc
  const wp2Angle = wpAngle + bendDir * (0.4 + Math.random() * 1.2)
  const wp2Dist = passDistance + Math.random() * 12
  const tangent2 = new THREE.Vector3(-Math.sin(wp2Angle), 0, Math.cos(wp2Angle))
  const bendStrength2 = (0.2 + Math.random() * 0.5) * wp2Dist * 0.4
  const waypoint2 = new THREE.Vector3(
    Math.cos(wp2Angle) * wp2Dist,
    wpY + (Math.random() - 0.5) * 4,
    Math.sin(wp2Angle) * wp2Dist
  )
  waypoint2.add(tangent2.clone().multiplyScalar(bendStrength2 * bendDir))

  return { entry, exit, waypoint, waypoint2 }
}

// ─── EXHAUST PARTICLE SYSTEM ──────────────────────────────
// GPU-friendly particle trail that persists in world space
function ExhaustTrail({ parentRef, type, config }) {
  const pointsRef = useRef()
  const PARTICLE_COUNT = type === 'jet' ? 80 : type === 'airliner' ? 120 : 0
  
  const particleData = useMemo(() => {
    if (PARTICLE_COUNT === 0) return null
    const positions = new Float32Array(PARTICLE_COUNT * 3)
    const colors = new Float32Array(PARTICLE_COUNT * 3)
    const sizes = new Float32Array(PARTICLE_COUNT)
    const lifetimes = new Float32Array(PARTICLE_COUNT)
    const velocities = []
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3] = 0
      positions[i * 3 + 1] = -9999 // hidden initially
      positions[i * 3 + 2] = 0
      sizes[i] = 0
      lifetimes[i] = -1 // inactive
      velocities.push(new THREE.Vector3())
    }
    return { positions, colors, sizes, lifetimes, velocities, nextIdx: { v: 0 } }
  }, [PARTICLE_COUNT])

  const baseColor = useMemo(() => {
    if (type === 'jet') return new THREE.Color('#ff6600')
    if (type === 'airliner') return new THREE.Color('#aaccff')
    return new THREE.Color('#ffffff')
  }, [type])

  useFrame((state, delta) => {
    if (!particleData || !pointsRef.current || !parentRef.current) return
    const dt = Math.min(delta, 0.05)
    const { positions, colors, sizes, lifetimes, velocities, nextIdx } = particleData
    const geo = pointsRef.current.geometry
    
    // Get parent world position for emission point
    const worldPos = new THREE.Vector3()
    parentRef.current.getWorldPosition(worldPos)
    
    // Get parent forward direction (for exhaust direction)
    const worldDir = new THREE.Vector3(0, 0, -1)
    parentRef.current.getWorldDirection(worldDir)
    worldDir.negate() // exhaust goes backward
    
    const parentScale = parentRef.current.scale.x // uniform scale
    
    // Emit 2-4 particles per frame when visible
    if (parentScale > 0.02) {
      const emitCount = type === 'jet' ? 3 : 2
      for (let e = 0; e < emitCount; e++) {
        const i = nextIdx.v % PARTICLE_COUNT
        nextIdx.v++
        
        // Position at exhaust point
        const offset = worldDir.clone().multiplyScalar(0.3 * parentScale)
        positions[i * 3] = worldPos.x + offset.x + (Math.random() - 0.5) * 0.1 * parentScale
        positions[i * 3 + 1] = worldPos.y + offset.y + (Math.random() - 0.5) * 0.1 * parentScale
        positions[i * 3 + 2] = worldPos.z + offset.z + (Math.random() - 0.5) * 0.1 * parentScale
        
        // Velocity — mostly backward + some spread
        const speed = type === 'jet' ? 3.5 : 1.5
        velocities[i].copy(worldDir).multiplyScalar(speed * parentScale)
        velocities[i].x += (Math.random() - 0.5) * 0.8 * parentScale
        velocities[i].y += (Math.random() - 0.5) * 0.8 * parentScale
        velocities[i].z += (Math.random() - 0.5) * 0.8 * parentScale
        
        lifetimes[i] = 1.0
        sizes[i] = (type === 'jet' ? 0.12 : 0.08) * parentScale
        
        // Hot core color
        if (type === 'jet') {
          colors[i * 3] = 1.0
          colors[i * 3 + 1] = 0.7 + Math.random() * 0.3
          colors[i * 3 + 2] = 0.2
        } else {
          colors[i * 3] = 0.7
          colors[i * 3 + 1] = 0.85
          colors[i * 3 + 2] = 1.0
        }
      }
    }
    
    // Update all particles
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      if (lifetimes[i] <= 0) continue
      
      lifetimes[i] -= dt * (type === 'jet' ? 1.2 : 0.6)
      
      if (lifetimes[i] <= 0) {
        positions[i * 3 + 1] = -9999
        sizes[i] = 0
        continue
      }
      
      // Physics
      positions[i * 3] += velocities[i].x * dt
      positions[i * 3 + 1] += velocities[i].y * dt
      positions[i * 3 + 2] += velocities[i].z * dt
      
      // Drag
      velocities[i].multiplyScalar(0.96)
      
      // Fade and grow
      const life = lifetimes[i]
      sizes[i] *= 1.003  // slowly expand
      
      // Color fade: hot → cool
      if (type === 'jet') {
        colors[i * 3] = life       // red fades
        colors[i * 3 + 1] = life * 0.4  // green fades faster
        colors[i * 3 + 2] = life * 0.1
      } else {
        const alpha = life * 0.6
        colors[i * 3] = 0.6 * alpha
        colors[i * 3 + 1] = 0.8 * alpha
        colors[i * 3 + 2] = 1.0 * alpha
      }
    }
    
    geo.attributes.position.needsUpdate = true
    geo.attributes.color.needsUpdate = true
    geo.attributes.size.needsUpdate = true
    
    // Global opacity fade based on particle system
    pointsRef.current.material.opacity = 0.85
  })

  if (!particleData) return null

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={PARTICLE_COUNT}
          array={particleData.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={PARTICLE_COUNT}
          array={particleData.colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={PARTICLE_COUNT}
          array={particleData.sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        vertexColors
        size={0.15}
        transparent
        opacity={0.85}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}

// ─── RADAR DETECTION RING ─────────────────────────────────
// Expanding ring that pulses outward when an object is detected
function DetectionRing({ position, active }) {
  const ringRef = useRef()
  const startTime = useRef(0)
  const hasStarted = useRef(false)

  useFrame((state) => {
    if (!ringRef.current) return
    
    if (active && !hasStarted.current) {
      hasStarted.current = true
      startTime.current = state.clock.getElapsedTime()
    }
    
    if (!hasStarted.current) {
      ringRef.current.visible = false
      return
    }
    
    const elapsed = state.clock.getElapsedTime() - startTime.current
    const duration = 2.0
    
    if (elapsed > duration) {
      ringRef.current.visible = false
      hasStarted.current = false
      return
    }
    
    ringRef.current.visible = true
    const t = elapsed / duration
    const scale = 0.5 + t * 4
    ringRef.current.scale.setScalar(scale)
    ringRef.current.material.opacity = (1 - t) * 0.4
    
    if (position) {
      ringRef.current.position.copy(position)
    }
  })

  return (
    <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
      <ringGeometry args={[0.8, 1.0, 64]} />
      <meshBasicMaterial
        color="#00ffee"
        transparent
        opacity={0}
        side={THREE.DoubleSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

// ─── ASTEROID DEBRIS CLOUD ────────────────────────────────
function AsteroidDebris({ parentRef }) {
  const pointsRef = useRef()
  const DEBRIS_COUNT = 30
  
  const debrisData = useMemo(() => {
    const positions = new Float32Array(DEBRIS_COUNT * 3)
    const baseOffsets = []
    for (let i = 0; i < DEBRIS_COUNT; i++) {
      const r = 0.3 + Math.random() * 1.2
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      baseOffsets.push(new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      ))
      positions[i * 3] = 0
      positions[i * 3 + 1] = -9999
      positions[i * 3 + 2] = 0
    }
    return { positions, baseOffsets }
  }, [])

  useFrame((state) => {
    if (!pointsRef.current || !parentRef.current) return
    const t = state.clock.getElapsedTime()
    const worldPos = new THREE.Vector3()
    parentRef.current.getWorldPosition(worldPos)
    const scale = parentRef.current.scale.x
    
    const pos = pointsRef.current.geometry.attributes.position
    for (let i = 0; i < DEBRIS_COUNT; i++) {
      const off = debrisData.baseOffsets[i]
      // Orbit around asteroid
      const a = t * (0.3 + i * 0.05) + i * 1.7
      const orbR = off.length() * scale
      pos.setXYZ(i,
        worldPos.x + Math.cos(a) * orbR * off.x / off.length(),
        worldPos.y + off.y * scale * Math.sin(t * 0.5 + i),
        worldPos.z + Math.sin(a) * orbR * off.z / off.length()
      )
    }
    pos.needsUpdate = true
  })

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={DEBRIS_COUNT}
          array={debrisData.positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#8B7355"
        size={0.04}
        transparent
        opacity={0.5}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  )
}

// ─── SINGLE FLYING OBJECT ──────────────────────────────────
function FlyingObject({ config, onComplete, onDetected }) {
  const groupRef = useRef()
  const glowRef = useRef()
  const strobeRef = useRef()
  const navRedRef = useRef()
  const navGreenRef = useRef()
  const beaconRef = useRef()
  const progress = useRef(0)
  const detected = useRef(false)
  const [detectionPos, setDetectionPos] = useState(null)
  const [isDetected, setIsDetected] = useState(false)

  const { type, path, speed, id } = config

  // Build a smooth CatmullRom curve through 4 control points
  const curve = useMemo(() => {
    return new THREE.CatmullRomCurve3(
      [path.entry, path.waypoint, path.waypoint2, path.exit],
      false,
      'centripetal',
      0.5
    )
  }, [path])

  const totalLength = useMemo(() => curve.getLength(), [curve])

  // Object visual configs
  const objCfg = useMemo(() => {
    switch (type) {
      case 'jet':
        return {
          bodyLength: 1.4,
          wingSpan: 2.2,
          bodyColor: '#a8b1b8',
          accentColor: '#00e5ff',
          engineColor: '#ff4400',
          engineGlow: '#ffaa00',
          roughness: 0.15,
          metalness: 0.85,
          baseSpeed: 0.35,
        }
      case 'airliner':
        return {
          bodyLength: 2.5,
          wingSpan: 3.6,
          bodyColor: '#f0f2f5',
          accentColor: '#003875',
          engineColor: '#445566',
          engineGlow: '#88bbff',
          roughness: 0.35,
          metalness: 0.3,
          baseSpeed: 0.2,
        }
      case 'asteroid':
        return {
          size: 0.5 + Math.random() * 1.5,
          color: '#7B6B55',
          craterColor: '#5a4a3a',
          baseSpeed: 0.12,
          tumbleSpeed: new THREE.Vector3(
            (Math.random() - 0.5) * 1.2,
            (Math.random() - 0.5) * 1.2,
            (Math.random() - 0.5) * 0.8
          ),
        }
      default:
        return {}
    }
  }, [type])

  // Asteroid irregular geometry
  const asteroidGeo = useMemo(() => {
    if (type !== 'asteroid') return null
    const geo = new THREE.IcosahedronGeometry(objCfg.size * 0.5, 2)
    const pos = geo.attributes.position
    // Perlin-like displacement for realistic rocky shape
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i)
      const noise = 0.65 + Math.random() * 0.7
      // Add some large-scale deformation
      const largeDef = 1 + 0.2 * Math.sin(x * 3 + y * 2) * Math.cos(z * 2.5)
      pos.setX(i, x * noise * largeDef)
      pos.setY(i, y * noise * largeDef)
      pos.setZ(i, z * noise * largeDef)
    }
    pos.needsUpdate = true
    geo.computeVertexNormals()
    return geo
  }, [type, objCfg.size])

  useFrame((state, delta) => {
    if (!groupRef.current) return

    const dt = Math.min(delta, 0.05)
    const t = state.clock.getElapsedTime()

    // ── DISTANCE-BASED SPEED MODULATION ──
    // Preview current position to calculate proximity-based time dilation
    // Objects near center get more screen time (slower, cinematic movement)
    const previewP = Math.min(progress.current, 0.999)
    const previewPoint = curve.getPointAt(previewP)
    const previewDist = previewPoint.length()
    const proximityFactor = THREE.MathUtils.clamp(previewDist / SPAWN_RANGE, 0.03, 1)
    // Near center: 0.3x speed (dramatic close pass), far away: 1.0x speed
    const speedMultiplier = 0.3 + 0.7 * Math.pow(proximityFactor, 0.5)

    progress.current += (speed * speedMultiplier * dt) / totalLength

    if (progress.current >= 1) {
      onComplete(id)
      return
    }

    const p = Math.min(progress.current, 0.999)
    const point = curve.getPointAt(p)
    const lookAhead = curve.getPointAt(Math.min(p + 0.005, 0.999))

    // Position
    groupRef.current.position.copy(point)

    // Orientation
    if (type !== 'asteroid') {
      groupRef.current.lookAt(lookAhead)
    } else {
      groupRef.current.rotation.x = t * objCfg.tumbleSpeed.x
      groupRef.current.rotation.y = t * objCfg.tumbleSpeed.y
      groupRef.current.rotation.z = t * objCfg.tumbleSpeed.z
    }

    // ── PERSPECTIVE SCALING ──
    // Distance-based with smooth logarithmic falloff for realism
    const distToCenter = point.length()
    const normalizedDist = THREE.MathUtils.clamp(distToCenter / SPAWN_RANGE, 0, 1)
    // Smoother power curve — gradual cinematic size transition
    const perspectiveScale = THREE.MathUtils.lerp(
      NEAR_SCALE,
      FAR_SCALE,
      Math.pow(normalizedDist, 0.5)
    )
    groupRef.current.scale.setScalar(perspectiveScale)

    // ── RADAR DETECTION — fires once when entering inner zone ──
    if (distToCenter < 10 && !detected.current) {
      detected.current = true
      setDetectionPos(point.clone())
      setIsDetected(true)
      if (onDetected) onDetected(type, point.clone())
      // Reset after animation
      setTimeout(() => setIsDetected(false), 2500)
    }

    // ── ENGINE GLOW (aircraft only) ──
    if (glowRef.current) {
      const pulse = 0.5 + 0.5 * Math.sin(t * 18 + Math.random() * 0.5)
      glowRef.current.material.opacity = pulse * 0.7
      glowRef.current.scale.setScalar(0.6 + pulse * 0.6)
    }

    // ── STROBE LIGHT — sharp white flash every ~1 second ──
    if (strobeRef.current) {
      const strobe = Math.pow(Math.max(0, Math.sin(t * 6.28)), 40)  // very sharp spike
      strobeRef.current.material.opacity = strobe * 0.95
      strobeRef.current.scale.setScalar(0.5 + strobe * 1.5)
    }

    // ── NAVIGATION LIGHTS — steady with subtle pulse ──
    if (navRedRef.current) {
      navRedRef.current.material.opacity = 0.7 + 0.3 * Math.sin(t * 2)
    }
    if (navGreenRef.current) {
      navGreenRef.current.material.opacity = 0.7 + 0.3 * Math.sin(t * 2 + Math.PI)
    }

    // ── ANTI-COLLISION BEACON — red flash on belly ──
    if (beaconRef.current) {
      const beacon = Math.pow(Math.max(0, Math.sin(t * 4)), 20)
      beaconRef.current.material.opacity = beacon * 0.8
      beaconRef.current.scale.setScalar(0.3 + beacon * 0.8)
    }
  })

  // ═══════════════════════════════════════════════════════
  // ASTEROID RENDER
  // ═══════════════════════════════════════════════════════
  if (type === 'asteroid') {
    return (
      <>
        <group ref={groupRef}>
          {/* Main rocky body */}
          <mesh geometry={asteroidGeo}>
            <meshStandardMaterial
              color={objCfg.color}
              roughness={0.95}
              metalness={0.05}
              flatShading
            />
          </mesh>
          {/* Dark crater overlay */}
          <mesh geometry={asteroidGeo} scale={0.98}>
            <meshStandardMaterial
              color={objCfg.craterColor}
              roughness={1}
              metalness={0}
              flatShading
              transparent
              opacity={0.4}
            />
          </mesh>
          {/* Wireframe surface detail */}
          <mesh geometry={asteroidGeo} scale={1.01}>
            <meshBasicMaterial
              color="#3a2a1a"
              wireframe
              transparent
              opacity={0.08}
            />
          </mesh>
          {/* Faint glow when near radar */}
          <mesh>
            <sphereGeometry args={[objCfg.size * 0.55, 16, 16]} />
            <meshBasicMaterial
              color="#ff6644"
              transparent
              opacity={0}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </group>
        {/* Orbiting debris particles */}
        <AsteroidDebris parentRef={groupRef} />
        {/* Detection ring */}
        <DetectionRing position={detectionPos} active={isDetected} />
      </>
    )
  }

  // ═══════════════════════════════════════════════════════
  // AIRCRAFT RENDER (jet / airliner)
  // ═══════════════════════════════════════════════════════
  const bLen = objCfg.bodyLength
  const wSpan = objCfg.wingSpan

  return (
    <>
      <group ref={groupRef}>
        {/* ── FUSELAGE ── */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[
            type === 'jet' ? 0.07 : 0.1,
            type === 'jet' ? 0.1 : 0.12,
            bLen, 12
          ]} />
          <meshStandardMaterial
            color={objCfg.bodyColor}
            roughness={objCfg.roughness || 0.25}
            metalness={objCfg.metalness || 0.75}
          />
        </mesh>

        {/* Cockpit windshield */}
        <mesh position={[bLen * 0.42, 0.04, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.03, type === 'jet' ? 0.06 : 0.09, 0.15, 8]} />
          <meshStandardMaterial
            color={type === 'jet' ? '#113344' : '#224466'}
            roughness={0.1}
            metalness={0.9}
          />
        </mesh>

        {/* Nose cone */}
        <mesh position={[bLen * 0.55, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[type === 'jet' ? 0.07 : 0.1, type === 'jet' ? 0.35 : 0.25, 12]} />
          <meshStandardMaterial
            color={objCfg.bodyColor}
            roughness={0.2}
            metalness={0.85}
          />
        </mesh>

        {/* ── WINGS ── */}
        {type === 'jet' ? (
          <>
            {/* Swept delta wings */}
            <mesh position={[-0.05, 0, 0]} rotation={[0, 0, 0]}>
              <boxGeometry args={[0.6, 0.018, wSpan]} />
              <meshStandardMaterial
                color={objCfg.bodyColor}
                roughness={0.3}
                metalness={0.7}
              />
            </mesh>
            {/* Wing sweep — angled wingtip extensions */}
            <mesh position={[-0.2, 0, wSpan * 0.45]} rotation={[0, -0.3, 0]}>
              <boxGeometry args={[0.35, 0.012, 0.3]} />
              <meshStandardMaterial color={objCfg.bodyColor} roughness={0.3} metalness={0.7} />
            </mesh>
            <mesh position={[-0.2, 0, -wSpan * 0.45]} rotation={[0, 0.3, 0]}>
              <boxGeometry args={[0.35, 0.012, 0.3]} />
              <meshStandardMaterial color={objCfg.bodyColor} roughness={0.3} metalness={0.7} />
            </mesh>
          </>
        ) : (
          <>
            {/* Airliner wide wings */}
            <mesh position={[0.05, 0, 0]}>
              <boxGeometry args={[0.35, 0.02, wSpan]} />
              <meshStandardMaterial
                color={objCfg.bodyColor}
                roughness={0.3}
                metalness={0.6}
              />
            </mesh>
            {/* Winglets */}
            <mesh position={[0, 0.08, wSpan * 0.49]} rotation={[0.3, 0, 0]}>
              <boxGeometry args={[0.12, 0.15, 0.01]} />
              <meshStandardMaterial color={objCfg.accentColor} roughness={0.3} metalness={0.6} />
            </mesh>
            <mesh position={[0, 0.08, -wSpan * 0.49]} rotation={[-0.3, 0, 0]}>
              <boxGeometry args={[0.12, 0.15, 0.01]} />
              <meshStandardMaterial color={objCfg.accentColor} roughness={0.3} metalness={0.6} />
            </mesh>
          </>
        )}

        {/* Wing accent stripe / livery line */}
        <mesh position={[type === 'jet' ? -0.05 : 0.05, 0.015, 0]}>
          <boxGeometry args={[type === 'jet' ? 0.12 : 0.06, 0.004, wSpan * 0.85]} />
          <meshBasicMaterial color={objCfg.accentColor} transparent opacity={0.6} />
        </mesh>

        {/* Fuselage accent stripe */}
        <mesh position={[0, 0.08, 0]} rotation={[0, 0, Math.PI / 2]}>
          <boxGeometry args={[0.004, bLen * 0.7, 0.004]} />
          <meshBasicMaterial color={objCfg.accentColor} transparent opacity={0.5} />
        </mesh>

        {/* ── TAIL SECTION ── */}
        {/* Vertical stabilizer */}
        <mesh position={[-bLen * 0.42, 0.18, 0]} rotation={[0, 0, type === 'jet' ? 0.15 : 0.1]}>
          <boxGeometry args={[type === 'jet' ? 0.3 : 0.2, type === 'jet' ? 0.35 : 0.3, 0.015]} />
          <meshStandardMaterial
            color={objCfg.bodyColor}
            roughness={0.3}
            metalness={0.6}
          />
        </mesh>
        {/* Tail accent */}
        <mesh position={[-bLen * 0.42, 0.28, 0]} rotation={[0, 0, type === 'jet' ? 0.15 : 0.1]}>
          <boxGeometry args={[0.12, 0.08, 0.018]} />
          <meshBasicMaterial color={objCfg.accentColor} transparent opacity={0.8} />
        </mesh>
        {/* Horizontal stabilizers */}
        <mesh position={[-bLen * 0.42, 0.06, 0]}>
          <boxGeometry args={[0.12, 0.012, wSpan * (type === 'jet' ? 0.4 : 0.32)]} />
          <meshStandardMaterial
            color={objCfg.bodyColor}
            roughness={0.3}
            metalness={0.6}
          />
        </mesh>

        {/* ── ENGINES ── */}
        {type === 'jet' ? (
          <>
            {/* Twin afterburner nozzles */}
            <mesh position={[-bLen * 0.38, -0.04, wSpan * 0.15]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.04, 0.055, 0.25, 10]} />
              <meshStandardMaterial color="#222233" roughness={0.15} metalness={0.95} />
            </mesh>
            <mesh position={[-bLen * 0.38, -0.04, -wSpan * 0.15]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.04, 0.055, 0.25, 10]} />
              <meshStandardMaterial color="#222233" roughness={0.15} metalness={0.95} />
            </mesh>
            {/* Afterburner glow */}
            <mesh ref={glowRef} position={[-bLen * 0.52, -0.04, 0]}>
              <sphereGeometry args={[0.18, 10, 10]} />
              <meshBasicMaterial
                color={objCfg.engineGlow}
                transparent opacity={0.6}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
            {/* Nozzle inner glow */}
            <mesh position={[-bLen * 0.47, -0.04, wSpan * 0.15]}>
              <sphereGeometry args={[0.04, 8, 8]} />
              <meshBasicMaterial color="#ff6600" transparent opacity={0.9} depthWrite={false} blending={THREE.AdditiveBlending} />
            </mesh>
            <mesh position={[-bLen * 0.47, -0.04, -wSpan * 0.15]}>
              <sphereGeometry args={[0.04, 8, 8]} />
              <meshBasicMaterial color="#ff6600" transparent opacity={0.9} depthWrite={false} blending={THREE.AdditiveBlending} />
            </mesh>
          </>
        ) : (
          <>
            {/* Four turbofan pods under wings */}
            {[-0.32, -0.18, 0.18, 0.32].map((zOff, i) => (
              <group key={`eng-${i}`} position={[0.12, -0.07, wSpan * zOff]}>
                <mesh rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.035, 0.042, 0.2, 10]} />
                  <meshStandardMaterial color="#556677" roughness={0.2} metalness={0.85} />
                </mesh>
                {/* Engine intake ring */}
                <mesh position={[0.1, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                  <torusGeometry args={[0.038, 0.004, 6, 16]} />
                  <meshStandardMaterial color="#aabbcc" roughness={0.2} metalness={0.9} />
                </mesh>
              </group>
            ))}
            {/* Engine glow */}
            <mesh ref={glowRef} position={[-bLen * 0.2, -0.07, 0]}>
              <sphereGeometry args={[0.14, 8, 8]} />
              <meshBasicMaterial
                color={objCfg.engineGlow}
                transparent opacity={0.35}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          </>
        )}

        {/* ── NAVIGATION LIGHTS ── */}
        {/* Red port (left wing tip) */}
        <mesh ref={navRedRef} position={[0, 0.02, -wSpan * 0.5]}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshBasicMaterial
            color="#ff0033"
            transparent opacity={0.9}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        {/* Green starboard (right wing tip) */}
        <mesh ref={navGreenRef} position={[0, 0.02, wSpan * 0.5]}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshBasicMaterial
            color="#00ff44"
            transparent opacity={0.9}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        {/* White strobe on tail */}
        <mesh ref={strobeRef} position={[-bLen * 0.5, 0.35, 0]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
        {/* Red anti-collision beacon on belly */}
        <mesh ref={beaconRef} position={[0, -0.1, 0]}>
          <sphereGeometry args={[0.025, 8, 8]} />
          <meshBasicMaterial
            color="#ff2200"
            transparent opacity={0}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>

        {/* ── BYTEBOOM TEXT ON FUSELAGE ── */}
        {/* Top side */}
        <Text
          position={[0.05, 0.09, 0.005]}
          rotation={[0, 0, 0]}
          fontSize={0.085}
          color={type === 'jet' ? '#00e5ff' : '#002266'}
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.18}
          font={undefined}
          outlineWidth={type === 'jet' ? 0.003 : 0}
          outlineColor="#000000"
        >
          BYTEBOOM
        </Text>
        {/* Bottom side (mirror) */}
        <Text
          position={[0.05, -0.09, -0.005]}
          rotation={[Math.PI, 0, 0]}
          fontSize={0.085}
          color={type === 'jet' ? '#00e5ff' : '#002266'}
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.18}
          font={undefined}
          outlineWidth={type === 'jet' ? 0.003 : 0}
          outlineColor="#000000"
        >
          BYTEBOOM
        </Text>
        {/* Side text (visible from lateral view) */}
        <Text
          position={[0.05, 0, 0.1]}
          rotation={[Math.PI / 2, 0, 0]}
          fontSize={0.06}
          color={type === 'jet' ? '#00bbdd' : '#003388'}
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.12}
          font={undefined}
        >
          BYTEBOOM
        </Text>
      </group>

      {/* Exhaust particles — rendered in world space */}
      <ExhaustTrail parentRef={groupRef} type={type} config={objCfg} />

      {/* Detection ring — fires on radar detection */}
      <DetectionRing position={detectionPos} active={isDetected} />
    </>
  )
}

// ─── SPAWN MANAGER ─────────────────────────────────────────
export default function AirTraffic({ onObjectDetected }) {
  const [activeObjects, setActiveObjects] = useState([])
  const nextSpawnTime = useRef(0)
  const currentPattern = useRef('normal')
  const patternCooldown = useRef(0)
  const objectIdCounter = useRef(0)

  // Pick a new traffic pattern periodically
  const updatePattern = useCallback(() => {
    const selected = weightedRandom(PATTERN_WEIGHTS)
    currentPattern.current = selected.pattern
    patternCooldown.current = randomRange(20, 50)
  }, [])

  useEffect(() => {
    updatePattern()
    // Don't spawn immediately — random initial delay
    nextSpawnTime.current = randomRange(4, 12)
  }, [updatePattern])

  const handleComplete = useCallback((id) => {
    setActiveObjects(prev => prev.filter(obj => obj.id !== id))
  }, [])

  const handleDetected = useCallback((objectType, position) => {
    if (onObjectDetected) {
      onObjectDetected({ type: objectType, position })
    }
  }, [onObjectDetected])

  useFrame((state) => {
    const t = state.clock.getElapsedTime()

    // Pattern rotation
    patternCooldown.current -= state.clock.getDelta()
    if (patternCooldown.current <= 0) {
      updatePattern()
    }

    // Spawn check
    if (t >= nextSpawnTime.current && activeObjects.length < MAX_CONCURRENT) {
      const objectType = weightedRandom(OBJECT_TYPES)
      const path = generateFlightPath()
      
      // Speed varies by type with some randomness
      const baseSpeed = objectType.type === 'jet'
        ? randomRange(12, 20)
        : objectType.type === 'airliner'
          ? randomRange(7, 13)
          : randomRange(4, 9)

      const newObj = {
        id: objectIdCounter.current++,
        type: objectType.type,
        path,
        speed: baseSpeed,
      }

      setActiveObjects(prev => [...prev, newObj])

      // Schedule next spawn based on current pattern
      const interval = SPAWN_INTERVALS[currentPattern.current]
      nextSpawnTime.current = t + randomRange(interval.min, interval.max)
    }
  })

  return (
    <group>
      {activeObjects.map(obj => (
        <FlyingObject
          key={obj.id}
          config={obj}
          onComplete={handleComplete}
          onDetected={handleDetected}
        />
      ))}
    </group>
  )
}
