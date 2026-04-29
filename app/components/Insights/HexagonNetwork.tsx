'use client';

import { useRef, useEffect, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';

interface HNode {
  x: number; y: number; size: number;
  label: string; color: string;
  phase: number; ring: number;
}
interface Particle {
  from: number; to: number;
  progress: number; speed: number;
}

function hexPath(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rot = -Math.PI / 6) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i + rot;
    const px = x + r * Math.cos(a);
    const py = y + r * Math.sin(a);
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

export default function HexagonNetwork() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const mouseRef = useRef({ x: -999, y: -999 });
  const { theme } = useTheme();
  const themeRef = useRef(theme);
  useEffect(() => { themeRef.current = theme; }, [theme]);

  const buildGraph = useCallback((W: number, H: number) => {
    const cx = W * 0.5, cy = H * 0.48;
    const scale = Math.min(W, H) / 520;
    const nodes: HNode[] = [];
    const edges: [number, number][] = [];
    const colors = ['#4F8EF7', '#34d399', '#a78bfa', '#f59e0b', '#06b6d4', '#ec4899',
                    '#818cf8', '#fb923c', '#38bdf8', '#f472b6', '#22d3ee', '#facc15'];

    nodes.push({ x: cx, y: cy, size: 42 * scale, label: 'CORE', color: '#4F8EF7', phase: 0, ring: 0 });

    const r1 = 115 * scale;
    const r1Labels = ['WIN%', 'VOL', 'P&L', 'RISK', 'SPEED', 'ALPHA'];
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i - Math.PI / 2;
      nodes.push({ x: cx + r1 * Math.cos(a), y: cy + r1 * Math.sin(a),
        size: 30 * scale, label: r1Labels[i], color: colors[i],
        phase: (Math.PI * 2 / 6) * i, ring: 1 });
      edges.push([0, i + 1]);
      edges.push([i + 1, i === 5 ? 1 : i + 2]);
    }

    const r2 = 210 * scale;
    const r2Labels = ['APE', 'LUNA', 'BTC', 'ETH', 'SOL', 'DOGE', 'XRP', 'ADA', 'DOT', 'AVAX', 'MATIC', 'LINK'];
    for (let i = 0; i < 12; i++) {
      const a = (Math.PI / 6) * i - Math.PI / 2;
      const parent = Math.floor(i / 2) + 1;
      nodes.push({ x: cx + r2 * Math.cos(a), y: cy + r2 * Math.sin(a),
        size: 18 * scale, label: r2Labels[i], color: colors[i],
        phase: (Math.PI * 2 / 12) * i, ring: 2 });
      edges.push([parent, 7 + i]);
      if (i > 0) edges.push([7 + i, 7 + i - 1]);
    }
    edges.push([7, 18]);

    // Cross-connections for more visual density
    edges.push([1, 4], [2, 5], [3, 6]);

    const particles: Particle[] = [];
    edges.forEach(([f, t]) => {
      particles.push({ from: f, to: t, progress: Math.random(), speed: 0.0015 + Math.random() * 0.0025 });
      if (Math.random() > 0.6) particles.push({ from: t, to: f, progress: Math.random(), speed: 0.001 + Math.random() * 0.002 });
    });

    return { nodes, edges, particles };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let W = 0, H = 0;
    let graph = { nodes: [] as HNode[], edges: [] as [number, number][], particles: [] as Particle[] };

    const resize = () => {
      const r = parent.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      W = r.width; H = r.height;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      graph = buildGraph(W, H);
    };
    resize();
    window.addEventListener('resize', resize);

    const onMouse = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    canvas.addEventListener('mousemove', onMouse);
    canvas.addEventListener('mouseleave', () => { mouseRef.current = { x: -999, y: -999 }; });

    let prev = performance.now();
    const animate = (now: number) => {
      const dt = Math.min(now - prev, 50);
      prev = now;
      const dark = themeRef.current === 'dark';
      const mx = mouseRef.current.x, my = mouseRef.current.y;

      ctx.clearRect(0, 0, W, H);

      // BG hex grid
      const hexR = 24;
      const hW = hexR * Math.sqrt(3);
      const hH = hexR * 1.5;
      ctx.lineWidth = 0.6;
      for (let row = -1; row < H / hH + 1; row++) {
        for (let col = -1; col < W / hW + 1; col++) {
          const ox = col * hW + (row % 2 ? hW / 2 : 0);
          const oy = row * hH;
          const dist = Math.hypot(ox - W / 2, oy - H / 2);
          const fade = Math.max(0, 1 - dist / (Math.min(W, H) * 0.6));
          const pulse = 0.5 + 0.5 * Math.sin(now * 0.0003 + dist * 0.004);
          const mDist = Math.hypot(mx - ox, my - oy);
          const mBoost = Math.max(0, 1 - mDist / 150) * 0.08;
          ctx.strokeStyle = dark
            ? `rgba(79,142,247,${(0.04 * fade * pulse) + mBoost})`
            : `rgba(79,142,247,${(0.07 * fade * pulse) + mBoost})`;
          hexPath(ctx, ox, oy, hexR);
          ctx.stroke();
        }
      }

      // Edges
      const { nodes, edges, particles } = graph;
      edges.forEach(([fi, ti]) => {
        const f = nodes[fi], t = nodes[ti];
        if (!f || !t) return;
        const pulse = 0.6 + 0.4 * Math.sin(now * 0.001 + fi + ti);
        ctx.beginPath();
        ctx.moveTo(f.x, f.y);
        ctx.lineTo(t.x, t.y);
        ctx.strokeStyle = dark ? `rgba(79,142,247,${0.1 * pulse})` : `rgba(79,142,247,${0.14 * pulse})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      });

      // Particles
      particles.forEach(p => {
        p.progress += p.speed * dt * 0.06;
        if (p.progress > 1) p.progress -= 1;
        const f = nodes[p.from], t = nodes[p.to];
        if (!f || !t) return;
        const px = lerp(f.x, t.x, p.progress);
        const py = lerp(f.y, t.y, p.progress);
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fillStyle = dark ? 'rgba(79,142,247,0.7)' : 'rgba(79,142,247,0.6)';
        ctx.fill();
        const glow = ctx.createRadialGradient(px, py, 0, px, py, 8);
        glow.addColorStop(0, dark ? 'rgba(79,142,247,0.3)' : 'rgba(79,142,247,0.2)');
        glow.addColorStop(1, 'rgba(79,142,247,0)');
        ctx.fillStyle = glow;
        ctx.beginPath(); ctx.arc(px, py, 8, 0, Math.PI * 2); ctx.fill();
      });

      // Nodes
      nodes.forEach((n) => {
        const breathe = 1 + 0.05 * Math.sin(now * 0.002 + n.phase);
        const s = n.size * breathe;
        const mDist = Math.hypot(mx - n.x, my - n.y);
        const hover = Math.max(0, 1 - mDist / 90);

        // Outer glow
        const glowR = s * (2.2 + hover * 0.8);
        const glow = ctx.createRadialGradient(n.x, n.y, s * 0.2, n.x, n.y, glowR);
        glow.addColorStop(0, n.color + (dark ? '20' : '15'));
        glow.addColorStop(0.4, n.color + (dark ? '0a' : '08'));
        glow.addColorStop(1, n.color + '00');
        ctx.beginPath(); ctx.arc(n.x, n.y, glowR, 0, Math.PI * 2);
        ctx.fillStyle = glow; ctx.fill();

        // Hex body
        hexPath(ctx, n.x, n.y, s);
        const fillA = dark ? (0.15 + hover * 0.2) : (0.1 + hover * 0.15);
        ctx.fillStyle = n.color + Math.round(fillA * 255).toString(16).padStart(2, '0');
        ctx.fill();
        ctx.strokeStyle = n.color + (dark ? '60' : '45');
        ctx.lineWidth = 1.5 + hover * 1.5;
        ctx.stroke();

        // Inner shine
        hexPath(ctx, n.x, n.y - s * 0.06, s * 0.65);
        const inner = ctx.createLinearGradient(n.x, n.y - s, n.x, n.y + s);
        inner.addColorStop(0, `rgba(255,255,255,${dark ? 0.08 : 0.12})`);
        inner.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = inner; ctx.fill();

        // Label
        if (s > 12) {
          ctx.font = `600 ${Math.max(9, s * 0.4)}px 'Space Grotesk', sans-serif`;
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillStyle = dark
            ? `rgba(255,255,255,${0.6 + hover * 0.35})`
            : `rgba(30,41,59,${0.6 + hover * 0.35})`;
          ctx.fillText(n.label, n.x, n.y);
        }
      });

      // Vignette
      const vig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.2, W / 2, H / 2, Math.max(W, H) * 0.58);
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, dark ? 'rgba(3,3,8,0.65)' : 'rgba(241,245,249,0.7)');
      ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H);

      frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [buildGraph]);

  return <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />;
}
