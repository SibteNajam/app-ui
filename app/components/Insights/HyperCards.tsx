'use client';

import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

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

/* ── Exported individual cards for bento placement ── */
export function HyperCard1() {
  const { theme } = useTheme();
  const dk = theme === 'dark';
  const S = 150, cx = S / 2, cy = S / 2, R = S * 0.38;
  return (
    <motion.div className="hyper-card" variants={fadeUp} whileHover={{ y: -4 }}>
      <span className="hc-label">Trading Volume</span>
      <div className="hc-hero-val">$24,891</div>
      <span className="hc-trend up">+12.4%</span>
      <div className="hc-chart-center">
        <svg width={S} height={S} viewBox={`0 0 ${S} ${S}`}>
          <defs><GlowDef id="gl1" color="#34d399" /><linearGradient id="lg1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#34d399" /><stop offset="100%" stopColor="#06b6d4" /></linearGradient></defs>
          <Grid cx={cx} cy={cy} maxR={R} dk={dk} />
          <path d={blobPath([75, 50, 88, 42, 65, 58, 72, 48], cx, cy, R)} fill="url(#lg1)" fillOpacity={.08} stroke="url(#lg1)" strokeWidth={2.5} filter="url(#gl1)" />
          {[75, 50, 88, 42, 65, 58, 72, 48].map((v, i) => {
            const a = (Math.PI * 2 / 8) * i - Math.PI / 2, r = R * (v / 100);
            return <circle key={i} cx={cx + r * Math.cos(a)} cy={cy + r * Math.sin(a)} r={2.5} fill="#34d399" filter="url(#gl1)"><animate attributeName="r" values="2;3.5;2" dur={`${2.5 + i * .3}s`} repeatCount="indefinite" /></circle>;
          })}
          <circle cx={cx} cy={cy} r={2} fill="#34d399" />
        </svg>
      </div>
      <div className="hc-periods">
        <div className="hc-period"><span className="hc-pdot" style={{ background: '#34d399' }} /> Monthly<span className="hc-pval">$8,097</span><span className="hc-ptrend up">+19.6%</span></div>
        <div className="hc-period"><span className="hc-pdot" style={{ background: '#fbbf24' }} /> Yearly<span className="hc-pval">$312,134</span><span className="hc-ptrend up">+2.5%</span></div>
      </div>
      <div className="hc-rows">
        {[['APE/USDT', '4,892'], ['LUNA/USDT', '3,241'], ['BTC/USDT', '2,156']].map(([k, v]) => (
          <div className="hc-row" key={k}><span>{k}</span><span>{v}</span></div>
        ))}
      </div>
    </motion.div>
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
          <g transform={`translate(${cx},${cy})`}><rect x={-3} y={-3} width={6} height={6} rx={1} fill="none" stroke="#22d3ee" strokeWidth={1} transform="rotate(45)" opacity={.5} /><circle r={1.5} fill="#22d3ee" /></g>
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

export default function HyperChartsSection() { return null; }
