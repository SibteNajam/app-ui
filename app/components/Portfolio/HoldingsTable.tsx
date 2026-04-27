'use client';
import { useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import './HoldingsTable.css';

const getLogoUrl = (id: string) => `https://cryptologos.cc/logos/${id}-logo.png`;

const ASSETS = [
  { sym:'USDT', name:'Tether', color:'#26a17b', qty: 64.389, price: 1.00, value: 64.389, free: 64.389, locked: 0, id: 'tether-usdt', wallet: 'Spot' },
  { sym:'BTC', name:'Bitcoin', color:'#f59e0b', qty: 0.0938, price: 57034.20, value: 5349.81, free: 0.0938, locked: 0, id: 'bitcoin-btc', wallet: 'Spot' },
  { sym:'ETH', name:'Ethereum', color:'#627eea', qty: 0.5939, price: 3185.70, value: 1892.10, free: 0.5939, locked: 0, id: 'ethereum-eth', wallet: 'Funding' },
  { sym:'SOL', name:'Solana', color:'#9945ff', qty: 12.40, price: 162.29, value: 2012.40, free: 10.0, locked: 2.40, id: 'solana-sol', wallet: 'Spot' },
  { sym:'BNB', name:'BNB', color:'#f0b90b', qty: 3.20, price: 593.75, value: 1900.00, free: 3.20, locked: 0, id: 'bnb-bnb', wallet: 'Spot' },
  { sym:'ARB', name:'Arbitrum', color:'#28b9ef', qty: 250.0, price: 1.12, value: 280.00, free: 200.0, locked: 50.0, id: 'arbitrum-arb', wallet: 'Funding' },
];

export default function HoldingsTable({ walletFilter, searchQuery }: { walletFilter: string, searchQuery: string }) {
  const [imgError, setImgError] = useState<Record<string, boolean>>({});

  const filtered = ASSETS.filter(a => {
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
              <th>Asset</th>
              <th className="right-align">Price</th>
              <th className="right-align">Quantity</th>
              <th className="right-align">Value (USDT)</th>
              <th className="right-align">Free</th>
              <th className="right-align">Locked</th>
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
                      <span className="ht-coin-sym">{a.sym}</span>
                      <span className="ht-coin-name">{a.name}</span>
                    </div>
                  </div>
                </td>
                <td className="right-align ht-td-price">
                  ${a.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                </td>
                <td className="right-align ht-td-qty">
                  {a.qty.toLocaleString()}
                </td>
                <td className="right-align ht-td-val">
                  ${a.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="right-align ht-td-free">
                  {a.free.toLocaleString()}
                </td>
                <td className="right-align ht-td-locked">
                  {a.locked.toLocaleString()}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="ht-empty">No assets found matching "{searchQuery}" in {walletFilter}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
