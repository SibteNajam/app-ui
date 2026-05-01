'use client';

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { theme } from "../config/theme";

/**
 * Builds a procedural noise-based bump texture so the globe reads as a
 * cratered/textured planet without needing external assets.
 */
function useNoiseTexture(size = 512) {
  return useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;

    // Base mid-grey
    ctx.fillStyle = "#7a7a7a";
    ctx.fillRect(0, 0, size, size);

    // Layered soft circles to simulate craters / surface mottling
    const drawBlobs = (count: number, minR: number, maxR: number, alpha: number) => {
      for (let i = 0; i < count; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const r = minR + Math.random() * (maxR - minR);
        const grd = ctx.createRadialGradient(x, y, 0, x, y, r);
        const tone = 60 + Math.random() * 140;
        grd.addColorStop(0, `rgba(${tone},${tone},${tone},${alpha})`);
        grd.addColorStop(1, `rgba(${tone},${tone},${tone},0)`);
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    drawBlobs(180, 8, 28, 0.55); // small craters
    drawBlobs(40, 30, 80, 0.35); // medium features
    drawBlobs(8, 80, 180, 0.18); // huge mares

    // Per-pixel grain
    const img = ctx.getImageData(0, 0, size, size);
    for (let i = 0; i < img.data.length; i += 4) {
      const n = (Math.random() - 0.5) * 28;
      img.data[i] = Math.max(0, Math.min(255, img.data[i] + n));
      img.data[i + 1] = Math.max(0, Math.min(255, img.data[i + 1] + n));
      img.data[i + 2] = Math.max(0, Math.min(255, img.data[i + 2] + n));
    }
    ctx.putImageData(img, 0, 0);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.anisotropy = 8;
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  }, [size]);
}

interface GlobeProps {
  rotationSpeed?: number;
  scale?: number;
}

export function Globe({
  rotationSpeed = theme.globe.rotationSpeed,
  scale = 1,
}: GlobeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const noiseMap = useNoiseTexture();

  useFrame((_, dt) => {
    if (meshRef.current) meshRef.current.rotation.y += rotationSpeed * dt;
  });

  const surface = theme.globe.surfaceColor;
  const deep = theme.globe.deepColor;
  const atmo = theme.globe.atmosphereColor;
  const radius = theme.globe.radius * scale;

  return (
    <group
      position={theme.globe.position}
      rotation={[0, 0, theme.globe.tilt]}
    >
      {/* ── Main globe sphere ─────────────────────────────────── */}
      <mesh ref={meshRef} castShadow receiveShadow>
        <sphereGeometry args={[radius, 96, 96]} />
        <meshStandardMaterial
          color={surface}
          emissive={deep}
          emissiveIntensity={0.18}
          roughness={0.85}
          metalness={0.25}
          bumpMap={noiseMap}
          bumpScale={theme.globe.bumpStrength}
          map={noiseMap}
        />
      </mesh>

      {/* ── Inner rim atmosphere — soft falloff from surface ──── */}
      <mesh scale={1.02}>
        <sphereGeometry args={[radius, 64, 64]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          side={THREE.BackSide}
          uniforms={{
            uColor: { value: new THREE.Color(atmo) },
            uIntensity: { value: 0.55 },
            uPower: { value: 3.0 },
          }}
          vertexShader={/* glsl */ `
            varying vec3 vNormal;
            varying vec3 vViewDir;
            void main() {
              vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
              vNormal = normalize(normalMatrix * normal);
              vViewDir = normalize(-mvPos.xyz);
              gl_Position = projectionMatrix * mvPos;
            }
          `}
          fragmentShader={/* glsl */ `
            varying vec3 vNormal;
            varying vec3 vViewDir;
            uniform vec3 uColor;
            uniform float uIntensity;
            uniform float uPower;
            void main() {
              float fres = pow(1.0 - abs(dot(vNormal, vViewDir)), uPower);
              gl_FragColor = vec4(uColor, fres * uIntensity);
            }
          `}
        />
      </mesh>

      {/* ── Outer atmospheric glow shell — gives the soft halo ── */}
      <mesh scale={theme.globe.atmosphereScale}>
        <sphereGeometry args={[radius, 64, 64]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          uniforms={{
            uColor: { value: new THREE.Color(atmo) },
            uIntensity: { value: theme.globe.atmosphereOpacity },
            uPower: { value: 2.2 },
          }}
          vertexShader={/* glsl */ `
            varying vec3 vNormal;
            varying vec3 vViewDir;
            void main() {
              vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
              vNormal = normalize(normalMatrix * normal);
              vViewDir = normalize(-mvPos.xyz);
              gl_Position = projectionMatrix * mvPos;
            }
          `}
          fragmentShader={/* glsl */ `
            varying vec3 vNormal;
            varying vec3 vViewDir;
            uniform vec3 uColor;
            uniform float uIntensity;
            uniform float uPower;
            void main() {
              float fres = pow(1.0 - abs(dot(vNormal, vViewDir)), uPower);
              gl_FragColor = vec4(uColor, fres * uIntensity);
            }
          `}
        />
      </mesh>
    </group>
  );
}
