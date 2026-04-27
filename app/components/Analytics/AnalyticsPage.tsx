'use client';
import { useState, useMemo, useEffect } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  BarChart,
  ReferenceLine,
  Brush,
} from 'recharts';
import { TrendingDown, BarChart3, Activity, Zap } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import './Analytics.css';

/* ═══════════════════════════════════════════════
   THEME-AWARE CHART COLORS
   ═══════════════════════════════════════════════ */
const CHART_COLORS = {
  dark: {
    tick: 'rgba(255,255,255,0.35)',
    tickSecondary: 'rgba(255,255,255,0.25)',
    axisLine: 'rgba(255,255,255,0.06)',
    grid: 'rgba(255,255,255,0.04)',
    legend: 'rgba(255,255,255,0.6)',
    refLine: 'rgba(255,255,255,0.1)',
    cursor: 'rgba(255,255,255,0.08)',
    cursorFill: 'rgba(255,255,255,0.03)',
    brushStroke: 'rgba(255,255,255,0.12)',
    brushFill: 'rgba(10,12,24,0.9)',
    activeDotStroke: '#1a1a2e',
    drawdownFrom: 0.15,
    drawdownTo: 0.02,
    tooltipWinRate: 'rgba(255,255,255,0.7)',
  },
  light: {
    tick: 'rgba(30,41,59,0.55)',
    tickSecondary: 'rgba(30,41,59,0.4)',
    axisLine: 'rgba(0,0,0,0.08)',
    grid: 'rgba(0,0,0,0.06)',
    legend: 'rgba(30,41,59,0.6)',
    refLine: 'rgba(0,0,0,0.1)',
    cursor: 'rgba(0,0,0,0.06)',
    cursorFill: 'rgba(0,0,0,0.04)',
    brushStroke: 'rgba(0,0,0,0.15)',
    brushFill: 'rgba(241,245,249,0.95)',
    activeDotStroke: '#ffffff',
    drawdownFrom: 0.08,
    drawdownTo: 0.02,
    tooltipWinRate: 'rgba(30,41,59,0.7)',
  },
} as const;

/* ═══════════════════════════════════════════════
   DETERMINISTIC DUMMY DATA — replaced by API later
   Using seeded PRNG to avoid SSR hydration mismatch
   ═══════════════════════════════════════════════ */

// Simple seeded PRNG (mulberry32)
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s |= 0; s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

interface GrowthDatum {
  date: string;
  fullDate: string;
  dailyPnl: number;
  cumulativePnl: number;
  drawdown: number;
}

interface ActivityDatum {
  hour: string;
  wins: number;
  losses: number;
  total: number;
}

function generateGrowthData(): GrowthDatum[] {
  const rand = seededRandom(42);
  const data: GrowthDatum[] = [];
  const startDate = new Date('2026-02-01');
  let cumPnl = 0;

  for (let i = 0; i < 85; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);

    let dailyPnl: number;
    if (i < 20) {
      dailyPnl = (rand() - 0.35) * 30;
    } else if (i < 45) {
      dailyPnl = (rand() - 0.55) * 40;
    } else if (i < 65) {
      dailyPnl = (rand() - 0.6) * 50;
    } else {
      dailyPnl = (rand() - 0.45) * 35;
    }

    cumPnl += dailyPnl;
    const drawdown = cumPnl < 0 ? cumPnl : 0;

    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    data.push({
      date: `${months[date.getMonth()]} ${date.getDate()}`,
      fullDate: date.toISOString().split('T')[0],
      dailyPnl: parseFloat(dailyPnl.toFixed(2)),
      cumulativePnl: parseFloat(cumPnl.toFixed(2)),
      drawdown: parseFloat(drawdown.toFixed(2)),
    });
  }

  return data;
}

function generateActivityData(): ActivityDatum[] {
  const rand = seededRandom(123);
  const data: ActivityDatum[] = [];
  for (let hour = 0; hour < 24; hour++) {
    const totalTrades = Math.floor(rand() * 55) + 5;
    const wr = 0.15 + rand() * 0.35;
    const wins = Math.floor(totalTrades * wr);
    const losses = totalTrades - wins;

    const isPeak = [4, 5, 6, 12, 13, 14, 16, 17].includes(hour);
    const multiplier = isPeak ? 1.4 + rand() * 0.6 : 1;

    data.push({
      hour: `${hour.toString().padStart(2, '0')}:00`,
      wins: Math.floor(wins * multiplier),
      losses: Math.floor(losses * multiplier),
      total: Math.floor(totalTrades * multiplier),
    });
  }
  return data;
}

// Static data generated deterministically (same on server + client)
const GROWTH_DATA = generateGrowthData();
const ACTIVITY_DATA = generateActivityData();

const totalPnl = GROWTH_DATA[GROWTH_DATA.length - 1]?.cumulativePnl ?? 0;
const totalTradesCount = ACTIVITY_DATA.reduce((s, d) => s + d.total, 0);
const totalWinsCount = ACTIVITY_DATA.reduce((s, d) => s + d.wins, 0);
const winRatePct = ((totalWinsCount / totalTradesCount) * 100).toFixed(1);
const peakHourData = ACTIVITY_DATA.reduce((best, d) => (d.total > best.total ? d : best), ACTIVITY_DATA[0]);
const bestPnlDay = GROWTH_DATA.reduce((best, d) => (d.dailyPnl > best.dailyPnl ? d : best), GROWTH_DATA[0]);

/* ═══════════════════════════════════════════════
   CUSTOM TOOLTIP COMPONENTS
   ═══════════════════════════════════════════════ */

interface GrowthPayloadItem {
  name: string;
  value: number;
  color: string;
}

function GrowthTooltip({ active, payload, label }: { active?: boolean; payload?: GrowthPayloadItem[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="an-tooltip">
      <div className="an-tooltip-label">{label}</div>
      {payload.map((p: GrowthPayloadItem, i: number) => (
        <div key={i} className="an-tooltip-row">
          <span className="an-tooltip-dot" style={{ background: p.color }} />
          <span className="an-tooltip-name">{p.name}</span>
          <span className={`an-tooltip-val ${p.value >= 0 ? 'positive' : 'negative'}`}>
            {p.value >= 0 ? '+' : ''}${p.value.toFixed(2)}
          </span>
        </div>
      ))}
    </div>
  );
}

interface ActivityPayloadItem {
  name: string;
  value: number;
  color: string;
}

function ActivityTooltip({ active, payload, label }: { active?: boolean; payload?: ActivityPayloadItem[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const wins = payload.find((p: ActivityPayloadItem) => p.name === 'Wins')?.value ?? 0;
  const losses = payload.find((p: ActivityPayloadItem) => p.name === 'Losses')?.value ?? 0;
  const total = wins + losses;
  const wr = total > 0 ? ((wins / total) * 100).toFixed(1) : '0';
  return (
    <div className="an-tooltip">
      <div className="an-tooltip-label">{label}</div>
      {payload.map((p: ActivityPayloadItem, i: number) => (
        <div key={i} className="an-tooltip-row">
          <span className="an-tooltip-dot" style={{ background: p.color }} />
          <span className="an-tooltip-name">{p.name}</span>
          <span className="an-tooltip-val">{p.value}</span>
        </div>
      ))}
      <div className="an-tooltip-divider" />
      <div className="an-tooltip-row">
        <span className="an-tooltip-name">Win Rate</span>
        <span className="an-tooltip-val" style={{ color: '#059669' }}>{wr}%</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   FILTER TABS
   ═══════════════════════════════════════════════ */
const TIME_FILTERS = ['All', '30D', '7D', '24H'] as const;
type TimeFilter = typeof TIME_FILTERS[number];

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */
export default function AnalyticsPage() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('All');
  const { theme } = useTheme();
  const c = CHART_COLORS[theme];

  // Filter growth data based on time selection
  const filteredGrowthData = useMemo(() => {
    if (timeFilter === 'All') return GROWTH_DATA;
    const now = new Date(GROWTH_DATA[GROWTH_DATA.length - 1].fullDate);
    const daysMap = { '30D': 30, '7D': 7, '24H': 1 };
    const days = daysMap[timeFilter as keyof typeof daysMap] ?? GROWTH_DATA.length;
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - days);
    return GROWTH_DATA.filter(d => new Date(d.fullDate) >= cutoff);
  }, [timeFilter]);

  return (
    <div className="an-page">
      {/* ── TOP BAR: Exchange info + Time Filters ── */}
      <div className="an-top-bar">
        <div className="an-exchange-info">
          <div className="an-exchange-icon">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="13" stroke="#F0B90B" strokeWidth="1.5" fill="rgba(240,185,11,0.08)" />
              <text x="14" y="18" textAnchor="middle" fill="#F0B90B" fontSize="12" fontWeight="700">B</text>
            </svg>
          </div>
          <div className="an-exchange-text">
            <span className="an-exchange-name">Binance</span>
            <span className="an-exchange-sub">Crypto Exchange · SPOT</span>
          </div>
        </div>

        <div className="an-filters">
          {TIME_FILTERS.map(f => (
            <button
              key={f}
              className={`an-filter-btn ${timeFilter === f ? 'active' : ''}`}
              onClick={() => setTimeFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="an-connected-badge">
          <span className="an-connected-dot" />
          Connected
        </div>
      </div>

      {/* ── CHARTS GRID ── */}
      <div className="an-charts-grid">

        {/* ─── CHART 1: Portfolio Growth ─── */}
        <div className="an-chart-card an-chart-growth">
          <div className="an-chart-header">
            <div className="an-chart-title-group">
              <div className="an-chart-icon-wrap growth">
                <TrendingDown size={16} />
              </div>
              <div>
                <h3 className="an-chart-title">PORTFOLIO GROWTH</h3>
                <p className="an-chart-subtitle">
                  Cumulative realized PnL · grey bands = drawdown · drag handles to zoom
                </p>
              </div>
            </div>
            <div className="an-chart-header-right">
              <span className="an-chart-sub-label">Cumulative PnL vs Daily PnL performance over time</span>
              <div className={`an-pnl-badge ${totalPnl >= 0 ? 'positive' : 'negative'}`}>
                {totalPnl >= 0 ? '+' : ''}{totalPnl < 0 ? '-' : ''}${Math.abs(totalPnl).toFixed(2)}
              </div>
            </div>
          </div>

          <div className="an-chart-body">
            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart data={filteredGrowthData} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="drawdownGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6b7280" stopOpacity={c.drawdownFrom} />
                    <stop offset="100%" stopColor="#6b7280" stopOpacity={c.drawdownTo} />
                  </linearGradient>
                  <linearGradient id="cumPnlGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity={0.1} />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={c.grid}
                  vertical={false}
                />

                <XAxis
                  dataKey="date"
                  tick={{ fill: c.tick, fontSize: 11 }}
                  axisLine={{ stroke: c.axisLine }}
                  tickLine={false}
                  interval="preserveStartEnd"
                />

                <YAxis
                  yAxisId="left"
                  tick={{ fill: c.tick, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `$${v}`}
                />

                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: c.tickSecondary, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `$${v}`}
                />

                <Tooltip content={<GrowthTooltip />} cursor={{ stroke: c.cursor }} />

                <Legend
                  verticalAlign="top"
                  align="center"
                  iconType="line"
                  wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }}
                  formatter={(value: string) => (
                    <span style={{ color: c.legend, fontSize: '12px', marginRight: '16px' }}>{value}</span>
                  )}
                />

                <ReferenceLine yAxisId="left" y={0} stroke={c.refLine} strokeDasharray="4 4" />

                {/* Drawdown area */}
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="drawdown"
                  fill="url(#drawdownGrad)"
                  stroke="none"
                  name="Drawdown"
                />

                {/* Cumulative PnL line */}
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="cumulativePnl"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={false}
                  name="Cumulative PnL"
                  activeDot={{ r: 4, fill: '#ef4444', stroke: c.activeDotStroke, strokeWidth: 2 }}
                />

                {/* Daily PnL line */}
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="dailyPnl"
                  stroke="#eab308"
                  strokeWidth={1.5}
                  dot={false}
                  name="Daily PnL"
                  activeDot={{ r: 3, fill: '#eab308', stroke: c.activeDotStroke, strokeWidth: 2 }}
                />

                {/* Brush for zoom */}
                <Brush
                  dataKey="date"
                  height={28}
                  stroke={c.brushStroke}
                  fill={c.brushFill}
                  travellerWidth={10}
                  startIndex={0}
                  endIndex={filteredGrowthData.length - 1}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="an-chart-footer">
            <span className="an-chart-footer-label">
              {filteredGrowthData[0]?.date} — {filteredGrowthData[filteredGrowthData.length - 1]?.date}
            </span>
          </div>
        </div>

        {/* ─── CHART 2: Trading Activity Hours ─── */}
        <div className="an-chart-card an-chart-activity">
          <div className="an-chart-header">
            <div className="an-chart-title-group">
              <div className="an-chart-icon-wrap activity">
                <BarChart3 size={16} />
              </div>
              <div>
                <h3 className="an-chart-title">TRADING ACTIVITY HOURS</h3>
                <p className="an-chart-subtitle">
                  Peak hour: <strong>{peakHourData.hour}</strong> · {peakHourData.total} trades · Best PnL at {bestPnlDay.date} (+${bestPnlDay.dailyPnl.toFixed(2)})
                </p>
              </div>
            </div>
            <div className="an-chart-legend-pills">
              <span className="an-legend-pill win">
                <span className="an-legend-dot" style={{ background: '#34d399' }} /> Wins
              </span>
              <span className="an-legend-pill loss">
                <span className="an-legend-dot" style={{ background: '#ef4444' }} /> Losses
              </span>
            </div>
          </div>

          <div className="an-chart-body">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={ACTIVITY_DATA} margin={{ top: 10, right: 20, left: 10, bottom: 0 }} barGap={1}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={c.grid}
                  vertical={false}
                />

                <XAxis
                  dataKey="hour"
                  tick={{ fill: c.tick, fontSize: 11 }}
                  axisLine={{ stroke: c.axisLine }}
                  tickLine={false}
                />

                <YAxis
                  tick={{ fill: c.tick, fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip content={<ActivityTooltip />} cursor={{ fill: c.cursorFill }} />

                <Bar
                  dataKey="wins"
                  name="Wins"
                  stackId="a"
                  fill="#34d399"
                  radius={[0, 0, 0, 0]}
                  maxBarSize={24}
                />

                <Bar
                  dataKey="losses"
                  name="Losses"
                  stackId="a"
                  fill="#ef4444"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={24}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="an-chart-footer">
            <div className="an-chart-footer-stat">
              <Activity size={13} />
              <span>{totalTradesCount} total trades across 24 active hours</span>
            </div>
            <div className="an-chart-footer-stat highlight">
              <Zap size={13} />
              <span>Win Rate: <strong>{winRatePct}%</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
