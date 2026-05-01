// @ts-nocheck
'use client';
import { useRef, useState, useCallback, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html, Text } from '@react-three/drei'
import * as THREE from 'three'
import { SIGNALS } from '../data/signals'

const MAX_VISIBLE = 6
const SIGNAL_LIFETIME = 90000
const SPAWN_COOLDOWN = 2500

// Refined color pairs — each dot has a distinct, high-contrast dual-tone
const COLOR_PAIRS = [
  ['#00d4ff', '#ff2d75'],   // cyan + hot pink
  ['#00ffaa', '#8855ff'],   // mint + violet
  ['#ffaa00', '#0088ff'],   // amber + blue
  ['#ff5566', '#00eebb'],   // coral + teal
  ['#aa77ff', '#ffcc00'],   // lavender + gold
  ['#00ccff', '#ff6633'],   // sky blue + tangerine
  ['#33ff99', '#dd44aa'],   // neon green + magenta
  ['#ff9944', '#4488ff'],   // orange + royal blue
]

function createSignalGem(color, radius) {
  // Sleek diamond/octahedron shape — futuristic signal marker
  const geo = new THREE.OctahedronGeometry(radius, 1)
  return geo
}

// ═══════════════════════════════════════════════════════════
// 3D HOLOGRAPHIC CARD — Opens with holographic light animation
// Draggable via header, rotatable via body drag
// Both operations are isolated — they do NOT rotate the scene
// ═══════════════════════════════════════════════════════════
function HoloCard3D({ data, colorPair, onClose, controlsRef }) {
  const cardGroupRef = useRef()    // outer group: position only
  const cardRotateRef = useRef()   // inner group: rotation only
  const borderRef = useRef()
  const scanRef = useRef()
  const glowRef = useRef()
  const beamColumnRef = useRef()
  const beamFlareRef = useRef()
  const holoRingsRef = useRef([])
  const holoParticlesRef = useRef()

  // Animation state
  const birthTime = useRef(Date.now())
  const scaleRef = useRef(0.001)
  const beamScale = useRef(0.01)
  const contentOpacity = useRef(0)

  // Drag state (header = move)
  const dragOffset = useRef([0, 0, 0])
  const dragging = useRef(false)
  const dragStartMouse = useRef(null)

  // Rotate state (body = rotate card only)
  const rotating = useRef(false)
  const rotStartMouse = useRef(null)
  const cardEuler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'))
  const cardQuat = useRef(new THREE.Quaternion())

  const { gl, camera } = useThree()

  const isLong = data.type === 'LONG'
  const typeColor = isLong ? '#00ff9d' : '#ff6b6b'
  const confColor = data.conf >= 85 ? '#00d4ff' : data.conf >= 75 ? '#ffd60a' : '#ff6b6b'
  const accent = colorPair[0]

  const W = 2.2
  const H = 2.8

  const borderGeo = useMemo(() => {
    const pts = [
      new THREE.Vector3(-W/2, -H/2, 0),
      new THREE.Vector3(W/2, -H/2, 0),
      new THREE.Vector3(W/2, H/2, 0),
      new THREE.Vector3(-W/2, H/2, 0),
      new THREE.Vector3(-W/2, -H/2, 0),
    ]
    return new THREE.BufferGeometry().setFromPoints(pts)
  }, [])

  const corners = useMemo(() => {
    const size = 0.15
    return [
      [[-W/2, H/2, 0.001], [-W/2 + size, H/2, 0.001], [-W/2, H/2, 0.001], [-W/2, H/2 - size, 0.001]],
      [[W/2, H/2, 0.001], [W/2 - size, H/2, 0.001], [W/2, H/2, 0.001], [W/2, H/2 - size, 0.001]],
      [[-W/2, -H/2, 0.001], [-W/2 + size, -H/2, 0.001], [-W/2, -H/2, 0.001], [-W/2, -H/2 + size, 0.001]],
      [[W/2, -H/2, 0.001], [W/2 - size, -H/2, 0.001], [W/2, -H/2, 0.001], [W/2, -H/2 + size, 0.001]],
    ]
  }, [])

  const scanLineGeo = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-W/2 + 0.05, 0, 0.002),
      new THREE.Vector3(W/2 - 0.05, 0, 0.002),
    ])
  }, [])

  // ── DRAG HANDLERS (header bar = move card) ──
  const handleDragStart = useCallback((e) => {
    e.stopPropagation()
    dragging.current = true
    dragStartMouse.current = { x: e.clientX, y: e.clientY, off: [...dragOffset.current] }
    gl.domElement.style.cursor = 'grabbing'
    if (controlsRef?.current) controlsRef.current.enabled = false

    const onMouseMove = (ev) => {
      if (!dragging.current || !dragStartMouse.current) return
      const dx = (ev.clientX - dragStartMouse.current.x) * 0.015
      const dy = -(ev.clientY - dragStartMouse.current.y) * 0.015
      dragOffset.current = [
        dragStartMouse.current.off[0] + dx,
        dragStartMouse.current.off[1] + dy,
        dragStartMouse.current.off[2]
      ]
    }
    const onMouseUp = () => {
      dragging.current = false
      dragStartMouse.current = null
      gl.domElement.style.cursor = 'default'
      if (controlsRef?.current) controlsRef.current.enabled = true
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }, [gl, controlsRef])

  // ── ROTATE HANDLERS (card body drag = rotate card only, NOT the scene) ──
  const handleRotateStart = useCallback((e) => {
    e.stopPropagation()
    rotating.current = true
    rotStartMouse.current = { x: e.clientX, y: e.clientY }
    gl.domElement.style.cursor = 'grabbing'
    if (controlsRef?.current) controlsRef.current.enabled = false

    const onMouseMove = (ev) => {
      if (!rotating.current || !rotStartMouse.current) return
      const dx = (ev.clientX - rotStartMouse.current.x) * 0.008
      rotStartMouse.current = { x: ev.clientX, y: ev.clientY }

      // Y-axis only — left/right swipe = turntable spin 360°
      const quatY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), dx)
      cardQuat.current.premultiply(quatY)
    }
    const onMouseUp = () => {
      rotating.current = false
      rotStartMouse.current = null
      gl.domElement.style.cursor = 'default'
      if (controlsRef?.current) controlsRef.current.enabled = true
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }, [gl, controlsRef])

  // Holographic ring geometries for the open animation
  const holoRingGeos = useMemo(() => {
    return [0.3, 0.5, 0.7].map(r => {
      const pts = []
      for (let i = 0; i <= 64; i++) {
        const a = (i / 64) * Math.PI * 2
        pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r))
      }
      return new THREE.BufferGeometry().setFromPoints(pts)
    })
  }, [])

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    const age = (Date.now() - birthTime.current) / 1000

    // Phase 1 (0-0.6s): Beam shoots up + holographic rings expand
    // Phase 2 (0.3-1.2s): Card materializes from light particles
    // Phase 3 (1.0s+): Fully interactive

    // Beam animation
    const beamTarget = age < 1.5 ? Math.min(age / 0.4, 1) : Math.max(0, 1 - (age - 1.5) * 2)
    beamScale.current += (beamTarget - beamScale.current) * 0.1
    if (beamColumnRef.current) {
      beamColumnRef.current.scale.y = beamScale.current
      beamColumnRef.current.material.opacity = beamScale.current * 0.4
    }
    if (beamFlareRef.current) {
      const p = 0.5 + 0.5 * Math.sin(t * 6)
      beamFlareRef.current.material.opacity = beamScale.current * (0.2 + p * 0.15)
      beamFlareRef.current.scale.setScalar(0.5 + beamScale.current * 2.0)
    }

    // Holographic rings expand outward during open
    holoRingsRef.current.forEach((ref, i) => {
      if (!ref) return
      const ringDelay = i * 0.12
      const ringAge = Math.max(0, age - ringDelay)
      const ringScale = ringAge < 1.0 ? Math.min(ringAge / 0.5, 1) : Math.max(0, 1 - (ringAge - 1.0) * 1.5)
      ref.scale.setScalar(1 + ringAge * 2)
      ref.material.opacity = ringScale * (0.25 - i * 0.06)
      ref.position.y = ringAge * 1.5 * (1 + i * 0.3)
    })

    // Card scale-up (delayed start, materializes from energy)
    const cardTarget = age > 0.2 ? 0.6 : 0
    scaleRef.current += (cardTarget - scaleRef.current) * 0.08
    if (cardGroupRef.current) {
      cardGroupRef.current.scale.setScalar(scaleRef.current)
      cardGroupRef.current.position.x = dragOffset.current[0]
      cardGroupRef.current.position.y = 1.8 + dragOffset.current[1]
      cardGroupRef.current.position.z = dragOffset.current[2]
    }

    // Apply user rotation to the card rotate group
    if (cardRotateRef.current) {
      cardRotateRef.current.quaternion.copy(cardQuat.current)
    }

    // Content opacity (staggered fade-in)
    const opTarget = age > 0.5 ? 1 : 0
    contentOpacity.current += (opTarget - contentOpacity.current) * 0.06

    // Scan line
    if (scanRef.current) {
      const sweep = ((t * 0.4) % 1)
      scanRef.current.position.y = H/2 - sweep * H
      scanRef.current.material.opacity = (0.15 + 0.1 * Math.sin(t * 8)) * contentOpacity.current
    }

    // Glow pulse
    if (glowRef.current) {
      const p = 0.5 + 0.5 * Math.sin(t * 1.5)
      glowRef.current.material.opacity = (0.03 + p * 0.02) * contentOpacity.current
    }

    // Border pulse
    if (borderRef.current) {
      const p = 0.5 + 0.5 * Math.sin(t * 2)
      borderRef.current.material.opacity = (0.15 + p * 0.1) * contentOpacity.current
    }
  })

  const priceText = '$' + (data.price || '—')
  const confText = data.conf + '%'

  return (
    <group>
      {/* ═══ HOLOGRAPHIC BEAM — shoots up first ═══ */}
      <mesh ref={beamColumnRef} position={[0, 1.0, 0]}>
        <cylinderGeometry args={[0.02, 0.15, 2.0, 8, 1, true]} />
        <meshBasicMaterial color={accent} transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      {/* Beam base flare — bigger, brighter */}
      <mesh ref={beamFlareRef} position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.05, 0.45, 24]} />
        <meshBasicMaterial color={accent} transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      {/* ═══ HOLOGRAPHIC OPENING RINGS — expand outward like Iron Man HUD ═══ */}
      {holoRingGeos.map((geo, i) => (
        <line key={`holo-ring-${i}`} ref={el => holoRingsRef.current[i] = el} geometry={geo} rotation={[-Math.PI / 2, 0, 0]}>
          <lineBasicMaterial color={accent} transparent opacity={0} depthWrite={false} />
        </line>
      ))}

      {/* ═══ CARD GROUP — position controlled by drag ═══ */}
      <group ref={cardGroupRef} position={[0, 2.8, 0]} scale={0.001}>
        {/* ═══ CARD ROTATE GROUP — rotation controlled by body drag ═══ */}
        <group ref={cardRotateRef}>
          {/* Card background — drag on THIS rotates the card */}
          <mesh
            onPointerDown={(e) => {
              e.stopPropagation()
              handleRotateStart(e)
            }}
            onPointerOver={() => { document.body.style.cursor = 'grab' }}
            onPointerOut={() => { if (!rotating.current && !dragging.current) document.body.style.cursor = 'default' }}
          >
            <planeGeometry args={[W, H]} />
            <meshBasicMaterial color="#040c1c" transparent opacity={0.88} side={THREE.DoubleSide} depthWrite={true} />
          </mesh>

          {/* Glow behind */}
          <mesh ref={glowRef} position={[0, 0, -0.01]}>
            <planeGeometry args={[W + 0.3, H + 0.3]} />
            <meshBasicMaterial color={accent} transparent opacity={0.04} side={THREE.FrontSide} depthWrite={false} />
          </mesh>

          {/* Border frame */}
          <line ref={borderRef} geometry={borderGeo}>
            <lineBasicMaterial color={accent} transparent opacity={0.2} />
          </line>

          {/* Corner accents */}
          {corners.map((corner, ci) => (
            <group key={`c-${ci}`}>
              <line geometry={new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...corner[0]), new THREE.Vector3(...corner[1])])}>
                <lineBasicMaterial color={accent} transparent opacity={0.5} />
              </line>
              <line geometry={new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...corner[2]), new THREE.Vector3(...corner[3])])}>
                <lineBasicMaterial color={accent} transparent opacity={0.5} />
              </line>
            </group>
          ))}

          {/* Scan line */}
          <line ref={scanRef} geometry={scanLineGeo}>
            <lineBasicMaterial color={accent} transparent opacity={0.2} />
          </line>

          {/* ═══ DRAG HANDLE BAR (top) — grab here to MOVE ═══ */}
          <mesh
            position={[0, H/2 - 0.015, 0.003]}
            onPointerDown={(e) => {
              e.stopPropagation()
              handleDragStart(e)
            }}
            onPointerOver={() => { document.body.style.cursor = 'grab' }}
            onPointerOut={() => { if (!dragging.current) document.body.style.cursor = 'default' }}
          >
            <planeGeometry args={[W, 0.06]} />
            <meshBasicMaterial color={accent} transparent opacity={0.5} side={THREE.FrontSide} />
          </mesh>
          <Text position={[0, H/2 - 0.015, 0.005]} fontSize={0.03} color="#ffffff" fillOpacity={0.4} anchorX="center" anchorY="middle" letterSpacing={0.4}>
            ⋯ DRAG TO MOVE ⋯
          </Text>

          {/* Accent bar */}
          <mesh position={[-(W/2 - 0.4), H/2 - 0.06, 0.001]}>
            <planeGeometry args={[0.8, 0.025]} />
            <meshBasicMaterial color={accent} transparent opacity={0.6} side={THREE.FrontSide} />
          </mesh>

          {/* ═══ TEXT CONTENT ═══ */}
          <Text position={[-W/2 + 0.15, H/2 - 0.25, 0.005]} fontSize={0.22} color={accent} anchorX="left" anchorY="top" fontWeight={700} letterSpacing={0.08}>
            {data.sym}
          </Text>

          {/* Close X */}
          <mesh position={[W/2 - 0.15, H/2 - 0.18, 0.005]} onClick={(e) => { e.stopPropagation(); onClose() }} onPointerOver={() => { document.body.style.cursor = 'pointer' }} onPointerOut={() => { document.body.style.cursor = 'default' }}>
            <planeGeometry args={[0.2, 0.2]} />
            <meshBasicMaterial color="#041020" transparent opacity={0.5} side={THREE.FrontSide} />
          </mesh>
          <Text position={[W/2 - 0.15, H/2 - 0.18, 0.006]} fontSize={0.12} color="#ffffff" anchorX="center" anchorY="middle">✕</Text>

          {/* Type badge */}
          <mesh position={[-W/2 + 0.42, H/2 - 0.55, 0.003]}>
            <planeGeometry args={[0.72, 0.16]} />
            <meshBasicMaterial color={typeColor} transparent opacity={0.08} side={THREE.FrontSide} />
          </mesh>
          <Text position={[-W/2 + 0.42, H/2 - 0.55, 0.005]} fontSize={0.07} color={typeColor} anchorX="center" anchorY="middle" letterSpacing={0.12}>
            {data.type} SIGNAL
          </Text>

          {/* Divider */}
          <mesh position={[0, H/2 - 0.7, 0.002]}>
            <planeGeometry args={[W - 0.3, 0.005]} />
            <meshBasicMaterial color={accent} transparent opacity={0.08} side={THREE.FrontSide} />
          </mesh>

          {/* Price */}
          <Text position={[-W/2 + 0.15, H/2 - 0.92, 0.005]} fontSize={0.2} color="#ffffff" anchorX="left" anchorY="top" fontWeight={700}>
            {priceText}
          </Text>

          {/* Change */}
          <Text position={[-W/2 + 0.15 + priceText.length * 0.11 + 0.15, H/2 - 0.94, 0.005]} fontSize={0.1} color={typeColor} anchorX="left" anchorY="top" fontWeight={600}>
            {data.change || '—'}
          </Text>

          {/* Stats background */}
          <mesh position={[0, H/2 - 1.32, 0.002]}>
            <planeGeometry args={[W - 0.3, 0.42]} />
            <meshBasicMaterial color="#0a1830" transparent opacity={0.5} side={THREE.FrontSide} />
          </mesh>

          {/* Confidence */}
          <Text position={[-W/2 + 0.25, H/2 - 1.15, 0.005]} fontSize={0.055} color="#ffffff" fillOpacity={0.33} anchorX="left" anchorY="top" letterSpacing={0.12}>CONF</Text>
          <Text position={[-W/2 + 0.25, H/2 - 1.28, 0.005]} fontSize={0.11} color={confColor} anchorX="left" anchorY="top" fontWeight={700}>{confText}</Text>
          <mesh position={[-W/2 + 0.5, H/2 - 1.46, 0.003]}>
            <planeGeometry args={[0.5, 0.02]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.05} side={THREE.FrontSide} />
          </mesh>
          <mesh position={[-W/2 + 0.5 - (0.5 * (1 - data.conf/100)) / 2, H/2 - 1.46, 0.004]}>
            <planeGeometry args={[0.5 * (data.conf / 100), 0.02]} />
            <meshBasicMaterial color={confColor} transparent opacity={0.7} side={THREE.FrontSide} />
          </mesh>

          {/* Volume */}
          <Text position={[-0.05, H/2 - 1.15, 0.005]} fontSize={0.055} color="#ffffff" fillOpacity={0.33} anchorX="left" anchorY="top" letterSpacing={0.12}>VOL</Text>
          <Text position={[-0.05, H/2 - 1.28, 0.005]} fontSize={0.11} color="#ffffff" anchorX="left" anchorY="top" fontWeight={700}>{data.vol || '—'}</Text>

          {/* Signal ID */}
          <Text position={[W/2 - 0.7, H/2 - 1.15, 0.005]} fontSize={0.055} color="#ffffff" fillOpacity={0.33} anchorX="left" anchorY="top" letterSpacing={0.12}>SIG</Text>
          <Text position={[W/2 - 0.7, H/2 - 1.28, 0.005]} fontSize={0.11} color="#ffffff" anchorX="left" anchorY="top" fontWeight={700}>
            {String(data.id).padStart(3, '0')}
          </Text>

          {/* Analysis */}
          <mesh position={[0, H/2 - 1.82, 0.002]}>
            <planeGeometry args={[W - 0.3, 0.5]} />
            <meshBasicMaterial color="#061428" transparent opacity={0.3} side={THREE.FrontSide} />
          </mesh>
          <Text position={[-W/2 + 0.22, H/2 - 1.62, 0.005]} fontSize={0.055} color={accent} anchorX="left" anchorY="top" letterSpacing={0.15}>
            {'◈ ANALYSIS'}
          </Text>
          <Text position={[-W/2 + 0.22, H/2 - 1.74, 0.005]} fontSize={0.065} color="#ffffff" fillOpacity={0.53} anchorX="left" anchorY="top" maxWidth={W - 0.5} lineHeight={1.4}>
            {data.desc || 'Signal analysis pending...'}
          </Text>

          {/* Rotate hint at bottom */}
          <Text position={[0, -H/2 + 0.46, 0.005]} fontSize={0.03} color="#ffffff" fillOpacity={0.2} anchorX="center" anchorY="middle" letterSpacing={0.3}>
            ⟳ DRAG CARD TO ROTATE
          </Text>

          {/* Action buttons */}
          <mesh position={[-0.4, -H/2 + 0.2, 0.003]} onClick={(e) => e.stopPropagation()} onPointerOver={() => { document.body.style.cursor = 'pointer' }} onPointerOut={() => { document.body.style.cursor = 'default' }}>
            <planeGeometry args={[0.8, 0.2]} />
            <meshBasicMaterial color={accent} transparent opacity={0.06} side={THREE.FrontSide} />
          </mesh>
          <Text position={[-0.4, -H/2 + 0.2, 0.005]} fontSize={0.06} color={accent} anchorX="center" anchorY="middle" letterSpacing={0.1}>◆ EXECUTE</Text>

          <mesh position={[0.45, -H/2 + 0.2, 0.003]} onClick={(e) => e.stopPropagation()} onPointerOver={() => { document.body.style.cursor = 'pointer' }} onPointerOut={() => { document.body.style.cursor = 'default' }}>
            <planeGeometry args={[0.55, 0.2]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.03} side={THREE.FrontSide} />
          </mesh>
          <Text position={[0.45, -H/2 + 0.2, 0.005]} fontSize={0.06} color="#ffffff" fillOpacity={0.47} anchorX="center" anchorY="middle" letterSpacing={0.1}>◇ WATCH</Text>
        </group>
      </group>
    </group>
  )
}

// ═══════════════════════════════════════════════════════════
// PROXIMITY EXPLODED VIEW — shows inside data when camera is close
// Rotatable independently — dragging on the exploded dot rotates
// only the dot, NOT the entire scene
// ═══════════════════════════════════════════════════════════
const DOT_EXPLODE_START = 2.8
const DOT_EXPLODE_FULL = 1.0
const DOT_HEMI_SPREAD = 0.25

function ExplodedDotView({ data, colorPair, explodeValue, controlsRef }) {
  const groupRef = useRef()
  const rotGroupRef = useRef()
  const topHemiRef = useRef()
  const botHemiRef = useRef()
  const dataGroupRef = useRef()
  const ringSpreadRefs = useRef([])
  const lineRefs = useRef([])

  // Independent rotation state for the exploded dot
  const dotRotating = useRef(false)
  const dotRotStartMouse = useRef(null)
  const dotQuat = useRef(new THREE.Quaternion())
  const { gl } = useThree()

  const isLong = data.type === 'LONG'
  const typeColor = isLong ? '#00ff9d' : '#ff6b6b'
  const accent = colorPair[0]

  const labels = useMemo(() => [
    { text: data.sym, color: accent, y: 0.12 },
    { text: '$' + (data.price || '—'), color: '#ffffff', y: 0.03 },
    { text: data.type + ' ' + data.conf + '%', color: typeColor, y: -0.06 },
    { text: 'VOL ' + (data.vol || '—'), color: '#ffffff', opacity: 0.53, y: -0.15 },
  ], [data, accent, typeColor])

  // ── ROTATE HANDLER for exploded dot — only rotates this dot ──
  const handleDotRotateStart = useCallback((e) => {
    e.stopPropagation()
    dotRotating.current = true
    dotRotStartMouse.current = { x: e.clientX, y: e.clientY }
    gl.domElement.style.cursor = 'grabbing'
    if (controlsRef?.current) controlsRef.current.enabled = false

    const onMouseMove = (ev) => {
      if (!dotRotating.current || !dotRotStartMouse.current) return
      const dx = (ev.clientX - dotRotStartMouse.current.x) * 0.01
      const dy = (ev.clientY - dotRotStartMouse.current.y) * 0.01
      dotRotStartMouse.current = { x: ev.clientX, y: ev.clientY }

      const quatX = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), dy)
      const quatY = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), dx)
      dotQuat.current.premultiply(quatY).premultiply(quatX)
    }
    const onMouseUp = () => {
      dotRotating.current = false
      dotRotStartMouse.current = null
      gl.domElement.style.cursor = 'default'
      if (controlsRef?.current) controlsRef.current.enabled = true
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }, [gl, controlsRef])

  useFrame(() => {
    const ex = explodeValue.current

    if (groupRef.current) {
      groupRef.current.visible = ex > 0.02
    }

    // Apply user rotation
    if (rotGroupRef.current) {
      rotGroupRef.current.quaternion.copy(dotQuat.current)
    }

    if (topHemiRef.current) {
      topHemiRef.current.position.y = ex * DOT_HEMI_SPREAD
      topHemiRef.current.material.opacity = 0.4 + ex * 0.3
    }
    if (botHemiRef.current) {
      botHemiRef.current.position.y = -ex * DOT_HEMI_SPREAD
      botHemiRef.current.material.opacity = 0.4 + ex * 0.3
    }

    // Data labels scale in
    if (dataGroupRef.current) {
      const s = THREE.MathUtils.clamp(ex * 2, 0, 1)
      dataGroupRef.current.scale.setScalar(s)
      dataGroupRef.current.visible = ex > 0.1
    }

    // Spread rings outward
    ringSpreadRefs.current.forEach((ref, i) => {
      if (ref) {
        const spread = ex * (0.3 + i * 0.15)
        ref.position.y = (i === 0 ? 1 : -1) * spread * (i < 2 ? 1 : 0.5)
        ref.material.opacity = ex * 0.15
      }
    })

    lineRefs.current.forEach(ref => {
      if (ref) ref.material.opacity = ex * 0.4
    })
  })

  return (
    <group ref={groupRef} visible={false}>
      {/* Invisible interaction sphere — drag this to rotate the exploded dot ONLY */}
      <mesh
        visible={false}
        onPointerDown={handleDotRotateStart}
        onPointerOver={() => { if (explodeValue.current > 0.1) gl.domElement.style.cursor = 'grab' }}
        onPointerOut={() => { if (!dotRotating.current) gl.domElement.style.cursor = 'default' }}
      >
        <sphereGeometry args={[0.4, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Rotation group — only this rotates when user drags */}
      <group ref={rotGroupRef}>
        {/* Top half — separates upward */}
        <mesh ref={topHemiRef} rotation={[0, 0, 0]}>
          <octahedronGeometry args={[0.1, 1]} />
          <meshBasicMaterial color={colorPair[0]} transparent opacity={0.4} side={THREE.DoubleSide} depthWrite={false} wireframe />
        </mesh>

        {/* Bottom half — separates downward */}
        <mesh ref={botHemiRef} rotation={[0, 0, 0]}>
          <octahedronGeometry args={[0.1, 1]} />
          <meshBasicMaterial color={colorPair[1]} transparent opacity={0.4} side={THREE.DoubleSide} depthWrite={false} wireframe />
        </mesh>

        {/* Spread rings */}
        {[0, 1, 2, 3].map(i => (
          <mesh key={`esr-${i}`} ref={el => ringSpreadRefs.current[i] = el} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.12 + i * 0.04, 0.14 + i * 0.04, 24]} />
            <meshBasicMaterial
              color={i % 2 === 0 ? colorPair[0] : colorPair[1]}
              transparent opacity={0}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        ))}

        {/* Data labels */}
        <group ref={dataGroupRef} visible={false}>
          {labels.map((label, i) => (
            <group key={`edl-${i}`} position={[0.25, label.y, 0]}>
              <line ref={el => lineRefs.current[i] = el}>
                <bufferGeometry>
                  <bufferAttribute attach="attributes-position" count={2}
                    array={new Float32Array([-0.25, -label.y, 0, 0, 0, 0])}
                    itemSize={3}
                  />
                </bufferGeometry>
                <lineBasicMaterial color={label.color} transparent opacity={0} />
              </line>
              <mesh>
                <sphereGeometry args={[0.008, 4, 4]} />
                <meshBasicMaterial color={label.color} />
              </mesh>
              <Text
                position={[0.03, 0, 0]}
                fontSize={0.04}
                color={label.color}
                fillOpacity={label.opacity !== undefined ? label.opacity : 1}
                anchorX="left"
                anchorY="middle"
                letterSpacing={0.06}
              >
                {label.text}
              </Text>
            </group>
          ))}
        </group>
      </group>
    </group>
  )
}

// ═══════════════════════════════════════════════════════════
// SIGNAL DOT — two-tone 3D sphere with pulse rings,
// hover label, click card, proximity exploded view
// ═══════════════════════════════════════════════════════════
function SignalDot({ data, birthTime, onExpand, onExpired, isAnyExpanded, isExpanded, onClose, controlsRef }) {
  const groupRef = useRef()
  const dotRef = useRef()
  const connectorRef = useRef()
  const pulseRing1 = useRef()
  const pulseRing2 = useRef()
  const pulseRing3 = useRef()
  const glowRef = useRef()
  const beamRef = useRef()
  const beamGlowRef = useRef()
  const [hovered, setHovered] = useState(false)
  const [age, setAge] = useState(0)
  const hoverLerp = useRef(0)
  const expandLerp = useRef(0)
  const dotExplodeValue = useRef(0)
  const birthLerp = useRef(0)
  const { gl, camera } = useThree()

  const pos = useMemo(() => data.pos, [data])
  const posVec = useMemo(() => new THREE.Vector3(...pos), [pos])
  const colorPair = COLOR_PAIRS[(data.id - 1) % COLOR_PAIRS.length]

  const dotGeo = useMemo(() => createSignalGem(
    colorPair[0], 0.08
  ), [colorPair])

  useEffect(() => {
    const iv = setInterval(() => {
      const elapsed = Date.now() - birthTime
      setAge(elapsed)
      if (elapsed >= SIGNAL_LIFETIME) onExpired(data.id)
    }, 1000)
    return () => clearInterval(iv)
  }, [birthTime, data.id, onExpired])

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    const id = data.id

    // ── BIRTH ANIMATION — smooth fade/scale in ──
    const birthAge = (Date.now() - birthTime) / 1000 // seconds since birth
    const birthTarget = Math.min(birthAge / 1.2, 1) // 0→1 over 1.2s
    birthLerp.current += (birthTarget - birthLerp.current) * 0.08
    const birth = birthLerp.current

    // Apply birth scale to entire group
    if (groupRef.current) {
      groupRef.current.scale.setScalar(birth)
    }

    // ── PROXIMITY DETECTION for exploded view ──
    const camDist = camera.position.distanceTo(posVec)
    const rawExplode = 1 - THREE.MathUtils.clamp(
      (camDist - DOT_EXPLODE_FULL) / (DOT_EXPLODE_START - DOT_EXPLODE_FULL), 0, 1
    )
    dotExplodeValue.current += (rawExplode - dotExplodeValue.current) * 0.06
    const proximity = dotExplodeValue.current

    const hTarget = hovered ? 1 : 0
    hoverLerp.current += (hTarget - hoverLerp.current) * 0.08
    const h = hoverLerp.current

    const eTarget = isExpanded ? 1 : 0
    expandLerp.current += (eTarget - expandLerp.current) * 0.06
    const e = expandLerp.current

    if (dotRef.current) {
      dotRef.current.rotation.y = t * 1.2 + id * 1.2
      dotRef.current.rotation.x = Math.sin(t * 0.6 + id) * 0.15
      const floatY = Math.sin(t * 0.5 + id * 1.3) * 0.04
      dotRef.current.position.y = floatY
      const s = 1.0 + h * 0.4 + e * 0.3
      dotRef.current.scale.setScalar(s)
      // Fade original dot as exploded view takes over
      dotRef.current.material.opacity = 0.9 * birth * (1 - proximity * 0.8)
    }

    if (glowRef.current) {
      const p = 0.5 + 0.5 * Math.sin(t * 2 + id)
      glowRef.current.material.opacity = (0.04 + p * 0.04) + h * 0.06 + e * 0.1 + proximity * 0.03
      glowRef.current.scale.setScalar(1.0 + p * 0.15 + h * 0.25 + e * 0.3 + proximity * 0.2)
    }

    const rings = [pulseRing1.current, pulseRing2.current, pulseRing3.current]
    rings.forEach((ring, i) => {
      if (!ring) return
      const phase = ((t * 0.6 + id * 0.5 + i * 1.1) % 3.0)
      const scale = 0.3 + phase * 0.7 + proximity * 0.4
      ring.scale.setScalar(scale)
      ring.material.opacity = Math.max(0, 0.25 - phase * 0.085)
      if (i === 0) ring.rotation.x = Math.PI / 2
      else if (i === 1) { ring.rotation.x = Math.PI / 3; ring.rotation.z = t * 0.2 }
      else { ring.rotation.x = Math.PI / 2.5; ring.rotation.y = t * 0.15 + 1 }
    })

    if (beamRef.current) {
      beamRef.current.material.opacity = e * 0.12
      beamRef.current.scale.x = 0.8 + e * 0.2
      beamRef.current.scale.z = 0.8 + e * 0.2
    }
    if (beamGlowRef.current) {
      beamGlowRef.current.material.opacity = e * 0.06
    }

    if (connectorRef.current) {
      const p = 0.5 + 0.5 * Math.sin(t * 0.4 + id * 2)
      connectorRef.current.material.opacity = 0.02 + p * 0.03 + e * 0.04
    }
  })

  const handleClick = useCallback((e) => {
    e.stopPropagation()
    if (isExpanded) {
      onClose()
    } else {
      onExpand(data)
    }
  }, [data, onExpand, onClose, isExpanded])

  const handlePointerOver = useCallback(() => {
    setHovered(true)
    gl.domElement.style.cursor = 'pointer'
  }, [gl])

  const handlePointerOut = useCallback(() => {
    setHovered(false)
    gl.domElement.style.cursor = 'default'
  }, [gl])

  const connectorGeo = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(...pos),
    ])
  }, [pos])

  const isLong = data.type === 'LONG'
  const typeColor = isLong ? '#00ff9d' : '#ff6b6b'

  return (
    <group ref={groupRef}>
      <line geometry={connectorGeo} ref={connectorRef}>
        <lineBasicMaterial color={colorPair[0]} transparent opacity={0.04} />
      </line>

      <group position={pos}>
        <mesh
          ref={dotRef}
          geometry={dotGeo}
          onClick={handleClick}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        >
          <meshBasicMaterial color={colorPair[0]} transparent opacity={0.9} />
        </mesh>

        {/* Subtle point glow */}
        <mesh ref={glowRef}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshBasicMaterial color={colorPair[0]} transparent opacity={0.06} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>

        {[pulseRing1, pulseRing2, pulseRing3].map((ref, i) => (
          <mesh key={`pr-${data.id}-${i}`} ref={ref}>
            <ringGeometry args={[0.14, 0.155, 32]} />
            <meshBasicMaterial
              color={colorPair[0]}
              transparent opacity={0.12}
              side={THREE.DoubleSide}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        ))}

        {/* Light beam */}
        <mesh ref={beamRef} position={[0, 0.9, 0]}>
          <cylinderGeometry args={[0.005, 0.08, 1.6, 8, 1, true]} />
          <meshBasicMaterial color={colorPair[0]} transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
        <mesh ref={beamGlowRef} position={[0, 0.9, 0]}>
          <cylinderGeometry args={[0.04, 0.2, 1.6, 8, 1, true]} />
          <meshBasicMaterial color={colorPair[0]} transparent opacity={0} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>

        {/* ═══ EXPLODED VIEW — proximity activated, independently rotatable ═══ */}
        <ExplodedDotView data={data} colorPair={colorPair} explodeValue={dotExplodeValue} controlsRef={controlsRef} />

        {/* Hover label */}
        {hovered && !isAnyExpanded && (
          <Html position={[0, 0.4, 0]} center distanceFactor={6} style={{ pointerEvents: 'none' }}>
            <div className="dot-hover-label" style={{ borderColor: colorPair[0] }}>
              <span className="dot-hover-sym" style={{ color: colorPair[0] }}>{data.sym}</span>
              <span className="dot-hover-type" style={{ color: typeColor }}>{data.type}</span>
            </div>
          </Html>
        )}

        {/* 3D HOLOGRAPHIC CARD */}
        {isExpanded && (
          <HoloCard3D data={data} colorPair={colorPair} onClose={onClose} controlsRef={controlsRef} />
        )}
      </group>
    </group>
  )
}

// ═══════════════════════════════════════════════════════════
// MAIN SIGNAL SYSTEM — Progressive discovery via sweep
// ═══════════════════════════════════════════════════════════
export default function StarkSignals({ sweepAngleRef, onBlipClick, activeBlip, expandedCard, onExpandCard, onCloseCard, controlsRef }) {
  const [discovered, setDiscovered] = useState([])
  const lastSpawn = useRef(0)

  useFrame(() => {
    if (!sweepAngleRef?.current) return
    const sweep = sweepAngleRef.current.getSweepAngle()
    const now = Date.now()
    if (discovered.length < MAX_VISIBLE && now - lastSpawn.current > SPAWN_COOLDOWN) {
      const ids = new Set(discovered.map(d => d.id))
      for (const sig of SIGNALS) {
        if (ids.has(sig.id)) continue
        // Use angle of the signal's XZ position for sweep detection
        const sigAngle = Math.atan2(sig.pos[2], sig.pos[0])
        const normSigAngle = ((sigAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
        const normSweep = ((sweep % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
        const diff = Math.abs(((normSweep - normSigAngle) + Math.PI * 3) % (Math.PI * 2) - Math.PI)
        if (diff < 0.3) {
          setDiscovered(prev => {
            if (prev.length >= MAX_VISIBLE || prev.some(d => d.id === sig.id)) return prev
            return [...prev, { ...sig, birthTime: now }]
          })
          lastSpawn.current = now
          break
        }
      }
    }
  })

  const handleExpired = useCallback((id) => setDiscovered(prev => prev.filter(d => d.id !== id)), [])
  const handleExpand = useCallback((d) => onExpandCard(d), [onExpandCard])
  const handleClose = useCallback(() => onCloseCard(), [onCloseCard])

  return (
    <>
      {discovered.map((sig) => (
        <SignalDot
          key={`${sig.id}-${sig.birthTime}`}
          data={sig}
          birthTime={sig.birthTime}
          onExpand={handleExpand}
          onExpired={handleExpired}
          isAnyExpanded={!!expandedCard}
          isExpanded={expandedCard?.id === sig.id}
          onClose={handleClose}
          controlsRef={controlsRef}
        />
      ))}
    </>
  )
}
