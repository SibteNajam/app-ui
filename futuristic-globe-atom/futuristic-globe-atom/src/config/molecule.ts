import * as THREE from "three";
import type { AtomElement } from "./theme";

export interface AtomData {
  id: number;
  element: AtomElement;
  position: THREE.Vector3;
}

export interface BondData {
  from: number;
  to: number;
  order: 1 | 2 | 3;
}

/**
 * Build a hexagonal benzene ring (6 carbons) at a given center, with optional rotation.
 * Returns the atoms and bonds describing it. The first carbon is at angle 0 of the ring.
 */
function buildBenzeneRing(
  startId: number,
  center: THREE.Vector3,
  normal: THREE.Vector3,
  radius = 0.7
): { atoms: AtomData[]; bonds: BondData[] } {
  // Build a basis perpendicular to `normal`
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
    atoms.push({ id: startId + i, element: "C", position: pos });
  }

  const bonds: BondData[] = [];
  for (let i = 0; i < 6; i++) {
    bonds.push({
      from: startId + i,
      to: startId + ((i + 1) % 6),
      order: i % 2 === 0 ? 2 : 1, // alternating double/single — aromatic
    });
  }

  return { atoms, bonds };
}

/**
 * Procedural drug-like molecule: 3 benzene rings linked by an aliphatic chain
 * with N and O heteroatoms (echoes the Lopinavir-style structure in the reference).
 */
export function buildMolecule(): { atoms: AtomData[]; bonds: BondData[] } {
  const atoms: AtomData[] = [];
  const bonds: BondData[] = [];
  let nextId = 0;

  // ── Ring 1 (left) ──────────────────────────────────────────
  const r1 = buildBenzeneRing(
    nextId,
    new THREE.Vector3(-2.4, 0.6, 0),
    new THREE.Vector3(0.2, 0.1, 1).normalize(),
    0.7
  );
  atoms.push(...r1.atoms);
  bonds.push(...r1.bonds);
  nextId += r1.atoms.length;

  // ── Ring 2 (center, slightly behind & up) ─────────────────
  const r2 = buildBenzeneRing(
    nextId,
    new THREE.Vector3(0.2, 1.2, -0.4),
    new THREE.Vector3(-0.1, 0.2, 1).normalize(),
    0.75
  );
  atoms.push(...r2.atoms);
  bonds.push(...r2.bonds);
  nextId += r2.atoms.length;

  // ── Ring 3 (right) ─────────────────────────────────────────
  const r3 = buildBenzeneRing(
    nextId,
    new THREE.Vector3(2.5, -0.4, 0.1),
    new THREE.Vector3(0.1, 0.15, 1).normalize(),
    0.7
  );
  atoms.push(...r3.atoms);
  bonds.push(...r3.bonds);
  nextId += r3.atoms.length;

  // ── Aliphatic backbone connecting the rings ─────────────────
  // Chain atoms: C-C-N-C(=O)-C-C-N-C(=O)-C between the rings
  const backbone: { element: AtomElement; pos: [number, number, number] }[] = [
    { element: "C", pos: [-1.55, 0.35, 0.4] }, // c1: links to ring 1 atom 0
    { element: "C", pos: [-1.0, -0.15, 0.7] },
    { element: "N", pos: [-0.45, 0.25, 0.95] },
    { element: "C", pos: [0.0, -0.05, 1.15] },
    { element: "O", pos: [0.05, -0.7, 1.5] }, // double-bonded oxygen
    { element: "C", pos: [0.55, 0.45, 0.85] },
    { element: "C", pos: [1.1, 0.05, 0.6] },
    { element: "N", pos: [1.55, 0.5, 0.4] },
    { element: "C", pos: [2.0, 0.05, 0.25] },
    { element: "O", pos: [2.1, -0.65, 0.5] },
  ];

  const backboneStart = nextId;
  // Track the previous *chain* atom (skipping Os) so the chain bonds correctly
  let prevChainId: number | null = null;
  backbone.forEach((b) => {
    atoms.push({
      id: nextId,
      element: b.element,
      position: new THREE.Vector3(...b.pos),
    });
    if (b.element !== "O" && prevChainId !== null) {
      bonds.push({ from: prevChainId, to: nextId, order: 1 });
    }
    if (b.element !== "O") prevChainId = nextId;
    nextId++;
  });

  // Carbonyl C=O double bonds (chain idx 3 -> 4, and 8 -> 9)
  bonds.push({ from: backboneStart + 3, to: backboneStart + 4, order: 2 });
  bonds.push({ from: backboneStart + 8, to: backboneStart + 9, order: 2 });

  // Connect backbone ends to the rings
  bonds.push({ from: backboneStart + 0, to: 0, order: 1 }); // ring1 atom 0
  bonds.push({ from: backboneStart + 6, to: 6, order: 1 }); // ring2 atom 0
  bonds.push({ from: backboneStart + 9, to: 12, order: 1 }); // ring3 atom 0

  // ── Hydrogens on every aromatic ring carbon (skip the ones bonded to backbone) ──
  const skipForHydrogen = new Set<number>([0, 6, 12]); // ring atoms bonded to chains
  for (let i = 0; i < 18; i++) {
    if (skipForHydrogen.has(i)) continue;
    const c = atoms[i];
    // find ring center
    const ringStart = Math.floor(i / 6) * 6;
    const ringCenter = new THREE.Vector3();
    for (let j = ringStart; j < ringStart + 6; j++) ringCenter.add(atoms[j].position);
    ringCenter.multiplyScalar(1 / 6);
    const dir = c.position.clone().sub(ringCenter).normalize();
    const hPos = c.position.clone().add(dir.multiplyScalar(0.55));
    atoms.push({ id: nextId, element: "H", position: hPos });
    bonds.push({ from: i, to: nextId, order: 1 });
    nextId++;
  }

  // ── A few decorative methyl groups (CH3) on backbone for visual richness ──
  const methylSpots = [backboneStart + 1, backboneStart + 5, backboneStart + 7];
  methylSpots.forEach((parentId) => {
    const parent = atoms[parentId];
    const offsets: [number, number, number][] = [
      [0.35, 0.4, 0.0],
      [-0.3, 0.4, 0.1],
      [0.1, 0.6, -0.3],
    ];
    offsets.forEach((o) => {
      const hPos = parent.position.clone().add(new THREE.Vector3(...o));
      atoms.push({ id: nextId, element: "H", position: hPos });
      bonds.push({ from: parentId, to: nextId, order: 1 });
      nextId++;
    });
  });

  // Center the whole molecule on the origin
  const centroid = new THREE.Vector3();
  atoms.forEach((a) => centroid.add(a.position));
  centroid.multiplyScalar(1 / atoms.length);
  atoms.forEach((a) => a.position.sub(centroid));

  return { atoms, bonds };
}
