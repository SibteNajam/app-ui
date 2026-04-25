'use client';
import { useState, useMemo } from 'react';
import './TradeCalendar.css';

/* ═══ DATA ═══ */
const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_LABELS = ['S','M','T','W','T','F','S'];

interface TradeDay {
  day: number;
  trades: number;
  pnl: number; // positive = profit, negative = loss
  volume: number;
  pairs: string[];
}

// Mock trade data for April 2026
const TRADE_DATA: Record<number, TradeDay> = {
  1: { day:1, trades:2, pnl:12.5, volume:320, pairs:['BTC/USDT','ETH/USDT'] },
  3: { day:3, trades:1, pnl:-5.2, volume:150, pairs:['SOL/USDT'] },
  4: { day:4, trades:3, pnl:28.7, volume:890, pairs:['BTC/USDT','ARB/USDT','BNB/USDT'] },
  7: { day:7, trades:1, pnl:8.3, volume:210, pairs:['ETH/USDT'] },
  9: { day:9, trades:4, pnl:42.1, volume:1250, pairs:['BTC/USDT','SOL/USDT','ETH/USDT','BNB/USDT'] },
  10: { day:10, trades:2, pnl:-15.8, volume:480, pairs:['ARB/USDT','BTC/USDT'] },
  12: { day:12, trades:1, pnl:6.2, volume:180, pairs:['BNB/USDT'] },
  15: { day:15, trades:3, pnl:33.5, volume:920, pairs:['BTC/USDT','ETH/USDT','SOL/USDT'] },
  17: { day:17, trades:2, pnl:-8.4, volume:340, pairs:['BTC/USDT','ARB/USDT'] },
  18: { day:18, trades:1, pnl:11.2, volume:290, pairs:['ETH/USDT'] },
  21: { day:21, trades:5, pnl:67.3, volume:2100, pairs:['BTC/USDT','ETH/USDT','SOL/USDT','BNB/USDT','ARB/USDT'] },
  22: { day:22, trades:2, pnl:14.6, volume:430, pairs:['BTC/USDT','SOL/USDT'] },
  24: { day:24, trades:1, pnl:-3.1, volume:90, pairs:['ARB/USDT'] },
  25: { day:25, trades:3, pnl:22.8, volume:780, pairs:['BTC/USDT','ETH/USDT','BNB/USDT'] },
};

/* ═══ ICONS ═══ */
const ChevLeft = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>;
const ChevRight = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 6 15 12 9 18"/></svg>;

/* ═══ COMPONENT ═══ */
export default function TradeCalendar() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const today = now.getDate();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();

  // Calendar grid
  const calDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [year, month]);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
    setSelectedDay(null);
  };

  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
    setSelectedDay(null);
  };

  const selectedTrade = selectedDay ? TRADE_DATA[selectedDay] || null : null;

  // Monthly summary
  const monthlySummary = useMemo(() => {
    const trades = Object.values(TRADE_DATA);
    return {
      totalTrades: trades.reduce((s, t) => s + t.trades, 0),
      totalPnl: trades.reduce((s, t) => s + t.pnl, 0),
      winDays: trades.filter(t => t.pnl > 0).length,
      lossDays: trades.filter(t => t.pnl < 0).length,
    };
  }, []);

  const getDayIntensity = (day: number): string => {
    const trade = TRADE_DATA[day];
    if (!trade) return '';
    if (trade.trades >= 4) return 'intense';
    if (trade.trades >= 2) return 'medium';
    return 'light';
  };

  return (
    <div className="tc-card">
      {/* ── HEADER ── */}
      <div className="tc-header">
        <div className="tc-month-nav">
          <button className="tc-nav-btn" onClick={prevMonth}><ChevLeft /></button>
          <span className="tc-month-label">{MONTH_NAMES[month]} {year}</span>
          <button className="tc-nav-btn" onClick={nextMonth}><ChevRight /></button>
        </div>
        <div className="tc-summary-pills">
          <div className="tc-pill">
            <span className="tc-pill-val">{monthlySummary.totalTrades}</span>
            <span className="tc-pill-label">Trades</span>
          </div>
          <div className="tc-pill tc-pill-pnl" data-positive={monthlySummary.totalPnl >= 0}>
            <span className="tc-pill-val">{monthlySummary.totalPnl >= 0 ? '+' : ''}${monthlySummary.totalPnl.toFixed(1)}</span>
            <span className="tc-pill-label">P&L</span>
          </div>
        </div>
      </div>

      {/* ── CALENDAR GRID ── */}
      <div className="tc-grid">
        {/* Day labels */}
        {DAY_LABELS.map((d, i) => (
          <div key={`lbl-${i}`} className="tc-day-label">{d}</div>
        ))}

        {/* Days */}
        {calDays.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} className="tc-cell tc-empty" />;
          const trade = TRADE_DATA[day];
          const isToday = isCurrentMonth && day === today;
          const isSelected = day === selectedDay;
          const intensity = getDayIntensity(day);

          return (
            <button
              key={day}
              className={`tc-cell ${trade ? 'has-trade' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${intensity}`}
              onClick={() => setSelectedDay(day === selectedDay ? null : day)}
            >
              <span className="tc-cell-num">{day}</span>
              {trade && (
                <div className="tc-cell-dots">
                  {Array.from({ length: Math.min(trade.trades, 4) }).map((_, di) => (
                    <span
                      key={di}
                      className="tc-dot"
                      style={{ background: trade.pnl >= 0 ? '#34d399' : '#f87171' }}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Win / Loss day bar ── */}
      <div className="tc-winloss-bar">
        <div className="tc-wl-segment tc-wl-win" style={{ flex: monthlySummary.winDays }}>
          <span>{monthlySummary.winDays} Win</span>
        </div>
        <div className="tc-wl-segment tc-wl-loss" style={{ flex: monthlySummary.lossDays }}>
          <span>{monthlySummary.lossDays} Loss</span>
        </div>
      </div>

      {/* ── TRADE DETAIL SLIDE-UP ── */}
      <div className={`tc-detail ${selectedTrade ? 'open' : ''}`}>
        {selectedTrade && (
          <div className="tc-detail-inner">
            <div className="tc-detail-header">
              <div className="tc-detail-date">
                <span className="tc-detail-day">{selectedTrade.day}</span>
                <span className="tc-detail-month">{MONTH_NAMES[month].slice(0, 3)}</span>
              </div>
              <div className="tc-detail-stats">
                <div className="tc-dstat">
                  <span className="tc-dstat-val">{selectedTrade.trades}</span>
                  <span className="tc-dstat-label">Trades</span>
                </div>
                <div className="tc-dstat">
                  <span className={`tc-dstat-val ${selectedTrade.pnl >= 0 ? 'tc-green' : 'tc-red'}`}>
                    {selectedTrade.pnl >= 0 ? '+' : ''}${selectedTrade.pnl.toFixed(1)}
                  </span>
                  <span className="tc-dstat-label">P&L</span>
                </div>
                <div className="tc-dstat">
                  <span className="tc-dstat-val">${selectedTrade.volume.toLocaleString()}</span>
                  <span className="tc-dstat-label">Volume</span>
                </div>
              </div>
            </div>
            <div className="tc-pairs">
              {selectedTrade.pairs.map(p => (
                <span key={p} className="tc-pair-chip">{p}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
