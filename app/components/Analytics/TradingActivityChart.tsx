'use client';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { BarChart3, Activity, Zap } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { CHART_COLORS, seededRandom } from './chartColors';

/* ── Data types ── */
interface ActivityDatum {
  hour: string;
  wins: number;
  losses: number;
  total: number;
}

interface ActivityPayloadItem {
  name: string;
  value: number;
  color: string;
}

/* ── Data generator ── */
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

const ACTIVITY_DATA = generateActivityData();
const totalTradesCount = ACTIVITY_DATA.reduce((s, d) => s + d.total, 0);
const totalWinsCount = ACTIVITY_DATA.reduce((s, d) => s + d.wins, 0);
const winRatePct = ((totalWinsCount / totalTradesCount) * 100).toFixed(1);
const peakHourData = ACTIVITY_DATA.reduce((best, d) => (d.total > best.total ? d : best), ACTIVITY_DATA[0]);

/* ── Custom Tooltip ── */
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

/* ── Component ── */
export default function TradingActivityChart() {
  const { theme } = useTheme();
  const c = CHART_COLORS[theme];

  return (
    <div className="an-chart-card an-chart-activity">
      <div className="an-chart-header">
        <div className="an-chart-title-group">
          <div className="an-chart-icon-wrap activity">
            <BarChart3 size={16} />
          </div>
          <div>
            <h3 className="an-chart-title">TRADING ACTIVITY HOURS</h3>
            <p className="an-chart-subtitle">
              Peak hour: <strong>{peakHourData.hour}</strong> · {peakHourData.total} trades
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
            <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />
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
            <Bar dataKey="wins" name="Wins" stackId="a" fill="#34d399" radius={[0, 0, 0, 0]} maxBarSize={24} />
            <Bar dataKey="losses" name="Losses" stackId="a" fill="#ef4444" radius={[3, 3, 0, 0]} maxBarSize={24} />
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
  );
}
