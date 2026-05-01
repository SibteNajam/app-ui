'use client';

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { Suspense } from "react";
import * as THREE from "three";
import { theme } from "../config/theme";

import { Globe } from "./Globe";
import { Atom } from "./Atom";
import { Lighting } from "./Lighting";
import { Starfield } from "./Starfield";
import { Effects } from "./Effects";

interface SceneProps {
  paused?: boolean;
}

/**
 * Top-level R3F scene. Sets up the canvas, fog, camera, and renders all
 * sub-components. Designed to fill its parent and stay responsive.
 *
 * R3F v9's <Canvas> creates its own wrapper div.
 * We apply absolute positioning directly to ensure it correctly fills the CSS grid cell.
 */
export function Scene({ paused = false }: SceneProps) {
  return (
    <Canvas
      shadows={{ type: THREE.PCFShadowMap }}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
      }}
      camera={{
        position: [
          theme.camera.position[0],
          theme.camera.position[1],
          theme.camera.position[2],
        ] as [number, number, number],
        fov: theme.camera.fov,
        near: theme.camera.near,
        far: theme.camera.far,
      }}
      frameloop={paused ? "demand" : "always"}
      onCreated={({ scene }) => {
        scene.background = null;
        scene.fog = new THREE.Fog(
          theme.background.fogColor,
          theme.background.fogNear,
          theme.background.fogFar
        );
      }}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
    >
      <Suspense fallback={null}>
        <Lighting />
        <Starfield />
        <Atom />
        {/* <Effects /> */}
        
        {/* Enable mouse/touch rotation */}
        <OrbitControls 
          enableZoom={false} // Disabled zoom to prevent page scroll trapping
          enablePan={false}
          enableDamping={true}
          dampingFactor={0.05}
        />
      </Suspense>
    </Canvas>
  );
}
