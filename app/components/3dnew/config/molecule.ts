import * as THREE from "three";
import type { AtomElement } from "./theme";

export interface AtomData {
  id: number;
  element: AtomElement;
  position: THREE.Vector3;
  dispersedPosition: THREE.Vector3;
  chunkId: number;
  tradeVolume: number; // Used to scale the atom size
}

export interface BondData {
  from: number;
  to: number;
  order: 1 | 2 | 3;
}

function buildBenzeneRing(
  startId: number,
  center: THREE.Vector3,
  normal: THREE.Vector3,
  radius = 0.7,
  chunkId: number
): { atoms: AtomData[]; bonds: BondData[] } {
  const n = normal.clone().normalize();
  const up = Math.abs(n.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0);
  const u = new THREE.Vector3().crossVectors(up, n).normalize();
  const v = new THREE.Vector3().crossVectors(n, u).normalize();

  const atoms: AtomData[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const pos = center
      .clone()
      .add(u.clone().multiplyScalar(Math.cos(angle) * radius))
      .add(v.clone().multiplyScalar(Math.sin(angle) * radius));
      
    // Random trade volume for carbon nodes
    const tradeVolume = 0.6 + Math.random() * 1.2;
    // 30% chance to be a "Dark Pool" (black node), otherwise Maker Order (gray node)
    const el: AtomElement = Math.random() > 0.7 ? "D" : "C";
    atoms.push({ id: startId + i, element: el, position: pos, dispersedPosition: new THREE.Vector3(), chunkId, tradeVolume });
  }

  const bonds: BondData[] = [];
  for (let i = 0; i < 6; i++) {
    bonds.push({
      from: startId + i,
      to: startId + ((i + 1) % 6),
      order: i % 2 === 0 ? 2 : 1,
    });
  }

  return { atoms, bonds };
}

export function buildMolecule(): { atoms: AtomData[]; bonds: BondData[] } {
  const atoms: AtomData[] = [];
  const bonds: BondData[] = [];
  let nextId = 0;

  // ── Ring 1 (left) -> Chunk 0
  const r1 = buildBenzeneRing(nextId, new THREE.Vector3(-2.4, 0.6, 0), new THREE.Vector3(0.2, 0.1, 1).normalize(), 0.7, 0);
  atoms.push(...r1.atoms); bonds.push(...r1.bonds); nextId += r1.atoms.length;

  // ── Ring 2 (center) -> Chunk 1
  const r2 = buildBenzeneRing(nextId, new THREE.Vector3(0.2, 1.2, -0.4), new THREE.Vector3(-0.1, 0.2, 1).normalize(), 0.75, 1);
  atoms.push(...r2.atoms); bonds.push(...r2.bonds); nextId += r2.atoms.length;

  // ── Ring 3 (right) -> Chunk 2
  const r3 = buildBenzeneRing(nextId, new THREE.Vector3(2.5, -0.4, 0.1), new THREE.Vector3(0.1, 0.15, 1).normalize(), 0.7, 2);
  atoms.push(...r3.atoms); bonds.push(...r3.bonds); nextId += r3.atoms.length;

  // ── Aliphatic backbone connecting the rings -> Chunk 3
  const backbone: { element: AtomElement; pos: [number, number, number] }[] = [
    { element: "C", pos: [-1.55, 0.35, 0.4] },
    { element: "C", pos: [-1.0, -0.15, 0.7] },
    { element: "N", pos: [-0.45, 0.25, 0.95] },
    { element: "C", pos: [0.0, -0.05, 1.15] },
    { element: "O", pos: [0.05, -0.7, 1.5] },
    { element: "C", pos: [0.55, 0.45, 0.85] },
    { element: "C", pos: [1.1, 0.05, 0.6] },
    { element: "N", pos: [1.55, 0.5, 0.4] },
    { element: "C", pos: [2.0, 0.05, 0.25] },
    { element: "O", pos: [2.1, -0.65, 0.5] },
  ];

  const backboneStart = nextId;
  let prevChainId: number | null = null;
  backbone.forEach((b) => {
    // Nitrogen and Oxygen get larger volumes
    const isSpecial = b.element === "N" || b.element === "O";
    const tradeVolume = isSpecial ? 1.2 + Math.random() * 0.8 : 0.6 + Math.random() * 1.0;
    
    let el = b.element;
    if (el === "C" && Math.random() > 0.7) el = "D";
    
    atoms.push({
      id: nextId,
      element: el,
      position: new THREE.Vector3(...b.pos),
      dispersedPosition: new THREE.Vector3(),
      chunkId: 3,
      tradeVolume,
    });
    if (b.element !== "O" && prevChainId !== null) {
      bonds.push({ from: prevChainId, to: nextId, order: 1 });
    }
    if (b.element !== "O") prevChainId = nextId;
    nextId++;
  });

  bonds.push({ from: backboneStart + 3, to: backboneStart + 4, order: 2 });
  bonds.push({ from: backboneStart + 8, to: backboneStart + 9, order: 2 });
  bonds.push({ from: backboneStart + 0, to: 0, order: 1 });
  bonds.push({ from: backboneStart + 6, to: 6, order: 1 });
  bonds.push({ from: backboneStart + 9, to: 12, order: 1 });

  // ── Hydrogens (Inherit chunkId from parent carbon)
  const skipForHydrogen = new Set<number>([0, 6, 12]);
  for (let i = 0; i < 18; i++) {
    if (skipForHydrogen.has(i)) continue;
    const c = atoms[i];
    const ringStart = Math.floor(i / 6) * 6;
    const ringCenter = new THREE.Vector3();
    for (let j = ringStart; j < ringStart + 6; j++) ringCenter.add(atoms[j].position);
    ringCenter.multiplyScalar(1 / 6);
    const dir = c.position.clone().sub(ringCenter).normalize();
    const hPos = c.position.clone().add(dir.multiplyScalar(0.55));
    // Hydrogens represent micro-transactions, keep volume small
    atoms.push({ id: nextId, element: "H", position: hPos, dispersedPosition: new THREE.Vector3(), chunkId: c.chunkId, tradeVolume: 0.4 + Math.random() * 0.3 });
    bonds.push({ from: i, to: nextId, order: 1 });
    nextId++;
  }

  const methylSpots = [backboneStart + 1, backboneStart + 5, backboneStart + 7];
  methylSpots.forEach((parentId) => {
    const parent = atoms[parentId];
    const offsets: [number, number, number][] = [[0.35, 0.4, 0.0], [-0.3, 0.4, 0.1], [0.1, 0.6, -0.3]];
    offsets.forEach((o) => {
      const hPos = parent.position.clone().add(new THREE.Vector3(...o));
      atoms.push({ id: nextId, element: "H", position: hPos, dispersedPosition: new THREE.Vector3(), chunkId: parent.chunkId, tradeVolume: 0.3 + Math.random() * 0.3 });
      bonds.push({ from: parentId, to: nextId, order: 1 });
      nextId++;
    });
  });

  // ── Calculate Chunk-Based Dispersed Positions 
  const centroid = new THREE.Vector3();
  atoms.forEach((a) => centroid.add(a.position));
  centroid.multiplyScalar(1 / atoms.length);

  // Define 4 chunk offsets to push them apart seamlessly
  const chunkOffsets = [
    new THREE.Vector3(-1.2, 0.8, -0.5),   // Chunk 0
    new THREE.Vector3(0.5, 1.5, 0.8),     // Chunk 1
    new THREE.Vector3(1.5, -0.5, -0.2),   // Chunk 2
    new THREE.Vector3(0, -1.0, 1.2),      // Chunk 3
  ];

  atoms.forEach((a) => {
    a.position.sub(centroid);
    // Dispersed position is just the normal position pushed away by its chunk offset
    a.dispersedPosition.copy(a.position).add(chunkOffsets[a.chunkId]);
  });

  return { atoms, bonds };
}
