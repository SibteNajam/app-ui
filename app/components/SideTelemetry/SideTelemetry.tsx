'use client';
import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
const worldMapUrl = '/world.svg';
import './SideTelemetry.css';

/* ─────────────────────────────────────────────────────────────
   LEFT OVERLAY - LIQUIDITY PROFILE & DEPTH
   ───────────────────────────────────────────────────────────── */
export function SideTelemetryLeft() {
  const [bids, setBids] = useState<number[]>(Array(12).fill(50));
  const [asks, setAsks] = useState<number[]>(Array(12).fill(50));

  useEffect(() => {
    const iv = setInterval(() => {
      setBids(prev => prev.map((v, i) => Math.max(10, Math.min(90, v + (Math.random() * 10 - 5) + (12 - i)))));
      setAsks(prev => prev.map((v, i) => Math.max(10, Math.min(90, v + (Math.random() * 10 - 5) + (i)))));
    }, 400);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="telem-overlay-panel left-panel">
      <div className="telem-header">
        <div className="th-indicator green-pulse" />
        <div className="th-title">LIQUIDITY DEPTH</div>
      </div>

      {/* Depth Chart Visualization (Abstract CSS bars) */}
      <div className="depth-chart">
        <div className="depth-half bids-half">
          {bids.map((val, i) => (
            <div key={`b-${i}`} className="depth-bar-wrap">
              <div className="depth-bar bid-color" style={{ width: `${val}%` }} />
            </div>
          ))}
        </div>
        <div className="depth-divider" />
        <div className="depth-half asks-half">
          {asks.map((val, i) => (
            <div key={`a-${i}`} className="depth-bar-wrap right-align">
              <div className="depth-bar ask-color" style={{ width: `${val}%` }} />
            </div>
          ))}
        </div>
      </div>

      <div className="telem-footer-stats">
        <div className="tfs-block">
          <div className="tfs-lbl">BID VOL</div>
          <div className="tfs-val green-text">24.2M</div>
        </div>
        <div className="tfs-block right-align">
          <div className="tfs-lbl">ASK VOL</div>
          <div className="tfs-val red-text">18.9M</div>
        </div>
      </div>

      {/* Abstract Animated Nodes */}
      <div className="abstract-nodes">
        <div className="an-title">NETWORK NODE STATUS</div>
        <div className="node-grid">
          {Array(8).fill(0).map((_, i) => (
            <div key={i} className="node-item" style={{ animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   ECG / GRADIENT FLOW CHART COMPONENT
   ───────────────────────────────────────────────────────────── */
function EcgFlowChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const h = 80;
    const ORANGE = 'rgba(255, 140, 30, 1)';
    const ORANGE_GLOW = 'rgba(255, 140, 30, 0.55)';
    const HEAD_X_RATIO = 0.70;
    const LERP_SPEED = 0.15;  // snappy enough to reach target before next fires

    let w = canvas.parentElement!.offsetWidth;
    canvas.width = w;
    canvas.height = h;

    // scrolling buffer — one y-value per pixel of headX
    let pts: number[] = [];
    const initLen = Math.ceil(w * HEAD_X_RATIO) + 4;
    for (let i = 0; i < initLen; i++) pts.push(h / 2);

    // random-walk target
    const mid = h / 2;
    const range = h * 0.38;
    let target = mid;
    let current = mid;
    let holdLeft = 0;

    function pickTarget() {
      const roll = Math.random();
      if (roll < 0.25) {
        target = mid + (Math.random() * 8 - 4);          // near-flat
      } else if (roll < 0.6) {
        target = mid - range * (0.4 + Math.random() * 0.6); // go up
      } else {
        target = mid + range * (0.4 + Math.random() * 0.6); // go down
      }
      target = Math.max(h * 0.1, Math.min(h * 0.9, target));
      holdLeft = 15 + Math.floor(Math.random() * 35); // 15–50 frames: many changes visible at once
    }
    pickTarget();

    // ── V-shape event queue ──
    const queue: { t: number; h: number }[] = [];
    function maybeQueueV() {
      if (Math.random() < 0.004) { // ~0.4% per frame chance
        const goDown = Math.random() > 0.5;
        const extreme1 = goDown ? h * 0.82 : h * 0.18;
        const extreme2 = goDown ? h * 0.18 : h * 0.82;
        queue.push({ t: extreme1, h: 12 + Math.floor(Math.random() * 8) });
        queue.push({ t: extreme2, h: 12 + Math.floor(Math.random() * 8) });
      }
    }

    let animId: number;
    let sub = 0;
    const SCROLL = 0.55; // px per frame — same as original

    function render() {
      animId = requestAnimationFrame(render);
      if (!canvas || !ctx) return;

      const W = canvas.parentElement!.offsetWidth;
      if (canvas.width !== W) { canvas.width = W; }

      // advance target — queue first, else normal random walk
      if (--holdLeft <= 0) {
        if (queue.length > 0) {
          const next = queue.shift()!;
          target = next.t;
          holdLeft = next.h;
        } else {
          pickTarget();
        }
      }
      maybeQueueV();

      // smooth lerp toward target
      current += (target - current) * LERP_SPEED;

      // push new value(s) as we scroll
      sub += SCROLL;
      while (sub >= 1) {
        pts.push(current);
        sub -= 1;
      }

      // keep buffer trimmed
      const need = Math.ceil(W * HEAD_X_RATIO) + 4;
      if (pts.length > need + 60) pts = pts.slice(-need - 60);

      ctx.clearRect(0, 0, W, h);

      // grid
      ctx.strokeStyle = 'rgba(255,255,255,0.03)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      [0.25, 0.5, 0.75].forEach(r => { ctx.moveTo(0, h * r); ctx.lineTo(W, h * r); });
      ctx.stroke();

      // visible slice ending at headX
      const headX = W * HEAD_X_RATIO;
      const visible = pts.slice(-Math.ceil(headX) - 1);
      const n = visible.length;
      if (n < 2) return;
      const step = headX / (n - 1);

      // fill under line
      ctx.beginPath();
      visible.forEach((y, i) => i === 0 ? ctx.moveTo(i * step, y) : ctx.lineTo(i * step, y));
      ctx.lineTo((n - 1) * step, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, 'rgba(255,140,20,0.18)');
      grad.addColorStop(1, 'rgba(255,140,20,0)');
      ctx.fillStyle = grad;
      ctx.fill();

      // line
      ctx.beginPath();
      visible.forEach((y, i) => i === 0 ? ctx.moveTo(i * step, y) : ctx.lineTo(i * step, y));
      ctx.strokeStyle = ORANGE;
      ctx.lineWidth = 1.8;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.shadowBlur = 5;
      ctx.shadowColor = ORANGE_GLOW;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // head dot
      const headY = visible[n - 1];
      ctx.beginPath();
      ctx.arc(headX, headY, 3, 0, Math.PI * 2);
      ctx.fillStyle = ORANGE;
      ctx.shadowBlur = 14;
      ctx.shadowColor = ORANGE_GLOW;
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    render();

    const onResize = () => { if (!canvas) return; w = canvas.parentElement!.offsetWidth; canvas.width = w; };
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', onResize); };
  }, []);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '80px', display: 'block' }} />;
}

/* ─────────────────────────────────────────────────────────────
   RIGHT OVERLAY - ULTRA-CLEAN DATA MATRIX
   ───────────────────────────────────────────────────────────── */
export function SideTelemetryRight() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    slippage: 0.003, latency: 12, tps: 840,
    spread: 0.012, funding: 0.0035, oi: 284.5, markPrice: 9.142, vol24h: 182.4, liq: 2.1
  });

  useEffect(() => {
    const iv = setInterval(() => {
      setMetrics(prev => ({
        slippage: +(Math.random() * 0.005 + 0.001).toFixed(4),
        latency: Math.max(8, prev.latency + Math.floor(Math.random() * 6 - 3)),
        tps: Math.max(500, prev.tps + Math.floor(Math.random() * 40 - 20)),
        spread: +(Math.random() * 0.02 + 0.005).toFixed(3),
        funding: +(Math.random() * 0.008 - 0.004).toFixed(4),
        oi: +(prev.oi + (Math.random() * 4 - 2)).toFixed(1),
        markPrice: +(9.14 + (Math.random() * 0.06 - 0.03)).toFixed(3),
        vol24h: +(prev.vol24h + (Math.random() * 2 - 1)).toFixed(1),
        liq: +(Math.random() * 3 + 0.5).toFixed(1),
      }));
    }, 1600);
    const loadT = setTimeout(() => setLoading(false), 4000);
    return () => { clearInterval(iv); clearTimeout(loadT); };
  }, []);

  const fundingColor = metrics.funding >= 0 ? '#4DB86A' : '#D65C5C';
  const isLight = typeof document !== 'undefined' ? document.documentElement.getAttribute('data-theme') === 'light' : false;
  const mapTextColor = isLight ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)';

  if (loading) {
    return (
      <div className="pro-sidebar-wrap" style={{ padding: '24px' }}>
        <div className="skeleton-box" style={{ width: '100%', height: '140px', marginBottom: '24px', borderRadius: '8px' }} />
        
        <div className="skeleton-box" style={{ width: '60%', height: '16px', marginBottom: '16px' }} />
        <div className="skeleton-box" style={{ width: '100%', height: '60px', marginBottom: '32px' }} />
        
        <div className="skeleton-box" style={{ width: '70%', height: '16px', marginBottom: '24px' }} />
        {Array(6).fill(0).map((_, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div className="skeleton-box" style={{ width: '40%', height: '14px' }} />
            <div className="skeleton-box" style={{ width: '30%', height: '14px' }} />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="pro-sidebar-wrap">
      {/* TRADE ROUTING NETWORK */}
      <div className="pd-section head-section" style={{ padding: 0, overflow: 'hidden', border: 'none', background: 'transparent' }}>
        <div style={{ position: 'relative', width: '100%', height: '160px' }}>
          <div style={{ position: 'absolute', inset: 0, opacity: 0.15, backgroundImage: `url(${worldMapUrl})`, backgroundSize: '150%', backgroundPosition: 'center', mixBlendMode: 'screen' }} />
          <svg viewBox="0 0 280 110" style={{ width: '100%', height: '100%', display: 'block', position: 'relative', zIndex: 2 }}>
            {/* Routing Paths */}
            <path d="M 60 40 Q 100 0 140 30" style={{ fill: 'none', stroke: 'rgba(255,51,102,0.3)', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <path d="M 140 30 Q 180 60 235 45" style={{ fill: 'none', stroke: 'rgba(77,184,106,0.3)', strokeWidth: 1, strokeDasharray: '4 4' }} />
            <path d="M 235 45 Q 150 90 60 40" style={{ fill: 'none', stroke: 'rgba(0,229,255,0.3)', strokeWidth: 1, strokeDasharray: '4 4' }} />
            
            {/* Server Nodes */}
            <circle cx="60" cy="40" r="3" style={{ fill: '#00E5FF' }} />
            <circle cx="140" cy="30" r="3" style={{ fill: '#ff3366' }} />
            <circle cx="235" cy="45" r="3" style={{ fill: '#4DB86A' }} />
            
            {/* Data Packets */}
            <circle r="2" fill="#00E5FF"><animateMotion dur="4.5s" repeatCount="indefinite" path="M 235 45 Q 150 90 60 40" /></circle>
            <circle r="2" fill="#ff3366"><animateMotion dur="3.2s" repeatCount="indefinite" path="M 60 40 Q 100 0 140 30" /></circle>
            <circle r="2" fill="#4DB86A"><animateMotion dur="3.8s" repeatCount="indefinite" path="M 140 30 Q 180 60 235 45" /></circle>
            
            {/* Trading Infrastructure Labels */}
            <text x="60" y="55" fontSize="7" fill={mapTextColor} textAnchor="middle" style={{ fontFamily: 'monospace' }}>US-EAST (API)</text>
            <text x="140" y="20" fontSize="7" fill={mapTextColor} textAnchor="middle" style={{ fontFamily: 'monospace' }}>MATCH ENGINE</text>
            <text x="235" y="60" fontSize="7" fill={mapTextColor} textAnchor="middle" style={{ fontFamily: 'monospace' }}>LIQUIDITY POOL</text>
          </svg>
        </div>
      </div>

      {/* ECG FLOW CHART — live orange signal under map */}
      <div className="pd-section" style={{ marginBottom: '16px' }}>
        <div className="pd-header">
          <span className="pd-diamond">◆</span>
          <span>SYSTEM PULSE</span>
        </div>
        <div className="pd-chart-container" style={{ height: '80px', borderTop: 'none', borderBottom: 'none' }}>
          <EcgFlowChart />
        </div>
      </div>

      {/* PORTFOLIO HEALTH */}
      <div className="pd-section">
        <div className="pd-header">
          <span className="pd-diamond">◆</span>
          <span>PORTFOLIO HEALTH</span>
        </div>
        {/* Prominent Yield Block */}
        <div style={{
          background: isLight ? 'rgba(52, 211, 153, 0.05)' : 'rgba(52, 211, 153, 0.08)',
          border: `1px solid ${isLight ? 'rgba(52, 211, 153, 0.2)' : 'rgba(52, 211, 153, 0.15)'}`,
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '10px', fontWeight: 600, color: isLight ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)', letterSpacing: '0.05em', marginBottom: '4px' }}>AVG. YIELD (APY)</div>
            <div style={{ fontSize: '24px', fontWeight: 800, color: '#34d399', fontFamily: "'Space Grotesk', sans-serif" }}>+4.28%</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '10px', fontWeight: 600, color: isLight ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)', letterSpacing: '0.05em', marginBottom: '4px' }}>EST. MONTHLY</div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: isLight ? '#000' : '#fff', fontFamily: "'Space Grotesk', sans-serif" }}>+$145.50</div>
          </div>
        </div>

        <div className="pd-grid-table">
          <div className="pd-row">
            <span>ACTIVE PNL</span>
            <span style={{ color: isLight ? '#2563eb' : '#60a5fa', fontWeight: 800 }}>+$840.00</span>
          </div>
          <div className="pd-row">
            <span>30D RETURN</span>
            <span style={{ color: '#34d399', fontWeight: 800 }}>+2.8%</span>
          </div>
          <div className="pd-row">
            <span>MAX DRAWDOWN</span>
            <span style={{ color: '#f87171', fontWeight: 800 }}>-4.1%</span>
          </div>
          <div className="pd-row">
            <span>WIN RATE</span>
            <span className="pd-val-highlight" style={{ fontWeight: 800 }}>62.4%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
