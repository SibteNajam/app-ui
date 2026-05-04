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

import { HyperCard1, HyperCard2, DynamicRingChart, CentralActivityCore } from './HyperCards';
import ActivityHeatmap from './ActivityHeatmap';
import TradeAllocation from './TradeAllocation';
import dynamic from 'next/dynamic';
import './Insights.css';

const MolecularScene = dynamic(
  () => import('../3dnew/r3f/Scene').then(mod => ({ default: mod.Scene })),
  { ssr: false }
);

import { useDashboardTrades } from '../../hooks/useDashboardTrades';

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
  const { completedTrades } = useDashboardTrades();

  const dk = theme === 'dark';
  const gc = dk ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)';
  const ac = dk ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const tf = dk ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)';
  const lf = dk ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.5)';

  // 1. Generate Trade Timeline (TL) for Area/Bar charts
  const tradeTimeline = useMemo(() => {
    const days: Record<string, number> = {};
    const now = Date.now();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now - i * 86400000);
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      days[label] = 0;
    }
    completedTrades.forEach(t => {
      let lastExit = t.exitOrders?.reduce((latest: number, exit: any) => Math.max(latest, exit.filledAt), 0) || 0;
      if (lastExit === 0) lastExit = t.entryOrder?.filledAt || 0;
      if (lastExit > 0) {
        const d = new Date(lastExit);
        const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (days[label] !== undefined) {
          days[label] += t.pnl.realized;
        }
      }
    });

    const TL: any[] = [];
    let cum = 0;
    Object.entries(days).forEach(([day, pnl]) => {
      cum += pnl;
      TL.push({ day, pnl: Math.round(pnl * 100) / 100, cumPnl: Math.round(cum * 100) / 100 });
    });
    return TL;
  }, [completedTrades]);

  // 2. Generate PNL Distribution
  const pnlDistData = useMemo(() => {
    const buckets = [
      { max: -20, range: '<-$20', color: '#ef4444', count: 0 },
      { max: -5, range: '-$20 to -$5', color: '#f87171', count: 0 },
      { max: 0, range: '-$5 to $0', color: '#fca5a5', count: 0 },
      { max: 5, range: '$0 to $5', color: '#6ee7b7', count: 0 },
      { max: 20, range: '$5 to $20', color: '#34d399', count: 0 },
      { max: Infinity, range: '>$20', color: '#10b981', count: 0 },
    ];
    completedTrades.forEach(t => {
      const pnl = t.pnl.realized;
      for (const b of buckets) {
        if (pnl < b.max) {
          b.count++;
          break;
        }
      }
    });
    return buckets;
  }, [completedTrades]);

  const maxD = useMemo(() => Math.max(1, ...pnlDistData.map(d => d.count)), [pnlDistData]);

  // 3. Generate Radar Data
  const radarData = useMemo(() => {
    const total = completedTrades.length;
    const wins = completedTrades.filter(t => t.pnl.realized > 0);
    const losses = completedTrades.filter(t => t.pnl.realized < 0);
    const winRate = total > 0 ? Math.round((wins.length / total) * 100) : 0;
    
    // Profit factor calculation
    const grossProfit = wins.reduce((sum, t) => sum + t.pnl.realized, 0);
    const grossLoss = Math.abs(losses.reduce((sum, t) => sum + t.pnl.realized, 0)) || 1;
    const profitFactorRaw = grossProfit / grossLoss;
    const profitFactorScore = Math.min(100, Math.round(profitFactorRaw * 25)); // Cap at 100 (PF 4.0 = 100)

    // Risk Mgmt calculation based on avg loss vs avg win
    const avgWin = wins.length > 0 ? grossProfit / wins.length : 0;
    const avgLoss = losses.length > 0 ? grossLoss / losses.length : 1;
    const riskReward = avgLoss > 0 ? avgWin / avgLoss : 0;
    const riskMgmtScore = Math.min(100, Math.round(Math.max(0, riskReward * 33))); // RR of 3.0 = 100
    
    // Speed: Average holding duration
    let totalDuration = 0;
    completedTrades.forEach(t => {
      const entryTime = t.entryOrder?.filledAt || 0;
      const lastExit = t.exitOrders?.reduce((latest, ex) => Math.max(latest, ex.filledAt), 0) || 0;
      if (lastExit > entryTime) totalDuration += (lastExit - entryTime);
    });
    const avgDurationHours = total > 0 ? (totalDuration / total) / 3600000 : 0;
    // Lower duration = higher speed score (arbitrary scaling for visual)
    const speedScore = Math.min(100, Math.max(10, 100 - Math.round(avgDurationHours * 2)));

    return [
      { axis: 'Win Rate', A: winRate || 0 },
      { axis: 'Consistency', A: Math.min(100, 40 + (total * 2)) },
      { axis: 'Risk Mgmt', A: riskMgmtScore || 0 },
      { axis: 'Speed', A: speedScore || 0 },
      { axis: 'Volume', A: Math.min(100, total * 5) },
      { axis: 'Profit Factor', A: profitFactorScore || 0 },
    ];
  }, [completedTrades]);

  const [isMounted, setIsMounted] = useState(false);
  const [chartReady, setChartReady] = useState(false);
  useEffect(() => { setIsMounted(true); }, []);
  useEffect(() => {
    if (isMounted) {
      const t = setTimeout(() => setChartReady(true), 50);
      return () => clearTimeout(t);
    }
  }, [isMounted]);

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
                  <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                    <PolarGrid stroke={dk ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)'} />
                    <PolarAngleAxis dataKey="axis" tick={{ fill: lf, fontSize: 10 }} />
                    <Radar dataKey="A" stroke="#4F8EF7" fill="#4F8EF7" fillOpacity={.15} strokeWidth={2} animationDuration={1800} />
                  </RadarChart>
                </ResponsiveContainer>}
              </motion.div>
              <motion.div className="ins-chart-block" variants={fadeUp}>
                <div className="ins-chart-label">PnL Distribution</div>
                <div className="ins-dist-bars" style={{ height: 140 }}>
                  {pnlDistData.map((d, i) => (
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

          {/* Right Side: DynamicRingChart with Telemetry HUD */}
          <motion.div variants={fadeUp} style={{ 
            width: '46%', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center', 
            alignItems: 'center',
            background: dk ? 'rgba(10, 14, 26, 0.4)' : 'rgba(255, 255, 255, 0.4)',
            border: `1px solid ${dk ? 'rgba(79, 142, 247, 0.15)' : 'rgba(79, 142, 247, 0.15)'}`,
            borderRadius: 24,
            padding: '30px 40px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: dk ? 'inset 0 0 40px rgba(79, 142, 247, 0.05)' : '0 10px 30px rgba(0,0,0,0.02)'
          }}>
            {/* Ambient Background Orbs */}
            <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: 200, height: 200, background: '#4F8EF7', opacity: dk ? 0.15 : 0.05, filter: 'blur(70px)', borderRadius: '50%' }} />
            <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: 200, height: 200, background: '#a855f7', opacity: dk ? 0.15 : 0.05, filter: 'blur(70px)', borderRadius: '50%' }} />

            {/* Top Stats */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', zIndex: 1, marginBottom: 10 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                 <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: dk ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.5)' }}>SYSTEM STATUS</div>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', boxShadow: '0 0 10px #34d399' }} />
                    <div style={{ fontSize: 13, fontWeight: 600, color: dk ? '#fff' : '#000' }}>LIVE SYNC</div>
                 </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                 <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, color: dk ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.5)' }}>DATA POINTS</div>
                 <div style={{ fontSize: 13, fontWeight: 600, color: dk ? '#fff' : '#000', fontFamily: "'Space Grotesk', sans-serif" }}>{(completedTrades.length * 4.2).toFixed(0)}</div>
              </div>
            </div>

            {/* Center Ring Chart */}
            <div style={{ transform: 'scale(1.25)', transformOrigin: 'center', margin: '20px 0', zIndex: 1 }}>
              <DynamicRingChart dk={theme === 'dark'} />
            </div>

            {/* Bottom Stats */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', zIndex: 1, marginTop: 10, paddingTop: 20, borderTop: `1px solid ${dk ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                 <div style={{ fontSize: 10, fontWeight: 600, color: dk ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.5)' }}>ACTIVE STRATEGY</div>
                 <div style={{ fontSize: 12, fontWeight: 500, color: dk ? '#fff' : '#000' }}>Neural Alpha-V2</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                 <div style={{ fontSize: 10, fontWeight: 600, color: dk ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.5)' }}>LATENCY</div>
                 <div style={{ fontSize: 12, fontWeight: 500, color: '#34d399' }}>12ms</div>
              </div>
            </div>
          </motion.div>

          {/* Keeping CentralActivityCore code commented out as requested */}
          {/* <CentralActivityCore dk={theme === 'dark'} /> */}
        </div>



        {/* ═══ BENTO: 2 rows — cards + charts mixed ═══ */}
        <motion.div className="ins-section-label ins-bottom-label" variants={fadeUp} style={{ marginTop: '20px' }}>
          <span className="ins-label-dot" style={{ background: '#a78bfa' }} /><span>Detailed Analytics</span><span className="ins-label-line" />
        </motion.div>

        <motion.div className="ins-bento-dynamic" variants={stagger} style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'stretch' }}>
          {/* Left Side: Combined Card */}
          <div style={{ flex: '1 1 280px', maxWidth: '450px', display: 'flex', flexDirection: 'column' }}>
            <HyperCard1 />
          </div>

          {/* Right Side: Charts stacked vertically */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <motion.div className="ins-chart-block" variants={fadeUp} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div className="ins-chart-label">Cumulative P&L (Last 30 Days)</div>
              <div style={{ flex: 1, position: 'relative', width: '100%', minHeight: '220px' }}>
                {chartReady && <ResponsiveContainer width="100%" height={220} minWidth={1} minHeight={1}>
                  <AreaChart data={tradeTimeline} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                    <defs><linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4F8EF7" stopOpacity={.25} /><stop offset="95%" stopColor="#4F8EF7" stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={gc} />
                    <XAxis dataKey="day" tick={{ fontSize: 9, fill: tf }} interval={5} stroke={ac} />
                    <YAxis tick={{ fontSize: 9, fill: tf }} stroke={ac} />
                    <Tooltip content={<Tip />} />
                    <Area type="monotone" dataKey="cumPnl" stroke="#4F8EF7" strokeWidth={2} fill="url(#aGrad)" animationDuration={2000} />
                  </AreaChart>
                </ResponsiveContainer>}
              </div>
            </motion.div>

            <motion.div className="ins-chart-block" variants={fadeUp} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div className="ins-chart-label">Daily P&L (Last 14 Days)</div>
              <div style={{ flex: 1, position: 'relative', width: '100%', minHeight: '180px' }}>
                {chartReady && <ResponsiveContainer width="100%" height={180} minWidth={1} minHeight={1}>
                  <BarChart data={tradeTimeline.slice(-14)} margin={{ top: 8, right: 4, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gc} />
                    <XAxis dataKey="day" tick={{ fontSize: 9, fill: tf }} interval={2} stroke={ac} />
                    <YAxis tick={{ fontSize: 9, fill: tf }} stroke={ac} />
                    <Tooltip content={<Tip />} />
                    <Bar dataKey="pnl" radius={[4, 4, 0, 0]} animationDuration={1500}>
                      {tradeTimeline.slice(-14).map((d: any, i: number) => <Cell key={i} fill={d.pnl >= 0 ? '#34d399' : '#f87171'} fillOpacity={.75} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>}
              </div>
            </motion.div>
          </div>
        </motion.div>
        {/* ═══ BOTTOM ROW: ACTIVITY HEATMAP & TRADE ALLOCATION ═══ */}
        <motion.div className="ins-section-label ins-bottom-label" variants={fadeUp} style={{ marginTop: '40px' }}>
          <span className="ins-label-dot" style={{ background: '#34d399' }} /><span>Yearly Activity & Trade Allocation</span><span className="ins-label-line" />
        </motion.div>
        <motion.div variants={fadeUp} style={{
          width: '100%',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'stretch',
          background: dk ? 'rgba(8, 12, 24, 0.65)' : '#ffffff',
          border: `1px solid ${dk ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)'}`,
          borderRadius: 16,
          backdropFilter: 'blur(16px)',
          boxShadow: dk ? 'none' : '0 2px 8px rgba(0,0,0,0.03), 0 8px 24px rgba(0,0,0,0.02)',
          overflow: 'hidden'
        }}>
          <div style={{ flex: '2 1 500px', minWidth: 320 }}>
            <ActivityHeatmap dk={theme === 'dark'} />
          </div>
          <div style={{ width: '1px', background: dk ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', margin: '0 10px', display: 'none' }} />
          <div style={{ flex: '1 1 300px', padding: '24px 32px', borderLeft: `1px solid ${dk ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}` }}>
            <TradeAllocation dk={theme === 'dark'} />
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}
