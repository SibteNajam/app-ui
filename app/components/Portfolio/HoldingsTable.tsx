'use client';
import { useState, useEffect, useMemo } from 'react';
import './HoldingsTable.css';

/* ═══ DATA ═══ */
const WALLET_TYPES = ['All', 'Spot', 'Funding'] as const;
type WalletType = typeof WALLET_TYPES[number];

const ASSETS = [
  { sym:'USDT', name:'Tether',      wallet:'Spot' as const,    color:'#26a17b', qty:64.389, available:64.389, price:1,     value:64.31,   pctOfPortfolio:100.0 },
  { sym:'ETHW', name:'EthereumPoW', wallet:'Funding' as const, color:'#627eea', qty:0.4297, available:0.4297, price:null as number|null,  value:0,       pctOfPortfolio:0.01  },
  { sym:'ATOM', name:'Cosmos',      wallet:'Spot' as const,    color:'#6f7390', qty:0.00514,available:0.00514,price:2.023, value:0.0104,  pctOfPortfolio:0.0   },
];

const DUST_ASSETS = [
  { sym:'ATOM', color:'#6f7390', freeBalance:0.00514, estValue:0.0104 },
];

const ConvertIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>
);

/* ═══ MAIN COMPONENT ═══ */
export default function HoldingsTable() {
  const [walletFilter, setWalletFilter] = useState<WalletType>('All');
  const [showConvert, setShowConvert] = useState(false);
  const [selectedDust, setSelectedDust] = useState<Set<string>>(new Set());
  const [animated, setAnimated] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  useEffect(() => { const t = setTimeout(() => setAnimated(true), 200); return () => clearTimeout(t); }, []);

  const filtered = useMemo(() => {
    return walletFilter === 'All' ? ASSETS : ASSETS.filter(a => a.wallet === walletFilter);
  }, [walletFilter]);

  const toggleDust = (sym: string) => {
    setSelectedDust(prev => { const n = new Set(prev); n.has(sym) ? n.delete(sym) : n.add(sym); return n; });
  };

  const totalPortfolio = ASSETS.reduce((s, a) => s + a.value, 0);

  return (
    <div className="ht-shell">
      {/* ── HEADER ── */}
      <div className="ht-header">
        <div className="ht-wallet-tabs">
          {WALLET_TYPES.map(w => (
            <button key={w} className={`ht-tab ${walletFilter === w ? 'active' : ''}`} onClick={() => setWalletFilter(w)}>{w}</button>
          ))}
        </div>
        <div className="ht-header-right">
          <div className="ht-total-chip">
            <span className="ht-total-amount">${totalPortfolio.toFixed(2)}</span>
          </div>
          <button className={`ht-convert-btn ${showConvert ? 'active' : ''}`} onClick={() => setShowConvert(v => !v)}>
            <ConvertIcon /><span>Convert</span>
          </button>
        </div>
      </div>

      {/* ── ASSET TILES ── */}
      <div className="ht-tiles">
        {filtered.map((a, i) => (
          <div
            key={a.sym}
            className={`ht-tile ${animated ? 'in' : ''} ${hoveredCard === a.sym ? 'hovered' : ''}`}
            style={{ 
              animationDelay: `${i * 0.12}s`,
              '--coin-color': a.color,
              '--coin-color-15': `${a.color}26`,
              '--coin-color-08': `${a.color}14`,
              '--coin-color-40': `${a.color}66`,
            } as React.CSSProperties}
            onMouseEnter={() => setHoveredCard(a.sym)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            {/* ── AMBIENT GLOW — color bleeds from edges ── */}
            <div className="ht-tile-glow"/>

            {/* ── GLASS REFLECTION — top highlight ── */}
            <div className="ht-tile-reflection"/>

            {/* ── INNER LIGHT EDGE — bottom ── */}
            <div className="ht-tile-edge"/>

            {/* ══ CARD CONTENT ══ */}
            <div className="ht-tile-body">

              {/* Row 1: Identity + Value */}
              <div className="ht-tile-row1">
                {/* Coin Identity Block */}
                <div className="ht-coin-block">
                  <div className="ht-coin-orb" style={{ background: `radial-gradient(circle at 35% 35%, ${a.color}55, ${a.color}11)` }}>
                    <span className="ht-coin-letter">{a.sym[0]}</span>
                    {/* Animated ring around orb */}
                    <svg className="ht-coin-ring" viewBox="0 0 52 52">
                      <circle cx="26" cy="26" r="24" fill="none" stroke={a.color} strokeWidth="1" opacity="0.2" strokeDasharray="3 5" className="ht-ring-spin"/>
                    </svg>
                  </div>
                  <div>
                    <div className="ht-coin-sym">{a.sym}</div>
                    <div className="ht-coin-name">{a.name}</div>
                  </div>
                </div>

                {/* Value Block — prominent */}
                <div className="ht-val-block">
                  <div className="ht-val-main">${a.value < 1 ? a.value.toFixed(4) : a.value.toFixed(2)}</div>
                  <div className="ht-val-badge" style={{ background: `${a.color}18`, color: a.color, borderColor: `${a.color}30` }}>
                    {a.wallet}
                  </div>
                </div>
              </div>

              {/* Row 2: Data Cells — frosted glass panels */}
              <div className="ht-tile-cells">
                <div className="ht-cell">
                  <div className="ht-cell-label">Quantity</div>
                  <div className="ht-cell-val">{a.qty.toFixed(8).replace(/\.?0+$/, '') || '0'}</div>
                </div>
                <div className="ht-cell">
                  <div className="ht-cell-label">Available</div>
                  <div className="ht-cell-val">{a.available.toFixed(8).replace(/\.?0+$/, '') || '0'}</div>
                </div>
                <div className="ht-cell">
                  <div className="ht-cell-label">Price</div>
                  <div className="ht-cell-val">{a.price !== null ? `$${a.price}` : '—'}</div>
                </div>
                <div className="ht-cell ht-cell-pct">
                  <div className="ht-cell-label">Portfolio</div>
                  <div className="ht-pct-display">
                    {/* Animated fill bar */}
                    <div className="ht-pct-track">
                      <div className="ht-pct-fill" style={{ 
                        width: animated ? `${Math.min(a.pctOfPortfolio, 100)}%` : '0%',
                        background: `linear-gradient(90deg, ${a.color}88, ${a.color})`,
                        boxShadow: `0 0 12px ${a.color}44`,
                      }}/>
                    </div>
                    <span className="ht-pct-num" style={{ color: a.pctOfPortfolio >= 50 ? a.color : '#64748b' }}>
                      {a.pctOfPortfolio < 0.01 && a.pctOfPortfolio > 0 ? '<0.01%' : `${a.pctOfPortfolio.toFixed(1)}%`}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── CONVERT DUST DRAWER ── */}
      <div className={`ht-drawer ${showConvert ? 'open' : ''}`}>
        <div className="ht-drawer-inner">
          <div className="ht-drawer-head">
            <ConvertIcon />
            <span>Convert Dust to USDT</span>
            <span className="ht-drawer-tag">Binance</span>
          </div>
          {DUST_ASSETS.map(d => (
            <div key={d.sym} className="ht-dust-item">
              <input type="checkbox" className="ht-dust-check" checked={selectedDust.has(d.sym)} onChange={() => toggleDust(d.sym)}/>
              <div className="ht-dust-orb" style={{ background: `${d.color}22`, color: d.color }}>{d.sym[0]}</div>
              <span className="ht-dust-name">{d.sym}</span>
              <div className="ht-dust-data">
                <span>{d.freeBalance}</span>
                <span className="ht-dust-est">${d.estValue.toFixed(4)}</span>
              </div>
              <button className="ht-dust-convert" disabled={!selectedDust.has(d.sym)}>Convert</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
