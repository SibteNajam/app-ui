'use client';
import { useTheme } from '../../context/ThemeContext';
import { seededRandom } from './chartColors';

/* ── Data ── */
const rand = seededRandom(555);

const totalWins = 211;
const totalLosses = 594;
const totalTrades = totalWins + totalLosses;
const winRate = ((totalWins / totalTrades) * 100).toFixed(1);
const avgWin = 0.67;
const avgLoss = -1.48;
const rrRatio = (Math.abs(avgWin) / Math.abs(avgLoss)).toFixed(2);
const netPnl = totalWins * avgWin + totalLosses * Math.abs(avgLoss);
const bestTrade = { amount: 4.36, ticker: 'ENSO', date: 'Feb 19' };
const worstTrade = { amount: -28.72, ticker: 'LTC', date: 'Mar 25' };
const expectancy = -0.91;
const bestStreak = 7;
const worstStreak = 30;
const winStreakCurrent = 2;
const winPnl = 141.35;
const lossPnl = -877.92;

/* ── Component ── */
export default function TradingEdge() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const winPct = (totalWins / totalTrades) * 100;
  const lossPct = 100 - winPct;

  return (
    <div className="an-chart-card an-trading-edge">
      <div className="an-chart-header">
        <div className="an-chart-title-group">
          <div>
            <h3 className="an-chart-title">TRADING EDGE</h3>
            <p className="an-chart-subtitle">
              Performance metrics across {totalTrades} completed trades
            </p>
          </div>
        </div>
        <div className="an-streak-badge">
          <span className="an-streak-dot" />
          {winStreakCurrent} Win Streak
        </div>
      </div>

      <div className="an-edge-body">
        {/* P&L Split bar */}
        <div className="an-edge-section">
          <div className="an-edge-row-between">
            <span className="an-edge-label">P&L Split</span>
            <span className="an-edge-value">{totalWins}W / {totalLosses}L</span>
          </div>
          <div className="an-edge-split-bar">
            <div className="an-edge-split-win" style={{ width: `${winPct}%` }} />
            <div className="an-edge-split-loss" style={{ width: `${lossPct}%` }} />
          </div>
          <div className="an-edge-row-between">
            <span className="an-edge-pnl positive">+${winPnl.toFixed(2)}</span>
            <span className="an-edge-pnl negative">${lossPnl.toFixed(2)}</span>
          </div>
        </div>

        {/* Key metrics row */}
        <div className="an-edge-metrics">
          <div className="an-edge-metric">
            <span className="an-edge-metric-label">R:R Ratio</span>
            <span className="an-edge-metric-value">{rrRatio}:1</span>
          </div>
          <div className="an-edge-metric">
            <span className="an-edge-metric-label">Avg Win</span>
            <span className="an-edge-metric-value positive">+${avgWin.toFixed(2)}</span>
          </div>
          <div className="an-edge-metric">
            <span className="an-edge-metric-label">Avg Loss</span>
            <span className="an-edge-metric-value negative">-${Math.abs(avgLoss).toFixed(2)}</span>
          </div>
          <div className="an-edge-metric">
            <span className="an-edge-metric-label">Win Rate</span>
            <span className="an-edge-metric-value">{winRate}%</span>
          </div>
        </div>

        {/* Best / Worst trade */}
        <div className="an-edge-trades-row">
          <div className="an-edge-trade-card best">
            <span className="an-edge-trade-label">BEST TRADE</span>
            <span className="an-edge-trade-amount positive">+${bestTrade.amount.toFixed(2)}</span>
            <span className="an-edge-trade-info">{bestTrade.ticker} · {bestTrade.date}</span>
          </div>
          <div className="an-edge-trade-card worst">
            <span className="an-edge-trade-label">WORST TRADE</span>
            <span className="an-edge-trade-amount negative">-${Math.abs(worstTrade.amount).toFixed(2)}</span>
            <span className="an-edge-trade-info">{worstTrade.ticker} · {worstTrade.date}</span>
          </div>
        </div>

        {/* Bottom stats */}
        <div className="an-edge-metrics bottom">
          <div className="an-edge-metric">
            <span className="an-edge-metric-label">Expectancy</span>
            <span className="an-edge-metric-value negative">-${Math.abs(expectancy).toFixed(2)}</span>
            <span className="an-edge-metric-sub">per trade avg</span>
          </div>
          <div className="an-edge-metric">
            <span className="an-edge-metric-label">Best Streak</span>
            <span className="an-edge-metric-value">{bestStreak}</span>
            <span className="an-edge-metric-sub">consecutive wins</span>
          </div>
          <div className="an-edge-metric">
            <span className="an-edge-metric-label">Worst Streak</span>
            <span className="an-edge-metric-value">{worstStreak}</span>
            <span className="an-edge-metric-sub">consecutive losses</span>
          </div>
        </div>
      </div>
    </div>
  );
}
