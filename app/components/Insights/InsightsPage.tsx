'use client';

import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip,
  BarChart, Bar, Cell,
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import DashboardHeader from '../DashboardHeader/DashboardHeader';
import HexagonNetwork from './HexagonNetwork';
import { HyperCard1, HyperCard2 } from './HyperCards';
import './Insights.css';

const RADAR_DATA = [
  { axis: 'Win Rate', A: 47 }, { axis: 'Consistency', A: 62 },
  { axis: 'Risk Mgmt', A: 71 }, { axis: 'Speed', A: 85 },
  { axis: 'Volume', A: 78 }, { axis: 'Profit Factor', A: 38 },
];
const PNL_DIST = [
  { range: '<-$20', count: 12, color: '#ef4444' }, { range: '-$20', count: 45, color: '#f87171' },
  { range: '-$10', count: 128, color: '#fca5a5' }, { range: '-$5', count: 210, color: '#fed7d7' },
  { range: '$0', count: 195, color: '#a7f3d0' }, { range: '$5', count: 142, color: '#6ee7b7' },
  { range: '$10', count: 78, color: '#34d399' }, { range: '>$20', count: 30, color: '#10b981' },
];
const TL = Array.from({ length: 30 }, (_, i) => {
  const pnl = Math.round((Math.sin(i * 0.4) * 20 + Math.random() * 30 - 15) * 100) / 100;
  return { day: `Apr ${i + 1}`, pnl, cumPnl: 0 };
});
TL.reduce((a, d) => { d.cumPnl = Math.round((a + d.pnl) * 100) / 100; return d.cumPnl; }, 0);
const HR = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}:00`, trades: Math.round(15 + Math.sin(i * .5 + 1) * 12 + Math.random() * 8),
}));

const fadeUp: any = { hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [.4, 0, .2, 1] } } };
const stagger: any = { hidden: {}, visible: { transition: { staggerChildren: 0.09 } } };

function Tip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'rgba(10,14,26,0.92)', border: '1px solid rgba(79,142,247,0.2)',
      borderRadius: 8, padding: '6px 12px', backdropFilter: 'blur(12px)' }}>
      <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 9 }}>{label}</p>
      <p style={{ color: payload[0].value >= 0 ? '#34d399' : '#f87171', fontSize: 13,
        fontWeight: 700, fontFamily: "'Space Grotesk'" }}>${payload[0].value.toFixed(2)}</p>
    </div>
  );
}

export default function InsightsPage() {
  const { theme } = useTheme();
  const dk = theme === 'dark';
  const maxD = useMemo(() => Math.max(...PNL_DIST.map(d => d.count)), []);
  const gc = dk ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)';
  const ac = dk ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const tf = dk ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)';
  const lf = dk ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.5)';

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);

  if (!isMounted) {
    return (
      <div className="ins-root">
        <div className="ins-ambient" aria-hidden="true">
          <div className="ins-ambient-orb" /><div className="ins-ambient-orb" /><div className="ins-ambient-orb" />
        </div>
        <DashboardHeader />
      </div>
    );
  }

  return (
    <div className="ins-root">
      <div className="ins-ambient" aria-hidden="true">
        <div className="ins-ambient-orb" /><div className="ins-ambient-orb" /><div className="ins-ambient-orb" />
      </div>
      <DashboardHeader />

      <motion.div className="ins-content" initial="hidden" animate="visible" variants={stagger}>
        {/* ═══ HERO — unchanged ═══ */}
        <div className="ins-hero">
          <div className="ins-hex-bg">
            <HexagonNetwork />
            <div className="ins-hex-labels">
              <span className="ins-hex-title">Neural Trade Network</span>
              <span className="ins-hex-sub">Real-time connectivity · 19 nodes</span>
            </div>
            <div className="ins-hex-legend">
              <span><i style={{ background: '#4F8EF7' }} /> Core</span>
              <span><i style={{ background: '#34d399' }} /> Metrics</span>
              <span><i style={{ background: '#a78bfa' }} /> Symbols</span>
            </div>
          </div>
          <motion.div className="ins-hero-overlay" variants={stagger}>
            <motion.div className="ins-section-label" variants={fadeUp}>
              <span className="ins-label-dot" /><span>Performance Analysis</span><span className="ins-label-line" />
            </motion.div>
            <motion.div className="ins-hero-charts" variants={stagger}>
              <motion.div className="ins-chart-block" variants={fadeUp}>
                <div className="ins-chart-label">Trading Radar</div>
                <ResponsiveContainer width="100%" height={190} minWidth={1} minHeight={1}>
                  <RadarChart data={RADAR_DATA} cx="50%" cy="50%" outerRadius="70%">
                    <PolarGrid stroke={dk ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'} />
                    <PolarAngleAxis dataKey="axis" tick={{ fill: lf, fontSize: 9 }} />
                    <Radar dataKey="A" stroke="#4F8EF7" fill="#4F8EF7" fillOpacity={.15} strokeWidth={2} animationDuration={1800} />
                  </RadarChart>
                </ResponsiveContainer>
              </motion.div>
              <motion.div className="ins-chart-block" variants={fadeUp}>
                <div className="ins-chart-label">PnL Distribution</div>
                <div className="ins-dist-bars">
                  {PNL_DIST.map((d, i) => (
                    <div className="ins-dist-col" key={i}>
                      <motion.div className="ins-dist-bar" style={{ background: d.color }}
                        initial={{ height: 0 }} animate={{ height: `${(d.count / maxD) * 100}%` }}
                        transition={{ duration: .9, delay: .5 + i * .07, ease: [.4, 0, .2, 1] }} />
                      <span className="ins-dist-label">{d.range}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        {/* ═══ BENTO: 2 rows — cards + charts mixed ═══ */}
        <motion.div className="ins-section-label ins-bottom-label" variants={fadeUp}>
          <span className="ins-label-dot" style={{ background: '#a78bfa' }} /><span>Detailed Analytics</span><span className="ins-label-line" />
        </motion.div>

        <motion.div className="ins-bento" variants={stagger}>
          {/* ROW 1: Card left | Cumulative P&L right (wide) */}
          <div className="bento-card1"><HyperCard1 /></div>
          <motion.div className="bento-cumul ins-chart-block" variants={fadeUp}>
            <div className="ins-chart-label">Cumulative P&L</div>
            <ResponsiveContainer width="100%" height="90%" minWidth={1} minHeight={1}>
              <AreaChart data={TL} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <defs><linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4F8EF7" stopOpacity={.25} /><stop offset="95%" stopColor="#4F8EF7" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gc} />
                <XAxis dataKey="day" tick={{ fontSize: 9, fill: tf }} interval={5} stroke={ac} />
                <YAxis tick={{ fontSize: 9, fill: tf }} stroke={ac} />
                <Tooltip content={<Tip />} />
                <Area type="monotone" dataKey="cumPnl" stroke="#4F8EF7" strokeWidth={2} fill="url(#aGrad)" animationDuration={2000} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* ROW 2: Daily P&L left | Volume/Hour center | Card right */}
          <motion.div className="bento-daily ins-chart-block" variants={fadeUp}>
            <div className="ins-chart-label">Daily P&L</div>
            <ResponsiveContainer width="100%" height="90%" minWidth={1} minHeight={1}>
              <BarChart data={TL.slice(0, 14)} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gc} />
                <XAxis dataKey="day" tick={{ fontSize: 9, fill: tf }} interval={2} stroke={ac} />
                <YAxis tick={{ fontSize: 9, fill: tf }} stroke={ac} />
                <Tooltip content={<Tip />} />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]} animationDuration={1500}>
                  {TL.slice(0, 14).map((d, i) => <Cell key={i} fill={d.pnl >= 0 ? '#34d399' : '#f87171'} fillOpacity={.75} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
          <motion.div className="bento-volhr ins-chart-block" variants={fadeUp}>
            <div className="ins-chart-label">Volume by Hour</div>
            <ResponsiveContainer width="100%" height="90%" minWidth={1} minHeight={1}>
              <BarChart data={HR} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gc} />
                <XAxis dataKey="hour" tick={{ fontSize: 8, fill: tf }} interval={3} stroke={ac} />
                <YAxis tick={{ fontSize: 9, fill: tf }} stroke={ac} />
                <Bar dataKey="trades" radius={[3, 3, 0, 0]} animationDuration={1500}>
                  {HR.map((d, i) => <Cell key={i} fill={`rgba(79,142,247,${.3 + (d.trades / 35) * .5})`} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
          <div className="bento-card2"><HyperCard2 /></div>
        </motion.div>
      </motion.div>
    </div>
  );
}
