'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import './LiveScouter.css';

/* ─────────────────────────────────────────────────────────────
   PANEL SCOUTER — borderless, fits left-side spot trade panel
   Always live (no idle). Animates through scan → lock cycle.
   ───────────────────────────────────────────────────────────── */

const TRADES = [
  { symbol: 'TIA', pair: 'TIA/USDT', exchange: 'BINANCE', price: '$9.14', change: '+4.12%', entryPrice: '$8.76', qty: '45.2 TIA', costBasis: '$395.95', currValue: '$413.13', unrealPnl: '+$17.18', realPnl: '+$38.02', fees: '$0.42', holdTime: '2h 14m', iconColor: '#7a5af8', iconBg: 'rgba(122,90,248,0.15)', logoUrl: 'https://assets.coingecko.com/coins/images/31967/small/tia.jpg' },
  { symbol: 'SOL', pair: 'SOL/USDT', exchange: 'BINANCE', price: '$161.40', change: '+5.87%', entryPrice: '$152.80', qty: '3.5 SOL', costBasis: '$534.80', currValue: '$564.90', unrealPnl: '+$30.10', realPnl: '+$12.40', fees: '$0.78', holdTime: '5h 02m', iconColor: '#9945FF', iconBg: 'rgba(153,69,255,0.15)', logoUrl: 'https://assets.coingecko.com/coins/images/4128/small/solana.png' },
  { symbol: 'AVAX', pair: 'AVAX/USDT', exchange: 'BINANCE', price: '$38.40', change: '-2.11%', entryPrice: '$41.20', qty: '12.0 AVAX', costBasis: '$494.40', currValue: '$460.80', unrealPnl: '-$33.60', realPnl: '+$6.20', fees: '$0.55', holdTime: '1h 47m', iconColor: '#E84142', iconBg: 'rgba(232,65,66,0.15)', logoUrl: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png' },
  { symbol: 'BNB', pair: 'BNB/USDT', exchange: 'BINANCE', price: '$594.00', change: '+1.23%', entryPrice: '$587.00', qty: '0.85 BNB', costBasis: '$498.95', currValue: '$504.90', unrealPnl: '+$5.95', realPnl: '+$22.10', fees: '$0.91', holdTime: '3h 30m', iconColor: '#F0B90B', iconBg: 'rgba(240,185,11,0.15)', logoUrl: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png' },
  { symbol: 'LINK', pair: 'LINK/USDT', exchange: 'BINANCE', price: '$14.82', change: '+3.44%', entryPrice: '$14.32', qty: '28.0 LINK', costBasis: '$400.96', currValue: '$414.96', unrealPnl: '+$14.00', realPnl: '+$9.50', fees: '$0.33', holdTime: '0h 58m', iconColor: '#2A5ADA', iconBg: 'rgba(42,90,218,0.15)', logoUrl: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png' },
];

/* Coin badge — real logo from CoinGecko CDN, fallback to letter */
function CoinIcon({ color, bg, symbol, logoUrl }: { color: string; bg: string; symbol: string; logoUrl: string }) {
  const [imgOk, setImgOk] = useState(true);
  const abbr = symbol.length <= 3 ? symbol : symbol.slice(0, 2);
  return (
    <div style={{
      width: 34, height: 34, borderRadius: '50%',
      background: bg,
      border: `1.5px solid ${color}44`,
      boxShadow: `0 0 12px ${color}44`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
      overflow: 'hidden',
      transition: 'box-shadow 0.4s ease',
    }}>
      {imgOk
        ? <img
          src={logoUrl}
          alt={symbol}
          onError={() => setImgOk(false)}
          style={{ width: '22px', height: '22px', objectFit: 'contain', display: 'block' }}
        />
        : <span style={{
          fontFamily: '"Space Grotesk", sans-serif',
          fontSize: abbr.length > 2 ? '8px' : '10px',
          fontWeight: 900, color, letterSpacing: '-0.02em', lineHeight: 1,
        }}>{abbr}</span>
      }
    </div>
  );
}

/* ── ORDER FLOW TICKER ── */
const SIDES = ['BUY', 'SELL'] as const;
function OrderFlowTicker({ symbol }: { symbol: string }) {
  const [orders, setOrders] = useState<{ id: number; side: 'BUY' | 'SELL'; qty: string; price: string; fresh: boolean }[]>([]);
  const idRef = useRef(0);

  const push = useCallback((sym: string) => {
    const side = SIDES[Math.random() > 0.48 ? 0 : 1];
    const base = ({ TIA: 9.14, SOL: 161.40, AVAX: 38.40, BNB: 594.00, LINK: 14.82 } as Record<string, number>)[sym] ?? 10;
    const price = (base + (Math.random() * 0.08 - 0.04)).toFixed(3);
    const qty = (Math.random() * 40 + 0.5).toFixed(2);
    const id = ++idRef.current;
    setOrders(prev => [{ id, side, qty, price, fresh: true }, ...prev].slice(0, 6));
    setTimeout(() => setOrders(prev => prev.map(o => o.id === id ? { ...o, fresh: false } : o)), 80);
  }, []);

  useEffect(() => {
    push(symbol);
    const iv = setInterval(() => push(symbol), 700);
    return () => clearInterval(iv);
  }, [symbol, push]);

  return (
    <div className="ps-of-wrap">
      <div className="ps-of-hdr">
        <span className="ps-of-dot" />
        <span>ORDER FLOW</span>
      </div>
      <div className="ps-of-list">
        {orders.map(o => (
          <div key={o.id} className={`ps-of-row ${o.fresh ? 'fresh' : ''}`}>
            <span className={`ps-of-side ${o.side === 'BUY' ? 'buy' : 'sell'}`}>{o.side}</span>
            <span className="ps-of-qty">{o.qty}</span>
            <span className="ps-of-price">${o.price}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── ALGO INTELLIGENCE ── */
function AlgoIntelligence({ symbol }: { symbol: string }) {
  const [conf, setConf] = useState(74);
  const [metrics, setMetrics] = useState([
    { lbl: 'RSI', val: 68, color: '#ffc107' },
    { lbl: 'MACD', val: 81, color: '#0ef0ad' },
    { lbl: 'VOLUME', val: 55, color: '#00e5ff' },
    { lbl: 'SENTIMENT', val: 72, color: '#7a5af8' },
  ]);

  useEffect(() => {
    const iv = setInterval(() => {
      setConf(Math.floor(55 + Math.random() * 40));
      setMetrics(prev => prev.map(m => ({
        ...m,
        val: Math.max(20, Math.min(98, m.val + Math.floor(Math.random() * 14 - 7))),
      })));
    }, 2000);
    return () => clearInterval(iv);
  }, [symbol]);

  const isLight = typeof document !== 'undefined' ? document.documentElement.getAttribute('data-theme') === 'light' : false;

  const confColorLight = conf >= 75 ? '#059669' : conf >= 55 ? '#d97706' : '#dc2626';
  const confColorDark = conf >= 75 ? '#0ef0ad' : conf >= 55 ? '#ffc107' : '#ff4466';
  const confColor = isLight ? confColorLight : confColorDark;
  
  const verdict = conf >= 75 ? 'STRONG BUY' : conf >= 55 ? 'NEUTRAL' : 'CAUTION';

  const themeMetrics = metrics.map(m => {
    let color = m.color;
    if (isLight) {
      if (m.lbl === 'RSI') color = '#d97706'; // Amber-600
      if (m.lbl === 'MACD') color = '#059669'; // Emerald-600
      if (m.lbl === 'VOLUME') color = '#0284c7'; // Sky-600
      if (m.lbl === 'SENTIMENT') color = '#6d28d9'; // Violet-700
    }
    return { ...m, color };
  });

  return (
    <div className="ps-algo-wrap">
      <div className="ps-of-hdr">
        <span className="ps-of-dot" style={{ background: confColor, boxShadow: `0 0 6px ${confColor}` }} />
        <span>ALGO INTELLIGENCE</span>
      </div>

      {/* Confidence score */}
      <div className="ps-algo-score-row">
        <div className="ps-algo-score" style={{ color: confColor }}
          key={conf}>{conf}<span className="ps-algo-pct">%</span>
        </div>
        <div className="ps-algo-verdict" style={{ color: confColor }}>{verdict}</div>
      </div>

      {/* Signal bars */}
      <div className="ps-algo-bars">
        {themeMetrics.map(m => (
          <div className="ps-algo-bar-row" key={m.lbl}>
            <div className="ps-algo-bar-lbl">{m.lbl}</div>
            <div className="ps-algo-bar-track">
              <div
                className="ps-algo-bar-fill"
                style={{ width: `${m.val}%`, background: m.color, boxShadow: isLight ? 'none' : `0 0 6px ${m.color}66` }}
              />
              <div className="ps-algo-shimmer" />
            </div>
            <div className="ps-algo-bar-val" style={{ color: m.color }}>{m.val}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PanelScouter() {
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<'scanning' | 'locked'>('scanning');
  const [stream, setStream] = useState('');
  const [power, setPower] = useState(0);
  const [scanSym, setScanSym] = useState('---');
  const [trade, setTrade] = useState(TRADES[0]);
  const timerRef = useRef<number | null>(null);
  const tradeIndexRef = useRef(0);

  // Auto-cycle: scan → lock → scan …
  useEffect(() => {
    let scanIv: number;

    function startScan() {
      setPhase('scanning');
      setScanSym('---');
      setPower(0);

      scanIv = window.setInterval(() => {
        setPower(Math.floor(2000 + Math.random() * 6000));
        setScanSym(['BTC', 'ETH', 'SOL', 'TIA', 'AVAX', 'INJ'][Math.floor(Math.random() * 6)]);
        let s = '';
        for (let i = 0; i < 10; i++) s += Math.random().toString(16).substring(2, 6).toUpperCase() + ' ';
        setStream(s);
      }, 55);

      timerRef.current = window.setTimeout(() => {
        clearInterval(scanIv);
        // advance to next trade
        tradeIndexRef.current = (tradeIndexRef.current + 1) % TRADES.length;
        const t = TRADES[tradeIndexRef.current];
        setTrade(t);
        setPower(parseFloat(t.price.replace(/[^0-9.]/g, '')) * 100 | 0);
        setScanSym(t.symbol);
        setStream(`TARGET LOCKED // ${t.pair} // SPOT SIGNAL ACQUIRED`);
        setPhase('locked');

        // stay locked for 4s then re-scan
        timerRef.current = window.setTimeout(startScan, 4000);
      }, 2000);
    }

    startScan();
    
    // Skeleton loader timeout
    const loadT = window.setTimeout(() => setLoading(false), 4000);

    return () => {
      clearInterval(scanIv);
      clearTimeout(loadT);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const locked = phase === 'locked';

  if (loading) {
    return (
      <div className="ps-root">
        <div className="ps-lens-wrap">
          <svg viewBox="0 0 100 100" className="ps-lens-svg">
            <circle cx="50" cy="50" r="42" className="ps-lens-bg" />
            <circle cx="50" cy="50" r="24" className="ps-lens-inner" />
          </svg>
          <div className="ps-lens-core" />
        </div>
        <div className="ps-glass">
          <div className="ps-inner" style={{ padding: '24px' }}>
            <div className="skeleton-box" style={{ width: '50%', height: '14px', marginBottom: '32px' }} />
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
              <div className="skeleton-box" style={{ width: '34px', height: '34px', borderRadius: '50%' }} />
              <div className="skeleton-box" style={{ width: '120px', height: '24px' }} />
            </div>
            <div className="skeleton-box" style={{ width: '80%', height: '12px', marginBottom: '24px' }} />
            <div className="skeleton-box" style={{ width: '100%', height: '1px', marginBottom: '24px', opacity: 0.5 }} />
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
              {Array(6).fill(0).map((_, i) => (
                <div key={i}>
                  <div className="skeleton-box" style={{ width: '40%', height: '8px', marginBottom: '8px' }} />
                  <div className="skeleton-box" style={{ width: '80%', height: '16px' }} />
                </div>
              ))}
            </div>

            <div className="skeleton-box" style={{ width: '60%', height: '14px', marginBottom: '16px' }} />
            <div className="skeleton-box" style={{ width: '100%', height: '40px', marginBottom: '8px' }} />
            <div className="skeleton-box" style={{ width: '100%', height: '40px', marginBottom: '8px' }} />
            <div className="skeleton-box" style={{ width: '100%', height: '40px' }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ps-root">

      {/* ── LENS ── */}
      <div className="ps-lens-wrap">
        <svg viewBox="0 0 100 100" className="ps-lens-svg">
          <circle cx="50" cy="50" r="42" className="ps-lens-bg" />
          <circle cx="50" cy="50" r="42" className={`ps-lens-spin ${phase}`} />
          <circle cx="50" cy="50" r="24" className={`ps-lens-inner ${phase}`} />
          <path d="M 50 20 L 50 80 M 20 50 L 80 50" className="ps-crosshair" />
          {locked && <circle cx="50" cy="50" r="10" className="ps-lock-dot" />}
        </svg>
        <div className={`ps-lens-core ${phase}`} />
      </div>

      {/* ── GLASS CONTENT (appears after lens) ── */}
      <div className="ps-glass">

        {/* Subtle scan sweep */}
        {!locked && <div className="ps-sweep" />}

        {/* Grid texture */}
        <div className="ps-grid" />

        <div className="ps-inner">
          {/* Header */}
          <div className="ps-hdr">
            <span className={`ps-hdr-dot ${phase}`} />
            <span className="ps-hdr-text">
              {locked ? 'TARGET LOCKED' : 'SCANNING…'}
            </span>
          </div>

          {locked ? (
            /* ── LOCKED: show full spot data ── */
            <>
              {/* Symbol + price hero */}
              <div className="ps-hero">
                {/* Coin icon left of symbol */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                  <CoinIcon color={trade.iconColor} bg={trade.iconBg} symbol={trade.symbol} logoUrl={trade.logoUrl} />
                  <div className="ps-sym" style={{ color: trade.iconColor, textShadow: typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'light' ? 'none' : `0 0 20px ${trade.iconColor}66` }}>
                    {trade.symbol}
                  </div>
                </div>
                <div className="ps-pair">{trade.pair} · {trade.exchange}</div>
                <div className="ps-price-row">
                  <span className="ps-price">{trade.price}</span>
                  <span className="ps-chg" style={{ color: trade.change.startsWith('-') ? (typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'light' ? '#dc2626' : '#ff4466') : (typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'light' ? '#059669' : '#00e676') }}>{trade.change}</span>
                </div>
              </div>

              <div className="ps-divider" />

              {/* Unrealized P&L */}
              <div className="ps-pnl-row">
                <span className="ps-lbl">UNREALIZED P&L</span>
                <span className="ps-pnl-val" style={{ color: trade.unrealPnl.startsWith('-') ? (typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'light' ? '#dc2626' : '#ff4466') : (typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'light' ? '#059669' : '#00e676') }}>{trade.unrealPnl}</span>
              </div>

              {/* Stats grid */}
              <div className="ps-grid-data">
                {[
                  { l: 'ENTRY', v: trade.entryPrice },
                  { l: 'QTY', v: trade.qty },
                  { l: 'COST', v: trade.costBasis },
                  { l: 'VALUE', v: trade.currValue, accent: true },
                  { l: 'REALIZED', v: trade.realPnl, green: true },
                  { l: 'FEES', v: trade.fees, dim: true },
                  { l: 'HOLD', v: trade.holdTime },
                  { l: '24H CHG', v: trade.change, green: !trade.change.startsWith('-') },
                ].map(({ l, v, accent, green, dim }) => (
                  <div className="ps-cell" key={l}>
                    <div className="ps-cell-lbl">{l}</div>
                    <div className={`ps-cell-val ${accent ? 'accent' : ''} ${green ? 'green' : ''} ${dim ? 'dim' : ''}`}>{v}</div>
                  </div>
                ))}
              </div>

              {/* EQ bars — locked */}
              <div className="ps-eq">
                {[80, 40, 100, 60, 90, 30].map((h, i) => (
                  <div key={i} className="ps-eq-bar locked" style={{ height: `${h}%` }} />
                ))}
              </div>
            </>
          ) : (
            /* ── SCANNING: animated readout ── */
            <>
              <div className="ps-scan-pow-lbl">VOLATILITY_IDX</div>
              <div className="ps-scan-pow">{power}</div>
              <div className="ps-scan-sym-lbl">ASSET_DETECTED</div>
              <div className="ps-scan-sym">{scanSym}</div>
              <div className="ps-stream">{stream}</div>

              <div className="ps-eq">
                {[0.1, 0.15, 0.08, 0.12, 0.18, 0.09].map((d, i) => (
                  <div key={i} className="ps-eq-bar" style={{ animationDuration: `${d}s` }} />
                ))}
              </div>
            </>
          )}

          {/* ── ALWAYS VISIBLE: Algo Intelligence + Order Flow ── */}
          <AlgoIntelligence symbol={trade.symbol} />
          {/* <OrderFlowTicker symbol={trade.symbol} /> */}

        </div>
      </div>
    </div>
  );
}
