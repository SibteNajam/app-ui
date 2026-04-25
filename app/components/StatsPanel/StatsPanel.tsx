'use client';
import React, { useState, useEffect, useRef } from 'react';
import './StatsPanel.css';

/* ══════════════════════════════════════════════════════
   STATS PANEL — Floating text on left + popup dual cards
   NO card container — just bare text + button
   ══════════════════════════════════════════════════════ */

function DonutChart({ percentage, label, color }: { percentage: number; label: string; color: string }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  return (
    <div className="sp-donut-wrap">
      <svg viewBox="0 0 70 70" className="sp-donut-svg">
        <circle cx="35" cy="35" r={radius} strokeWidth="4" stroke="rgba(255,255,255,0.05)" fill="none" />
        <circle cx="35" cy="35" r={radius} strokeWidth="4" stroke={color} fill="none"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          className="sp-donut-fill" transform="rotate(-90 35 35)" />
      </svg>
      <div className="sp-donut-center">
        <span className="sp-donut-val" style={{ color }}>{percentage}%</span>
        <span className="sp-donut-lbl">{label}</span>
      </div>
    </div>
  );
}

function BarChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const maxVal = Math.max(...data.map(d => d.value));
  return (
    <div className="sp-bar-chart">
      {data.map((d, i) => (
        <div key={d.label} className="sp-bar-col" style={{ animationDelay: `${i * 60}ms` }}>
          <div className="sp-bar-value" style={{ color: d.color }}>{d.value}</div>
          <div className="sp-bar-track">
            <div className="sp-bar-fill" style={{
              height: `${(d.value / maxVal) * 100}%`,
              background: `linear-gradient(to top, ${d.color}40, ${d.color})`,
              animationDelay: `${i * 60 + 150}ms`,
            }} />
          </div>
          <div className="sp-bar-label">{d.label}</div>
        </div>
      ))}
    </div>
  );
}

/* ──────────────────────────────────────────────────
   SPARK ECG — orange live signal for left panel
   ────────────────────────────────────────────────── */
function SparkEcg() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const h = 56;
    const ORANGE      = 'rgba(255,140,30,1)';
    const ORANGE_GLOW = 'rgba(255,140,30,0.5)';
    const HEAD_X_R    = 0.72;
    const LERP        = 0.15;
    const SCROLL      = 0.55;

    let w = canvas.parentElement!.offsetWidth;
    canvas.width = w; canvas.height = h;

    let pts: number[] = [];
    for (let i = 0; i < Math.ceil(w * HEAD_X_R) + 4; i++) pts.push(h / 2);

    const mid = h / 2, range = h * 0.38;
    let target = mid, current = mid, holdLeft = 0;

    function pickTarget() {
      const r = Math.random();
      target = r < 0.25 ? mid + (Math.random() * 6 - 3)
             : r < 0.6  ? mid - range * (0.4 + Math.random() * 0.6)
                        : mid + range * (0.4 + Math.random() * 0.6);
      target = Math.max(h * 0.1, Math.min(h * 0.9, target));
      holdLeft = 15 + Math.floor(Math.random() * 35);
    }
    pickTarget();

    const queue: { t: number; h: number }[] = [];
    function maybeV() {
      if (Math.random() < 0.004) {
        const d = Math.random() > 0.5;
        queue.push({ t: d ? h * 0.82 : h * 0.18, h: 12 + Math.floor(Math.random() * 8) });
        queue.push({ t: d ? h * 0.18 : h * 0.82, h: 12 + Math.floor(Math.random() * 8) });
      }
    }

    let animId: number, sub = 0;
    function render() {
      animId = requestAnimationFrame(render);
      if (!canvas || !ctx) return;
      const W = canvas.parentElement!.offsetWidth;
      if (canvas.width !== W) { canvas.width = W; }
      if (--holdLeft <= 0) {
        if (queue.length > 0) { const n = queue.shift()!; target = n.t; holdLeft = n.h; }
        else pickTarget();
      }
      maybeV();
      current += (target - current) * LERP;
      sub += SCROLL;
      while (sub >= 1) { pts.push(current); sub -= 1; }
      const need = Math.ceil(W * HEAD_X_R) + 4;
      if (pts.length > need + 60) pts = pts.slice(-need - 60);

      ctx.clearRect(0, 0, W, h);
      ctx.strokeStyle = 'rgba(255,255,255,0.025)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      [0.33, 0.67].forEach(r => { ctx.moveTo(0, h * r); ctx.lineTo(W, h * r); });
      ctx.stroke();

      const headX = W * HEAD_X_R;
      const vis = pts.slice(-Math.ceil(headX) - 1);
      const n = vis.length;
      if (n < 2) return;
      const step = headX / (n - 1);

      ctx.beginPath();
      vis.forEach((y, i) => i === 0 ? ctx.moveTo(i * step, y) : ctx.lineTo(i * step, y));
      ctx.lineTo((n - 1) * step, h); ctx.lineTo(0, h); ctx.closePath();
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, 'rgba(255,140,20,0.16)'); g.addColorStop(1, 'rgba(255,140,20,0)');
      ctx.fillStyle = g; ctx.fill();

      ctx.beginPath();
      vis.forEach((y, i) => i === 0 ? ctx.moveTo(i * step, y) : ctx.lineTo(i * step, y));
      ctx.strokeStyle = ORANGE; ctx.lineWidth = 1.6;
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.shadowBlur = 4; ctx.shadowColor = ORANGE_GLOW;
      ctx.stroke(); ctx.shadowBlur = 0;

      const hy = vis[n - 1];
      ctx.beginPath(); ctx.arc(headX, hy, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = ORANGE; ctx.shadowBlur = 12; ctx.shadowColor = ORANGE_GLOW;
      ctx.fill(); ctx.shadowBlur = 0;
    }
    render();
    const onR = () => { if (!canvas) return; w = canvas.parentElement!.offsetWidth; canvas.width = w; };
    window.addEventListener('resize', onR);
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', onR); };
  }, []);
  return <canvas ref={canvasRef} style={{ width: '100%', height: '56px', display: 'block', borderTop: '1px dotted rgba(255,255,255,0.06)', borderBottom: '1px dotted rgba(255,255,255,0.06)' }} />;
}

export default function StatsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  const chartData = [
    { label: 'BTC', value: 42, color: '#ffaa00' },
    { label: 'ETH', value: 28, color: '#627eea' },
    { label: 'SOL', value: 35, color: '#00ff88' },
    { label: 'BNB', value: 18, color: '#f0a517' },
    { label: 'ARB', value: 22, color: '#28b9ef' },
    { label: 'AVAX', value: 15, color: '#e84142' },
  ];

  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setAnimateIn(true));
    } else {
      setAnimateIn(false);
    }
  }, [isOpen]);

  const handleClose = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setAnimateIn(false);
      setTimeout(() => setIsOpen(false), 400);
    }
  };

  const triggerClose = () => {
    setAnimateIn(false);
    setTimeout(() => setIsOpen(false), 400);
  };

  return (
    <>
      {/* ── FLOATING TEXT — absolute on left, no card ── */}
      <div className="sp-float" style={{ pointerEvents: 'auto' }}>

        {/* SYMBOL HEADER */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.15em', marginBottom: '10px', fontFamily: '"Space Grotesk", sans-serif' }}>
            ACTIVE <span style={{ opacity: 0.5 }}>•</span> SPOT TRADE
          </div>
          <div style={{ fontSize: '38px', fontWeight: 900, color: '#7a5af8', lineHeight: 1, letterSpacing: '-0.02em', marginBottom: '2px', fontFamily: '"Space Grotesk", sans-serif' }}>
            TIA
          </div>
          <div style={{ fontSize: '9px', fontWeight: 600, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.08em', marginBottom: '14px' }}>
            TIA/USDT · BINANCE
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
            <div style={{ fontSize: '26px', fontWeight: 800, color: '#FFFFFF', lineHeight: 1, fontFamily: '"Space Grotesk", sans-serif' }}>
              $9.14
            </div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#00e676', fontFamily: '"Space Grotesk", sans-serif' }}>
              +4.12%
            </div>
          </div>
        </div>

        {/* DIVIDER */}
        <div style={{ width: '32px', height: '1px', background: 'rgba(255,255,255,0.1)', marginBottom: '18px' }} />

        {/* UNREALIZED P&L */}
        <div style={{ marginBottom: '18px' }}>
          <div style={{ fontSize: '8px', fontWeight: 700, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.15em', marginBottom: '5px', textTransform: 'uppercase' }}>
            UNREALIZED P&L
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#00e676', fontFamily: '"Space Grotesk", sans-serif' }}>
              +$17.18
            </div>
            <div style={{ fontSize: '9px', fontWeight: 700, color: '#00e676', opacity: 0.75 }}>+4.34%</div>
          </div>
        </div>

        {/* SPOT TRADE DETAILS GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: '13px', columnGap: '16px', marginBottom: '18px' }}>
          {[
            { lbl: 'ENTRY PRICE', val: '$8.76',    color: '' },
            { lbl: 'QUANTITY',    val: '45.2 TIA',  color: '' },
            { lbl: 'COST BASIS',  val: '$395.95',   color: '' },
            { lbl: 'CURR. VALUE', val: '$413.13',   color: '#0ef0ad' },
            { lbl: 'REALIZED P&L',val: '+$38.02',   color: '#00e676' },
            { lbl: 'FEES PAID',   val: '$0.42',     color: 'rgba(255,255,255,0.4)' },
            { lbl: 'HOLD TIME',   val: '2h 14m',    color: '' },
            { lbl: '24H CHANGE',  val: '+4.12%',    color: '#00e676' },
          ].map(({ lbl, val, color }) => (
            <div key={lbl}>
              <div style={{ fontSize: '7px', fontWeight: 700, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.1em', marginBottom: '3px' }}>{lbl}</div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: color || '#FFFFFF', fontFamily: '"Space Grotesk", sans-serif' }}>{val}</div>
            </div>
          ))}
        </div>

        <button className="sp-float-btn" onClick={() => setIsOpen(true)} style={{ marginBottom: '16px' }}>
          View Full Portfolio Stats ›
        </button>

        {/* ── ECG SIGNAL CHART ── */}
        <div style={{ marginTop: '4px' }}>
          <div style={{ fontSize: '8px', fontWeight: 700, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.14em', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
            <span>◆ PRICE SIGNAL</span>
            <span style={{ color: 'rgba(255,140,30,0.6)' }}>LIVE</span>
          </div>
          <SparkEcg />
        </div>
      </div>

      {/* ── POPUP OVERLAY ── */}
      {isOpen && (
        <div className={`sp-overlay ${animateIn ? 'visible' : ''}`} onClick={handleClose}>
          <div className="sp-cards-row">

            {/* CARD 1: Stats */}
            <div className={`sp-card ${animateIn ? 'in' : ''}`}>
              <button className="sp-card-close" onClick={triggerClose}>×</button>
              <div className="sp-card-head">
                <div className="sp-card-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <path d="M18 20V10M12 20V4M6 20v-6" strokeLinecap="round" />
                  </svg>
                </div>
                <span className="sp-card-title">PORTFOLIO STATS</span>
              </div>

              <div className="sp-grid-2">
                <div className="sp-cell big">
                  <div className="sp-cell-lbl">TOTAL PNL</div>
                  <div className="sp-cell-val green">$6.66</div>
                  <div className="sp-cell-sub">134 trades</div>
                </div>
                <div className="sp-cell">
                  <div className="sp-cell-lbl">REALIZED</div>
                  <div className="sp-cell-val green">$6.66</div>
                  <div className="sp-cell-sub">134 closed</div>
                </div>
                <div className="sp-cell">
                  <div className="sp-cell-lbl">UNREALIZED</div>
                  <div className="sp-cell-val">$0.00</div>
                  <div className="sp-cell-sub">0 open</div>
                </div>
                <div className="sp-cell">
                  <div className="sp-cell-lbl">WIN RATE</div>
                  <div className="sp-cell-val amber">39%</div>
                  <div className="sp-cell-bar-wrap"><div className="sp-cell-bar" style={{ width: '39%', background: '#ffc107' }} /></div>
                </div>
              </div>

              <div className="sp-row-4">
                <div className="sp-mini"><div className="sp-mini-val">134</div><div className="sp-mini-lbl">TOTAL</div></div>
                <div className="sp-mini"><div className="sp-mini-val">0</div><div className="sp-mini-lbl">ACTIVE</div></div>
                <div className="sp-mini"><div className="sp-mini-val green">134</div><div className="sp-mini-lbl">CLOSED</div></div>
                <div className="sp-mini"><div className="sp-mini-val">0</div><div className="sp-mini-lbl">PENDING</div></div>
              </div>

              <div className="sp-roi-row">
                <div>
                  <div className="sp-roi-lbl">NET ROI</div>
                  <div className="sp-roi-sub">$1,773 invested</div>
                </div>
                <div className="sp-roi-val green">+0.4%</div>
              </div>
            </div>

            {/* CARD 2: Charts */}
            <div className={`sp-card sp-card-delay ${animateIn ? 'in' : ''}`}>
              <div className="sp-card-head">
                <div className="sp-card-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <path d="M3 3v18h18" strokeLinecap="round" /><path d="M7 16l4-5 4 3 5-7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="sp-card-title">ANALYTICS</span>
              </div>

              <div className="sp-donuts">
                <DonutChart percentage={39} label="WIN" color="#4DB86A" />
                <DonutChart percentage={61} label="LOSS" color="#D65C5C" />
                <DonutChart percentage={78} label="FILL" color="#0ef0ad" />
              </div>

              <div className="sp-section-lbl">VOLUME BY SYMBOL</div>
              <BarChart data={chartData} />

              <div className="sp-grid-2 mt12">
                <div className="sp-cell sm">
                  <div className="sp-cell-lbl">BEST</div>
                  <div className="sp-cell-val green sm">+$420.30</div>
                  <div className="sp-cell-sub">BTC/USDT</div>
                </div>
                <div className="sp-cell sm">
                  <div className="sp-cell-lbl">WORST</div>
                  <div className="sp-cell-val red sm">-$88.50</div>
                  <div className="sp-cell-sub">ETH/USDT</div>
                </div>
                <div className="sp-cell sm">
                  <div className="sp-cell-lbl">AVG HOLD</div>
                  <div className="sp-cell-val sm">4h 32m</div>
                </div>
                <div className="sp-cell sm">
                  <div className="sp-cell-lbl">SHARPE</div>
                  <div className="sp-cell-val amber sm">1.24</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
