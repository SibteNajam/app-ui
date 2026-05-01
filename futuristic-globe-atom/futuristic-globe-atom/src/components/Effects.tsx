import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { theme } from "../config/theme";

/**
 * Bloom drives the soft glow on emissive surfaces (atmosphere, hydrogens, accents).
 * Vignette focuses the eye on the centre of the scene.
 */
export function Effects() {
  const e = theme.effects;
  return (
    <EffectComposer multisampling={4} disableNormalPass>
      <Bloom
        intensity={e.bloomIntensity}
        luminanceThreshold={e.bloomThreshold}
        luminanceSmoothing={e.bloomSmoothing}
        mipmapBlur
        radius={0.7}
      />
      <Vignette
        offset={e.vignetteOffset}
        darkness={e.vignetteDarkness}
        eskil={false}
      />
    </EffectComposer>
  );
}
