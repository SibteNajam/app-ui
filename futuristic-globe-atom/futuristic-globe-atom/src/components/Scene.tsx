import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import * as THREE from "three";
import { theme } from "../config/theme";

import { Globe } from "./Globe";
import { Atom } from "./Atom";
import { Lighting } from "./Lighting";
import { Starfield } from "./Starfield";
import { Effects } from "./Effects";

interface SceneProps {
  /** Pause/resume animation — useful when the section scrolls out of view */
  paused?: boolean;
}

/**
 * Top-level R3F scene. Sets up the canvas, fog, camera, and renders all
 * sub-components. Designed to fill its parent and stay responsive.
 */
export function Scene({ paused = false }: SceneProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      gl={{
        antialias: true,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
      }}
      camera={{
        position: theme.camera.position,
        fov: theme.camera.fov,
        near: theme.camera.near,
        far: theme.camera.far,
      }}
      frameloop={paused ? "demand" : "always"}
      onCreated={({ scene }) => {
        scene.background = new THREE.Color(theme.background.color);
        scene.fog = new THREE.Fog(
          theme.background.fogColor,
          theme.background.fogNear,
          theme.background.fogFar
        );
      }}
    >
      <Suspense fallback={null}>
        <Lighting />
        <Starfield />
        <Globe />
        <Atom />
        <Effects />
      </Suspense>
    </Canvas>
  );
}
