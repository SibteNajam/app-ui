'use client';
import { useState } from 'react';
import { ArrowUpRight, ArrowDownRight, ChevronDown, ChevronUp } from 'lucide-react';
import './AssetTable.css';

/* ══════════════════════════════════════════════════════
   ASSET TABLE — Portfolio asset holdings list
   Shows coin icon, name, holdings, value, allocation %,
   24hr change with sparkline-style indicator
   ══════════════════════════════════════════════════════ */

export interface Asset {
  symbol: string;
  name: string;
  icon?: string;
  holdings: number;
  avgBuyPrice: number;
  currentPrice: number;
  valueUsd: number;
  valueBtc: number;
  allocationPct: number;
  change24h: number;
  change24hPct: number;
  exchange: string;
}

interface AssetTableProps {
  assets: Asset[];
}

type SortKey = 'symbol' | 'valueUsd' | 'allocationPct' | 'change24hPct' | 'holdings';
type SortDir = 'asc' | 'desc';

export default function AssetTable({ assets }: AssetTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('valueUsd');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sorted = [...assets].sort((a, b) => {
    const mul = sortDir === 'asc' ? 1 : -1;
    if (sortKey === 'symbol') return mul * a.symbol.localeCompare(b.symbol);
    return mul * ((a[sortKey] as number) - (b[sortKey] as number));
  });

  const fmtUsd = (v: number) => {
    if (v >= 1000) return '$' + v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (v >= 1) return '$' + v.toFixed(2);
    return '$' + v.toFixed(4);
  };

  const fmtPct = (v: number) => (v >= 0 ? '+' : '') + v.toFixed(2) + '%';

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ChevronDown size={10} className="at-sort-icon idle" />;
    return sortDir === 'asc'
      ? <ChevronUp size={10} className="at-sort-icon active" />
      : <ChevronDown size={10} className="at-sort-icon active" />;
  };

  return (
    <div className="at-wrapper">
      <table className="at-table">
        <thead>
          <tr>
            <th className="at-th at-th-asset" onClick={() => handleSort('symbol')}>
              Asset <SortIcon col="symbol" />
            </th>
            <th className="at-th at-th-right" onClick={() => handleSort('holdings')}>
              Holdings <SortIcon col="holdings" />
            </th>
            <th className="at-th at-th-right" onClick={() => handleSort('valueUsd')}>
              Value <SortIcon col="valueUsd" />
            </th>
            <th className="at-th at-th-right" onClick={() => handleSort('allocationPct')}>
              Allocation <SortIcon col="allocationPct" />
            </th>
            <th className="at-th at-th-right" onClick={() => handleSort('change24hPct')}>
              24h Change <SortIcon col="change24hPct" />
            </th>
            <th className="at-th at-th-right">Avg. Buy</th>
            <th className="at-th at-th-right">Price</th>
            <th className="at-th at-th-right">Exchange</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((asset) => {
            const isPositive = asset.change24hPct >= 0;
            const pnl = asset.valueUsd - (asset.holdings * asset.avgBuyPrice);
            const pnlPositive = pnl >= 0;

            return (
              <tr
                key={`${asset.symbol}-${asset.exchange}`}
                className={`at-row ${hoveredRow === asset.symbol ? 'hovered' : ''}`}
                onMouseEnter={() => setHoveredRow(asset.symbol)}
                onMouseLeave={() => setHoveredRow(null)}
              >
                {/* Asset */}
                <td className="at-td at-td-asset">
                  <div className="at-asset-cell">
                    <div className="at-coin-icon">
                      {asset.icon ? (
                        <img src={asset.icon} alt={asset.symbol} className="at-coin-img" crossOrigin="anonymous" />
                      ) : (
                        <span className="at-coin-letter">{asset.symbol[0]}</span>
                      )}
                    </div>
                    <div className="at-coin-info">
                      <span className="at-coin-sym">{asset.symbol}</span>
                      <span className="at-coin-name">{asset.name}</span>
                    </div>
                  </div>
                </td>

                {/* Holdings */}
                <td className="at-td at-td-right">
                  <span className="at-val-main">{asset.holdings.toLocaleString(undefined, { maximumFractionDigits: 6 })}</span>
                  <span className="at-val-sub">{asset.symbol}</span>
                </td>

                {/* Value */}
                <td className="at-td at-td-right">
                  <div className="at-val-stack">
                    <span className="at-val-main">{fmtUsd(asset.valueUsd)}</span>
                    <span className={`at-pnl-badge ${pnlPositive ? 'pos' : 'neg'}`}>
                      {pnlPositive ? '+' : ''}{fmtUsd(pnl)}
                    </span>
                  </div>
                </td>

                {/* Allocation */}
                <td className="at-td at-td-right">
                  <div className="at-alloc-cell">
                    <div className="at-alloc-bar-bg">
                      <div
                        className="at-alloc-bar-fill"
                        style={{ width: `${Math.min(100, asset.allocationPct)}%` }}
                      />
                    </div>
                    <span className="at-alloc-val">{asset.allocationPct.toFixed(1)}%</span>
                  </div>
                </td>

                {/* 24h Change */}
                <td className="at-td at-td-right">
                  <div className={`at-change ${isPositive ? 'pos' : 'neg'}`}>
                    {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    <span>{fmtPct(asset.change24hPct)}</span>
                  </div>
                </td>

                {/* Avg Buy */}
                <td className="at-td at-td-right at-val-dimmed">
                  {fmtUsd(asset.avgBuyPrice)}
                </td>

                {/* Current Price */}
                <td className="at-td at-td-right at-val-main">
                  {fmtUsd(asset.currentPrice)}
                </td>

                {/* Exchange */}
                <td className="at-td at-td-right">
                  <span className="at-exchange-badge">{asset.exchange}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
