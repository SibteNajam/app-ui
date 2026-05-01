import { theme } from "../config/theme";

/**
 * Three-point + accent rig tuned for the dark green/teal scene:
 *   • Key   — soft front-top white light to reveal the molecule
 *   • Rim   — strong teal back light that silhouettes both globe & molecule
 *   • Fill  — low cool fill from below to lift shadows
 *   • Accent — small green point light kissing the globe to drive the bloom halo
 */
export function Lighting() {
  const l = theme.lighting;

  return (
    <>
      <ambientLight intensity={l.ambient} color="#cfe9dc" />

      {/* Key light */}
      <directionalLight
        position={[5, 6, 6]}
        intensity={l.keyIntensity}
        color="#ffffff"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.5}
        shadow-camera-far={30}
        shadow-bias={-0.0005}
      />

      {/* Rim / back light — drives the silhouette glow */}
      <directionalLight
        position={[-4, 3, -8]}
        intensity={l.rimIntensity}
        color={l.rimColor}
      />

      {/* Cool fill from below */}
      <directionalLight
        position={[-3, -4, 2]}
        intensity={l.fillIntensity}
        color="#9fc7b8"
      />

      {/* Accent point light hugging the globe — fuels the atmospheric glow */}
      <pointLight
        position={[-1.5, 0, -2.5]}
        intensity={l.accentIntensity}
        color={l.accentColor}
        distance={12}
        decay={2}
      />

      {/* Subtle warm-cool counter point light for the molecule */}
      <pointLight
        position={[2, 1.5, 3]}
        intensity={0.6}
        color="#7df5cc"
        distance={8}
        decay={2}
      />
    </>
  );
}
