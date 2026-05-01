'use client';

import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

/* ── Radial Sunburst Helpers (for HyperCard1) ── */
function getColorGradient(progress: number, stops: { p: number; c: number[] }[]) {
  let s1 = stops[0], s2 = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (progress >= stops[i].p && progress <= stops[i + 1].p) {
      s1 = stops[i];
      s2 = stops[i + 1];
      break;
    }
  }
  const t = s2.p === s1.p ? 0 : (progress - s1.p) / (s2.p - s1.p);
  const r = Math.round(s1.c[0] + (s2.c[0] - s1.c[0]) * t);
  const g = Math.round(s1.c[1] + (s2.c[1] - s1.c[1]) * t);
  const b = Math.round(s1.c[2] + (s2.c[2] - s1.c[2]) * t);
  return `rgb(${r},${g},${b})`;
}

const PALETTES = {
  default: [
    { p: 0.0, c: [16, 185, 129] }, // Emerald
    { p: 0.2, c: [6, 182, 212] },  // Cyan
    { p: 0.4, c: [59, 130, 246] }, // Blue
    { p: 0.6, c: [168, 85, 247] }, // Purple
    { p: 0.8, c: [244, 63, 94] },  // Rose
    { p: 1.0, c: [249, 115, 22] }, // Orange
  ]
};

function RadialSunburst({ value, iconMode, palette = PALETTES.default, maxActive = 30 }: any) {
  const { theme } = useTheme();
  const dk = theme === 'dark';
  const S = 180, cx = S / 2, cy = S / 2, innerR = 25, baseR = 55, total = 36;

  return (
    <div className="hc-chart-center" style={{ position: 'relative', height: S, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
      <div style={{ position: 'absolute', width: 90, height: 90, background: `rgba(${palette[1].c.join(',')}, 0.15)`, filter: 'blur(35px)', borderRadius: '50%', transform: 'translate(15px, 15px)' }} />
      <div style={{ position: 'absolute', width: 90, height: 90, background: `rgba(${palette[palette.length - 2].c.join(',')}, 0.15)`, filter: 'blur(35px)', borderRadius: '50%', transform: 'translate(-15px, -15px)' }} />

      <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`} style={{ position: 'relative', zIndex: 1 }}>
        <circle cx={cx} cy={cy - 12} r={10} fill="rgba(255,255,255,0.06)" />
        <g transform={`translate(${cx}, ${cy - 12})`}>
          {iconMode === 'crosshair' ? (
            <>
              <circle cx={0} cy={0} r={4} fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth={1} />
              <path d="M-2,0 L2,0 M0,-2 L0,2" stroke="rgba(255,255,255,0.6)" strokeWidth={1} />
            </>
          ) : iconMode === 'bolt' ? (
            <path d="M-1,-4 L3,-4 L0,0 L4,0 L-2,5 L-1,1 L-4,1 Z" fill="rgba(255,255,255,0.7)" />
          ) : (
            <circle cx={0} cy={0} r={3} fill="rgba(255,255,255,0.7)" />
          )}
        </g>
        <text x={cx} y={cy + 10} textAnchor="middle" fill={dk ? '#fff' : '#000'} fontSize="16" fontWeight="700" fontFamily="'Space Grotesk'">
          {value}
        </text>

        {Array.from({ length: total }).map((_, i) => {
          const angle = (Math.PI * 2 * i) / total - Math.PI / 2;
          let isActive = false;
          let progress = 0;

          const startIndex = total - maxActive;
          if (i === 0) {
            isActive = true;
            progress = 1;
          } else if (i >= startIndex) {
            isActive = true;
            progress = (i - startIndex) / (total - startIndex);
          }

          const minOuterR = 35;
          const maxOuterR = 75;
          const r1 = innerR;
          let r2 = baseR;
          let color = dk ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
          let strokeW = 1.5;

          if (isActive) {
            r2 = minOuterR + (maxOuterR - minOuterR) * progress;
            strokeW = 3;
            color = getColorGradient(progress, palette);
          }

          const x1 = cx + r1 * Math.cos(angle);
          const y1 = cy + r1 * Math.sin(angle);
          const x2 = cx + r2 * Math.cos(angle);
          const y2 = cy + r2 * Math.sin(angle);

          return (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={strokeW} strokeLinecap="round" opacity={isActive ? 1 : 0.4} />
          );
        })}
      </svg>
    </div>
  );
}

/* ── Blob Helpers (for HyperCard2, 3) ── */
function blobPath(data: number[], cx: number, cy: number, maxR: number, t = 0.35) {
  const n = data.length;
  const pts = data.map((v, i) => {
    const a = (Math.PI * 2 / n) * i - Math.PI / 2;
    const r = maxR * (v / 100);
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  });
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    d += ` C ${(p1.x + (p2.x - p0.x) * t).toFixed(1)} ${(p1.y + (p2.y - p0.y) * t).toFixed(1)},`
      + ` ${(p2.x - (p3.x - p1.x) * t).toFixed(1)} ${(p2.y - (p3.y - p1.y) * t).toFixed(1)},`
      + ` ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d + ' Z';
}

function GlowDef({ id, color }: { id: string; color: string }) {
  return (
    <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
      <feFlood floodColor={color} floodOpacity="0.5" result="c" />
      <feComposite in="c" in2="blur" operator="in" result="glow" />
      <feMerge><feMergeNode in="glow" /><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
    </filter>
  );
}

function Grid({ cx, cy, maxR, spokes = 8, dk }: { cx: number; cy: number; maxR: number; spokes?: number; dk: boolean }) {
  const c = dk ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  return (<g>
    {[.25, .5, .75, 1].map((f, i) => <circle key={i} cx={cx} cy={cy} r={maxR * f} fill="none" stroke={c} strokeWidth={.5} />)}
    {Array.from({ length: spokes }, (_, i) => {
      const a = (Math.PI * 2 / spokes) * i;
      return <line key={i} x1={cx} y1={cy} x2={cx + maxR * Math.cos(a)} y2={cy + maxR * Math.sin(a)} stroke={c} strokeWidth={.3} />;
    })}
  </g>);
}

const fadeUp: any = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [.4, 0, .2, 1] } } };

/* ── Exported Cards ── */
export function HyperCard1() {
  const { theme } = useTheme();
  const dk = theme === 'dark';

  return (
    <motion.div className="hyper-card" variants={fadeUp} whileHover={{ y: -4 }} style={{ padding: '24px 20px' }}>
      <div style={{ fontSize: 16, fontWeight: 700, color: dk ? '#fff' : '#000', marginBottom: 12 }}>Execution Volume</div>
      <RadialSunburst value="4,120" iconMode="crosshair" palette={PALETTES.default} maxActive={32} />

      <div className="hc-periods" style={{ borderTop: 'none', paddingTop: 0, marginBottom: 16, gap: 16 }}>
        <div className="hc-period">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: dk ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>
            <span style={{ color: '#34d399', fontSize: 14 }}>✦</span> Monthly
          </div>
          <div className="hc-pval" style={{ fontSize: 22 }}>$4.82M</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <span className="hc-ptrend up" style={{ fontSize: 10 }}>↑12.4%</span>
            <span style={{ fontSize: 10, color: dk ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.4)' }}>Volume</span>
          </div>
        </div>
        <div className="hc-period">
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: dk ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>
            <span style={{ color: '#fbbf24', fontSize: 14 }}>✦</span> Yearly
          </div>
          <div className="hc-pval" style={{ fontSize: 22 }}>$52.41M</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <span className="hc-ptrend up" style={{ fontSize: 10 }}>↑8.2%</span>
            <span style={{ fontSize: 10, color: dk ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.4)' }}>Volume</span>
          </div>
        </div>
      </div>

      <div className="hc-rows" style={{ borderTop: 'none', display: 'flex', flexDirection: 'column', gap: 0, paddingTop: 0 }}>
        {[
          { k: 'BTC/USDT', v: '24,512' },
          { k: 'ETH/USDT', v: '18,294' },
          { k: 'SOL/USDT', v: '12,105' },
        ].map(({ k, v }, i) => (
          <div className="hc-row" key={k} style={{ padding: '10px 0', borderBottom: i < 2 ? `1px solid ${dk ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` : 'none' }}>
            <span style={{ color: dk ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)', fontSize: 12, fontWeight: 500 }}>{k}</span>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 13, fontWeight: 600, color: dk ? '#fff' : '#000' }}>{v}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function RadarGrid({ cx, cy, R, dk }: { cx: number, cy: number, R: number, dk: boolean }) {
  const c = dk ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
  const labels = [0, 10, 15, 20, 25, 30, 35, 40];
  const spokes = 8;
  return (
    <g>
      {/* Outer circle */}
      <circle cx={cx} cy={cy} r={R} fill="none" stroke={c} strokeWidth={1} />
      {/* Inner circle */}
      <circle cx={cx} cy={cy} r={R * 0.25} fill="none" stroke={c} strokeWidth={1} />
      {/* Spokes and Labels */}
      {labels.map((label, i) => {
        const a = (Math.PI * 2 / spokes) * i - Math.PI / 2;
        const x1 = cx + R * 0.25 * Math.cos(a);
        const y1 = cy + R * 0.25 * Math.sin(a);
        const x2 = cx + R * Math.cos(a);
        const y2 = cy + R * Math.sin(a);
        
        const lx = cx + (R + 12) * Math.cos(a);
        const ly = cy + (R + 12) * Math.sin(a);
        
        return (
          <g key={i}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={c} strokeWidth={1} />
            <text x={lx} y={ly} textAnchor="middle" dominantBaseline="central" fill={dk ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'} fontSize={9} fontWeight={600} fontFamily="'Space Grotesk', sans-serif">{label}</text>
          </g>
        );
      })}
    </g>
  );
}

function RadarLineChart({ data, dk }: { data: number[], dk: boolean }) {
  const S = 180, cx = S / 2, cy = S / 2, R = 60;
  
  return (
    <div className="hc-chart-center" style={{ position: 'relative', height: S, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
      {/* Background glow */}
      <div style={{ position: 'absolute', width: 100, height: 100, background: 'rgba(52, 211, 153, 0.12)', filter: 'blur(35px)', borderRadius: '50%' }} />

      <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`} style={{ position: 'relative', zIndex: 1 }}>
        <defs>
          <GlowDef id="neonGlow2" color="#34d399" />
        </defs>
        <RadarGrid cx={cx} cy={cy} R={R} dk={dk} />
        
        <path d={blobPath(data, cx, cy, R, 0.25)} fill="rgba(52, 211, 153, 0.05)" stroke="#34d399" strokeWidth={2.5} filter="url(#neonGlow2)" />
        <path d={blobPath(data, cx, cy, R, 0.25)} fill="none" stroke="#34d399" strokeWidth={2} />
        
        <circle cx={cx} cy={cy} r={12} fill="rgba(255,255,255,0.03)" stroke={dk ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} strokeWidth={1} />
        <g transform={`translate(${cx}, ${cy}) scale(0.6)`} stroke="#34d399" strokeWidth={1.5} fill="none">
          <path d="M0,-10 L8,-5 L8,5 L0,10 L-8,5 L-8,-5 Z" />
          <path d="M-8,-5 L0,0 L8,-5" />
          <path d="M0,0 L0,10" />
        </g>
      </svg>
    </div>
  );
}

export function DynamicRingChart({ dk }: { dk: boolean }) {
  const S = 220, cx = S / 2, cy = S / 2;
  const faintColor = dk ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const numTicks = 120;
  const tickR1 = 58;
  const tickR2 = 66;
  const ringR = 51;
  const C = 2 * Math.PI * ringR;

  const cyanLen = C * 0.45;
  const orangeLen = C * 0.15;
  const purpleLen = C * 0.25;
  const gap1 = C * 0.02;
  const gap2 = C * 0.03;

  return (
    <div className="dynamic-ring-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 340 }}>
      <div className="hc-chart-center" style={{ position: 'relative', height: S, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
        <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`} style={{ position: 'relative', zIndex: 1, overflow: 'visible' }}>
          <defs>
            <GlowDef id="glowOrange2" color="#f97316" />
            <GlowDef id="glowPurple2" color="#a855f7" />
          </defs>

          <circle cx={cx} cy={cy} r={80} fill="none" stroke={faintColor} strokeWidth={1} />
          <circle cx={cx} cy={cy} r={100} fill="none" stroke={faintColor} strokeWidth={1} strokeDasharray="2 4" />

          {Array.from({ length: numTicks }).map((_, i) => {
            const angle = (Math.PI * 2 / numTicks) * i - Math.PI;
            const x1 = cx + tickR1 * Math.cos(angle);
            const y1 = cy + tickR1 * Math.sin(angle);
            const x2 = cx + tickR2 * Math.cos(angle);
            const y2 = cy + tickR2 * Math.sin(angle);
            
            let color = dk ? 'rgba(79, 142, 247, 0.15)' : 'rgba(79, 142, 247, 0.2)';
            if (angle > -Math.PI && angle < -0.2) {
              color = '#06b6d4';
            }
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={1.5} strokeLinecap="round" />;
          })}

          <g transform={`rotate(-160 ${cx} ${cy})`}>
            <circle cx={cx} cy={cy} r={ringR} fill="none" stroke="#06b6d4" strokeWidth={3} strokeDasharray={`${cyanLen} ${C}`} strokeDashoffset={0} strokeLinecap="round" />
            <circle cx={cx} cy={cy} r={ringR} fill="none" stroke="#f97316" strokeWidth={3} strokeDasharray={`${orangeLen} ${C}`} strokeDashoffset={-(cyanLen + gap1)} strokeLinecap="round" />
            <circle cx={cx} cy={cy} r={ringR} fill="none" stroke="#a855f7" strokeWidth={3} strokeDasharray={`${purpleLen} ${C}`} strokeDashoffset={-(cyanLen + gap1 + orangeLen + gap2)} strokeLinecap="round" />
          </g>

          <circle cx={cx} cy={cy} r={44} fill={dk ? 'rgba(8, 12, 22, 0.9)' : '#f8fafc'} stroke={faintColor} strokeWidth={1.5} />
          
          <g transform={`translate(${cx}, ${cy - 16})`}>
            <rect x="-5" y="-1" width="2" height="7" rx="1" fill={dk ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"} />
            <rect x="-1" y="-5" width="2" height="11" rx="1" fill={dk ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.7)"} />
            <rect x="3" y="1" width="2" height="5" rx="1" fill={dk ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"} />
          </g>
          <text x={cx} y={cy + 2} textAnchor="middle" fill={dk ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"} fontSize={6.5} fontWeight={600} letterSpacing={0.5} fontFamily="'Space Grotesk', sans-serif">STORE DYNAMICS</text>
          <text x={cx - 4} y={cy + 22} textAnchor="middle" fill={dk ? "#fff" : "#000"} fontSize={26} fontWeight={700} fontFamily="'Space Grotesk', sans-serif">87</text>
          <text x={cx + 14} y={cy + 14} textAnchor="start" fill={dk ? "#fff" : "#000"} fontSize={11} fontWeight={700} fontFamily="'Space Grotesk', sans-serif">%</text>

          <g transform={`translate(${cx + 80 * Math.cos(-Math.PI * 0.15)}, ${cy + 80 * Math.sin(-Math.PI * 0.15)})`}>
            <circle cx={0} cy={0} r={16} fill={dk ? '#0a0e1a' : '#fff'} stroke="#f97316" strokeWidth={1.5} filter="url(#glowOrange2)" />
            <text x={0} y={-4} textAnchor="middle" fill="#f97316" fontSize={6} fontWeight={700} fontFamily="'Space Grotesk', sans-serif">PLAN</text>
            <text x={0} y={6} textAnchor="middle" fill={dk ? "#fff" : "#000"} fontSize={11} fontWeight={700} fontFamily="'Space Grotesk', sans-serif">67<tspan fontSize={7}>%</tspan></text>
          </g>

          <g transform={`translate(${cx + 80 * Math.cos(Math.PI * 0.12)}, ${cy + 80 * Math.sin(Math.PI * 0.12)})`}>
            <circle cx={0} cy={0} r={14} fill={dk ? '#0a0e1a' : '#fff'} stroke="#a855f7" strokeWidth={1.5} filter="url(#glowPurple2)" />
            <text x={0} y={-3} textAnchor="middle" fill="#a855f7" fontSize={5} fontWeight={700} fontFamily="'Space Grotesk', sans-serif">MONTH</text>
            <text x={0} y={6} textAnchor="middle" fill={dk ? "#fff" : "#000"} fontSize={10} fontWeight={700} fontFamily="'Space Grotesk', sans-serif">54<tspan fontSize={6}>%</tspan></text>
          </g>

          <g transform={`translate(${cx + 100 * Math.cos(-Math.PI * 0.03)}, ${cy + 100 * Math.sin(-Math.PI * 0.03)})`}>
            <circle cx={0} cy={0} r={10} fill="none" stroke={faintColor} strokeWidth={1.5} />
            <circle cx={0} cy={0} r={3} fill={faintColor} />
            <circle cx={0} cy={0} r={6} fill="none" stroke={faintColor} strokeWidth={0.5} />
          </g>

          <g transform={`translate(${cx - 90}, ${cy - 20})`}>
            <circle cx={0} cy={0} r={8} fill="none" stroke={faintColor} strokeWidth={1} />
            <circle cx={0} cy={0} r={3} fill="none" stroke={faintColor} strokeWidth={1} />
            <text x={0} y={15} textAnchor="middle" fill={dk ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"} fontSize={6.5}>Views</text>
            <text x={0} y={24} textAnchor="middle" fill={dk ? "#fff" : "#000"} fontSize={9} fontWeight={700} fontFamily="'Space Grotesk', sans-serif">41,978</text>
          </g>

          <g transform={`translate(${cx + 80}, ${cy + 60})`}>
            <circle cx={0} cy={0} r={8} fill="none" stroke={faintColor} strokeWidth={1} />
            <rect x="-3" y="-3" width="6" height="5" fill="none" stroke={faintColor} strokeWidth={1} />
            <text x={0} y={15} textAnchor="middle" fill={dk ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"} fontSize={6.5}>Sales</text>
            <text x={0} y={24} textAnchor="middle" fill={dk ? "#fff" : "#000"} fontSize={9} fontWeight={700} fontFamily="'Space Grotesk', sans-serif">32,123</text>
          </g>
        </svg>
      </div>

      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16, marginTop: 4 }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: dk ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)', padding: '6px 14px', borderRadius: 20, border: `1px solid ${dk ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}` }}>
             <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
             <span style={{ fontSize: 10, color: dk ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', fontWeight: 500 }}>Profitability</span>
             <span style={{ fontSize: 11, color: dk ? '#fff' : '#000', fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>86%</span>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 20, padding: '0 8px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 18, paddingBottom: 1 }}>
            {[4, 8, 14, 18, 10, 6, 12, 16].map((h, i) => (
              <div key={i} style={{ width: 3, height: h, background: '#06b6d4', borderRadius: 1.5 }} />
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: dk ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <svg width="9" height="9" viewBox="0 0 24 24" fill="#a855f7" stroke="#a855f7" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <span style={{ fontSize: 8, color: dk ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Active Users</span>
                <span style={{ fontSize: 14, color: dk ? '#fff' : '#000', fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1 }}>546</span>
              </div>
            </div>
            <div style={{ display: 'flex', width: '100%', height: 2, borderRadius: 1, background: dk ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              <div style={{ width: '60%', background: '#a855f7' }} />
              <div style={{ width: '20%', background: '#06b6d4' }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: dk ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <svg width="9" height="9" viewBox="0 0 24 24" fill="#5b21b6" stroke="#a855f7" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect><rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect><line x1="6" y1="6" x2="6.01" y2="6"></line><line x1="6" y1="18" x2="6.01" y2="18"></line></svg>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <span style={{ fontSize: 8, color: dk ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>Server</span>
                <span style={{ fontSize: 14, color: dk ? '#fff' : '#000', fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1 }}>546</span>
              </div>
            </div>
            <div style={{ display: 'flex', width: '100%', gap: 2 }}>
              <div style={{ flex: 1, height: 2, background: '#f97316', borderRadius: 1 }} />
              <div style={{ flex: 1, height: 2, background: '#f97316', borderRadius: 1 }} />
              <div style={{ flex: 1, height: 2, background: '#f97316', borderRadius: 1 }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HyperCard2() {
  const { theme } = useTheme();
  const dk = theme === 'dark';
  const S = 150, cx = S / 2, cy = S / 2, R = S * 0.38;
  return (
    <motion.div className="hyper-card" variants={fadeUp} whileHover={{ y: -4 }}>
      <span className="hc-label">Win Analysis</span>
      <div className="hc-hero-val" style={{ color: '#fbbf24' }}>47.3%</div>
      <span className="hc-trend down">-0.8%</span>
      <div className="hc-chart-center">
        <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`}>
          <defs><GlowDef id="gl2a" color="#a78bfa" /><GlowDef id="gl2b" color="#fb923c" /><linearGradient id="lg2a" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#a78bfa" /><stop offset="100%" stopColor="#818cf8" /></linearGradient><linearGradient id="lg2b" x1="100%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stopColor="#fb923c" /><stop offset="100%" stopColor="#f59e0b" /></linearGradient></defs>
          <Grid cx={cx} cy={cy} maxR={R} spokes={6} dk={dk} />
          <path d={blobPath([47, 62, 71, 85, 78, 38], cx, cy, R)} fill="url(#lg2a)" fillOpacity={.06} stroke="url(#lg2a)" strokeWidth={2.5} filter="url(#gl2a)" />
          <path d={blobPath([60, 45, 55, 70, 50, 65], cx, cy, R * .55)} fill="url(#lg2b)" fillOpacity={.04} stroke="url(#lg2b)" strokeWidth={1.8} filter="url(#gl2b)" />
          {[47, 62, 71, 85, 78, 38].map((v, i) => {
            const a = (Math.PI * 2 / 6) * i - Math.PI / 2, r = R * (v / 100);
            return <circle key={i} cx={cx + r * Math.cos(a)} cy={cy + r * Math.sin(a)} r={2.5} fill="#a78bfa" filter="url(#gl2a)"><animate attributeName="r" values="2;3.5;2" dur={`${2.5 + i * .4}s`} repeatCount="indefinite" /></circle>;
          })}
          <circle cx={cx} cy={cy} r={2} fill="#a78bfa" />
        </svg>
      </div>
      <div className="hc-periods">
        <div className="hc-period"><span className="hc-pdot" style={{ background: '#34d399' }} /> Best Streak<span className="hc-pval">7 wins</span><span className="hc-ptrend up">streak</span></div>
        <div className="hc-period"><span className="hc-pdot" style={{ background: '#f87171' }} /> Worst<span className="hc-pval">9 losses</span><span className="hc-ptrend down">streak</span></div>
      </div>
      <div className="hc-rows">
        {[['Profit Factor', '0.82'], ['Sharpe', '-0.34'], ['Max DD', '12.6%']].map(([k, v]) => (
          <div className="hc-row" key={k}><span>{k}</span><span>{v}</span></div>
        ))}
      </div>
    </motion.div>
  );
}

export function HyperCard3() {
  const { theme } = useTheme();
  const dk = theme === 'dark';
  const S = 150, cx = S / 2, cy = S / 2, R = S * 0.38;
  return (
    <motion.div className="hyper-card" variants={fadeUp} whileHover={{ y: -4 }}>
      <span className="hc-label">Realized P&L</span>
      <div className="hc-hero-val" style={{ color: '#22d3ee' }}>-$737.96</div>
      <span className="hc-trend down">-4.2%</span>
      <div className="hc-chart-center">
        <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`}>
          <defs><GlowDef id="gl3" color="#22d3ee" /><linearGradient id="lg3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#22d3ee" /><stop offset="100%" stopColor="#34d399" /></linearGradient></defs>
          <Grid cx={cx} cy={cy} maxR={R} spokes={7} dk={dk} />
          <path d={blobPath([65, 80, 35, 90, 50, 72, 45], cx, cy, R)} fill="url(#lg3)" fillOpacity={.06} stroke="url(#lg3)" strokeWidth={2.5} filter="url(#gl3)" />
          {[65, 80, 35, 90, 50, 72, 45].map((v, i) => {
            const a = (Math.PI * 2 / 7) * i - Math.PI / 2, r = R * (v / 100);
            return <circle key={i} cx={cx + r * Math.cos(a)} cy={cy + r * Math.sin(a)} r={2.5} fill="#22d3ee" filter="url(#gl3)"><animate attributeName="r" values="2;3.5;2" dur={`${2.5 + i * .3}s`} repeatCount="indefinite" /></circle>;
          })}
          <circle cx={cx} cy={cy} r={2} fill="#22d3ee" />
        </svg>
      </div>
      <div className="hc-periods">
        <div className="hc-period"><span className="hc-pdot" style={{ background: '#a78bfa' }} /> This Week<span className="hc-pval">-$42.30</span><span className="hc-ptrend down">-2.1%</span></div>
        <div className="hc-period"><span className="hc-pdot" style={{ background: '#fb923c' }} /> Month<span className="hc-pval">-$186.50</span><span className="hc-ptrend down">-5.8%</span></div>
      </div>
      <div className="hc-rows">
        {[['APE/USDT', '-82.40'], ['LUNA/USDT', '-45.12'], ['ETH/USDT', '+22.80']].map(([k, v]) => (
          <div className="hc-row" key={k}><span>{k}</span><span style={{ color: v.startsWith('+') ? '#34d399' : '#f87171' }}>{v}</span></div>
        ))}
      </div>
    </motion.div>
  );
}

export function CentralActivityCore({ dk }: { dk: boolean }) {
  const S = 480, cx = S / 2, cy = S / 2;
  const bars = 100;
  
  // Create a continuous wave path for a radial area
  const points = [];
  for (let i = 0; i <= bars; i++) {
    const angle = (Math.PI * 2 * i) / bars - Math.PI / 2;
    const wave = Math.sin(i * 0.3) * Math.cos(i * 0.15) + Math.sin(i * 0.08);
    const r = 110 + Math.abs(wave) * 45; 
    points.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
  }
  const pathD = "M " + points.map(p => p.join(',')).join(' L ') + " Z";

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 0 }}>
      <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`}>
        <defs>
          <GlowDef id="cacCyan" color="#06b6d4" />
          <GlowDef id="cacPurple" color="#a855f7" />
          <GlowDef id="cacOrange" color="#f97316" />
          <linearGradient id="cacGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>

        {/* Center Content */}
        <text x={cx} y={cy - 16} textAnchor="middle" fill={dk ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'} fontSize={11} fontWeight={700} letterSpacing={3} textTransform="uppercase">Volume Index</text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill={dk ? '#fff' : '#000'} fontSize={36} fontWeight={700} fontFamily="'Space Grotesk', sans-serif">14.2M</text>
        <text x={cx} y={cy + 34} textAnchor="middle" fill="#06b6d4" fontSize={12} fontWeight={700} letterSpacing={1}>▲ 245K (1.8%)</text>

        {/* Base Rings */}
        <circle cx={cx} cy={cy} r={80} fill="none" stroke={dk ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'} strokeWidth={1} />
        <circle cx={cx} cy={cy} r={95} fill="none" stroke={dk ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'} strokeWidth={4} strokeDasharray="2 6" />

        {/* Radial Wave Area */}
        <path d={pathD} fill="url(#cacGrad)" opacity={0.12} stroke="url(#cacGrad)" strokeWidth={1.5} filter="url(#cacCyan)" />

        {/* Equalizer Bars */}
        {Array.from({ length: bars }).map((_, i) => {
          const angle = (Math.PI * 2 * i) / bars - Math.PI / 2;
          const wave = Math.sin(i * 0.3) * Math.cos(i * 0.15) + Math.sin(i * 0.08);
          const h = Math.abs(wave) * 45;
          const r1 = 110;
          const r2 = r1 + h;
          const x1 = cx + r1 * Math.cos(angle);
          const y1 = cy + r1 * Math.sin(angle);
          const x2 = cx + r2 * Math.cos(angle);
          const y2 = cy + r2 * Math.sin(angle);
          const isHigh = h > 25;
          const color = isHigh ? '#06b6d4' : '#a855f7';
          const opacity = isHigh ? 1 : 0.4;

          return (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={2.5} strokeLinecap="round" opacity={opacity}>
              <animate attributeName="opacity" values={`${opacity};${opacity === 1 ? 0.6 : 0.8};${opacity}`} dur={`${1.5 + Math.random()}s`} repeatCount="indefinite" />
            </line>
          )
        })}

        {/* Orbiting Highlight */}
        <g style={{ transformOrigin: 'center', animation: 'spin-cac 14s linear infinite' }}>
          <circle cx={cx} cy={cy} r={170} fill="none" stroke="#f97316" strokeWidth={1} strokeDasharray="40 1000" strokeLinecap="round" filter="url(#cacOrange)" />
          <circle cx={cx} cy={cy - 170} r={4} fill="#fff" filter="url(#cacOrange)" />
        </g>
        <g style={{ transformOrigin: 'center', animation: 'spin-cac-rev 20s linear infinite' }}>
          <circle cx={cx} cy={cy} r={190} fill="none" stroke="#06b6d4" strokeWidth={1} strokeDasharray="100 1000" strokeLinecap="round" filter="url(#cacCyan)" />
          <circle cx={cx} cy={cy - 190} r={4} fill="#fff" filter="url(#cacCyan)" />
        </g>
      </svg>
      <style>{`
        @keyframes spin-cac { 100% { transform: rotate(360deg); } }
        @keyframes spin-cac-rev { 100% { transform: rotate(-360deg); } }
      `}</style>
    </div>
  );
}
