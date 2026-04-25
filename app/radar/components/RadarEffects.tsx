'use client';
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/* AMBIENT EFFECTS — deep space particles spread in all directions */
export default function RadarEffects() {
  const particlesRef = useRef<THREE.Points>(null)
  const dustRef = useRef<THREE.Points>(null)
  const orbitalRef = useRef<THREE.Points>(null)

  const particleCount = 200
  const particlePositions = useMemo(() => {
    const p = new Float32Array(particleCount * 3)
    const c = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
      const th = Math.random() * Math.PI * 2
      const ph = Math.acos(2 * Math.random() - 1)
      const r = 5 + Math.random() * 20
      p[i*3] = r * Math.sin(ph) * Math.cos(th)
      p[i*3+1] = r * Math.sin(ph) * Math.sin(th)
      p[i*3+2] = r * Math.cos(ph)
      // Random colors — cyan, purple, white
      const ci = Math.floor(Math.random() * 3)
      if (ci === 0) { c[i*3]=0; c[i*3+1]=0.8; c[i*3+2]=1 }
      else if (ci === 1) { c[i*3]=0.7; c[i*3+1]=0.4; c[i*3+2]=1 }
      else { c[i*3]=0.9; c[i*3+1]=0.9; c[i*3+2]=1 }
    }
    return { positions: p, colors: c }
  }, [])

  const dustCount = 80
  const dustPositions = useMemo(() => {
    const p = new Float32Array(dustCount * 3)
    for (let i = 0; i < dustCount; i++) {
      p[i*3] = (Math.random()-0.5)*30
      p[i*3+1] = (Math.random()-0.5)*30
      p[i*3+2] = (Math.random()-0.5)*30
    }
    return p
  }, [])

  const orbitalCount = 40
  const orbitalData = useMemo(() => {
    const p = new Float32Array(orbitalCount * 3)
    const sp = new Float32Array(orbitalCount)
    const ra = new Float32Array(orbitalCount)
    const of = new Float32Array(orbitalCount)
    const yo = new Float32Array(orbitalCount)
    for (let i = 0; i < orbitalCount; i++) {
      ra[i] = 3 + Math.random() * 8
      of[i] = Math.random() * Math.PI * 2
      sp[i] = 0.03 + Math.random() * 0.1
      yo[i] = (Math.random() - 0.5) * 8
      p[i*3] = Math.cos(of[i]) * ra[i]
      p[i*3+1] = yo[i]
      p[i*3+2] = Math.sin(of[i]) * ra[i]
    }
    return { positions: p, speeds: sp, radii: ra, offsets: of, yOffsets: yo }
  }, [])

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (particlesRef.current) particlesRef.current.rotation.y = t * 0.005
    if (dustRef.current) dustRef.current.rotation.y = -t * 0.003
    if (orbitalRef.current) {
      const pos = orbitalRef.current.geometry.attributes.position as THREE.BufferAttribute
      for (let i = 0; i < orbitalCount; i++) {
        const a = orbitalData.offsets[i] + t * orbitalData.speeds[i]
        pos.setX(i, Math.cos(a) * orbitalData.radii[i])
        pos.setY(i, orbitalData.yOffsets[i] + Math.sin(t * 0.2 + i) * 0.2)
        pos.setZ(i, Math.sin(a) * orbitalData.radii[i])
      }
      pos.needsUpdate = true
    }
  })

  return (
    <group>
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={particleCount} array={particlePositions.positions} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={particleCount} array={particlePositions.colors} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial vertexColors size={0.02} transparent opacity={0.3} sizeAttenuation depthWrite={false} />
      </points>
      <points ref={dustRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={dustCount} array={dustPositions} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial color="#ffffff" size={0.006} transparent opacity={0.12} sizeAttenuation depthWrite={false} />
      </points>
      <points ref={orbitalRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={orbitalCount} array={orbitalData.positions} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial color="#00bbdd" size={0.012} transparent opacity={0.2} sizeAttenuation depthWrite={false} />
      </points>
    </group>
  )
}
