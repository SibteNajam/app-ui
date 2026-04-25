'use client';
import { useEffect, useRef } from 'react';
import './PortfolioChart.css';

/* ══════════════════════════════════════════════════════
   PORTFOLIO CHART — Canvas-based area chart
   Shows portfolio value over time (7 day view)
   ══════════════════════════════════════════════════════ */

interface ChartPoint {
  time: string;
  usd: number;
  btc: number;
}

interface PortfolioChartProps {
  data: ChartPoint[];
  mode: 'USD' | 'BTC';
}

export default function PortfolioChart({ data, mode }: PortfolioChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length < 2) return;

    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const values = data.map(d => mode === 'USD' ? d.usd : d.btc);
    const min = Math.min(...values) * 0.995;
    const max = Math.max(...values) * 1.005;
    const range = max - min || 1;

    const padL = 0;
    const padR = 0;
    const padT = 8;
    const padB = 28;
    const chartW = w - padL - padR;
    const chartH = h - padT - padB;

    const toX = (i: number) => padL + (i / (data.length - 1)) * chartW;
    const toY = (v: number) => padT + (1 - (v - min) / range) * chartH;

    ctx.clearRect(0, 0, w, h);

    /* ── Grid lines ── */
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 4; i++) {
      const y = padT + (i / 4) * chartH;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(w - padR, y);
      ctx.stroke();
    }

    /* ── Area fill ── */
    const gradient = ctx.createLinearGradient(0, padT, 0, h - padB);
    if (mode === 'USD') {
      gradient.addColorStop(0, 'rgba(52, 211, 153, 0.18)');
      gradient.addColorStop(0.6, 'rgba(52, 211, 153, 0.04)');
      gradient.addColorStop(1, 'rgba(52, 211, 153, 0)');
    } else {
      gradient.addColorStop(0, 'rgba(247, 147, 26, 0.18)');
      gradient.addColorStop(0.6, 'rgba(247, 147, 26, 0.04)');
      gradient.addColorStop(1, 'rgba(247, 147, 26, 0)');
    }

    ctx.beginPath();
    ctx.moveTo(toX(0), h - padB);
    for (let i = 0; i < values.length; i++) {
      if (i === 0) {
        ctx.lineTo(toX(i), toY(values[i]));
      } else {
        // Bezier smoothing
        const prevX = toX(i - 1);
        const prevY = toY(values[i - 1]);
        const currX = toX(i);
        const currY = toY(values[i]);
        const cpX = (prevX + currX) / 2;
        ctx.bezierCurveTo(cpX, prevY, cpX, currY, currX, currY);
      }
    }
    ctx.lineTo(toX(values.length - 1), h - padB);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    /* ── Line ── */
    ctx.beginPath();
    for (let i = 0; i < values.length; i++) {
      if (i === 0) {
        ctx.moveTo(toX(i), toY(values[i]));
      } else {
        const prevX = toX(i - 1);
        const prevY = toY(values[i - 1]);
        const currX = toX(i);
        const currY = toY(values[i]);
        const cpX = (prevX + currX) / 2;
        ctx.bezierCurveTo(cpX, prevY, cpX, currY, currX, currY);
      }
    }
    ctx.strokeStyle = mode === 'USD' ? '#34d399' : '#f7931a';
    ctx.lineWidth = 2;
    ctx.stroke();

    /* ── Secondary line (dimmer) ── */
    const altValues = data.map(d => mode === 'USD' ? d.btc : d.usd);
    const altMin = Math.min(...altValues) * 0.995;
    const altMax = Math.max(...altValues) * 1.005;
    const altRange = altMax - altMin || 1;
    const toAltY = (v: number) => padT + (1 - (v - altMin) / altRange) * chartH;

    ctx.beginPath();
    for (let i = 0; i < altValues.length; i++) {
      if (i === 0) {
        ctx.moveTo(toX(i), toAltY(altValues[i]));
      } else {
        const prevX = toX(i - 1);
        const prevY = toAltY(altValues[i - 1]);
        const currX = toX(i);
        const currY = toAltY(altValues[i]);
        const cpX = (prevX + currX) / 2;
        ctx.bezierCurveTo(cpX, prevY, cpX, currY, currX, currY);
      }
    }
    ctx.strokeStyle = mode === 'USD'
      ? 'rgba(247, 147, 26, 0.25)'
      : 'rgba(52, 211, 153, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    /* ── X-axis labels ── */
    ctx.font = '500 10px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.textAlign = 'center';
    const step = Math.max(1, Math.floor(data.length / 6));
    for (let i = 0; i < data.length; i += step) {
      ctx.fillText(data[i].time, toX(i), h - 6);
    }

    /* ── Y-axis labels (right side) ── */
    ctx.textAlign = 'right';
    ctx.font = '500 9px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    for (let i = 0; i <= 4; i++) {
      const val = min + (range * (4 - i)) / 4;
      const label = mode === 'USD'
        ? `$${val.toFixed(val < 10 ? 2 : 0)}`
        : `${val.toFixed(4)}₿`;
      ctx.fillText(label, w - 4, padT + (i / 4) * chartH + 3);
    }

    /* ── Glow dot at last point ── */
    const lastX = toX(values.length - 1);
    const lastY = toY(values[values.length - 1]);
    const glowColor = mode === 'USD' ? '52,211,153' : '247,147,26';

    ctx.beginPath();
    ctx.arc(lastX, lastY, 8, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${glowColor}, 0.15)`;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(lastX, lastY, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = mode === 'USD' ? '#34d399' : '#f7931a';
    ctx.fill();

  }, [data, mode]);

  return (
    <div className="pchart-wrapper">
      <canvas ref={canvasRef} className="pchart-canvas" />
    </div>
  );
}
