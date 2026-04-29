/* ═══════════════════════════════════════════════
   SHARED CHART COLORS & UTILITIES
   Used by all analytics chart components
   ═══════════════════════════════════════════════ */

export const CHART_COLORS = {
  dark: {
    tick: 'rgba(255,255,255,0.35)',
    tickSecondary: 'rgba(255,255,255,0.25)',
    axisLine: 'rgba(255,255,255,0.06)',
    grid: 'rgba(255,255,255,0.04)',
    legend: 'rgba(255,255,255,0.6)',
    refLine: 'rgba(255,255,255,0.1)',
    cursor: 'rgba(255,255,255,0.08)',
    cursorFill: 'rgba(255,255,255,0.03)',
    brushStroke: 'rgba(255,255,255,0.12)',
    brushFill: 'rgba(10,12,24,0.9)',
    activeDotStroke: '#1a1a2e',
    drawdownFrom: 0.15,
    drawdownTo: 0.02,
    tooltipWinRate: 'rgba(255,255,255,0.7)',
  },
  light: {
    tick: 'rgba(30,41,59,0.55)',
    tickSecondary: 'rgba(30,41,59,0.4)',
    axisLine: 'rgba(0,0,0,0.08)',
    grid: 'rgba(0,0,0,0.06)',
    legend: 'rgba(30,41,59,0.6)',
    refLine: 'rgba(0,0,0,0.1)',
    cursor: 'rgba(0,0,0,0.06)',
    cursorFill: 'rgba(0,0,0,0.04)',
    brushStroke: 'rgba(0,0,0,0.15)',
    brushFill: 'rgba(241,245,249,0.95)',
    activeDotStroke: '#ffffff',
    drawdownFrom: 0.08,
    drawdownTo: 0.02,
    tooltipWinRate: 'rgba(30,41,59,0.7)',
  },
} as const;

// Simple seeded PRNG (mulberry32) — deterministic to avoid SSR hydration mismatch
export function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s |= 0; s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
