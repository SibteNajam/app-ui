'use client';
import { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { useTheme } from '../../context/ThemeContext';
import { CHART_COLORS, seededRandom } from './chartColors';

/* ── Data types ── */
interface DailyTradeDatum {
  date: string;
  wins: number;
  losses: number;
}

interface DailyTradePayloadItem {
  name: string;
  value: number;
  color: string;
}

/* ── Period configs ── */
const PERIODS = ['By Day', '5-Day', '10-Day', '15-Day'] as const;
type Period = typeof PERIODS[number];

/* ── Data generator ── */
function generateDailyTradesData(): DailyTradeDatum[] {
  const rand = seededRandom(777);
  const data: DailyTradeDatum[] = [];
  const startDate = new Date('2026-01-20');

  for (let i = 0; i < 70; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const wins = Math.floor(rand() * 20) + 2;
    const losses = Math.floor(rand() * 35) + 1;
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    data.push({
      date: `${months[d.getMonth()]} ${d.getDate()}`,
      wins,
      losses,
    });
  }
  return data;
}

const RAW_DATA = generateDailyTradesData();

/* ── Helper: aggregate into N-day buckets ── */
function bucketData(raw: DailyTradeDatum[], bucketSize: number): DailyTradeDatum[] {
  if (bucketSize <= 1) return raw;
  const buckets: DailyTradeDatum[] = [];
  for (let i = 0; i < raw.length; i += bucketSize) {
    const slice = raw.slice(i, i + bucketSize);
    buckets.push({
      date: slice.length > 1 ? `${slice[0].date}–${slice[slice.length - 1].date}` : slice[0].date,
      wins: slice.reduce((s, d) => s + d.wins, 0),
      losses: slice.reduce((s, d) => s + d.losses, 0),
    });
  }
  return buckets;
}

/* ── Custom Tooltip ── */
function DailyTradesTooltip({ active, payload, label }: { active?: boolean; payload?: DailyTradePayloadItem[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const wins = payload.find(p => p.name === 'Wins')?.value ?? 0;
  const losses = payload.find(p => p.name === 'Losses')?.value ?? 0;
  const total = wins + losses;
  const wr = total > 0 ? ((wins / total) * 100).toFixed(1) : '0';
  return (
    <div className="an-tooltip">
      <div className="an-tooltip-label">{label}</div>
      {payload.map((p, i) => (
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

/* ── Component ── */
export default function DailyTradesOverview() {
  const { theme } = useTheme();
  const c = CHART_COLORS[theme];
  const [period, setPeriod] = useState<Period>('By Day');

  const bucketSize = period === '5-Day' ? 5 : period === '10-Day' ? 10 : period === '15-Day' ? 15 : 1;
  const chartData = useMemo(() => bucketData(RAW_DATA, bucketSize), [bucketSize]);

  const totalWins = RAW_DATA.reduce((s, d) => s + d.wins, 0);
  const totalLosses = RAW_DATA.reduce((s, d) => s + d.losses, 0);
  const totalTrades = totalWins + totalLosses;
  const winRate = ((totalWins / totalTrades) * 100).toFixed(0);

  return (
    <div className="an-chart-card">
      <div className="an-chart-header">
        <div className="an-chart-title-group">
          <div>
            <h3 className="an-chart-title">DAILY TRADES OVERVIEW</h3>
            <p className="an-chart-subtitle">
              Stacked wins &amp; losses per day · {totalWins}W (+$141.35) / {totalLosses}L ($-253.24) · WR:{winRate}%
            </p>
          </div>
        </div>
        <div className="an-chart-header-right" style={{ flexDirection: 'row', gap: '0.5rem', alignItems: 'center' }}>
          <div className="an-chart-legend-pills" style={{ marginRight: '0.75rem' }}>
            <span className="an-legend-pill win">
              <span className="an-legend-dot" style={{ background: '#34d399' }} /> Wins
            </span>
            <span className="an-legend-pill loss">
              <span className="an-legend-dot" style={{ background: '#ef4444' }} /> Losses
            </span>
          </div>
        </div>
      </div>

      {/* Period toggle pills */}
      <div className="an-period-pills">
        {PERIODS.map(p => (
          <button
            key={p}
            className={`an-period-btn ${period === p ? 'active' : ''}`}
            onClick={() => setPeriod(p)}
          >
            {p}
          </button>
        ))}
        <span className="an-period-info">{chartData.length} periods · {totalTrades} trades</span>
      </div>

      <div className="an-chart-body">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} margin={{ top: 10, right: 16, left: 4, bottom: 0 }} barGap={1}>
            <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
            <XAxis
              dataKey="date"
              tick={{ fill: c.tick, fontSize: 10 }}
              axisLine={{ stroke: c.axisLine }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: c.tick, fontSize: 10 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<DailyTradesTooltip />} cursor={{ fill: c.cursorFill }} />
            <Bar dataKey="wins" name="Wins" stackId="a" fill="#34d399" radius={[0, 0, 0, 0]} maxBarSize={20} />
            <Bar dataKey="losses" name="Losses" stackId="a" fill="#ef4444" radius={[2, 2, 0, 0]} maxBarSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="an-chart-footer">
        <span className="an-chart-footer-label">
          Wins ({totalWins}) · Losses ({totalLosses})
        </span>
        <span className="an-chart-footer-label">
          Net: <span style={{ color: '#ef4444', fontWeight: 700 }}>$-111.89</span>
        </span>
      </div>
    </div>
  );
}
