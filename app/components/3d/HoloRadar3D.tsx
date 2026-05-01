// @ts-nocheck
'use client';
import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Text } from '@react-three/drei'
import * as THREE from 'three'

/*
  3D HOLOGRAPHIC SPACE STRUCTURE
  - Multi-plane scan beams
  - Proximity-based EXPLODED VIEW when camera approaches core
  - Components separate into layered engineering blueprint layout
  - Data shells appear inside exploded layers
*/

// Threshold distances
const EXPLODE_START = 5.0    // start spreading at this distance
const EXPLODE_FULL = 1.5     // fully exploded at this distance
const EXPLODE_MAX_SPREAD = 1.2 // max vertical spread per layer

export default function HoloRadar3D({ sweepAngleRef }) {
  const sweepRef = useRef()
  const sweepAngle = useRef(0)
  const coreRef = useRef()
  const coreGlowRef = useRef()
  const ringRefs = useRef([])
  const scan2Ref = useRef()
  const scan3Ref = useRef()
  const verticalScanRef = useRef()
  const corePulseRefs = useRef([])
  const explodeValue = useRef(0)  // 0 = collapsed, 1 = fully exploded
  const { camera } = useThree()

  // ── SONAR PING refs ──
  const sonarRefs = useRef([])
  const SONAR_COUNT = 4

  // ── SWEEP TRAIL refs ──
  const trailRefs = useRef([])
  const TRAIL_COUNT = 6

  // Octahedron with a unique color per face (8 faces)
  // Death Star core — realistic gray paneled sphere
  const R = 0.28
  const coreGeo = useMemo(() => {
    const indexed = new THREE.SphereGeometry(R, 48, 36)
    const geo = indexed.toNonIndexed()
    const count = geo.attributes.position.count
    const colors = new Float32Array(count * 3)
    // Per-triangle panel coloring — alternating shades of gray like hull plates
    for (let i = 0; i < count; i += 3) {
      const shade = 0.35 + Math.random() * 0.18
      // Slightly bluish-gray tint
      const r = shade * 0.95
      const g = shade * 0.96
      const b = shade * 1.0
      for (let v = 0; v < 3; v++) {
        colors[(i + v) * 3] = r
        colors[(i + v) * 3 + 1] = g
        colors[(i + v) * 3 + 2] = b
      }
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return geo
  }, [])

  // Surface detail geometry — all computed once
  const deathStarDetail = useMemo(() => {
    const r = R + 0.001
    const lines = []

    // Dense latitude lines (panels)
    for (let lat = -6; lat <= 6; lat++) {
      const phi = (0.5 + lat / 14) * Math.PI
      const ry = r * Math.sin(phi)
      const y = r * Math.cos(phi)
      if (Math.abs(y) < 0.008) continue // skip equator (trench goes there)
      const pts = []
      for (let j = 0; j <= 64; j++) {
        const theta = (j / 64) * Math.PI * 2
        pts.push(new THREE.Vector3(ry * Math.cos(theta), y, ry * Math.sin(theta)))
      }
      lines.push(new THREE.BufferGeometry().setFromPoints(pts))
    }

    // Dense longitude lines (meridians)
    for (let lon = 0; lon < 16; lon++) {
      const theta = (lon / 16) * Math.PI * 2
      const pts = []
      for (let j = 0; j <= 48; j++) {
        const phi = (j / 48) * Math.PI
        pts.push(new THREE.Vector3(
          r * Math.sin(phi) * Math.cos(theta),
          r * Math.cos(phi),
          r * Math.sin(phi) * Math.sin(theta)
        ))
      }
      lines.push(new THREE.BufferGeometry().setFromPoints(pts))
    }

    // Equatorial trench — two parallel rings + dark band
    const trenchWidth = 0.014
    const trenchInner = r - 0.003
    const trenchRings = []
    for (const yOff of [-trenchWidth, 0, trenchWidth]) {
      const pts = []
      const ringR = Math.sqrt(Math.max(0, trenchInner * trenchInner - yOff * yOff))
      for (let j = 0; j <= 64; j++) {
        const theta = (j / 64) * Math.PI * 2
        pts.push(new THREE.Vector3(ringR * Math.cos(theta), yOff, ringR * Math.sin(theta)))
      }
      trenchRings.push(new THREE.BufferGeometry().setFromPoints(pts))
    }

    // Superlaser dish — large concave area in upper-north hemisphere
    // Positioned at about 30° from north pole, facing outward
    const dishDir = new THREE.Vector3(0.35, 0.85, 0.4).normalize()
    const dishCenter = dishDir.clone().multiplyScalar(R - 0.01)
    // Build local coordinate frame for the dish
    const dishUp = new THREE.Vector3(0, 1, 0)
    const dishRight = new THREE.Vector3().crossVectors(dishUp, dishDir).normalize()
    const dishActualUp = new THREE.Vector3().crossVectors(dishDir, dishRight).normalize()

    const dishRings = [] // concentric rings of the dish
    const dishRadii = [0.12, 0.09, 0.06, 0.03, 0.015]
    for (const dr of dishRadii) {
      const pts = []
      for (let j = 0; j <= 32; j++) {
        const a = (j / 32) * Math.PI * 2
        const p = dishCenter.clone()
          .add(dishRight.clone().multiplyScalar(Math.cos(a) * dr))
          .add(dishActualUp.clone().multiplyScalar(Math.sin(a) * dr))
        pts.push(p)
      }
      dishRings.push(new THREE.BufferGeometry().setFromPoints(pts))
    }

    // Dish spokes — 8 radial lines from center to rim
    const dishSpokes = []
    for (let s = 0; s < 8; s++) {
      const a = (s / 8) * Math.PI * 2
      const inner = dishCenter.clone()
      const outer = dishCenter.clone()
        .add(dishRight.clone().multiplyScalar(Math.cos(a) * 0.12))
        .add(dishActualUp.clone().multiplyScalar(Math.sin(a) * 0.12))
      dishSpokes.push(new THREE.BufferGeometry().setFromPoints([inner, outer]))
    }

    return { lines, trenchRings, dishRings, dishSpokes, dishCenter, dishDir }
  }, [])

  // Data labels that appear inside exploded core
  const coreDataLabels = useMemo(() => [
    { text: 'SCAN FREQ: 2.4GHz', y: 0, color: '#00e5ff' },
    { text: 'RANGE: 4.0 AU', y: -0.3, color: '#00ff9d' },
    { text: 'SIGNALS: ACTIVE', y: -0.6, color: '#ffd60a' },
    { text: 'CORE TEMP: 4,200K', y: -0.9, color: '#ff4488' },
  ], [])

  if (sweepAngleRef) sweepAngleRef.current = { getSweepAngle: () => sweepAngle.current }

  // Floating rings at different Y levels — spread out for more space inside
  const floatingRings = useMemo(() => {
    const rings = []
    const levels = [-4, -2, 0, 2, 4]
    const colors = ['#ff4488', '#00e5ff', '#00ff9d', '#ffd60a', '#c77dff']
    const radii = [5.5, 4.8, 4.2, 4.8, 5.5]
    levels.forEach((y, i) => {
      const r = radii[i]
      const pts = []
      for (let j = 0; j <= 64; j++) {
        const a = (j / 64) * Math.PI * 2
        pts.push(new THREE.Vector3(r * Math.cos(a), y, r * Math.sin(a)))
      }
      rings.push({ geo: new THREE.BufferGeometry().setFromPoints(pts), color: colors[i], opacity: 0.12 + (i === 2 ? 0.08 : 0), baseY: y })
    })
    return rings
  }, [])

  // Vertical reference lines — spread wider to match rings
  const verticalLines = useMemo(() => {
    const lines = []
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2
      const r = 5.0
      lines.push({
        geo: new THREE.BufferGeometry().setFromPoints([
          new THREE.Vector3(Math.cos(a) * r, -5, Math.sin(a) * r),
          new THREE.Vector3(Math.cos(a) * r, 5, Math.sin(a) * r),
        ]),
        color: i % 2 === 0 ? '#00aacc' : '#8855cc'
      })
    }
    return lines
  }, [])

  // Axis reference lines
  const axisLines = useMemo(() => {
    return [
      { pts: [[-5, 0, 0], [5, 0, 0]], color: '#ff4466' },
      { pts: [[0, -5, 0], [0, 5, 0]], color: '#44ff88' },
      { pts: [[0, 0, -5], [0, 0, 5]], color: '#4488ff' },
    ].map(({ pts, color }) => ({
      geo: new THREE.BufferGeometry().setFromPoints(pts.map(p => new THREE.Vector3(...p))),
      color
    }))
  }, [])

  // ── 3D VOLUMETRIC BEAM BUILDER ──
  // Creates a tapered cone sector (like a flashlight beam) with vertex-based fade
  function makeBeamCone(arcAngle, radius, height, segments) {
    const positions = []
    const colors = []
    const half = arcAngle / 2
    const steps = segments || 20

    // Build triangles from origin tip to outer arc, with vertical extent
    for (let i = 0; i < steps; i++) {
      const a0 = -half + (arcAngle * i) / steps
      const a1 = -half + (arcAngle * (i + 1)) / steps

      const x0 = Math.cos(a0) * radius, z0 = Math.sin(a0) * radius
      const x1 = Math.cos(a1) * radius, z1 = Math.sin(a1) * radius

      // Bottom face (y = -height/2)
      positions.push(0, 0, 0,  x0, -height / 2, z0,  x1, -height / 2, z1)
      // Top face (y = +height/2)
      positions.push(0, 0, 0,  x1, height / 2, z1,  x0, height / 2, z0)
      // Outer wall quad (2 triangles)
      positions.push(x0, -height / 2, z0,  x0, height / 2, z0,  x1, -height / 2, z1)
      positions.push(x1, -height / 2, z1,  x0, height / 2, z0,  x1, height / 2, z1)

      // Colors: bright at origin, fades at outer edge
      for (let tri = 0; tri < 2; tri++) {
        colors.push(1, 1, 1)  // origin: bright
        colors.push(0.2, 0.2, 0.2)  // outer: dim
        colors.push(0.2, 0.2, 0.2)
      }
      // Wall: all dim
      for (let v = 0; v < 6; v++) colors.push(0.15, 0.15, 0.15)
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    geo.computeVertexNormals()
    return geo
  }

  // Primary scan beam — thick 3D volumetric cone
  const beamGeo = useMemo(() => makeBeamCone(Math.PI / 8, 4.0, 0.6, 24), [])
  const beamGeo2 = useMemo(() => makeBeamCone(Math.PI / 12, 3.2, 0.4, 18), [])
  const vertScanGeo = useMemo(() => makeBeamCone(Math.PI / 16, 3.5, 0.3, 14), [])

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    sweepAngle.current = (t * 0.5) % (Math.PI * 2)

    // ── PROXIMITY DETECTION — camera distance to origin ──
    const camDist = camera.position.length()
    const rawExplode = 1 - THREE.MathUtils.clamp((camDist - EXPLODE_FULL) / (EXPLODE_START - EXPLODE_FULL), 0, 1)
    // Smooth lerp
    explodeValue.current += (rawExplode - explodeValue.current) * 0.06
    const ex = explodeValue.current

    // Primary sweep — circulates in diagonal plane 1 ("/" tilt)
    if (sweepRef.current) {
      sweepRef.current.rotation.y = -sweepAngle.current
      sweepRef.current.position.y = -ex * EXPLODE_MAX_SPREAD * 0.5
    }

    // Secondary sweep — circulates in diagonal plane 2 ("\" tilt), forms X
    if (scan2Ref.current) {
      scan2Ref.current.rotation.y = sweepAngle.current + Math.PI / 3
      scan2Ref.current.position.y = ex * EXPLODE_MAX_SPREAD * 0.8
    }

    // Third sweep — horizontal equatorial accent
    if (scan3Ref.current) {
      scan3Ref.current.rotation.y = -sweepAngle.current * 0.7 + 2.5
      scan3Ref.current.position.y = ex * EXPLODE_MAX_SPREAD * 1.4
    }

    // Vertical scan — drops
    if (verticalScanRef.current) {
      verticalScanRef.current.rotation.y = sweepAngle.current * 0.4
      const vAngle = Math.sin(t * 0.25) * 0.6
      verticalScanRef.current.rotation.z = Math.PI / 2 + vAngle
      verticalScanRef.current.position.y = -ex * EXPLODE_MAX_SPREAD * 1.3
    }

    // Core — slow majestic rotation for Death Star
    if (coreRef.current) {
      const p = 0.5 + 0.5 * Math.sin(t * 3)
      coreRef.current.scale.setScalar(0.8 + p * 0.15 + ex * 0.3)
      coreRef.current.rotation.y = t * 0.3
      coreRef.current.rotation.x = 0.15
      coreRef.current.position.y = ex * EXPLODE_MAX_SPREAD * 2.0
    }
    if (coreGlowRef.current) {
      const p = 0.5 + 0.5 * Math.sin(t * 2)
      coreGlowRef.current.scale.setScalar(1 + p * 0.6 + ex * 0.5)
      coreGlowRef.current.material.opacity = 0.08 + p * 0.05 + ex * 0.04
      coreGlowRef.current.position.y = ex * EXPLODE_MAX_SPREAD * 2.0
    }

    // Floating rings spread vertically in exploded mode
    // + RING BRIGHTENING: flash when beam sweeps past
    ringRefs.current.forEach((ref, i) => {
      if (ref) {
        const pulse = 0.5 + 0.5 * Math.sin(t * 0.8 + i * 1.5)
        // Beam proximity flash — rings brighten as sweep passes
        const ringAngle = (sweepAngle.current + i * 0.6) % (Math.PI * 2)
        const flashPhase = (Math.sin(ringAngle) + 1) * 0.5
        const flash = Math.pow(flashPhase, 8) * 0.25  // sharp spike
        ref.material.opacity = 0.08 + pulse * 0.08 + flash + ex * 0.06
        const baseY = floatingRings[i]?.baseY || 0
        const spreadFactor = (baseY > 0 ? 1 : -1) * (Math.abs(baseY) / 3)
        ref.position.y = ex * spreadFactor * EXPLODE_MAX_SPREAD
      }
    })

    // Pulse rings
    corePulseRefs.current.forEach((ref, i) => {
      if (!ref) return
      const phase = ((t * 0.35 + i * 1.2) % 3.5)
      ref.scale.setScalar(0.2 + phase * 1.2)
      ref.material.opacity = Math.max(0, 0.12 - phase * 0.035)
      ref.position.y = ex * EXPLODE_MAX_SPREAD * (2.0 + i * 0.2)
    })

    // ── SONAR PING WAVES — expanding rings from center ──
    sonarRefs.current.forEach((ref, i) => {
      if (!ref) return
      // Each ping is staggered, loops every ~5 seconds
      const cycle = 5.0
      const phase = ((t * 0.8 + i * (cycle / SONAR_COUNT)) % cycle) / cycle
      const scale = 0.1 + phase * 6.0
      ref.scale.setScalar(scale)
      // Fade out as it expands + slight brightness at start
      const fade = phase < 0.1 ? phase / 0.1 : Math.max(0, 1 - (phase - 0.1) / 0.9)
      ref.material.opacity = fade * 0.12
    })

    // ── DETECTION BLIPS — random flashes around the scan field ──
    // (removed — replaced by ring brightening below)

    // ── SWEEP TRAIL — ghosted copies behind main beam ──
    trailRefs.current.forEach((ref, i) => {
      if (!ref) return
      const trailAngle = -sweepAngle.current + (i + 1) * 0.12
      ref.rotation.y = trailAngle
      ref.material.opacity = Math.max(0, 0.04 - i * 0.006)
    })
  })

  const ex = explodeValue.current

  return (
    <group>
      {/* Floating rings at different heights */}
      {floatingRings.map((ring, i) => (
        <line key={`fr-${i}`} geometry={ring.geo} ref={el => ringRefs.current[i] = el}>
          <lineBasicMaterial color={ring.color} transparent opacity={ring.opacity} />
        </line>
      ))}

      {/* Vertical reference lines */}
      {verticalLines.map((l, i) => (
        <line key={`vl-${i}`} geometry={l.geo}>
          <lineBasicMaterial color={l.color} transparent opacity={0.04} />
        </line>
      ))}

      {/* Axis lines */}
      {axisLines.map((l, i) => (
        <line key={`ax-${i}`} geometry={l.geo}>
          <lineBasicMaterial color={l.color} transparent opacity={0.06} />
        </line>
      ))}

      {/* ═══ PRIMARY SCAN — diagonal plane 1 ("/") ═══ */}
      <group rotation={[0, 0, Math.PI / 4]}>
        <group ref={sweepRef}>
          {/* Solid beam body */}
          <mesh>
            <primitive object={beamGeo} attach="geometry" />
            <meshBasicMaterial color="#00ffee" transparent opacity={0.07} side={THREE.DoubleSide} depthWrite={false} vertexColors />
          </mesh>
          {/* Inner glow layer */}
          <mesh>
            <primitive object={beamGeo} attach="geometry" />
            <meshBasicMaterial color="#00ffee" transparent opacity={0.03} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
          {/* Leading edge line */}
          <line>
            <bufferGeometry><bufferAttribute attach="attributes-position" count={2} array={new Float32Array([0, 0, 0, 4.0, 0, 0])} itemSize={3} /></bufferGeometry>
            <lineBasicMaterial color="#00ffee" transparent opacity={0.5} />
          </line>
          {/* Tip dot */}
          <mesh position={[4.0, 0, 0]}>
            <sphereGeometry args={[0.04, 8, 8]} />
            <meshBasicMaterial color="#00ffff" transparent opacity={0.9} />
          </mesh>
        </group>
      </group>

      {/* ═══ SECONDARY SCAN — diagonal plane 2 ("\") forms X ═══ */}
      <group rotation={[0, 0, -Math.PI / 4]}>
        <group ref={scan2Ref}>
          <mesh>
            <primitive object={beamGeo2} attach="geometry" />
            <meshBasicMaterial color="#cc66ff" transparent opacity={0.05} side={THREE.DoubleSide} depthWrite={false} vertexColors />
          </mesh>
          <mesh>
            <primitive object={beamGeo2} attach="geometry" />
            <meshBasicMaterial color="#cc66ff" transparent opacity={0.02} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
          <line>
            <bufferGeometry><bufferAttribute attach="attributes-position" count={2} array={new Float32Array([0, 0, 0, 3.2, 0, 0])} itemSize={3} /></bufferGeometry>
            <lineBasicMaterial color="#cc66ff" transparent opacity={0.25} />
          </line>
        </group>
      </group>

      {/* ═══ THIRD SCAN — horizontal equatorial accent ═══ */}
      <group ref={scan3Ref}>
        <mesh>
          <primitive object={beamGeo2} attach="geometry" />
          <meshBasicMaterial color="#00ff9d" transparent opacity={0.04} side={THREE.DoubleSide} depthWrite={false} vertexColors />
        </mesh>
        <mesh>
          <primitive object={beamGeo2} attach="geometry" />
          <meshBasicMaterial color="#00ff9d" transparent opacity={0.015} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        <line>
          <bufferGeometry><bufferAttribute attach="attributes-position" count={2} array={new Float32Array([0, 0, 0, 3.2, 0, 0])} itemSize={3} /></bufferGeometry>
          <lineBasicMaterial color="#00ff9d" transparent opacity={0.18} />
        </line>
      </group>

      {/* ═══ VERTICAL SCAN — 3D volumetric ═══ */}
      <group ref={verticalScanRef}>
        <mesh>
          <primitive object={vertScanGeo} attach="geometry" />
          <meshBasicMaterial color="#ffd60a" transparent opacity={0.03} side={THREE.DoubleSide} depthWrite={false} vertexColors />
        </mesh>
        <line>
          <bufferGeometry><bufferAttribute attach="attributes-position" count={2} array={new Float32Array([0, 0, 0, 3.5, 0, 0])} itemSize={3} /></bufferGeometry>
          <lineBasicMaterial color="#ffd60a" transparent opacity={0.15} />
        </line>
      </group>

      {/* ═══ DEATH STAR CORE ═══ */}
      <group ref={coreRef} position={[0, 0, 0]}>
        {/* Main hull — gray paneled sphere */}
        <mesh geometry={coreGeo}>
          <meshStandardMaterial
            color="#9a9a9a"
            roughness={0.8}
            metalness={0.2}
            vertexColors
          />
        </mesh>

        {/* Surface panel grid */}
        {deathStarDetail.lines.map((geo, i) => (
          <line key={`dsl-${i}`} geometry={geo}>
            <lineBasicMaterial color="#3a3a3a" transparent opacity={0.4} />
          </line>
        ))}

        {/* Equatorial trench — dark band with border lines */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[R - 0.002, 0.015, 6, 64]} />
          <meshBasicMaterial color="#151515" />
        </mesh>
        {deathStarDetail.trenchRings.map((geo, i) => (
          <line key={`tr-${i}`} geometry={geo}>
            <lineBasicMaterial color="#333333" transparent opacity={0.7} />
          </line>
        ))}

        {/* Superlaser dish — concentric rings */}
        {deathStarDetail.dishRings.map((geo, i) => (
          <line key={`dr-${i}`} geometry={geo}>
            <lineBasicMaterial
              color={i === 0 ? '#555555' : i === 4 ? '#88aa88' : '#444444'}
              transparent opacity={i === 0 ? 0.8 : i === 4 ? 0.9 : 0.5}
            />
          </line>
        ))}
        {/* Dish spokes */}
        {deathStarDetail.dishSpokes.map((geo, i) => (
          <line key={`ds-${i}`} geometry={geo}>
            <lineBasicMaterial color="#444444" transparent opacity={0.35} />
          </line>
        ))}
        {/* Dish concave dark surface */}
        <mesh
          position={deathStarDetail.dishCenter}
          onUpdate={self => self.lookAt(deathStarDetail.dishCenter.clone().add(deathStarDetail.dishDir))}
        >
          <circleGeometry args={[0.12, 32]} />
          <meshBasicMaterial color="#1a1a1a" transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
        {/* Dish green focus point */}
        <mesh position={deathStarDetail.dishCenter.clone().add(deathStarDetail.dishDir.clone().multiplyScalar(0.003))}>
          <sphereGeometry args={[0.008, 8, 8]} />
          <meshBasicMaterial color="#66dd66" transparent opacity={0.9} />
        </mesh>
      </group>

      {/* Death Star ambient glow */}
      <mesh ref={coreGlowRef} position={[0, 0, 0]}>
        <sphereGeometry args={[0.38, 16, 16]} />
        <meshBasicMaterial color="#555555" transparent opacity={0.04} depthWrite={false} />
      </mesh>

      {/* ═══ EXPLODED VIEW: DATA LABELS ═══ 
          These appear inside the exploded core — engineering blueprint data */}
      <ExplodedCoreData labels={coreDataLabels} explodeRef={explodeValue} />

      {/* Core pulse rings — float up with core */}
      {[0, 1, 2].map(i => (
        <mesh key={`cp-${i}`} ref={el => corePulseRefs.current[i] = el}
          rotation={i === 0 ? [-Math.PI / 2, 0, 0] : i === 1 ? [0, 0, 0] : [Math.PI / 3, Math.PI / 4, 0]}
        >
          <ringGeometry args={[0.35, 0.4, 32]} />
          <meshBasicMaterial
            color={i === 0 ? '#00eeff' : i === 1 ? '#cc66ff' : '#00ff9d'}
            transparent opacity={0.1}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}

      {/* ═══ SONAR PING WAVES — expanding detection rings ═══ */}
      {Array.from({ length: SONAR_COUNT }, (_, i) => (
        <mesh key={`sonar-${i}`} ref={el => sonarRefs.current[i] = el}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[0.95, 1.0, 64]} />
          <meshBasicMaterial
            color="#00ddff"
            transparent opacity={0}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}


      {/* ═══ SWEEP TRAIL — ghost copies behind main beam ═══ */}
      {Array.from({ length: TRAIL_COUNT }, (_, i) => (
        <mesh key={`trail-${i}`} ref={el => trailRefs.current[i] = el}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[0.1, 4.0 - i * 0.3, 64, 1, 0, Math.PI / 10]} />
          <meshBasicMaterial
            color="#00ffee"
            transparent opacity={0}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  )
}

// ═══════════════════════════════════════════════════════════
// EXPLODED CORE DATA — appears between layers when camera is close
// Shows engineering-style blueprint labels inside the exploded core
// ═══════════════════════════════════════════════════════════
function ExplodedCoreData({ labels, explodeRef }) {
  const groupRef = useRef()
  const lineRefs = useRef([])

  useFrame(() => {
    const ex = explodeRef.current
    if (groupRef.current) {
      groupRef.current.visible = ex > 0.05
      // Scale from 0 to 1 based on explode
      const s = THREE.MathUtils.clamp(ex * 1.5, 0, 1)
      groupRef.current.scale.setScalar(s)
    }
    lineRefs.current.forEach((ref) => {
      if (ref) {
        ref.material.opacity = explodeRef.current * 0.6
      }
    })
  })

  return (
    <group ref={groupRef} visible={false}>
      {labels.map((label, i) => (
        <group key={`cdl-${i}`} position={[0.4, 0.6 + label.y * 0.6, 0]}>
          {/* Horizontal connector line from center */}
          <line ref={el => lineRefs.current[i] = el}>
            <bufferGeometry>
              <bufferAttribute attach="attributes-position" count={2}
                array={new Float32Array([-0.4, -0.6 - label.y * 0.6, 0, 0, 0, 0])}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial color={label.color} transparent opacity={0} />
          </line>
          {/* Small dot at connection point */}
          <mesh position={[0, 0, 0]}>
            <sphereGeometry args={[0.015, 6, 6]} />
            <meshBasicMaterial color={label.color} transparent opacity={0.8} />
          </mesh>
          {/* Label text */}
          <Text
            position={[0.05, 0, 0.01]}
            fontSize={0.055}
            color={label.color}
            anchorX="left"
            anchorY="middle"
            letterSpacing={0.08}
          >
            {label.text}
          </Text>
          {/* Subtle backing */}
          <mesh position={[0.5, 0, -0.005]}>
            <planeGeometry args={[1.0, 0.08]} />
            <meshBasicMaterial color="#040c1c" transparent opacity={0.4} side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
        </group>
      ))}
    </group>
  )
}
