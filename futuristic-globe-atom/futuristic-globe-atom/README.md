# Futuristic Globe + Atom — 3D Hero Scene

A premium, production-ready 3D hero section built with **React + TypeScript + React Three Fiber**. Recreates the dark green moon-like globe and floating molecular structure from the reference video.

## Quick start

```bash
npm install
npm run dev
```

Then open `http://localhost:5173`.

## Build for production

```bash
npm run build
npm run preview
```

## Project structure

```
src/
├── App.tsx                     # Hero section + overlay copy
├── main.tsx                    # React entry
├── styles.css                  # Global styles + overlay/vignette
├── config/
│   ├── theme.ts                # All colors, speeds, scales — single source of truth
│   └── molecule.ts             # Procedural molecular structure (3 benzene rings + chain)
└── components/
    ├── Scene.tsx               # <Canvas> + camera/fog setup
    ├── Globe.tsx               # Dark green planet + atmospheric glow shaders
    ├── Atom.tsx                # Floating molecule (atoms + bonds, animated)
    ├── Lighting.tsx            # 3-point + accent rig
    ├── Starfield.tsx           # Background star points
    └── Effects.tsx             # Bloom + vignette post-processing
```

Every visual element lives in one component, and every tunable parameter lives in `src/config/theme.ts`.

## Customizing

### Change colors

Edit `src/config/theme.ts`:

```ts
globe: {
  surfaceColor: "#0e3a2c",      // try "#1a2c4d" for a blue planet
  atmosphereColor: "#2bd9a7",   // halo / glow color
  ...
}
```

### Change rotation speed

```ts
globe: { rotationSpeed: 0.04 },
atom:  { rotationSpeed: { x: 0.15, y: 0.22, z: 0.06 } },
```

### Change atom colors

```ts
atomColors: {
  C: "#1c1f22",   // carbon
  H: "#f0f4f1",   // hydrogen
  N: "#3aa9ff",   // nitrogen
  O: "#ff5da2",   // oxygen
}
```

### Replace the molecule

Edit `src/config/molecule.ts`. The `buildMolecule()` function returns `{ atoms, bonds }`. You can:

- Change the ring count or positions in `buildMolecule()`
- Add new ring centers with `buildBenzeneRing(...)`
- Edit the backbone array to change the chain
- Swap atom elements (`'C' | 'H' | 'N' | 'O' | 'P' | 'S'`)

### Tune lighting

```ts
lighting: {
  keyIntensity: 1.4,            // front light
  rimIntensity: 1.8,            // back glow — drives the silhouette
  accentIntensity: 1.1,         // colored point light near the globe
}
```

### Tune the bloom glow

```ts
effects: {
  bloomIntensity: 0.85,         // higher = more glow
  bloomThreshold: 0.25,         // what brightness starts to bloom
}
```

## Performance notes

- **Adaptive DPR** is set to `[1, 2]` so high-DPI screens look crisp without melting low-end GPUs.
- **`mipmapBlur` bloom** runs much faster than naive bloom.
- **Procedural noise texture** for the globe — no network requests, no asset pipeline.
- **`frameloop="demand"`** can be enabled by passing `paused` to `<Scene paused />` when the section scrolls out of view, dropping CPU/GPU usage to near-zero.
- All geometries use sensible segment counts (sphere 96, atom sphere 32, bond cylinder 16) tuned for 60 FPS.

## Responsive design

The `<Canvas>` automatically resizes with its parent. The hero copy uses `clamp()` typography. On mobile (≤600px) the copy aligns to the top so the globe sits below the headline rather than behind it.

If you need to scale the entire scene smaller on phones, pass `scale` props:

```tsx
<Globe scale={0.85} />
<Atom scale={0.85} />
```

## Tech stack

| Library | Purpose |
| --- | --- |
| `react` + `react-dom` | UI |
| `three` | WebGL engine |
| `@react-three/fiber` | React renderer for Three.js |
| `@react-three/drei` | (available — handy helpers if you extend the scene) |
| `@react-three/postprocessing` | Bloom + Vignette |
| `vite` + `typescript` | Tooling |

## License

MIT — use it freely.
