'use client';

import { useMemo, useState, useEffect, useLayoutEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip,
  BarChart, Bar, Cell,
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import DashboardHeader from '../DashboardHeader/DashboardHeader';
import HexagonNetwork from './HexagonNetwork';
import { HyperCard1, HyperCard2, DynamicRingChart, CentralActivityCore } from './HyperCards';
import ActivityHeatmap from './ActivityHeatmap';
import TradeAllocation from './TradeAllocation';
import dynamic from 'next/dynamic';
import './Insights.css';

const MolecularScene = dynamic(
  () => import('../3dnew/r3f/Scene').then(mod => ({ default: mod.Scene })),
  { ssr: false }
);

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
    <div style={{
      background: 'rgba(10,14,26,0.92)', border: '1px solid rgba(79,142,247,0.2)',
      borderRadius: 8, padding: '6px 12px', backdropFilter: 'blur(12px)'
    }}>
      <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 9 }}>{label}</p>
      <p style={{
        color: payload[0].value >= 0 ? '#34d399' : '#f87171', fontSize: 13,
        fontWeight: 700, fontFamily: "'Space Grotesk'"
      }}>${payload[0].value.toFixed(2)}</p>
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
  const [chartReady, setChartReady] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);
  useLayoutEffect(() => { if (isMounted) setChartReady(true); }, [isMounted]);

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
        {/* ═══ HERO ═══ */}
        <div className="ins-hero" style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', gap: '40px', padding: '20px 0' }}>
          {/* Left Side: Radar and PNL Distribution */}
          <motion.div className="ins-hero-overlay" variants={stagger} style={{ width: '42%', position: 'static', paddingTop: 0 }}>
            <motion.div className="ins-section-label" variants={fadeUp}>
              <span className="ins-label-dot" /><span>Performance Analysis</span><span className="ins-label-line" />
            </motion.div>
            <motion.div className="ins-hero-charts" variants={stagger}>
              <motion.div className="ins-chart-block" variants={fadeUp}>
                <div className="ins-chart-label">Trading Radar</div>
                {chartReady && <ResponsiveContainer width="100%" height={260} minWidth={1} minHeight={1}>
                  <RadarChart data={RADAR_DATA} cx="50%" cy="50%" outerRadius="75%">
                    <PolarGrid stroke={dk ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'} />
                    <PolarAngleAxis dataKey="axis" tick={{ fill: lf, fontSize: 10 }} />
                    <Radar dataKey="A" stroke="#4F8EF7" fill="#4F8EF7" fillOpacity={.15} strokeWidth={2} animationDuration={1800} />
                  </RadarChart>
                </ResponsiveContainer>}
              </motion.div>
              <motion.div className="ins-chart-block" variants={fadeUp}>
                <div className="ins-chart-label">PnL Distribution</div>
                <div className="ins-dist-bars" style={{ height: 140 }}>
                  {PNL_DIST.map((d, i) => (
                    <div className="ins-dist-col" key={i}>
                      <motion.div className="ins-dist-bar" style={{ background: d.color }}
                        initial={{ height: 0 }} animate={{ height: `${(d.count / maxD) * 100}%` }}
                        transition={{ duration: .9, delay: .5 + i * .07, ease: [.4, 0, .2, 1] }} />
                      <span className="ins-dist-label" style={{ fontSize: 9 }}>{d.range}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Right Side: DynamicRingChart */}
          <motion.div variants={fadeUp} style={{ width: '42%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ transform: 'scale(1.4)', transformOrigin: 'center', pointerEvents: 'none' }}>
              <DynamicRingChart dk={theme === 'dark'} />
            </div>
          </motion.div>

          {/* Keeping CentralActivityCore code commented out as requested */}
          {/* <CentralActivityCore dk={theme === 'dark'} /> */}
        </div>



        {/* ═══ BENTO: 2 rows — cards + charts mixed ═══ */}
        <motion.div className="ins-section-label ins-bottom-label" variants={fadeUp} style={{ marginTop: '20px' }}>
          <span className="ins-label-dot" style={{ background: '#a78bfa' }} /><span>Detailed Analytics</span><span className="ins-label-line" />
        </motion.div>

        <motion.div className="ins-bento" variants={stagger}>
          {/* ROW 1: Card left | Cumulative P&L right (wide) */}
          <div className="bento-card1"><HyperCard1 /></div>
          <motion.div className="bento-cumul ins-chart-block" variants={fadeUp}>
            <div className="ins-chart-label">Cumulative P&L</div>
            {chartReady && <ResponsiveContainer width="100%" height={240} minWidth={1} minHeight={1}>
              <AreaChart data={TL} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <defs><linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4F8EF7" stopOpacity={.25} /><stop offset="95%" stopColor="#4F8EF7" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke={gc} />
                <XAxis dataKey="day" tick={{ fontSize: 9, fill: tf }} interval={5} stroke={ac} />
                <YAxis tick={{ fontSize: 9, fill: tf }} stroke={ac} />
                <Tooltip content={<Tip />} />
                <Area type="monotone" dataKey="cumPnl" stroke="#4F8EF7" strokeWidth={2} fill="url(#aGrad)" animationDuration={2000} />
              </AreaChart>
            </ResponsiveContainer>}
          </motion.div>

          {/* ROW 2: Daily P&L left | Card right */}
          <motion.div className="bento-daily ins-chart-block" variants={fadeUp}>
            <div className="ins-chart-label">Daily P&L</div>
            {chartReady && <ResponsiveContainer width="100%" height={200} minWidth={1} minHeight={1}>
              <BarChart data={TL.slice(0, 14)} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gc} />
                <XAxis dataKey="day" tick={{ fontSize: 9, fill: tf }} interval={2} stroke={ac} />
                <YAxis tick={{ fontSize: 9, fill: tf }} stroke={ac} />
                <Tooltip content={<Tip />} />
                <Bar dataKey="pnl" radius={[4, 4, 0, 0]} animationDuration={1500}>
                  {TL.slice(0, 14).map((d, i) => <Cell key={i} fill={d.pnl >= 0 ? '#34d399' : '#f87171'} fillOpacity={.75} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>}
          </motion.div>
          <div className="bento-card2"><HyperCard2 /></div>
        </motion.div>
        {/* ═══ BOTTOM ROW: ACTIVITY HEATMAP & TRADE ALLOCATION ═══ */}
        <motion.div className="ins-section-label ins-bottom-label" variants={fadeUp} style={{ marginTop: '40px' }}>
          <span className="ins-label-dot" style={{ background: '#34d399' }} /><span>Yearly Activity & Trade Allocation</span><span className="ins-label-line" />
        </motion.div>
        <motion.div variants={fadeUp} style={{
          width: '100%', 
          display: 'flex', 
          alignItems: 'stretch',
          background: dk ? 'rgba(8, 12, 24, 0.65)' : '#ffffff',
          border: `1px solid ${dk ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)'}`,
          borderRadius: 16,
          backdropFilter: 'blur(16px)',
          boxShadow: dk ? 'none' : '0 2px 8px rgba(0,0,0,0.03), 0 8px 24px rgba(0,0,0,0.02)',
          overflow: 'hidden'
        }}>
          <div style={{ flex: '0 0 65%', minWidth: 0 }}>
            <ActivityHeatmap dk={theme === 'dark'} />
          </div>
          <div style={{ flex: '0 0 35%', minWidth: 0 }}>
            <TradeAllocation dk={theme === 'dark'} />
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}
