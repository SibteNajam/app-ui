'use client';
import { useState } from 'react';
import { RefreshCw, AlertCircle, DollarSign } from 'lucide-react';
import './ExchangeCard.css';

/* ══════════════════════════════════════════════════════
   EXCHANGE CARD — Shows connected exchange info
   Replicates 3Commas-style exchange card with
   balance bar, totals, and 24hr change
   ══════════════════════════════════════════════════════ */

export interface ExchangeData {
  id: string;
  name: string;
  type: string;            // e.g. "Binance Spot", "Binance Futures COIN-M"
  icon: string;            // exchange logo URL or fallback letter
  totalUsd: number;
  totalBtc: number;
  change24hUsd: number;
  change24hBtc: number;
  change24hPct: number;
  /** Allocation bar segments */
  allocations: { color: string; pct: number; label: string }[];
  /** Warning message if any */
  warning?: string;
}

interface ExchangeCardProps {
  data: ExchangeData;
  onRefresh?: (id: string) => void;
}

export default function ExchangeCard({ data, onRefresh }: ExchangeCardProps) {
  const [refreshing, setRefreshing] = useState(false);
  const isPositive = data.change24hPct >= 0;

  const handleRefresh = () => {
    setRefreshing(true);
    onRefresh?.(data.id);
    setTimeout(() => setRefreshing(false), 1200);
  };

  const fmtUsd = (v: number) => {
    if (Math.abs(v) >= 1000) return '$' + v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return '$' + v.toFixed(2);
  };

  const fmtBtc = (v: number) => v.toFixed(8) + ' BTC';
  const fmtPct = (v: number) => (v >= 0 ? '+' : '') + v.toFixed(2) + '%';

  return (
    <div className="exc-card">
      {/* Header */}
      <div className="exc-header">
        <div className="exc-header-left">
          <div className="exc-icon">
            {data.icon.startsWith('http') ? (
              <img src={data.icon} alt={data.name} className="exc-icon-img" />
            ) : (
              <DollarSign size={16} className="exc-icon-fallback" />
            )}
          </div>
          <div className="exc-header-text">
            <span className="exc-name">{data.name}</span>
            <span className="exc-type">{data.type}</span>
          </div>
        </div>
        <button
          className={`exc-refresh ${refreshing ? 'spinning' : ''}`}
          onClick={handleRefresh}
          title="Refresh"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Allocation Bar */}
      <div className="exc-alloc-bar">
        {data.allocations.map((a, i) => (
          <div
            key={i}
            className="exc-alloc-seg"
            style={{ width: `${a.pct}%`, background: a.color }}
            title={`${a.label}: ${a.pct.toFixed(1)}%`}
          />
        ))}
      </div>

      {/* Stats */}
      <div className="exc-stats">
        <div className="exc-stat-row">
          <span className="exc-stat-label">Total:</span>
          <span className="exc-stat-val">{fmtUsd(data.totalUsd)}</span>
          <span className="exc-stat-btc">{fmtBtc(data.totalBtc)}</span>
        </div>
        <div className="exc-stat-row">
          <span className="exc-stat-label">24hr changes:</span>
          <span className={`exc-stat-val ${isPositive ? 'positive' : 'negative'}`}>
            {fmtUsd(data.change24hUsd)}
          </span>
          <span className={`exc-stat-pct ${isPositive ? 'positive' : 'negative'}`}>
            {fmtPct(data.change24hPct)}
          </span>
        </div>
      </div>

      {/* Warning */}
      {data.warning && (
        <div className="exc-warning">
          <AlertCircle size={12} />
          <span>{data.warning}</span>
        </div>
      )}
    </div>
  );
}
