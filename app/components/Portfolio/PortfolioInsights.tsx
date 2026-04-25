'use client';
import { useState, useEffect } from 'react';
import './PortfolioInsights.css';

/* ═══ DATA ═══ */
const EXCHANGES = [
  { name:'Binance Spot', type:'My Binance', val:'$64.32', status:'connected' as const },
  { name:'Binance COIN-M', type:'Futures', val:'—', status:'inactive' as const },
  { name:'Binance USDT-M', type:'Futures', val:'—', status:'inactive' as const },
];

const RECENT_ACTIVITY = [
  { type:'deposit' as const, asset:'USDT', amount:'+50.00', time:'2h ago', color:'#34d399' },
  { type:'trade' as const, asset:'ATOM', amount:'-0.005', time:'1d ago', color:'#f87171' },
  { type:'deposit' as const, asset:'ETHW', amount:'+0.429', time:'3d ago', color:'#627eea' },
];

/* ═══════════════════════════════════════════════════════
   UNIQUE SVG COMPONENTS — Nothing reused from hero
   ═══════════════════════════════════════════════════════ */

/* ── RADAR SWEEP: Scanning animation for exchange status ── */
function RadarSweep({ active }: { active: boolean }) {
  return (
    <svg width="32" height="32" viewBox="0 0 64 64" style={{ flexShrink:0 }}>
      <defs>
        <linearGradient id="radar-sweep-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={active ? '#34d399' : '#4a5568'} stopOpacity="0.5"/>
          <stop offset="100%" stopColor={active ? '#34d399' : '#4a5568'} stopOpacity="0"/>
        </linearGradient>
      </defs>
      {/* Concentric rings */}
      <circle cx="32" cy="32" r="28" fill="none" stroke={active ? 'rgba(52,211,153,0.08)' : 'rgba(255,255,255,0.03)'} strokeWidth="1"/>
      <circle cx="32" cy="32" r="20" fill="none" stroke={active ? 'rgba(52,211,153,0.06)' : 'rgba(255,255,255,0.02)'} strokeWidth="0.8"/>
      <circle cx="32" cy="32" r="12" fill="none" stroke={active ? 'rgba(52,211,153,0.04)' : 'rgba(255,255,255,0.02)'} strokeWidth="0.5"/>
      {/* Cross hairs */}
      <line x1="32" y1="4" x2="32" y2="14" stroke={active ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.04)'} strokeWidth="0.5"/>
      <line x1="32" y1="50" x2="32" y2="60" stroke={active ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.04)'} strokeWidth="0.5"/>
      <line x1="4" y1="32" x2="14" y2="32" stroke={active ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.04)'} strokeWidth="0.5"/>
      <line x1="50" y1="32" x2="60" y2="32" stroke={active ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.04)'} strokeWidth="0.5"/>
      {/* Sweep arm */}
      {active && (
        <g className="pi-radar-arm">
          <path d="M32 32 L32 4 A28 28 0 0 1 56 18 Z" fill="url(#radar-sweep-g)" opacity="0.6"/>
        </g>
      )}
      {/* Center blip */}
      <circle cx="32" cy="32" r="3" fill={active ? '#34d399' : '#4a5568'}>
        {active && <animate attributeName="opacity" values="1;0.4;1" dur="1.5s" repeatCount="indefinite"/>}
      </circle>
    </svg>
  );
}

/* ── WAVEFORM VISUALIZER: Audio-style bars for activity ── */
function WaveformBar({ color, height=20 }: { color:string; height?:number }) {
  return (
    <div className="pi-waveform" style={{ height }}>
      {Array.from({ length: 7 }, (_, i) => {
        const h = [40, 70, 55, 90, 45, 75, 35][i];
        return (
          <div
            key={i}
            className="pi-wave-bar"
            style={{
              height: `${h}%`,
              background: `linear-gradient(180deg, ${color}, ${color}33)`,
              animationDelay: `${i * 0.15}s`,
            }}
          />
        );
      })}
    </div>
  );
}

/* ── TIMELINE NODE: Connected vertical timeline markers ── */
function TimelineNode({ color, isLast }: { color:string; isLast:boolean }) {
  return (
    <div className="pi-timeline-node">
      {/* Connecting line */}
      {!isLast && <div className="pi-timeline-line" style={{ background: `linear-gradient(180deg, ${color}44, transparent)` }}/>}
      {/* Node dot with ring */}
      <svg width="20" height="20" viewBox="0 0 40 40" style={{ flexShrink:0 }}>
        <circle cx="20" cy="20" r="16" fill="none" stroke={`${color}22`} strokeWidth="1" strokeDasharray="2 3"/>
        <circle cx="20" cy="20" r="8" fill={`${color}15`} stroke={color} strokeWidth="1.5"/>
        <circle cx="20" cy="20" r="3" fill={color}>
          <animate attributeName="r" values="3;4;3" dur="2s" repeatCount="indefinite"/>
        </circle>
      </svg>
    </div>
  );
}

/* ── STAT GLYPH: Unique decorative micro-shapes ── */
function StatGlyph({ variant, color }: { variant:number; color:string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 32 32" style={{ flexShrink:0, opacity:0.25 }}>
      {variant === 0 && (
        /* Spiral */
        <path d="M16 16 Q16 8 24 8 Q32 8 32 16 Q32 24 24 24 Q20 24 20 20 Q20 16 24 16" fill="none" stroke={color} strokeWidth="1.5"/>
      )}
      {variant === 1 && (
        /* Nested triangles */
        <>
          <path d="M16 4 L28 26 L4 26 Z" fill="none" stroke={color} strokeWidth="1"/>
          <path d="M16 10 L24 24 L8 24 Z" fill="none" stroke={color} strokeWidth="0.8"/>
        </>
      )}
      {variant === 2 && (
        /* Infinity loop */
        <path d="M8 16 C8 10 14 10 16 16 C18 22 24 22 24 16 C24 10 18 10 16 16 C14 22 8 22 8 16" fill="none" stroke={color} strokeWidth="1.5"/>
      )}
    </svg>
  );
}

/* ── DECORATIVE BLUEPRINT GRID ── */
function BlueprintGrid() {
  return (
    <div className="pi-blueprint">
      <svg width="100%" height="100%" viewBox="0 0 200 500" preserveAspectRatio="none">
        {/* Faint grid */}
        {Array.from({ length: 20 }, (_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 25} x2="200" y2={i * 25} stroke="rgba(255,255,255,0.015)" strokeWidth="0.5"/>
        ))}
        {Array.from({ length: 8 }, (_, i) => (
          <line key={`v${i}`} x1={i * 25} y1="0" x2={i * 25} y2="500" stroke="rgba(255,255,255,0.015)" strokeWidth="0.5"/>
        ))}
        {/* Accent diagonals */}
        <line x1="0" y1="0" x2="200" y2="200" stroke="rgba(52,211,153,0.02)" strokeWidth="0.5"/>
        <line x1="200" y1="100" x2="0" y2="300" stroke="rgba(245,158,11,0.02)" strokeWidth="0.5"/>
      </svg>
    </div>
  );
}

/* ═══ MAIN COMPONENT ═══ */
export default function PortfolioInsights() {
  const [animated, setAnimated] = useState(false);

  useEffect(() => { const t = setTimeout(() => setAnimated(true), 300); return () => clearTimeout(t); }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
    card.style.setProperty('--my', `${e.clientY - rect.top}px`);
  };

  return (
    <div className="pi-card">
      <BlueprintGrid />

      {/* ── EXCHANGE HUB ── */}
      <div className="pi-section">
        <div className="pi-section-head">
          <span className="pi-section-label">Exchange Hub</span>
          <div className="pi-section-line"/>
        </div>
        <div className="pi-exchanges">
          {EXCHANGES.map((ex, i) => (
            <div
              key={i}
              className={`pi-ex-row ${animated ? 'in' : ''}`}
              style={{ animationDelay: `${i * 0.12}s` }}
              onMouseMove={handleMouseMove}
            >
              <div className="pi-card-glow"/>
              <RadarSweep active={ex.status === 'connected'}/>
              <div className="pi-ex-info">
                <div className="pi-ex-name">{ex.name}</div>
                <div className="pi-ex-type">{ex.type}</div>
              </div>
              <div className="pi-ex-val-wrap">
                <span className="pi-ex-val">{ex.val}</span>
                {ex.status === 'connected' && <WaveformBar color="#34d399" height={14}/>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── QUICK STATS ── */}
      <div className="pi-section">
        <div className="pi-section-head">
          <span className="pi-section-label">Quick Stats</span>
          <div className="pi-section-line"/>
        </div>
        <div className="pi-stats-grid">
          {[
            { label:'Assets', val:'3', sub:'currencies', color:'#f59e0b' },
            { label:'Spot Value', val:'$64.32', sub:'available', color:'#34d399' },
            { label:'Top Asset', val:'USDT', sub:'100%', color:'#26a17b' },
          ].map((s, i) => (
            <div
              key={i}
              className={`pi-stat-tile ${animated ? 'in' : ''}`}
              style={{ animationDelay: `${0.4 + i * 0.1}s` }}
              onMouseMove={handleMouseMove}
            >
              <div className="pi-card-glow"/>
              <StatGlyph variant={i} color={s.color}/>
              <span className="pi-stat-label">{s.label}</span>
              <span className="pi-stat-val" style={{ color: s.color }}>{s.val}</span>
              <span className="pi-stat-sub">{s.sub}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── RECENT ACTIVITY — Vertical Timeline ── */}
      <div className="pi-section">
        <div className="pi-section-head">
          <span className="pi-section-label">Recent Activity</span>
          <div className="pi-section-line"/>
        </div>
        <div className="pi-timeline">
          {RECENT_ACTIVITY.map((a, i) => (
            <div
              key={i}
              className={`pi-timeline-row ${animated ? 'in' : ''}`}
              style={{ animationDelay: `${0.6 + i * 0.12}s` }}
              onMouseMove={handleMouseMove}
            >
              <TimelineNode color={a.color} isLast={i === RECENT_ACTIVITY.length - 1}/>
              <div className="pi-card-glow"/>
              <div className="pi-tl-content">
                <div className="pi-tl-top">
                  <span className="pi-tl-asset">{a.asset}</span>
                  <span className="pi-tl-type">{a.type}</span>
                </div>
                <div className="pi-tl-bottom">
                  <span className="pi-tl-amount" style={{ color: a.color }}>{a.amount}</span>
                  <span className="pi-tl-time">{a.time}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
