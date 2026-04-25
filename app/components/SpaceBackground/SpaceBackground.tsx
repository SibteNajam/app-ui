'use client';
import { useEffect, useRef } from 'react';
import './SpaceBackground.css';

/* ─── Types ─── */
interface Star {
  x: number;
  y: number;
  radius: number;
  baseAlpha: number;
  alpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
  color: string;
}

interface ShootingStar {
  x: number;
  y: number;
  len: number;
  speed: number;
  angle: number;
  alpha: number;
  decay: number;
  color: string;
}

/* ─── Config ─── */
const STAR_COUNT = 160;
const SHOOTING_STAR_INTERVAL = 8000; // ms between shooting stars

const STAR_COLORS = [
  '255,255,255',   // white
  '200,220,255',   // blue-white
  '180,200,255',   // cool blue
  '255,230,200',   // warm white
  '170,220,255',   // icy blue
  '52,211,153',    // emerald (theme accent)
  '255,200,180',   // pinkish
];

/* ─── Component ─── */
export default function SpaceBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    let animId: number;
    let w = 0;
    let h = 0;
    let stars: Star[] = [];
    let shootingStars: ShootingStar[] = [];
    let lastShootingTime = 0;

    /* Resize handler */
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      generateStars();
    };

    /* Generate star field */
    const generateStars = () => {
      stars = [];
      for (let i = 0; i < STAR_COUNT; i++) {
        const color = STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)];
        stars.push({
          x: Math.random() * w,
          y: Math.random() * h,
          radius: Math.random() * 1.6 + 0.3,
          baseAlpha: Math.random() * 0.4 + 0.1,
          alpha: 0,
          twinkleSpeed: Math.random() * 0.006 + 0.001,
          twinklePhase: Math.random() * Math.PI * 2,
          color,
        });
      }
    };

    /* Spawn a shooting star */
    const spawnShootingStar = () => {
      const angle = Math.random() * 0.5 + 0.3; // roughly 17°–46°
      shootingStars.push({
        x: Math.random() * w * 0.8,
        y: Math.random() * h * 0.4,
        len: Math.random() * 80 + 60,
        speed: Math.random() * 6 + 4,
        angle,
        alpha: 1,
        decay: Math.random() * 0.008 + 0.006,
        color: Math.random() > 0.5 ? '52,211,153' : '200,220,255',
      });
    };

    /* Draw loop */
    const draw = (time: number) => {
      ctx.clearRect(0, 0, w, h);

      /* ── Stars ── */
      for (const s of stars) {
        s.alpha = s.baseAlpha + Math.sin(time * s.twinkleSpeed + s.twinklePhase) * 0.35;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${s.color},${Math.max(0, Math.min(1, s.alpha))})`;
        ctx.fill();

        // faint glow halo for brighter stars
        if (s.radius > 1.1) {
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.radius * 3, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${s.color},${Math.max(0, s.alpha * 0.08)})`;
          ctx.fill();
        }
      }

      /* ── Shooting stars ── */
      if (time - lastShootingTime > SHOOTING_STAR_INTERVAL) {
        spawnShootingStar();
        lastShootingTime = time;
      }

      shootingStars = shootingStars.filter((ss) => ss.alpha > 0.01);
      for (const ss of shootingStars) {
        const tailX = ss.x - Math.cos(ss.angle) * ss.len;
        const tailY = ss.y - Math.sin(ss.angle) * ss.len;

        const grad = ctx.createLinearGradient(tailX, tailY, ss.x, ss.y);
        grad.addColorStop(0, `rgba(${ss.color},0)`);
        grad.addColorStop(1, `rgba(${ss.color},${ss.alpha})`);

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(ss.x, ss.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // bright head
        ctx.beginPath();
        ctx.arc(ss.x, ss.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${ss.color},${ss.alpha})`;
        ctx.fill();

        ss.x += Math.cos(ss.angle) * ss.speed;
        ss.y += Math.sin(ss.angle) * ss.speed;
        ss.alpha -= ss.decay;
      }

      animId = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener('resize', resize);
    animId = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <div className="space-bg">
      <canvas ref={canvasRef} className="space-bg__canvas" />
      {/* Static CSS nebula layers — cheaper than drawing on canvas */}
      <div className="space-bg__nebula space-bg__nebula--1" />
      <div className="space-bg__nebula space-bg__nebula--2" />
      <div className="space-bg__nebula space-bg__nebula--3" />
    </div>
  );
}
