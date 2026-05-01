'use client';

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { theme } from "../config/theme";
import { buildMolecule, type AtomData, type BondData } from "../config/molecule";

const CYCLE_SPEED = 0.5; // Slightly faster for more dynamic feeling

function getPhaseProgress(time: number) {
  const t = Math.sin(time * CYCLE_SPEED);
  return THREE.MathUtils.smoothstep(t, -0.2, 0.4);
}

interface AtomSphereProps {
  atom: AtomData;
}

function AtomSphere({ atom }: AtomSphereProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshPhysicalMaterial>(null);
  
  const color = theme.atom.atomColors[atom.element];
  // Node Size based on Data Volume! (User requested big nodes = high trade volume)
  const baseRadius = theme.atom.atomRadii[atom.element];
  const radius = baseRadius * (atom.tradeVolume || 1);
  
  const isLight = atom.element === "H";
  const isCarbon = atom.element === "C";
  const baseEmissive = isLight ? 0.05 : isCarbon ? 0.02 : 0.15;

  useFrame(({ clock }) => {
    if (!meshRef.current || !matRef.current) return;
    
    const time = clock.getElapsedTime();
    const progress = getPhaseProgress(time);
    const eased = THREE.MathUtils.smoothstep(progress, 0, 1);
    
    meshRef.current.position.lerpVectors(atom.dispersedPosition, atom.position, eased);
    
    // Very soft organic glow by modulating the actual atom's emissive surface
    // instead of a hard geometric border.
    if (progress > 0.9) {
      const pulse = Math.sin(time * 4) * 0.5 + 0.5; // 0 to 1
      matRef.current.emissiveIntensity = baseEmissive + (pulse * 0.15);
    } else {
      matRef.current.emissiveIntensity = baseEmissive;
    }
  });

  return (
    <mesh ref={meshRef} castShadow receiveShadow>
      <sphereGeometry args={[radius, 32, 32]} />
      <meshPhysicalMaterial
        ref={matRef}
        color={color}
        roughness={isCarbon ? 0.55 : isLight ? 0.4 : 0.3}
        metalness={isCarbon ? 0.3 : 0.1}
        clearcoat={isLight ? 0.6 : 0.3}
        clearcoatRoughness={0.25}
        emissive={color}
        emissiveIntensity={baseEmissive}
      />
    </mesh>
  );
}

interface BondCylinderProps {
  bond: BondData;
  atoms: AtomData[];
}

function BondCylinder({ bond, atoms }: BondCylinderProps) {
  const groupRef = useRef<THREE.Group>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  const matRefs = useRef<THREE.MeshStandardMaterial[]>([]);
  
  const aDisp = atoms[bond.from].dispersedPosition;
  const aOrig = atoms[bond.from].position;
  const bDisp = atoms[bond.to].dispersedPosition;
  const bOrig = atoms[bond.to].position;

  const isSameChunk = atoms[bond.from].chunkId === atoms[bond.to].chunkId;

  const aCurr = new THREE.Vector3();
  const bCurr = new THREE.Vector3();
  const dir = new THREE.Vector3();
  const mid = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);

  // Calculate connection flash timing offset based on position
  const randomOffset = useMemo(() => Math.random() * 2, []);
  // Direction of data flow
  const flowDir = useMemo(() => Math.random() > 0.5 ? 1 : -1, []);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const progress = getPhaseProgress(time);
    const eased = THREE.MathUtils.smoothstep(progress, 0, 1);
    
    // 1. Calculate Positions
    aCurr.lerpVectors(aDisp, aOrig, eased);
    bCurr.lerpVectors(bDisp, bOrig, eased);

    // 2. Animate Data Pulse (Floating light running through bonds)
    if (pulseRef.current) {
      if (progress > 0.8) {
        pulseRef.current.visible = true;
        let t = (time * 0.6 + randomOffset) % 1;
        if (flowDir < 0) t = 1 - t; // Reverse flow
        
        // Linear interpolation directly from Atom A to Atom B
        const pulsePos = new THREE.Vector3().lerpVectors(aCurr, bCurr, t);
        pulseRef.current.position.copy(pulsePos);
        
        // Scale it so it smoothly emerges from the atom and fades back in
        const edgeFade = 1 - Math.pow(Math.abs(t - 0.5) * 2, 2);
        pulseRef.current.scale.setScalar(edgeFade * (isSameChunk ? 1 : 1.4));
      } else {
        pulseRef.current.visible = false;
      }
    }

    if (!groupRef.current) return;
    
    if (!isSameChunk && eased < 0.05) {
      groupRef.current.visible = false;
      return;
    }
    groupRef.current.visible = true;

    mid.addVectors(aCurr, bCurr).multiplyScalar(0.5);
    dir.subVectors(bCurr, aCurr);
    const len = dir.length();

    groupRef.current.position.copy(mid);
    groupRef.current.quaternion.setFromUnitVectors(up, dir.normalize());
    
    const extrusion = isSameChunk ? 1 : THREE.MathUtils.smoothstep(eased, 0.2, 0.9);
    
    // Animate the thickness and glow of the connecting bonds!
    let thicknessMult = 1;
    let emissiveGlow = 0;

    if (!isSameChunk && progress > 0.8) {
      // Pulse animation for the joining bond
      const pulse = Math.max(0, Math.sin((time * 5) + randomOffset));
      thicknessMult = 1 + (pulse * 0.4); // Bond gets slightly thicker like an energy surge
      emissiveGlow = pulse * 0.8; // High glow intensity
    }

    groupRef.current.scale.set(extrusion * thicknessMult, len * extrusion, extrusion * thicknessMult);

    // Apply the glow to the materials
    matRefs.current.forEach(mat => {
      if (mat) mat.emissiveIntensity = emissiveGlow;
    });
  });

  const offsets: Array<[number, number]> = bond.order === 1 
    ? [[0, 0]] 
    : bond.order === 2 ? [[0.06, 0], [-0.06, 0]] 
    : [[0.08, 0], [0, 0], [-0.08, 0]];

  return (
    <group>
      <group ref={groupRef}>
        {offsets.map((o, i) => (
          <mesh key={i} position={[o[0], 0, o[1]]} castShadow>
            <cylinderGeometry args={[theme.atom.bondRadius, theme.atom.bondRadius, 1, 8]} />
            <meshStandardMaterial 
              ref={(el) => { if (el) matRefs.current[i] = el; }}
              color={theme.atom.bondColor} 
              emissive="#ffffff"
              emissiveIntensity={0}
              roughness={0.5} 
              metalness={0.4} 
            />
          </mesh>
        ))}
      </group>
      
      {/* Floating Data Pulse independent of the cylinder scaling */}
      <mesh ref={pulseRef} visible={false}>
         <sphereGeometry args={[theme.atom.bondRadius * 1.5, 12, 12]} />
         {/* Using White for Neutral Data, blending creates nice glowing intersections */}
         <meshBasicMaterial color="#ffffff" transparent opacity={0.6} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
}

interface AtomProps {
  scale?: number;
  rotationSpeed?: { x: number; y: number; z: number };
}

export function Atom({
  scale = theme.atom.scale,
  rotationSpeed = theme.atom.rotationSpeed,
}: AtomProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { atoms, bonds } = useMemo(() => buildMolecule(), []);
  
  useFrame((_, dt) => {
    if (groupRef.current && rotationSpeed) {
      groupRef.current.rotation.x += rotationSpeed.x * dt;
      groupRef.current.rotation.y += rotationSpeed.y * dt;
      groupRef.current.rotation.z += rotationSpeed.z * dt;
    }
  });

  return (
    <group ref={groupRef} position={theme.atom.position} scale={scale}>
      {bonds.map((b, i) => <BondCylinder key={`b-${i}`} bond={b} atoms={atoms} />)}
      {atoms.map((a) => <AtomSphere key={`a-${a.id}`} atom={a} />)}
    </group>
  );
}
