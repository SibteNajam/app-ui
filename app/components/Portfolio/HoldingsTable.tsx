'use client';
import { useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import './HoldingsTable.css';

const getLogoUrl = (id: string) => `https://cryptologos.cc/logos/${id}-logo.png`;

export type AssetData = {
  sym: string;
  name: string;
  color: string;
  qty: number;
  price: number;
  value: number;
  free: number;
  locked: number;
  id: string;
  wallet: string;
};

export default function HoldingsTable({ assets, walletFilter, searchQuery, isLoading }: { assets: AssetData[], walletFilter: string, searchQuery: string, isLoading?: boolean }) {
  const [imgError, setImgError] = useState<Record<string, boolean>>({});

  const filtered = assets.filter(a => {
    const matchesSearch = a.sym.toLowerCase().includes(searchQuery.toLowerCase()) || a.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesWallet = walletFilter === 'All' || a.wallet === walletFilter;
    return matchesSearch && matchesWallet;
  });

  return (
    <div className="ht-wrapper">
      <div className="ht-table-header">
        <h2 className="ht-table-title">Holdings Overview</h2>
        <div className="ht-table-actions">
          <button className="ht-icon-btn"><SlidersHorizontal size={14} /></button>
        </div>
      </div>

      <div className="ht-table-container">
        <table className="ht-main-table">
          <thead>
            <tr>
              <th className="left-align">Asset</th>
              <th className="right-align">Price</th>
              <th className="right-align">Quantity</th>
              <th className="right-align">Free</th>
              <th className="right-align">Locked</th>
              <th className="right-align">Value (USDT)</th>
              <th className="center-align">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(a => (
              <tr key={a.sym} className="ht-tr">
                <td>
                  <div className="ht-coin-cell">
                    <div className="ht-coin-logo" style={{ background: `${a.color}15`, color: a.color }}>
                      {!imgError[a.sym] ? (
                        <img 
                          src={getLogoUrl(a.id)} 
                          alt={a.sym} 
                          onError={() => setImgError(prev => ({...prev, [a.sym]: true}))}
                          className="ht-real-logo"
                        />
                      ) : (
                        a.sym[0]
                      )}
                    </div>
                    <div className="ht-coin-info">
                      <span className="ht-coin-sym ht-hover-target">{a.sym}</span>
                      <span className="ht-coin-name ht-hover-target">{a.name}</span>
                    </div>
                  </div>
                </td>
                <td className="right-align ht-td-price ht-hover-target">
                  ${a.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                </td>
                <td className="right-align ht-td-qty">
                  {a.qty.toLocaleString()}
                </td>
                <td className="right-align ht-td-qty">
                  {a.free.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                </td>
                <td className="right-align ht-td-qty" style={{ color: '#64748b' }}>
                  {a.locked.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                </td>
                <td className="right-align ht-td-val ht-hover-target">
                  ${a.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="center-align">
                  <button className="ht-action-btn">Sell</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && !isLoading && (
              <tr>
                <td colSpan={7} className="ht-empty">No assets found matching "{searchQuery}" in {walletFilter}</td>
              </tr>
            )}
            {isLoading && (
              <tr>
                <td colSpan={7} className="ht-empty">Loading assets from Binance...</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
