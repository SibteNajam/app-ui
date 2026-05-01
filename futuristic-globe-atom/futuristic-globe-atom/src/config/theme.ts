/**
 * Central configuration for the entire scene.
 * Tweak any of these values to change look-and-feel without touching component code.
 */

export const theme = {
  // ───── Background / atmosphere ─────
  background: {
    color: "#03110d", // deep teal-black
    fogColor: "#03110d",
    fogNear: 8,
    fogFar: 28,
  },

  // ───── Globe ─────
  globe: {
    radius: 3.2,
    position: [0, -0.2, -1] as [number, number, number],
    rotationSpeed: 0.04, // radians per second on Y
    tilt: 0.18, // radians, around Z
    surfaceColor: "#0e3a2c",
    deepColor: "#02120c",
    highlightColor: "#3ddca3",
    bumpStrength: 0.18,
    atmosphereColor: "#2bd9a7",
    atmosphereOpacity: 0.55,
    atmosphereScale: 1.18, // how much bigger the glow shell is than the globe
  },

  // ───── Atom / molecule ─────
  atom: {
    position: [0, 0.15, 1.6] as [number, number, number],
    scale: 0.78,
    rotationSpeed: { x: 0.15, y: 0.22, z: 0.06 },
    floatAmplitude: 0.08,
    floatSpeed: 0.6,
    bondColor: "#2a2f33",
    bondRadius: 0.045,
    atomColors: {
      C: "#1c1f22", // carbon — almost black, faint specular
      H: "#f0f4f1", // hydrogen — soft white
      N: "#3aa9ff", // nitrogen — cool blue
      O: "#ff5da2", // oxygen — magenta/pink
      P: "#b46bff", // phosphorus
      S: "#ffd84d", // sulfur
    },
    atomRadii: {
      C: 0.18,
      H: 0.11,
      N: 0.2,
      O: 0.2,
      P: 0.22,
      S: 0.22,
    },
  },

  // ───── Lighting ─────
  lighting: {
    ambient: 0.35,
    keyIntensity: 1.4,
    rimIntensity: 1.8,
    fillIntensity: 0.45,
    accentIntensity: 1.1,
    accentColor: "#2bd9a7",
    rimColor: "#7df5cc",
  },

  // ───── Post-processing ─────
  effects: {
    bloomIntensity: 0.85,
    bloomThreshold: 0.25,
    bloomSmoothing: 0.7,
    vignetteOffset: 0.35,
    vignetteDarkness: 0.85,
  },

  // ───── Camera ─────
  camera: {
    position: [0, 0.4, 8.5] as [number, number, number],
    fov: 38,
    near: 0.1,
    far: 100,
  },
} as const;

export type AtomElement = keyof typeof theme.atom.atomColors;
