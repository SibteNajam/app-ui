'use client';
import { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { seededRandom } from './chartColors';

/* ── Types ── */
interface AllocationItem {
  symbol: string;
  trades: number;
  pct: number;
  color: string;
}

type ViewMode = 'Symbol' | 'Outcome';

/* ── Palette ── */
const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280',
];

/* ── Data generator ── */
function generateAllocationData(): AllocationItem[] {
  const rand = seededRandom(888);
  const symbols = [
    'BANANAS31', 'ZRO', 'BTC', 'DEXE', 'FET',
  ];

  const rawTrades = symbols.map(() => Math.floor(rand() * 30) + 5);
  const othersCount = Math.floor(rand() * 300) + 400;
  const totalTrades = rawTrades.reduce((s, t) => s + t, 0) + othersCount;

  const items: AllocationItem[] = symbols.map((sym, i) => ({
    symbol: sym,
    trades: rawTrades[i],
    pct: parseFloat(((rawTrades[i] / totalTrades) * 100).toFixed(1)),
    color: COLORS[i],
  }));

  items.push({
    symbol: `Others (172)`,
    trades: othersCount,
    pct: parseFloat(((othersCount / totalTrades) * 100).toFixed(1)),
    color: '#4b5563',
  });

  return items;
}

const ALLOCATION_DATA = generateAllocationData();
const totalTrades = ALLOCATION_DATA.reduce((s, d) => s + d.trades, 0);
const top5Pct = ALLOCATION_DATA.slice(0, 5).reduce((s, d) => s + d.pct, 0).toFixed(0);

/* ── Donut Chart (SVG) ── */
function DonutChart({ data, size = 120 }: { data: AllocationItem[]; size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size / 2 - 2;
  const innerR = outerR * 0.62;

  let cumAngle = -90; // start from top

  const arcs = data.map((item) => {
    const angle = (item.pct / 100) * 360;
    const startAngle = cumAngle;
    cumAngle += angle;
    const endAngle = cumAngle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1Outer = cx + outerR * Math.cos(startRad);
    const y1Outer = cy + outerR * Math.sin(startRad);
    const x2Outer = cx + outerR * Math.cos(endRad);
    const y2Outer = cy + outerR * Math.sin(endRad);

    const x1Inner = cx + innerR * Math.cos(endRad);
    const y1Inner = cy + innerR * Math.sin(endRad);
    const x2Inner = cx + innerR * Math.cos(startRad);
    const y2Inner = cy + innerR * Math.sin(startRad);

    const largeArc = angle > 180 ? 1 : 0;

    const d = [
      `M ${x1Outer} ${y1Outer}`,
      `A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2Outer} ${y2Outer}`,
      `L ${x1Inner} ${y1Inner}`,
      `A ${innerR} ${innerR} 0 ${largeArc} 0 ${x2Inner} ${y2Inner}`,
      'Z',
    ].join(' ');

    return { d, color: item.color, symbol: item.symbol };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="an-alloc-donut">
      {arcs.map((arc, i) => (
        <path
          key={i}
          d={arc.d}
          fill={arc.color}
          stroke="rgba(0,0,0,0.3)"
          strokeWidth={1}
          className="an-alloc-arc"
        />
      ))}
      {/* Center label */}
      <text x={cx} y={cy - 6} textAnchor="middle" className="an-alloc-center-label">ALL</text>
      <text x={cx} y={cy + 12} textAnchor="middle" className="an-alloc-center-count">{totalTrades} trades</text>
    </svg>
  );
}

/* ── Component ── */
export default function TradeAllocation() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [viewMode, setViewMode] = useState<ViewMode>('Symbol');

  const winRate = 26.2;
  const profitFactor = 0.05;
  const symbolsCount = 177;

  return (
    <div className="an-chart-card an-trade-alloc">
      <div className="an-chart-header">
        <div className="an-chart-title-group">
          <div>
            <h3 className="an-chart-title">TRADE ALLOCATION</h3>
            <p className="an-chart-subtitle">
              {symbolsCount} symbols traded · Top 5 represent {top5Pct}% of all trades
            </p>
          </div>
        </div>
        <div className="an-alloc-toggle">
          {(['Symbol', 'Outcome'] as ViewMode[]).map(m => (
            <button
              key={m}
              className={`an-alloc-toggle-btn ${viewMode === m ? 'active' : ''}`}
              onClick={() => setViewMode(m)}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="an-alloc-body">
        {/* Left: Donut */}
        <div className="an-alloc-donut-wrap">
          <DonutChart data={ALLOCATION_DATA} size={130} />
        </div>

        {/* Right: Legend list */}
        <div className="an-alloc-legend">
          {ALLOCATION_DATA.map((item, i) => (
            <div key={i} className="an-alloc-legend-row">
              <span className="an-alloc-legend-dot" style={{ background: item.color }} />
              <span className="an-alloc-legend-symbol">{item.symbol}</span>
              <span className="an-alloc-legend-bar-wrap">
                <span
                  className="an-alloc-legend-bar"
                  style={{ width: `${Math.min(item.pct * 1.2, 100)}%`, background: item.color }}
                />
              </span>
              <span className="an-alloc-legend-pct">{item.pct}%</span>
              <span className="an-alloc-legend-trades">{item.trades}tdr</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom stats */}
      <div className="an-alloc-stats">
        <div className="an-alloc-stat">
          <span className="an-alloc-stat-label">WIN RATE</span>
          <span className="an-alloc-stat-value" style={{ color: '#34d399' }}>{winRate}%</span>
        </div>
        <div className="an-alloc-stat">
          <span className="an-alloc-stat-label">PROFIT FACTOR</span>
          <span className="an-alloc-stat-value">{profitFactor}</span>
        </div>
        <div className="an-alloc-stat">
          <span className="an-alloc-stat-label">SYMBOLS</span>
          <span className="an-alloc-stat-value">{symbolsCount}</span>
        </div>
      </div>
    </div>
  );
}
