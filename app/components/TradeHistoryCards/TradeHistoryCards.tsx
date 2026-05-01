'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';
import './TradeHistoryCards.css';

/* ══════════════════════════════════════════════════════
   SPOT TRADE DATA
   ══════════════════════════════════════════════════════ */

interface TradeData {
  sym: string; pair: string; qty: string; buyAt: number; sellAt: number; vol: string; pnl: number; roi: number;
}

const POOL: TradeData[] = [
  { sym: 'BTC', pair: 'BTC/USDT SPOT', qty: '0.048 BTC', buyAt: 62400, sellAt: 64820, vol: '$3,110', pnl: 116.16, roi: 3.88 },
  { sym: 'ETH', pair: 'ETH/USDT SPOT', qty: '1.40 ETH', buyAt: 3050, sellAt: 3191, vol: '$4,467', pnl: 197.40, roi: 4.62 },
  { sym: 'SOL', pair: 'SOL/USDT SPOT', qty: '12.5 SOL', buyAt: 168.50, sellAt: 161.0, vol: '$2,012', pnl: -93.75, roi: -4.45 },
  { sym: 'BNB', pair: 'BNB/USDT SPOT', qty: '3.20 BNB', buyAt: 582.00, sellAt: 594.0, vol: '$1,900', pnl: 38.40, roi: 2.06 },
  { sym: 'AVAX', pair: 'AVAX/USDT SPOT', qty: '18.0 AVAX', buyAt: 40.20, sellAt: 38.40, vol: '$691', pnl: -32.40, roi: -4.48 },
  { sym: 'ARB', pair: 'ARB/USDT SPOT', qty: '250 ARB', buyAt: 1.04, sellAt: 1.12, vol: '$280', pnl: 20.00, roi: 7.69 },
  { sym: 'LINK', pair: 'LINK/USDT SPOT', qty: '30.0 LINK', buyAt: 14.40, sellAt: 14.82, vol: '$444', pnl: 12.60, roi: 2.92 },
  { sym: 'INJ', pair: 'INJ/USDT SPOT', qty: '4.50 INJ', buyAt: 31.70, sellAt: 28.60, vol: '$128', pnl: -13.95, roi: -9.78 },
  { sym: 'TIA', pair: 'TIA/USDT SPOT', qty: '55.0 TIA', buyAt: 8.80, sellAt: 9.14, vol: '$502', pnl: 18.70, roi: 3.86 },
  { sym: 'WIF', pair: 'WIF/USDT SPOT', qty: '40.0 WIF', buyAt: 3.02, sellAt: 2.87, vol: '$114', pnl: -6.00, roi: -4.97 },
  { sym: 'JUP', pair: 'JUP/USDT SPOT', qty: '100 JUP', buyAt: 0.88, sellAt: 0.94, vol: '$94', pnl: 6.00, roi: 6.82 },
  { sym: 'SEI', pair: 'SEI/USDT SPOT', qty: '120 SEI', buyAt: 0.65, sellAt: 0.61, vol: '$73', pnl: -4.80, roi: -6.15 },
];

function getCoinColors(sym: string) {
  return ({
    BTC: { neon: '255,170,0', dark: '40,30,0', hex: '#ffaa00' },
    ETH: { neon: '98,126,234', dark: '20,15,50', hex: '#627eea' },
    SOL: { neon: '0,255,136', dark: '8,20,25', hex: '#00ff88' },
    BNB: { neon: '240,165,23', dark: '40,30,0', hex: '#f0a517' },
    AVAX: { neon: '232,65,66', dark: '40,15,15', hex: '#e84142' },
    ARB: { neon: '40,185,239', dark: '15,25,50', hex: '#28b9ef' },
    LINK: { neon: '84,71,255', dark: '15,12,50', hex: '#5447ff' },
    INJ: { neon: '244,208,63', dark: '40,35,0', hex: '#f4d03f' },
    TIA: { neon: '98,71,234', dark: '20,15,50', hex: '#6247ea' },
    WIF: { neon: '139,95,191', dark: '30,20,45', hex: '#8b5fbf' },
    JUP: { neon: '255,215,0', dark: '40,35,0', hex: '#ffd700' },
    SEI: { neon: '32,185,163', dark: '10,30,25', hex: '#20b9a3' },
  } as Record<string, { neon: string; dark: string; hex: string }>)[sym] || { neon: '0,255,136', dark: '8,20,25', hex: '#00ff88' };
}

const fmtPrice = (v: number) => v >= 1000
  ? '$' + v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })
  : '$' + v.toFixed(v < 1 ? 3 : 2);

/* ══════════════════════════════════════════════════════
   SINGLE FLIP CARD COMPONENT
   ══════════════════════════════════════════════════════ */

function FlipCard({ data, logoUrl, entering }: { data: TradeData; logoUrl?: string; entering?: boolean }) {
  const c = getCoinColors(data.sym);
  const win = data.pnl >= 0;
  const pnlStr = (win ? '+$' : '−$') + Math.abs(data.pnl).toFixed(2);
  const roiStr = (data.roi >= 0 ? '+' : '') + data.roi.toFixed(2) + '%';
  const fee = (Math.abs(data.pnl) * 0.0015).toFixed(2);

  return (
    <div
      className={`th-card${entering ? ' entering' : ''}`}
      style={{ '--neon-rgb': c.neon, '--dark-rgb': c.dark, '--hex-color': c.hex } as React.CSSProperties}
    >
      <div className="th-shell">
        <div className="th-face th-front">
          <div className="d7p-header">
            <span className="d7p-label">TRADE COMPLETED</span>
            <span className={`d7p-status-dot ${win ? 'pos' : 'neg'}`} />
          </div>
          <div className="d7p-logo-wrap">
            <div className="d7p-ring" />
            <div className="d7p-ring-outer" />
            <div className="d7p-logo-slot">
              {logoUrl ? (
                <img className="d7p-logo-img" src={logoUrl} alt={data.sym} crossOrigin="anonymous" />
              ) : (
                <div className="d7p-logo-letter">{data.sym[0]}</div>
              )}
            </div>
          </div>
          <div className="d7p-info">
            <div className="d7p-sym">{data.sym}</div>
            <div className="d7p-pair">{data.pair}</div>
            <div className="d7p-badges">
              <span className={`th-badge ${win ? 'long' : 'short'}`}>{win ? 'PROFIT' : 'LOSS'}</span>
              <span className="d7p-lev">{data.qty}</span>
            </div>
          </div>
          <div className="d7p-footer">
            <span className="d7p-hint">↻ HOVER FOR DETAILS</span>
          </div>
        </div>
        <div className="th-face th-back">
          <div className="th-back-glow" />

          <div className="d7p-b-header">
            <div className="d7p-b-title">
              {logoUrl ? <img className="d7p-b-logo" src={logoUrl} alt={data.sym} crossOrigin="anonymous" /> : <div className="d7p-b-logo-letter">{data.sym[0]}</div>}
              <span>{data.sym} // SPOT</span>
            </div>
            <div className={`d7p-b-roi ${win ? 'pos' : 'neg'}`}>{roiStr}</div>
          </div>

          <div className="d7p-b-hero">
            <div className="d7p-b-hero-lbl">NET PROFIT</div>
            <div className={`d7p-b-hero-val ${win ? 'pos' : 'neg'}`}>{pnlStr}</div>
          </div>

          <div className="d7p-b-grid">
            <div className="d7p-g-item">
              <span className="d7p-g-lbl">ENTRY</span>
              <span className="d7p-g-val" style={{ color: '#E8EAF6' }}>{fmtPrice(data.buyAt)}</span>
            </div>
            <div className="d7p-g-item">
              <span className="d7p-g-lbl">EXIT</span>
              <span className="d7p-g-val" style={{ color: '#E8EAF6' }}>{fmtPrice(data.sellAt)}</span>
            </div>
            <div className="d7p-g-item">
              <span className="d7p-g-lbl">VOLUME</span>
              <span className="d7p-g-val">{data.vol}</span>
            </div>
            <div className="d7p-g-item">
              <span className="d7p-g-lbl">EST. FEE</span>
              <span className="d7p-g-val">${fee}</span>
            </div>
          </div>

          <div className="d7p-b-footer">
            <span>EXECUTED VIA VAULTBOT</span>
          </div>
        </div>
      </div>
    </div>
  );
}


/* ══════════════════════════════════════════════════════
   TRADE HISTORY CARDS COMPONENT
   ══════════════════════════════════════════════════════ */

export default function TradeHistoryCards() {
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<TradeData[]>([]);
  const [logos, setLogos] = useState<Record<string, string>>({});
  const [toast, setToast] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const { theme } = useTheme();
  const trackRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const dealIdxRef = useRef(7);

  /* Logo fetching */
  const fetchLogo = useCallback(async (sym: string) => {
    const name = sym.toLowerCase();
    const unsupported = ['sei', 'arb', 'tia', 'inj', 'sui', 'wif', 'jup'];
    if (unsupported.includes(name)) return null;

    const url = `https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/128/color/${name}.png`;
    try { const r = await fetch(url, { mode: 'cors' }); if (r.ok) return url; } catch { /* next */ }
    return null;
  }, []);

  /* Init cards */
  useEffect(() => {
    setIsMounted(true);
    const initial = POOL.slice(0, 7);
    setCards(initial);
    initial.forEach(d => {
      fetchLogo(d.sym).then(url => {
        if (url) setLogos(prev => ({ ...prev, [d.sym]: url }));
      });
    });

    const loadT = setTimeout(() => setLoading(false), 4000);
    return () => clearTimeout(loadT);
  }, [fetchLogo]);

  /* Auto deal new cards */
  useEffect(() => {
    const interval = setInterval(() => {
      const data = POOL[dealIdxRef.current % POOL.length];
      dealIdxRef.current++;

      setCards(prev => [...prev, data]);
      fetchLogo(data.sym).then(url => {
        if (url) setLogos(prev => ({ ...prev, [data.sym]: url }));
      });

      setToast(`✦ ${data.sym} spot trade closed`);
      setTimeout(() => setToast(''), 2400);

      setTimeout(() => {
        if (wrapRef.current) wrapRef.current.scrollTo({ left: wrapRef.current.scrollWidth, behavior: 'smooth' });
      }, 120);
    }, 14000);

    return () => clearInterval(interval);
  }, [fetchLogo]);

  if (!isMounted || loading) {
    const isLight = theme === 'light';
    const cardBg = isLight ? '#f8fafc' : 'rgba(17, 24, 39, 0.4)';
    const cardBorder = isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)';

    return (
      <div className="history-section">
        <div className="track-wrap" ref={wrapRef} style={{ overflow: 'hidden' }}>
          <div className="track">
            {Array(7).fill(0).map((_, i) => (
              <div key={i} style={{ 
                width: '190px', height: '260px', borderRadius: '12px', flexShrink: 0,
                background: cardBg, border: `1px solid ${cardBorder}`, padding: '20px 16px',
                display: 'flex', flexDirection: 'column'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <div className="skeleton-box" style={{ width: '100px', height: '10px' }} />
                  <div className="skeleton-box" style={{ width: '6px', height: '6px', borderRadius: '50%' }} />
                </div>
                
                <div className="skeleton-box" style={{ width: '46px', height: '46px', borderRadius: '50%', marginBottom: '24px' }} />
                
                <div className="skeleton-box" style={{ width: '70px', height: '24px', marginBottom: '8px' }} />
                <div className="skeleton-box" style={{ width: '110px', height: '12px', marginBottom: '20px' }} />
                
                <div style={{ display: 'flex', gap: '8px', marginBottom: 'auto' }}>
                  <div className="skeleton-box" style={{ width: '56px', height: '22px', borderRadius: '4px' }} />
                  <div className="skeleton-box" style={{ width: '72px', height: '22px', borderRadius: '4px' }} />
                </div>

                <div className="skeleton-box" style={{ width: '130px', height: '10px', alignSelf: 'center', marginTop: 'auto' }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="history-section">
      {/* <div className="sec-hd">
        <span className="sec-title">
          <span className="sec-dot" />
          Trade History // Completed Spot Trades
        </span>
        <span className="sec-count">{cards.length} RECORD{cards.length === 1 ? '' : 'S'}</span>
      </div> */}
      <div className="track-wrap" ref={wrapRef}>
        <div className="track" ref={trackRef}>
          {cards.map((d, i) => (
            <FlipCard key={`${d.sym}-${i}`} data={d} logoUrl={logos[d.sym]} entering={i >= 7} />
          ))}
        </div>
      </div>
      <div className={`th-toast${toast ? ' on' : ''}`}>{toast}</div>
    </div>
  );
}
