'use client';
import { useState, useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { seededRandom } from './chartColors';

/* ── Types ── */
interface HeatmapCell {
  weekCol: number;
  dayRow: number;   // 0=Sun … 6=Sat
  trades: number;
  pnl: number;
  dateObj: Date;
  label: string;
  isExtraordinary: boolean; // >10% daily PnL
}

/* ── Generate 6 months of data (~26 week columns) ── */
function generateHalfYearData(year: number, startMonth: number): HeatmapCell[] {
  const rand = seededRandom(year * 7 + startMonth + 42);
  const cells: HeatmapCell[] = [];

  const monthStart = new Date(year, startMonth, 1);
  const monthEnd = new Date(year, startMonth + 6, 0);

  const gridStart = new Date(monthStart);
  gridStart.setDate(gridStart.getDate() - gridStart.getDay());

  const gridEnd = new Date(monthEnd);
  gridEnd.setDate(gridEnd.getDate() + (6 - gridEnd.getDay()));

  const current = new Date(gridStart);
  let weekCol = 0;

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  while (current <= gridEnd) {
    const dayRow = current.getDay();
    const inRange = current >= monthStart && current <= monthEnd;
    const label = `${months[current.getMonth()]} ${current.getDate()}, ${current.getFullYear()}`;

    let trades = 0;
    let pnl = 0;

    if (inRange) {
      const isWeekday = dayRow >= 1 && dayRow <= 5;
      const hasActivity = isWeekday ? rand() > 0.3 : rand() > 0.85;

      if (hasActivity) {
        trades = Math.floor(rand() * 25) + 1;
        // PnL can be positive or negative
        pnl = (rand() - 0.48) * trades * 3;
      }
    }

    // Extraordinary = only the very best/worst days (PnL > $30)
    const isExtraordinary = Math.abs(pnl) > 30;

    cells.push({
      weekCol,
      dayRow,
      trades: inRange ? trades : -1,
      pnl: parseFloat(pnl.toFixed(2)),
      dateObj: new Date(current),
      label,
      isExtraordinary: inRange && isExtraordinary,
    });

    current.setDate(current.getDate() + 1);
    if (current.getDay() === 0) weekCol++;
  }

  return cells;
}

/* ── Month label positions ── */
function getMonthLabels(cells: HeatmapCell[], year: number, startMonth: number) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const labels: { label: string; weekCol: number }[] = [];

  for (let m = startMonth; m < startMonth + 6; m++) {
    const mo = m % 12;
    const yr = m >= 12 ? year + 1 : year;
    const firstOfMonth = cells.find(
      c => c.dateObj.getFullYear() === yr && c.dateObj.getMonth() === mo && c.dateObj.getDate() === 1
    );
    if (firstOfMonth) {
      labels.push({ label: months[mo], weekCol: firstOfMonth.weekCol });
    }
  }
  return labels;
}

/* ── Dual intensity color: green for profit, red for loss ── */
function getCellColor(pnl: number, trades: number, maxAbsPnl: number, isDark: boolean): string {
  if (trades <= 0) {
    return isDark ? 'var(--hm-empty-dark)' : 'var(--hm-empty-light)';
  }

  if (pnl === 0) {
    return isDark ? 'var(--hm-empty-dark)' : 'var(--hm-empty-light)';
  }

  const intensity = Math.min(Math.abs(pnl) / maxAbsPnl, 1);

  if (pnl > 0) {
    // Profit: bright emerald green
    if (isDark) {
      if (intensity < 0.25) return 'rgba(52, 211, 153, 0.25)';
      if (intensity < 0.50) return 'rgba(52, 211, 153, 0.50)';
      if (intensity < 0.75) return 'rgba(52, 211, 153, 0.75)';
      return 'rgba(52, 211, 153, 1.0)';
    } else {
      if (intensity < 0.25) return 'rgba(16, 185, 129, 0.25)';
      if (intensity < 0.50) return 'rgba(16, 185, 129, 0.50)';
      if (intensity < 0.75) return 'rgba(16, 185, 129, 0.75)';
      return 'rgba(16, 185, 129, 1.0)';
    }
  } else {
    // Loss: red
    if (isDark) {
      if (intensity < 0.25) return 'rgba(239, 68, 68, 0.10)';
      if (intensity < 0.50) return 'rgba(239, 68, 68, 0.22)';
      if (intensity < 0.75) return 'rgba(239, 68, 68, 0.38)';
      return 'rgba(220, 38, 38, 0.58)';
    } else {
      if (intensity < 0.25) return 'rgba(239, 68, 68, 0.12)';
      if (intensity < 0.50) return 'rgba(239, 68, 68, 0.28)';
      if (intensity < 0.75) return 'rgba(239, 68, 68, 0.48)';
      return 'rgba(220, 38, 38, 0.72)';
    }
  }
}

/* ── Legend swatches ── */
function getGreenSwatches(isDark: boolean) {
  return isDark
    ? ['var(--hm-empty-dark)', 'rgba(52,211,153,0.25)', 'rgba(52,211,153,0.50)', 'rgba(52,211,153,0.75)', 'rgba(52,211,153,1.0)']
    : ['var(--hm-empty-light)', 'rgba(16,185,129,0.25)', 'rgba(16,185,129,0.50)', 'rgba(16,185,129,0.75)', 'rgba(16,185,129,1.0)'];
}

function getRedSwatches(isDark: boolean) {
  return isDark
    ? ['var(--hm-empty-dark)', 'rgba(239,68,68,0.10)', 'rgba(239,68,68,0.22)', 'rgba(239,68,68,0.38)', 'rgba(220,38,38,0.58)']
    : ['var(--hm-empty-light)', 'rgba(239,68,68,0.08)', 'rgba(239,68,68,0.20)', 'rgba(239,68,68,0.35)', 'rgba(220,38,38,0.55)'];
}

/* ── BytBoom Robot Icon (inline SVG — clean, bold) ── */
function RobotIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 20 20"
      fill="none"
      className="an-hm-robot-icon"
    >
      {/* Antenna ball */}
      <circle cx="10" cy="2" r="1.5" fill="#fbbf24" stroke="#0a0c10" strokeWidth="1.5" />
      {/* Antenna line */}
      <line x1="10" y1="3.5" x2="10" y2="5.5" stroke="#0a0c10" strokeWidth="1.5" />
      {/* Head */}
      <rect x="3.5" y="5.5" width="13" height="10" rx="2.5" fill="#24b0fbff" stroke="#0a0c10" strokeWidth="1.5" />
      {/* Eyes — dark circles with bright pupils */}
      <circle cx="7.2" cy="9.5" r="1.8" fill="#0a0c10" />
      <circle cx="12.8" cy="9.5" r="1.8" fill="#0a0c10" />
      <circle cx="7.2" cy="9.2" r="0.7" fill="#ffffff" />
      <circle cx="12.8" cy="9.2" r="0.7" fill="#ffffff" />
      {/* Mouth */}
      <rect x="7" y="12.5" width="6" height="1.5" rx="0.75" fill="#0a0c10" />
    </svg>
  );
}

const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

const HALF_OPTIONS = [
  { label: 'H1', startMonth: 0 },
  { label: 'H2', startMonth: 6 },
] as const;

/* ══════════════════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════════════════ */
export default function ActivityHeatmap() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [selectedHalf, setSelectedHalf] = useState<0 | 1>(0);
  const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null);

  const year = 2026;
  const startMonth = HALF_OPTIONS[selectedHalf].startMonth;

  const cells = useMemo(() => generateHalfYearData(year, startMonth), [year, startMonth]);
  const monthLabels = useMemo(() => getMonthLabels(cells, year, startMonth), [cells, year, startMonth]);
  const validCells = cells.filter(c => c.trades >= 0);
  const activeDays = validCells.filter(c => c.trades > 0).length;
  const totalTrades = validCells.reduce((s, c) => s + c.trades, 0);
  const maxAbsPnl = Math.max(...validCells.map(c => Math.abs(c.pnl)), 1);
  const totalWeeks = Math.max(...cells.map(c => c.weekCol)) + 1;
  const extraordinaryCount = validCells.filter(c => c.isExtraordinary).length;

  const greenSwatches = getGreenSwatches(isDark);
  const redSwatches = getRedSwatches(isDark);

  return (
    <div className="an-chart-card an-heatmap">
      <div className="an-hm-header">
        <div>
          <h3 className="an-chart-title">ACTIVITY HEATMAP</h3>
          <p className="an-chart-subtitle">
            {totalTrades} trades · {activeDays} active days
            {extraordinaryCount > 0 && (
              <> · <span className="an-hm-extra-count">{extraordinaryCount} standout days</span></>
            )}
          </p>
        </div>

        <div className="an-hm-years">
          {HALF_OPTIONS.map((opt, i) => (
            <button
              key={opt.label}
              className={`an-hm-year-btn ${selectedHalf === i ? 'active' : ''}`}
              onClick={() => setSelectedHalf(i as 0 | 1)}
            >
              {opt.label} {year}
            </button>
          ))}
        </div>
      </div>

      <div className="an-hm-scroll-container">
        <div className="an-hm-content">
          {/* Month labels row */}
          <div className="an-hm-month-row">
            <div className="an-hm-day-col" />
            <div className="an-hm-months-track" style={{ gridTemplateColumns: `repeat(${totalWeeks}, 1fr)` }}>
              {monthLabels.map((m, i) => (
                <span
                  key={i}
                  className="an-hm-month-label"
                  style={{ gridColumnStart: m.weekCol + 1 }}
                >
                  {m.label}
                </span>
              ))}
            </div>
          </div>

          {/* Grid area */}
          <div className="an-hm-grid-area">
            <div className="an-hm-day-col">
              {DAY_LABELS.map((d, i) => (
                <span key={i} className="an-hm-day-label">{d}</span>
              ))}
            </div>

            <div
              className="an-hm-cells"
              style={{ gridTemplateColumns: `repeat(${totalWeeks}, 1fr)` }}
            >
              {Array.from({ length: totalWeeks }, (_, weekIdx) =>
                Array.from({ length: 7 }, (__, dayIdx) => {
                  const cell = cells.find(c => c.weekCol === weekIdx && c.dayRow === dayIdx);
                  const key = `${weekIdx}-${dayIdx}`;

                  if (!cell || cell.trades < 0) {
                    return <div key={key} className="an-hm-cell an-hm-cell-outside" />;
                  }

                  const bg = getCellColor(cell.pnl, cell.trades, maxAbsPnl, isDark);
                  const isHovered = hoveredCell === cell;

                  return (
                    <div
                      key={key}
                      className={`an-hm-cell ${cell.trades > 0 ? 'has-data' : ''} ${cell.isExtraordinary ? 'extraordinary' : ''}`}
                      style={{ background: bg }}
                      onMouseEnter={() => setHoveredCell(cell)}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      {cell.isExtraordinary && (
                        <span className="an-hm-robot-wrap">
                          <RobotIcon size={9} />
                        </span>
                      )}
                      {/* Tooltip on hover */}
                      {isHovered && cell.trades > 0 && (
                        <div className="an-hm-tooltip">
                          <div className="an-hm-tooltip-date">{cell.label}</div>
                          <div className="an-hm-tooltip-row">
                            <span>Trades</span>
                            <span className="an-hm-tooltip-val">{cell.trades}</span>
                          </div>
                          <div className="an-hm-tooltip-row">
                            <span>P&L</span>
                            <span className={`an-hm-tooltip-val ${cell.pnl >= 0 ? 'positive' : 'negative'}`}>
                              {cell.pnl >= 0 ? '+' : ''}${cell.pnl.toFixed(2)}
                            </span>
                          </div>
                          {cell.isExtraordinary && (
                            <div className="an-hm-tooltip-badge">
                              🤖 Standout Day
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar: dual legends */}
      <div className="an-hm-bottom">
        <div className="an-hm-legend">
          <span className="an-hm-legend-text loss-text">Loss</span>
          {[...redSwatches].reverse().map((color, i) => (
            <span key={`r${i}`} className="an-hm-legend-swatch" style={{ background: color }} />
          ))}
          <span className="an-hm-legend-text">Less</span>
          <span className="an-hm-legend-gap" />
          <span className="an-hm-legend-text">More</span>
          {greenSwatches.map((color, i) => (
            <span key={`g${i}`} className="an-hm-legend-swatch" style={{ background: color }} />
          ))}
          <span className="an-hm-legend-text win-text">Profit</span>
        </div>
      </div>
    </div>
  );
}
