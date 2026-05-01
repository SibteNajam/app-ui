// @ts-nocheck
'use client';
import { useRef, useEffect, useCallback, useMemo } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import HoloRadar3D from './HoloRadar3D'
import StarkSignals from './StarkSignals'
import RadarEffects from './RadarEffects'
import SpacetimeFabric from './SpacetimeFabric'
import AirTraffic from './AirTraffic'

function CameraController({ isCollapsing, onCollapseComplete }) {
  const { camera } = useThree()
  const startTime = useRef(Date.now())
  const collapseStart = useRef(null)
  const targetPos = useRef(new THREE.Vector3(5, 3, -8))
  const returnHome = useRef(false)
  const homeTarget = useRef(new THREE.Vector3(5, 3, -8))

  useEffect(() => {
    camera.position.set(0, 12, -18)
    camera.lookAt(0, 0, 0)
    startTime.current = Date.now()

    const handleKey = (e) => {
      if (e.key === 'h' || e.key === 'H') {
        returnHome.current = true
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [camera])

  useEffect(() => {
    if (isCollapsing) collapseStart.current = Date.now()
  }, [isCollapsing])

  useFrame(() => {
    if (isCollapsing && collapseStart.current) {
      const elapsed = (Date.now() - collapseStart.current) / 1000
      const t = Math.min(elapsed / 1.0, 1)
      const ease = t * t * t
      camera.position.y = THREE.MathUtils.lerp(camera.position.y, 30, ease * 0.04)
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, -55, ease * 0.04)
      camera.lookAt(0, 0, 0)
      if (t >= 1) onCollapseComplete()
      return
    }

    if (returnHome.current) {
      camera.position.lerp(homeTarget.current, 0.05)
      const dist = camera.position.distanceTo(homeTarget.current)
      if (dist < 0.1) {
        camera.position.copy(homeTarget.current)
        returnHome.current = false
      }
      camera.lookAt(0, 0, 0)
      return
    }

    const elapsed = (Date.now() - startTime.current) / 1000
    if (elapsed < 3) {
      const t = Math.min(elapsed / 2.8, 1)
      const ease = 1 - Math.pow(1 - t, 3)
      camera.position.x = THREE.MathUtils.lerp(0, targetPos.current.x, ease)
      camera.position.y = THREE.MathUtils.lerp(12, targetPos.current.y, ease)
      camera.position.z = THREE.MathUtils.lerp(-18, targetPos.current.z, ease)
      camera.lookAt(0, 0, 0)
    }
  })

  return null
}

// Zoom towards the point under the cursor/finger instead of always zooming to center
// Supports both mouse wheel AND touch pinch-to-zoom
//
// INSIDE-MODE: When camera is inside the ring area, orbit target is pinned
// right in front of the camera so single-finger drag = look around in place
// (first-person style) instead of orbiting and flinging you out.
const INSIDE_RADIUS = 4.5  // rings start at ~4.2, treat anything closer as "inside"
const INSIDE_TARGET_DIST = 0.5  // orbit target distance when inside (very close = look-around)
const OUTSIDE_TARGET_DIST_MIN = 2.0

function ZoomToPointer({ controlsRef, enabled }) {
  const { camera, gl } = useThree()
  const raycaster = useRef(new THREE.Raycaster())
  const mouse = useRef(new THREE.Vector2())
  const lastPinchDist = useRef(null)
  const pinchCenter = useRef(new THREE.Vector2())

  // Smooth zoom — accumulate movement, consume via lerp each frame
  const pendingMove = useRef(new THREE.Vector3())
  const insideMode = useRef(false)

  useFrame(() => {
    if (!enabled || !controlsRef?.current) return

    const camDist = camera.position.length()
    const isInside = camDist < INSIDE_RADIUS
    insideMode.current = isInside

    const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion)

    if (isInside) {
      // ── INSIDE MODE: pin orbit target very close in front of camera ──
      // This turns orbit rotation into first-person look-around
      const idealTarget = camera.position.clone().add(forward.clone().multiplyScalar(INSIDE_TARGET_DIST))
      controlsRef.current.target.lerp(idealTarget, 0.2)
      // Reduce rotate speed inside for smoother look-around
      controlsRef.current.rotateSpeed = 0.3
    } else {
      // ── OUTSIDE MODE: keep orbit target at stable distance ahead ──
      const camToTarget = new THREE.Vector3().subVectors(controlsRef.current.target, camera.position)
      const distAhead = camToTarget.dot(forward)
      if (distAhead < OUTSIDE_TARGET_DIST_MIN) {
        const idealTarget = camera.position.clone().add(forward.clone().multiplyScalar(OUTSIDE_TARGET_DIST_MIN))
        controlsRef.current.target.lerp(idealTarget, 0.12)
      }
      // Normal rotate speed outside
      controlsRef.current.rotateSpeed = 0.6
    }

    // ── Consume pending zoom movement smoothly ──
    const len = pendingMove.current.length()
    if (len > 0.0001) {
      const factor = 0.18
      const step = pendingMove.current.clone().multiplyScalar(factor)

      camera.position.add(step)
      // Move target along with camera (same vector, full amount)
      // so camera-to-target relationship stays stable
      controlsRef.current.target.add(step)

      pendingMove.current.multiplyScalar(1 - factor)
    }

    controlsRef.current.update()
  })

  useEffect(() => {
    if (!enabled) return
    const canvas = gl.domElement

    // Queue a smooth zoom toward the cursor/touch point
    const zoomToward = (ndcX, ndcY, zoomDelta) => {
      if (!controlsRef?.current) return
      mouse.current.set(ndcX, ndcY)
      raycaster.current.setFromCamera(mouse.current, camera)
      const dir = raycaster.current.ray.direction.clone()
      const moveVec = dir.multiplyScalar(zoomDelta)
      pendingMove.current.add(moveVec)
    }

    // ── MOUSE WHEEL ──
    const handleWheel = (e) => {
      e.preventDefault()
      if (!controlsRef?.current) return
      const rect = canvas.getBoundingClientRect()
      const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const ndcY = -((e.clientY - rect.top) / rect.height) * 2 + 1
      // Speed based on how far camera is from origin (not target)
      const camDist = camera.position.length()
      const speed = Math.max(camDist * 0.08, 0.15)
      const zoomDelta = e.deltaY > 0 ? -speed : speed
      zoomToward(ndcX, ndcY, zoomDelta)
    }

    // ── TOUCH PINCH ──
    const handleTouchStart = (e) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX
        const dy = e.touches[0].clientY - e.touches[1].clientY
        lastPinchDist.current = Math.sqrt(dx * dx + dy * dy)
        const rect = canvas.getBoundingClientRect()
        const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2
        const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2
        pinchCenter.current.set(
          ((cx - rect.left) / rect.width) * 2 - 1,
          -((cy - rect.top) / rect.height) * 2 + 1
        )
      }
    }

    const handleTouchMove = (e) => {
      if (e.touches.length === 2 && lastPinchDist.current !== null) {
        e.preventDefault()
        const dx = e.touches[0].clientX - e.touches[1].clientX
        const dy = e.touches[0].clientY - e.touches[1].clientY
        const dist = Math.sqrt(dx * dx + dy * dy)
        const delta = dist - lastPinchDist.current
        lastPinchDist.current = dist

        const rect = canvas.getBoundingClientRect()
        const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2
        const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2
        pinchCenter.current.set(
          ((cx - rect.left) / rect.width) * 2 - 1,
          -((cy - rect.top) / rect.height) * 2 + 1
        )

        const camDist = camera.position.length()
        const speed = Math.max(camDist * 0.003, 0.02)
        const zoomDelta = delta * speed
        zoomToward(pinchCenter.current.x, pinchCenter.current.y, zoomDelta)
      }
    }

    const handleTouchEnd = () => {
      lastPinchDist.current = null
    }

    canvas.addEventListener('wheel', handleWheel, { passive: false })
    canvas.addEventListener('touchstart', handleTouchStart, { passive: true })
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
    canvas.addEventListener('touchend', handleTouchEnd, { passive: true })
    return () => {
      canvas.removeEventListener('wheel', handleWheel)
      canvas.removeEventListener('touchstart', handleTouchStart)
      canvas.removeEventListener('touchmove', handleTouchMove)
      canvas.removeEventListener('touchend', handleTouchEnd)
    }
  }, [enabled, camera, gl, controlsRef])

  return null
}

// Far-away background stars — realistic star field in all directions
function BackgroundStars() {
  const tinyRef = useRef()
  const brightRef = useRef()
  const twinkleRef = useRef()

  // Tiny dots — vast majority, like naked-eye stars
  const tinyCount = 4000
  const tiny = useMemo(() => {
    const p = new Float32Array(tinyCount * 3)
    const c = new Float32Array(tinyCount * 3)
    for (let i = 0; i < tinyCount; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 150 + Math.random() * 500
      p[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      p[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      p[i * 3 + 2] = r * Math.cos(phi)
      const roll = Math.random()
      if (roll < 0.6) { c[i*3]=0.95; c[i*3+1]=0.95; c[i*3+2]=1.0 }
      else if (roll < 0.8) { c[i*3]=0.8; c[i*3+1]=0.9; c[i*3+2]=1.0 }
      else if (roll < 0.92) { c[i*3]=1.0; c[i*3+1]=0.92; c[i*3+2]=0.78 }
      else { c[i*3]=0.7; c[i*3+1]=0.8; c[i*3+2]=1.0 }
    }
    return { positions: p, colors: c }
  }, [])

  // Medium brighter stars — some stand out
  const brightCount = 350
  const bright = useMemo(() => {
    const p = new Float32Array(brightCount * 3)
    const c = new Float32Array(brightCount * 3)
    for (let i = 0; i < brightCount; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 140 + Math.random() * 450
      p[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      p[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      p[i * 3 + 2] = r * Math.cos(phi)
      const roll = Math.random()
      if (roll < 0.4) { c[i*3]=1.0; c[i*3+1]=1.0; c[i*3+2]=1.0 }
      else if (roll < 0.7) { c[i*3]=0.85; c[i*3+1]=0.92; c[i*3+2]=1.0 }
      else { c[i*3]=1.0; c[i*3+1]=0.93; c[i*3+2]=0.82 }
    }
    return { positions: p, colors: c }
  }, [])

  // Twinkle stars — ~5% of sky, these blink subtly
  const twinkleCount = 200
  const twinkle = useMemo(() => {
    const p = new Float32Array(twinkleCount * 3)
    const c = new Float32Array(twinkleCount * 3)
    const phases = new Float32Array(twinkleCount) // random phase offsets
    const speeds = new Float32Array(twinkleCount) // random blink speeds
    for (let i = 0; i < twinkleCount; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 130 + Math.random() * 500
      p[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      p[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      p[i * 3 + 2] = r * Math.cos(phi)
      c[i*3] = 1.0; c[i*3+1] = 1.0; c[i*3+2] = 1.0
      phases[i] = Math.random() * Math.PI * 2
      speeds[i] = 0.5 + Math.random() * 2.5
    }
    return { positions: p, colors: c, phases, speeds }
  }, [])

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    const rot = t * 0.001
    if (tinyRef.current) tinyRef.current.rotation.y = rot
    if (brightRef.current) brightRef.current.rotation.y = rot * 1.1

    // Twinkle effect — vary opacity over time
    if (twinkleRef.current) {
      twinkleRef.current.rotation.y = rot * 0.9
      // Pulse opacity between 0.2 and 1.0
      const op = 0.4 + 0.5 * Math.abs(Math.sin(t * 1.2))
      twinkleRef.current.material.opacity = op
      // Slight size pulse
      twinkleRef.current.material.size = 1.6 + 0.6 * Math.sin(t * 1.8)
    }
  })

  return (
    <group>
      {/* Tiny pinpoint stars — most of the sky */}
      <points ref={tinyRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={tinyCount} array={tiny.positions} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={tinyCount} array={tiny.colors} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial vertexColors size={0.7} transparent opacity={0.7} sizeAttenuation={false} depthWrite={false} />
      </points>
      {/* Medium brighter stars */}
      <points ref={brightRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={brightCount} array={bright.positions} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={brightCount} array={bright.colors} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial vertexColors size={1.4} transparent opacity={0.85} sizeAttenuation={false} depthWrite={false} />
      </points>
      {/* Twinkle stars — blink subtly */}
      <points ref={twinkleRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={twinkleCount} array={twinkle.positions} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={twinkleCount} array={twinkle.colors} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial vertexColors size={1.8} transparent opacity={0.6} sizeAttenuation={false} depthWrite={false} />
      </points>
    </group>
  )
}

function RadarSceneContent({ isCollapsing, onCollapseComplete, onBlipClick, activeBlip, expandedCard, onExpandCard, onCloseCard }) {
  const sweepAngleRef = useRef()
  const controlsRef = useRef()

  return (
    <>
      <CameraController isCollapsing={isCollapsing} onCollapseComplete={onCollapseComplete} />

      {/* FREE CAMERA — orbit/pan only, zoom handled by ZoomToPointer */}
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.08}
        enablePan={true}
        enableZoom={false}
        minDistance={0}
        maxDistance={Infinity}
        enabled={!isCollapsing}
        maxPolarAngle={Math.PI}
        minPolarAngle={0}
        panSpeed={1.0}
        rotateSpeed={0.6}
      />
      <ZoomToPointer controlsRef={controlsRef} enabled={!isCollapsing} />

      {/* Lighting — spread out for 3D space illumination */}
      <ambientLight intensity={0.08} />
      <pointLight position={[8, 10, 8]} intensity={0.15} color="#00ccff" />
      <pointLight position={[-8, -6, -8]} intensity={0.08} color="#cc44ff" />
      <pointLight position={[0, 0, 0]} intensity={0.12} color="#00ddff" />
      <pointLight position={[5, -5, 5]} intensity={0.06} color="#00ff9d" />
      <pointLight position={[-5, 5, -5]} intensity={0.06} color="#ffd60a" />

      {/* SPACETIME — 3D reference grid */}
      <SpacetimeFabric />

      {/* 3D HOLOGRAPHIC STRUCTURE */}
      <group position={[0, 0, 0]}>
        <HoloRadar3D sweepAngleRef={sweepAngleRef} />
        <StarkSignals
          sweepAngleRef={sweepAngleRef}
          onBlipClick={onBlipClick}
          activeBlip={activeBlip}
          expandedCard={expandedCard}
          onExpandCard={onExpandCard}
          onCloseCard={onCloseCard}
          controlsRef={controlsRef}
        />
      </group>

      {/* AIR TRAFFIC — jets, airliners, asteroids flying through */}
      <AirTraffic />

      {/* BACKGROUND STARS */}
      <BackgroundStars />

      {/* AMBIENT EFFECTS */}
      <RadarEffects />
    </>
  )
}

export default function RadarScene({ isCollapsing, onCollapseComplete, onBlipClick, activeBlip, expandedCard, onExpandCard, onCloseCard }) {
  return (
    <Canvas
      camera={{ fov: 55, near: 0.01, far: 10000, position: [0, 12, -18] }}
      style={{ width: '100%', height: '100%', display: 'block' }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance", preserveDrawingBuffer: true }}
      onCreated={({ gl }) => {
        gl.setClearColor('#020810', 1)
      }}
    >
      <color attach="background" args={['#020810']} />
      {/* Very distant fog — things fade gently into deep space */}
      <fog attach="fog" args={['#020810', 80, 600]} />

      <RadarSceneContent
        isCollapsing={isCollapsing}
        onCollapseComplete={onCollapseComplete}
        onBlipClick={onBlipClick}
        activeBlip={activeBlip}
        expandedCard={expandedCard}
        onExpandCard={onExpandCard}
        onCloseCard={onCloseCard}
      />
    </Canvas>
  )
}
