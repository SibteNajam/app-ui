'use client';
import { useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
  Brush,
} from 'recharts';
import { TrendingDown } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { CHART_COLORS, seededRandom } from './chartColors';

/* ── Data types ── */
interface GrowthDatum {
  date: string;
  fullDate: string;
  dailyPnl: number;
  cumulativePnl: number;
  drawdown: number;
}

interface GrowthPayloadItem {
  name: string;
  value: number;
  color: string;
}

/* ── Data generator ── */
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

const GROWTH_DATA = generateGrowthData();
const totalPnl = GROWTH_DATA[GROWTH_DATA.length - 1]?.cumulativePnl ?? 0;

/* ── Custom Tooltip ── */
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

/* ── Component ── */
interface PortfolioGrowthChartProps {
  timeFilter: string;
}

export default function PortfolioGrowthChart({ timeFilter }: PortfolioGrowthChartProps) {
  const { theme } = useTheme();
  const c = CHART_COLORS[theme];

  const filteredGrowthData = useMemo(() => {
    if (timeFilter === 'All') return GROWTH_DATA;
    const now = new Date(GROWTH_DATA[GROWTH_DATA.length - 1].fullDate);
    const daysMap: Record<string, number> = { '30D': 30, '7D': 7, '24H': 1 };
    const days = daysMap[timeFilter] ?? GROWTH_DATA.length;
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - days);
    return GROWTH_DATA.filter(d => new Date(d.fullDate) >= cutoff);
  }, [timeFilter]);

  return (
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

            <CartesianGrid strokeDasharray="3 3" stroke={c.grid} vertical={false} />

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

            <Area
              yAxisId="left"
              type="monotone"
              dataKey="drawdown"
              fill="url(#drawdownGrad)"
              stroke="none"
              name="Drawdown"
            />

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
  );
}
