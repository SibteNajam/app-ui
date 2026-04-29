'use client';
import { useTheme } from '../../context/ThemeContext';
import { seededRandom } from './chartColors';

/* ── Data types ── */
interface PerformerDatum {
  ticker: string;
  loss: number;   // negative value
  gain: number;   // positive value
  lossLabel: string;
  gainLabel: string;
}

/* ── Data generator ── */
function generatePerformersData(): PerformerDatum[] {
  const rand = seededRandom(999);
  const tickers = ['BANANAS31', 'ENJ', 'BTC', 'SUPER', 'LDO'];
  const winners = ['GPS', 'ENSO', 'FORM', 'TIA', 'PLUME'];

  return tickers.map((ticker, i) => {
    const loss = -(rand() * 100 + 20);
    const gain = rand() * 15 + 1;
    return {
      ticker,
      loss: parseFloat(loss.toFixed(1)),
      gain: parseFloat(gain.toFixed(1)),
      lossLabel: `$${Math.abs(loss).toFixed(1)}`,
      gainLabel: `+$${gain.toFixed(1)}`,
    };
  });
}

const PERFORMERS_DATA = generatePerformersData();

// Find the leader
const leaderIdx = PERFORMERS_DATA.reduce((bestIdx, d, i, arr) => 
  d.gain > arr[bestIdx].gain ? i : bestIdx, 0);

const winnerTickers = ['GPS', 'ENSO', 'FORM', 'TIA', 'PLUME'];

/* ── Component ── */
export default function TopPerformers() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const maxLoss = Math.max(...PERFORMERS_DATA.map(d => Math.abs(d.loss)));
  const maxGain = Math.max(...PERFORMERS_DATA.map(d => d.gain));

  return (
    <div className="an-chart-card an-top-performers">
      <div className="an-chart-header">
        <div className="an-chart-title-group">
          <div>
            <h3 className="an-chart-title">TOP PERFORMERS</h3>
            <p className="an-chart-subtitle">
              Leader: GPS · +$6.82 · 64% win rate · 11 trades
            </p>
          </div>
        </div>
      </div>

      <div className="an-perf-table">
        {/* Column headers */}
        <div className="an-perf-header-row">
          <span className="an-perf-header-cell" />
          <span className="an-perf-header-cell an-perf-losers-label">LOSERS</span>
          <span className="an-perf-header-cell an-perf-winners-label">WINNERS</span>
          <span className="an-perf-header-cell" />
        </div>

        {PERFORMERS_DATA.map((d, i) => {
          const lossWidth = (Math.abs(d.loss) / maxLoss) * 100;
          const gainWidth = (d.gain / maxGain) * 100;

          return (
            <div key={d.ticker} className="an-perf-row">
              {/* Left ticker */}
              <span className="an-perf-ticker">{d.ticker}</span>

              {/* Diverging bars */}
              <div className="an-perf-bar-container">
                {/* Loss bar (grows from center-left) */}
                <div className="an-perf-loss-side">
                  <div
                    className="an-perf-bar an-perf-bar-loss"
                    style={{ width: `${lossWidth}%` }}
                  />
                  <span className="an-perf-bar-label loss">${Math.abs(d.loss).toFixed(1)}</span>
                  <span className="an-perf-bar-label gain">+${d.gain.toFixed(1)}</span>
                </div>

                {/* Gain bar (grows from center-right) */}
                <div className="an-perf-gain-side">
                  <div
                    className="an-perf-bar an-perf-bar-gain"
                    style={{ width: `${gainWidth}%` }}
                  />
                </div>
              </div>

              {/* Right winner ticker */}
              <span className="an-perf-ticker right">{winnerTickers[i]}</span>
            </div>
          );
        })}
      </div>

      <div className="an-chart-footer">
        <span className="an-chart-footer-label">$112.9</span>
        <span className="an-chart-footer-label">$0</span>
        <span className="an-chart-footer-label">+$112.9</span>
      </div>
    </div>
  );
}
