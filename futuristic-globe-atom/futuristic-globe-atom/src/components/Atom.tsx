import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { theme } from "../config/theme";
import { buildMolecule, type AtomData, type BondData } from "../config/molecule";

interface AtomSphereProps {
  atom: AtomData;
}

/** A single atom rendered as a sphere with element-specific color & radius. */
function AtomSphere({ atom }: AtomSphereProps) {
  const color = theme.atom.atomColors[atom.element];
  const radius = theme.atom.atomRadii[atom.element];

  // Hydrogens get extra brightness, carbons read very dark with a hint of gloss
  const isLight = atom.element === "H";
  const isCarbon = atom.element === "C";

  return (
    <mesh position={atom.position} castShadow receiveShadow>
      <sphereGeometry args={[radius, 32, 32]} />
      <meshPhysicalMaterial
        color={color}
        roughness={isCarbon ? 0.55 : isLight ? 0.4 : 0.3}
        metalness={isCarbon ? 0.3 : 0.1}
        clearcoat={isLight ? 0.6 : 0.3}
        clearcoatRoughness={0.25}
        emissive={color}
        emissiveIntensity={isLight ? 0.05 : isCarbon ? 0.02 : 0.15}
      />
    </mesh>
  );
}

interface BondCylinderProps {
  bond: BondData;
  atoms: AtomData[];
}

/** A single bond rendered as one or more thin cylinders connecting two atoms. */
function BondCylinder({ bond, atoms }: BondCylinderProps) {
  const { position, quaternion, length } = useMemo(() => {
    const a = atoms[bond.from].position;
    const b = atoms[bond.to].position;
    const mid = a.clone().add(b).multiplyScalar(0.5);
    const dir = b.clone().sub(a);
    const len = dir.length();

    const up = new THREE.Vector3(0, 1, 0);
    const q = new THREE.Quaternion().setFromUnitVectors(up, dir.clone().normalize());

    return { position: mid, quaternion: q, length: len };
  }, [bond, atoms]);

  // Render multiple parallel sticks for double/triple bonds
  // Offsets are [x, z] in the bond's local frame (cylinder is along Y)
  const offsets: Array<[number, number]> =
    bond.order === 1
      ? [[0, 0]]
      : bond.order === 2
      ? [
          [0.06, 0],
          [-0.06, 0],
        ]
      : [
          [0.08, 0],
          [0, 0],
          [-0.08, 0],
        ];

  return (
    <group position={position} quaternion={quaternion}>
      {offsets.map((o, i) => (
        <mesh key={i} position={[o[0], 0, o[1]]} castShadow>
          <cylinderGeometry
            args={[theme.atom.bondRadius, theme.atom.bondRadius, length, 16]}
          />
          <meshStandardMaterial
            color={theme.atom.bondColor}
            roughness={0.4}
            metalness={0.5}
          />
        </mesh>
      ))}
    </group>
  );
}

interface AtomProps {
  scale?: number;
  rotationSpeed?: { x: number; y: number; z: number };
  floatAmplitude?: number;
  floatSpeed?: number;
}

/**
 * The complete molecular "atom structure" floating above the globe.
 * Procedurally built from buildMolecule(); rotates on all axes & gently floats.
 */
export function Atom({
  scale = theme.atom.scale,
  rotationSpeed = theme.atom.rotationSpeed,
  floatAmplitude = theme.atom.floatAmplitude,
  floatSpeed = theme.atom.floatSpeed,
}: AtomProps) {
  const groupRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Group>(null);

  const { atoms, bonds } = useMemo(() => buildMolecule(), []);

  useFrame((state, dt) => {
    if (innerRef.current) {
      innerRef.current.rotation.x += rotationSpeed.x * dt;
      innerRef.current.rotation.y += rotationSpeed.y * dt;
      innerRef.current.rotation.z += rotationSpeed.z * dt;
    }
    if (groupRef.current) {
      const t = state.clock.getElapsedTime();
      groupRef.current.position.y =
        theme.atom.position[1] + Math.sin(t * floatSpeed) * floatAmplitude;
    }
  });

  return (
    <group ref={groupRef} position={theme.atom.position} scale={scale}>
      <group ref={innerRef}>
        {bonds.map((b, i) => (
          <BondCylinder key={`b-${i}`} bond={b} atoms={atoms} />
        ))}
        {atoms.map((a) => (
          <AtomSphere key={`a-${a.id}`} atom={a} />
        ))}
      </group>
    </group>
  );
}
