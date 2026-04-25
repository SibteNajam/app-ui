'use client';
import { useState, useEffect } from 'react';
import './Portfolio.css';

/* ══ DATA ══════════════════════════════════════ */
const PERIODS = ['1D','7D','1M','3M','1Y'];

// Asset allocation for the multi-arc donut (LeetCode-style)
const ALLOCATION = [
  { sym:'BTC', pct:46.8, color:'#f59e0b', val:'$5,350' },
  { sym:'ETH', pct:16.5, color:'#627eea', val:'$1,892' },
  { sym:'SOL', pct:17.6, color:'#9945ff', val:'$2,012' },
  { sym:'BNB', pct:16.6, color:'#f0b90b', val:'$1,900' },
  { sym:'ARB', pct:2.5,  color:'#28b9ef', val:'$280'   },
];

const HOLDINGS = [
  { sym:'BTC', name:'Bitcoin',   color:'#f59e0b', bg:'rgba(245,158,11,0.15)',   amt:'0.0938', val:'$5,349.81', change:'+3.42%', pos:true  },
  { sym:'ETH', name:'Ethereum',  color:'#627eea', bg:'rgba(98,126,234,0.15)',   amt:'0.5939', val:'$1,892.10', change:'-1.18%', pos:false },
  { sym:'SOL', name:'Solana',    color:'#9945ff', bg:'rgba(153,69,255,0.15)',   amt:'12.40',  val:'$2,012.40', change:'+5.67%', pos:true  },
  { sym:'BNB', name:'BNB',       color:'#f0b90b', bg:'rgba(240,185,11,0.15)',   amt:'3.20',   val:'$1,900.00', change:'+1.23%', pos:true  },
  { sym:'ARB', name:'Arbitrum',  color:'#28b9ef', bg:'rgba(40,185,239,0.15)',   amt:'250',    val:'$280.00',   change:'+7.34%', pos:true  },
];

const EXCHANGES = [
  { name:'Binance Spot',    type:'My Binance',  val:'$3.26', btc:'0.000041 BTC', active:true  },
  { name:'Binance Futures', type:'COIN-M',      val:'—',     btc:'Insufficient', active:false },
  { name:'Binance Futures', type:'USDT-M',      val:'—',     btc:'Insufficient', active:false },
];

/* ══ ICONS ══════════════════════════════════════ */
const ArrowUp   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/></svg>;
const ArrowDown = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>;
const Download  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;
const Eye       = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const Refresh   = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>;
const Search    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const Dots      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>;

/* ══ REALISTIC 3D BADGE ══════════════════════════════════════ */
function RealisticBadge({ type }: { type: 'emerald' | 'blue' | 'gold' | 'ruby' }) {
  let frameC1 = "#e2e8f0", frameC2 = "#64748b", frameC3 = "#0f172a";
  let shapeC1 = "#34d399", shapeC2 = "#059669";
  let isGold = false;
  let text = "VAL";

  if (type === 'gold') {
    frameC1 = "#fef08a"; frameC2 = "#ca8a04"; frameC3 = "#422006";
    shapeC1 = "#facc15"; shapeC2 = "#a16207";
    isGold = true;
    text = "WIN";
  } else if (type === 'blue') {
    frameC1 = "#bfdbfe"; frameC2 = "#3b82f6"; frameC3 = "#172554";
    shapeC1 = "#60a5fa"; shapeC2 = "#2563eb";
    text = "24H";
  } else if (type === 'ruby') {
    frameC1 = "#fecaca"; frameC2 = "#ef4444"; frameC3 = "#450a0a";
    shapeC1 = "#f87171"; shapeC2 = "#dc2626";
    text = "TOP";
  }

  const id = `badge-${type}`;

  return (
    <svg width="42" height="42" viewBox="0 0 100 100" className="pf-badge-svg" style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.4))', flexShrink: 0 }}>
      <defs>
        <linearGradient id={`${id}-frame`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={frameC1} />
          <stop offset="50%" stopColor={frameC2} />
          <stop offset="100%" stopColor={frameC3} />
        </linearGradient>
        <linearGradient id={`${id}-inner`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>
        <radialGradient id={`${id}-shape`} cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor={shapeC1} />
          <stop offset="100%" stopColor={shapeC2} />
        </radialGradient>
      </defs>
      
      {/* Outer Frame Shape */}
      {type === 'emerald' && (
        <>
          <path d="M50 2 L93 27 L93 73 L50 98 L7 73 L7 27 Z" fill={`url(#${id}-inner)`} stroke={`url(#${id}-frame)`} strokeWidth="4" strokeLinejoin="round"/>
          <path d="M50 8 L88 30 L88 70 L50 92 L12 70 L12 30 Z" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
        </>
      )}
      {type === 'blue' && (
        <>
          <path d="M30 5 L70 5 L95 30 L95 70 L70 95 L30 95 L5 70 L5 30 Z" fill={`url(#${id}-inner)`} stroke={`url(#${id}-frame)`} strokeWidth="4" strokeLinejoin="round"/>
          <path d="M33 11 L67 11 L89 33 L89 67 L67 89 L33 89 L11 67 L11 33 Z" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
        </>
      )}
      {type === 'gold' && (
        <>
          <circle cx="50" cy="50" r="46" fill={`url(#${id}-inner)`} stroke={`url(#${id}-frame)`} strokeWidth="4" />
          <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
        </>
      )}
      {type === 'ruby' && (
        <>
          <path d="M50 4 L96 50 L50 96 L4 50 Z" fill={`url(#${id}-inner)`} stroke={`url(#${id}-frame)`} strokeWidth="4" strokeLinejoin="round"/>
          <path d="M50 11 L89 50 L50 89 L11 50 Z" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
        </>
      )}
      
      {/* Background Text */}
      <text x="18" y="65" fill="rgba(255,255,255,0.15)" fontSize="26" fontWeight="900" fontFamily="Inter, sans-serif" letterSpacing="-1">{text}</text>
      
      {/* Dynamic Background Design Lines (Primary colored element) */}
      <g stroke={shapeC1} strokeWidth="4" fill="none" strokeLinecap="round" style={{ filter: `drop-shadow(0 0 8px ${shapeC1}aa)` }}>
        {/* Central Kite / Rotated Square Shape */}
        <path 
          d="M50 30 L70 50 L50 70 L30 50 Z" 
          fill={shapeC1} 
          fillOpacity="0.15" 
          stroke={shapeC1} 
          strokeWidth="4" 
          strokeLinejoin="round" 
        />

        {/* Lines "coming out" - radiating from corners */}
        <line x1="50" y1="30" x2="50" y2="10" strokeOpacity="0.8" />
        <line x1="70" y1="50" x2="90" y2="50" strokeOpacity="0.8" />
        <line x1="50" y1="70" x2="50" y2="90" strokeOpacity="0.8" />
        <line x1="30" y1="50" x2="10" y2="50" strokeOpacity="0.8" />

        {/* Subtle diagonal cross lines */}
        <line x1="38" y1="38" x2="25" y2="25" strokeOpacity="0.4" strokeWidth="2" />
        <line x1="62" y1="38" x2="75" y2="25" strokeOpacity="0.4" strokeWidth="2" />
        <line x1="62" y1="62" x2="75" y2="75" strokeOpacity="0.4" strokeWidth="2" />
        <line x1="38" y1="62" x2="25" y2="75" strokeOpacity="0.4" strokeWidth="2" />
      </g>
      <style jsx>{`
        .pf-badge-svg { 
          animation: pf-badge-pulse 4s infinite ease-in-out; 
          filter: drop-shadow(0 0 10px ${shapeC1}33);
        }
        @keyframes pf-badge-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </svg>
  );
}

/* ══ MICRO SPARKLINE ══════════════════════════════════════ */
function Sparkline({ color }: { color: string }) {
  return (
    <div className="pf-stat-sparkline">
      <svg width="100%" height="100%" viewBox="0 0 100 30" preserveAspectRatio="none">
        <path 
          d="M0 25 Q 10 5, 20 20 T 40 15 T 60 25 T 80 10 T 100 20" 
          fill="none" 
          stroke={color} 
          strokeWidth="2" 
          strokeLinecap="round"
          strokeOpacity="0.4"
        />
      </svg>
    </div>
  );
}

/* ══ WIN RATE PROGRESS RING ══════════════════════════════════════ */
function WinRateRing({ pct }: { pct: number }) {
  const [offset, setOffset] = useState(2 * Math.PI * 14);
  const R = 14;
  const CIRC = 2 * Math.PI * R;

  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(CIRC - (pct / 100) * CIRC);
    }, 300);
    return () => clearTimeout(timer);
  }, [pct, CIRC]);
  
  return (
    <div className="pf-winrate-ring">
      <svg width="32" height="32" viewBox="0 0 32 32">
        <circle cx="16" cy="16" r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
        <circle 
          cx="16" cy="16" r={R} fill="none" 
          stroke="#facc15" strokeWidth="3" 
          strokeDasharray={CIRC}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 16 16)"
          style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
      </svg>
    </div>
  );
}


/* ══ MULTI-ARC ALLOCATION DONUT (LeetCode-style) ══ */
function AllocDonut({ animated }: { animated: boolean }) {
  const SIZE = 160, SW = 14, GAP = 3;
  const R = (SIZE - SW) / 2;
  const CIRC = 2 * Math.PI * R;
  const total = ALLOCATION.reduce((s, a) => s + a.pct, 0);

  // Build arc segments
  let offset = 0;
  const arcs = ALLOCATION.map((a) => {
    const dash = (a.pct / total) * (CIRC - GAP * ALLOCATION.length);
    const seg = { ...a, dashLen: animated ? dash : 0, dashGap: CIRC - dash, offset };
    offset += dash + GAP;
    return seg;
  });

  return (
    <div className="pf-alloc-chart">
      <svg width="100%" height="100%" viewBox={`0 0 ${SIZE} ${SIZE}`} className="pf-alloc-svg">
        {/* track */}
        <circle cx={SIZE/2} cy={SIZE/2} r={R} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={SW}/>
        {arcs.map((a, i) => (
          <circle
            key={i}
            cx={SIZE/2} cy={SIZE/2} r={R}
            fill="none"
            stroke={a.color}
            strokeWidth={SW}
            strokeLinecap="round"
            strokeDasharray={`${a.dashLen} ${CIRC - a.dashLen}`}
            strokeDashoffset={-a.offset}
            style={{ transition: `stroke-dasharray 1.4s cubic-bezier(0.4,0,0.2,1) ${i * 0.12}s` }}
          />
        ))}
      </svg>
      <div className="pf-alloc-center">
        <span className="pf-alloc-pct">5</span>
        <span className="pf-alloc-sub">Assets</span>
      </div>
    </div>
  );
}

/* ══ DUAL LINE CHART (Smooth, No Fill) ══════════════════════════════════ */
function DualLineChart() {
  // Smooth Bezier path for USD (Green)
  const usdPath = "M 0 100 C 30 100, 50 60, 90 60 S 140 110, 180 110 S 230 40, 270 40 S 320 80, 360 80 S 410 20, 450 20 S 480 30, 500 30";
  // Smooth Bezier path for BTC (Orange)
  const btcPath = "M 0 60 C 40 60, 60 90, 100 90 S 150 40, 190 40 S 240 70, 280 70 S 330 30, 370 30 S 420 50, 460 50 S 480 40, 500 40";

  return (
    <div className="pf-chart-svg-wrap">
      <svg width="100%" height="100%" viewBox="0 0 500 140" preserveAspectRatio="none">
        {/* Faint horizontal grid lines */}
        {[0,1,2,3].map(i => <line key={i} x1="0" y1={i*35 + 10} x2="500" y2={i*35 + 10} stroke="rgba(255,255,255,0.03)" strokeWidth="1"/>)}
        
        {/* Smooth paths */}
        <path fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" d={usdPath} className="pf-line-draw"/>
        <path fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" d={btcPath} className="pf-line-draw" opacity="0.8"/>
        
        {/* Ending dots */}
        <circle cx="500" cy="30" r="4" fill="#34d399" />
        <circle cx="500" cy="40" r="3" fill="#f59e0b" />
      </svg>
      {/* X-axis labels */}
      <div className="pf-chart-xaxis">
        {['17 Apr','18 Apr','19 Apr','20 Apr','21 Apr','22 Apr','23 Apr'].map(d=><span key={d}>{d}</span>)}
      </div>
    </div>
  );
}

/* ══ MAIN PAGE ══════════════════════════════════ */
export default function PortfolioPage() {
  const [period, setPeriod] = useState('7D');
  const [activeFilter, setActiveFilter] = useState('All');
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 200);
    return () => clearTimeout(t);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--x', `${e.clientX - rect.left}px`);
    card.style.setProperty('--y', `${e.clientY - rect.top}px`);
  };

  return (
    <div className="pf-root">

      {/* PAGE TITLE */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'12px' }}>
        <div>
          <h1 style={{ fontSize:'26px', fontWeight:800, color:'#fff', letterSpacing:'-0.5px', margin:0 }}>Portfolio</h1>
          <p style={{ fontSize:'13px', color:'#4a5568', margin:'4px 0 0', fontWeight:500 }}>Track your crypto assets in real-time</p>
        </div>
        <div style={{ display:'flex', gap:'8px' }}>
          <button className="pf-pill-btn icon-only"><Eye /></button>
          <button className="pf-pill-btn icon-only"><Refresh /></button>
        </div>
      </div>

      {/* ══ HERO CARD — 3 columns ══ */}
      <div className="pf-hero">

        {/* LEFT — balance + actions + stat badges */}
        <div className="pf-hero-panel pf-hero-left">
          <div className="pf-hero-balance-section">
            <div className="pf-hero-label">
              <span className="pf-hero-label-dot"/>
              Total Portfolio Value
            </div>
            <div className="pf-hero-value">
              $11,434<span className="pf-hero-cents">.31</span>
            </div>
            <div className="pf-hero-meta">
              <span className="pf-hero-change pos">↑ +4.30%</span>
              <span className="pf-hero-btc">≈ 0.1741 BTC</span>
            </div>
            <div className="pf-pill-bar">
              <button className="pf-pill-btn transfer"><ArrowUp /> Transfer</button>
              <button className="pf-pill-btn receive"><ArrowDown /> Receive</button>
              <button className="pf-pill-btn icon-only"><Download /></button>
            </div>
          </div>
          
          <div className="pf-hero-stats-grid">
            {[
              { type:'emerald', label:'Total Value',    val:'$11,434', sub:'Across 3 exchanges', color: '#34d399' },
              { type:'blue',    label:'24H Gain',        val:'+$472.80', sub:'↑ 4.30% today',      color: '#60a5fa' },
              { type:'gold',    label:'Win Rate',         val:'81%',      sub:'Last 30 trades',     color: '#facc15', ring: 81 },
              { type:'ruby',    label:'Best Performer',   val:'ARB',      sub:'+7.34% today',       color: '#f87171' },
            ].map((s,i) => (
              <div className="pf-stat-row" key={i} onMouseMove={handleMouseMove}>
                <div className="pf-stat-left">
                  {s.ring ? (
                    <div style={{ position: 'relative', width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <WinRateRing pct={s.ring} />
                      <span style={{ fontSize: 10, fontWeight: 800, color: '#facc15', position: 'absolute' }}>{s.ring}%</span>
                    </div>
                  ) : (
                    <RealisticBadge type={s.type as any} />
                  )}
                  <div className="pf-stat-content">
                    <div className="pf-stat-name">{s.label}</div>
                    <div className="pf-stat-val" style={{ color: (s.type==='blue' || s.type==='emerald') ? '#34d399' : '' }}>{s.val}</div>
                    <div className="pf-stat-sub">{s.sub}</div>
                  </div>
                </div>
                <Sparkline color={s.color} />
              </div>
            ))}
          </div>
        </div>

        {/* CENTER — Area Chart */}
        <div className="pf-hero-panel pf-hero-center-chart">
          <div className="pf-chart-top-mini">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span className="pf-chart-title-mini">Performance</span>
              <div className="pf-chart-legend">
                <span><span className="pf-legend-dot" style={{ background: '#34d399' }}/> USD</span>
                <span><span className="pf-legend-dot" style={{ background: '#f59e0b' }}/> BTC</span>
              </div>
            </div>
            <div className="pf-period-tabs">
              {PERIODS.map(p => (
                <button key={p} className={`pf-period-tab${period===p?' active':''}`} onClick={()=>setPeriod(p)}>{p}</button>
              ))}
            </div>
          </div>
          <DualLineChart />
        </div>

        {/* RIGHT — multi-arc allocation donut (LeetCode-style) */}
        <div className="pf-hero-panel pf-hero-right-donut">
          <AllocDonut animated={animated} />
          {/* breakdown rows — like LeetCode Easy/Med/Hard */}
          <div className="pf-alloc-rows">
            {ALLOCATION.map(a => (
              <div className="pf-alloc-row" key={a.sym}>
                <span className="pf-alloc-dot" style={{ background: a.color, boxShadow:`0 0 6px ${a.color}66` }}/>
                <span className="pf-alloc-sym" style={{ color: a.color }}>{a.sym}</span>
                <div className="pf-alloc-bar-track">
                  <div
                    className="pf-alloc-bar-fill"
                    style={{ width: animated ? `${a.pct}%` : '0%', background: a.color }}
                  />
                </div>
                <span className="pf-alloc-pct-label" style={{ color: a.color }}>{a.pct}%</span>
              </div>
            ))}
          </div>
        </div>

      </div>


      {/* ── FILTER BAR ── */}
      <div className="pf-filter-bar">
        <div className="pf-search"><Search /><span>Search assets…</span></div>
        <div className="pf-filter-pills">
          {['All','Spot','Futures','Margin'].map(f=>(
            <button key={f} className={`pf-fpill${activeFilter===f?' active':''}`} onClick={()=>setActiveFilter(f)}>{f}</button>
          ))}
        </div>
      </div>

      {/* ── LOWER: HOLDINGS + ACTIVITY ── */}
      <div className="pf-lower">

        {/* Holdings */}
        <div className="pf-holdings">
          <div className="pf-sec-head">
            <span className="pf-sec-head-label">Portfolio Balance</span>
            <div className="pf-sec-head-line"/>
          </div>
          {HOLDINGS.map(h=>(
            <div className="pf-holding-row" key={h.sym} onMouseMove={handleMouseMove}>
              <div className="pf-coin-icon" style={{ background:h.bg, color:h.color }}>{h.sym[0]}</div>
              <div>
                <div className="pf-coin-name">{h.sym}</div>
                <div className="pf-coin-sub">{h.name}</div>
              </div>
              <div style={{ marginLeft:'auto', textAlign:'right' }}>
                <div className="pf-coin-val">{h.val}</div>
                <div className={`pf-coin-change ${h.pos?'pf-pos':'pf-neg'}`}>{h.amt} · {h.change}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Exchange Activity */}
        <div className="pf-activity">
          <div className="pf-sec-head">
            <span className="pf-sec-head-label">Exchanges</span>
            <div className="pf-sec-head-line"/>
          </div>

          {EXCHANGES.map((ex,i)=>(
            <div className="pf-ex-tile" key={i} onMouseMove={handleMouseMove}>
              <div className="pf-ex-tile-top">
                <div className="pf-ex-tile-name">
                  {/* Binance diamond */}
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L7.5 6.5L9.26 8.26L12 5.52L14.74 8.26L16.5 6.5L12 2Z" fill="#F0B90B"/>
                    <path d="M12 10L9.26 12.74L12 15.48L14.74 12.74L12 10Z" fill="#F0B90B"/>
                    <path d="M4.5 10L6.26 11.76L4.5 13.52L2.74 11.76L4.5 10Z" fill="#F0B90B"/>
                    <path d="M19.5 10L21.26 11.76L19.5 13.52L17.74 11.76L19.5 10Z" fill="#F0B90B"/>
                    <path d="M7.5 17L9.26 18.76L12 16.02L14.74 18.76L16.5 17L12 12.5L7.5 17Z" fill="#F0B90B"/>
                  </svg>
                  {ex.name}
                </div>
                {ex.active && <span className="pf-ex-tile-badge">ACTIVE</span>}
              </div>
              <div className="pf-ex-tile-sub">{ex.type}</div>
              <div className="pf-ex-tile-btm">
                <div>
                  <div className="pf-ex-val">{ex.val}</div>
                  <div style={{ fontSize:'11px', color:'#4a5568', fontFamily: 'JetBrains Mono, monospace' }}>{ex.btc}</div>
                </div>
                <div className="pf-ex-actions">
                  <button className="pf-ex-action-btn dep">Deposit</button>
                  <button className="pf-ex-action-btn tfr">Transfer</button>
                  <button className="pf-pill-btn download" style={{ width:28,height:28,fontSize:'12px',color:'#4a5568' }}><Dots /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
