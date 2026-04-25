'use client';
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/*
  SPACETIME — INFINITE 3D SPACE
  Replaced the flat warped grid with a subtle 3D grid cube
  that gives depth perception from any direction.
*/
export default function SpacetimeFabric() {
  const gridRef = useRef<THREE.LineSegments>(null)

  // 3D wireframe grid — subtle box edges for spatial reference
  const gridBoxGeo = useMemo(() => {
    const geo = new THREE.BoxGeometry(12, 12, 12, 6, 6, 6)
    return new THREE.EdgesGeometry(geo)
  }, [])

  // Floor grid — subtle
  const floorGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(20, 20, 20, 20)
    geo.rotateX(-Math.PI / 2)
    return new THREE.EdgesGeometry(geo)
  }, [])

  // Scattered small reference cubes in space
  const refCubes = useMemo(() => {
    const cubes = []
    for (let i = 0; i < 12; i++) {
      cubes.push({
        pos: [
          (Math.random() - 0.5) * 16,
          (Math.random() - 0.5) * 12,
          (Math.random() - 0.5) * 16,
        ] as [number, number, number],
        size: 0.04 + Math.random() * 0.06,
        color: ['#00e5ff', '#c77dff', '#ffd60a', '#00ff9d', '#ff6b6b'][i % 5],
        speed: 0.3 + Math.random() * 0.5,
        offset: Math.random() * Math.PI * 2,
      })
    }
    return cubes
  }, [])

  const cubeRefs = useRef<(THREE.Mesh | null)[]>([])

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (gridRef.current) {
      gridRef.current.rotation.y = t * 0.003
    }
    cubeRefs.current.forEach((ref, i) => {
      if (ref && refCubes[i]) {
        ref.rotation.x = t * refCubes[i].speed
        ref.rotation.y = t * refCubes[i].speed * 0.7
        const float = Math.sin(t * 0.4 + refCubes[i].offset) * 0.15
        ref.position.y = refCubes[i].pos[1] + float
      }
    })
  })

  return (
    <group>
      {/* 3D wireframe box — spatial reference */}
      <lineSegments ref={gridRef} geometry={gridBoxGeo}>
        <lineBasicMaterial color="#0a2035" transparent opacity={0.15} />
      </lineSegments>

      {/* Floor grid */}
      <lineSegments geometry={floorGeo} position={[0, -6, 0]}>
        <lineBasicMaterial color="#0a1825" transparent opacity={0.08} />
      </lineSegments>

      {/* Scattered reference cubes — depth markers */}
      {refCubes.map((cube, i) => (
        <mesh
          key={`rc-${i}`}
          ref={(el: THREE.Mesh | null) => { cubeRefs.current[i] = el }}
          position={cube.pos}
        >
          <octahedronGeometry args={[cube.size, 0]} />
          <meshBasicMaterial color={cube.color} transparent opacity={0.35} />
        </mesh>
      ))}
    </group>
  )
}
