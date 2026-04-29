'use client';
import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import './Analytics.css';

/* ── Chart Components ── */
import PortfolioGrowthChart from './PortfolioGrowthChart';
import TradingActivityChart from './TradingActivityChart';
import DailyTradesOverview from './DailyTradesOverview';
import TopPerformers from './TopPerformers';
import TradingEdge from './TradingEdge';
import ActivityHeatmap from './ActivityHeatmap';
import TradeAllocation from './TradeAllocation';

/* ── Filter Tabs ── */
const TIME_FILTERS = ['All', '30D', '7D', '24H'] as const;
type TimeFilter = typeof TIME_FILTERS[number];

/* ═══════════════════════════════════════════════
   MAIN ANALYTICS PAGE — layout orchestrator only
   Each chart lives in its own component file
   ═══════════════════════════════════════════════ */
export default function AnalyticsPage() {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('All');
  const { theme } = useTheme();

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

      {/* ── ROW 1: Portfolio Growth + Trading Activity (top priority) ── */}
      <div className="an-charts-grid">
        <PortfolioGrowthChart timeFilter={timeFilter} />
        <TradingActivityChart />
      </div>

      {/* ── ROW 2: Daily Trades + Top Performers ── */}
      <div className="an-charts-grid">
        <DailyTradesOverview />
        <TopPerformers />
      </div>

      {/* ── ROW 3: Trading Edge + Trade Allocation ── */}
      <div className="an-charts-grid">
        <TradingEdge />
        <TradeAllocation />
      </div>

      {/* ── ROW 4: Activity Heatmap (left) + empty right ── */}
      <div className="an-charts-grid">
        <ActivityHeatmap />
        <div /> {/* spacer to keep grid alignment */}
      </div>
    </div>
  );
}
