'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import './OrderBook.css';

/* ══════════════════════════════════════════════════════
   TYPES & CONSTANTS
   ══════════════════════════════════════════════════════ */

interface Level {
  price: number;
  qty: number;
  total: number;
  flash: 'up' | 'down' | null;
  isNew?: boolean;
}

interface OrderBookState {
  asks: Level[];
  bids: Level[];
  spread: number;
  spreadPct: number;
  midPrice: number;
  lastTradeDir: 'up' | 'down';
}

const SYMBOLS = ['BTC/USDT', 'ETH/USDT', 'SOL/USDT', 'BNB/USDT'];

const BASE_PRICES: Record<string, number> = {
  'BTC/USDT': 64820,
  'ETH/USDT': 3191,
  'SOL/USDT': 161,
  'BNB/USDT': 594,
};

const TICK_SIZES: Record<string, number> = {
  'BTC/USDT': 0.5,
  'ETH/USDT': 0.1,
  'SOL/USDT': 0.01,
  'BNB/USDT': 0.05,
};

const QTY_SCALE: Record<string, number> = {
  'BTC/USDT': 0.8,
  'ETH/USDT': 6,
  'SOL/USDT': 120,
  'BNB/USDT': 15,
};

/* ══════════════════════════════════════════════════════
   ORDER BOOK ENGINE
   ══════════════════════════════════════════════════════ */

function generateBook(
  symbol: string,
  prevAsks?: Level[],
  prevBids?: Level[]
): OrderBookState {
  const base = BASE_PRICES[symbol];
  const tick = TICK_SIZES[symbol];
  const qScale = QTY_SCALE[symbol];
  const jitter = base * 0.0008;

  // Mid price wanders slightly
  const mid = base + (Math.random() - 0.5) * jitter;

  const asks: Level[] = [];
  const bids: Level[] = [];

  // Generate 10 levels each side
  for (let i = 0; i < 10; i++) {
    const askPrice = parseFloat((mid + tick * (i + 1) + Math.random() * tick * 0.5).toFixed(
      tick < 1 ? 2 : 1
    ));
    const bidPrice = parseFloat((mid - tick * (i + 1) - Math.random() * tick * 0.5).toFixed(
      tick < 1 ? 2 : 1
    ));

    // Qty: larger near mid, smaller far out, with noise
    const depthFactor = 1 / (i * 0.3 + 1);
    const askQty = parseFloat((qScale * depthFactor * (0.5 + Math.random()) * (1 + Math.random() * 0.5)).toFixed(3));
    const bidQty = parseFloat((qScale * depthFactor * (0.5 + Math.random()) * (1 + Math.random() * 0.5)).toFixed(3));

    // Detect flash (price or qty changed significantly)
    const prevAsk = prevAsks?.[i];
    const prevBid = prevBids?.[i];

    asks.push({
      price: askPrice,
      qty: askQty,
      total: asks.reduce((s, l) => s + l.qty, 0) + askQty,
      flash: prevAsk ? (askQty > prevAsk.qty * 1.15 ? 'up' : askQty < prevAsk.qty * 0.85 ? 'down' : null) : null,
      isNew: !prevAsk,
    });

    bids.push({
      price: bidPrice,
      qty: bidQty,
      total: bids.reduce((s, l) => s + l.qty, 0) + bidQty,
      flash: prevBid ? (bidQty > prevBid.qty * 1.15 ? 'up' : bidQty < prevBid.qty * 0.85 ? 'down' : null) : null,
      isNew: !prevBid,
    });
  }

  const spread = parseFloat((asks[0].price - bids[0].price).toFixed(tick < 1 ? 2 : 1));
  const spreadPct = parseFloat(((spread / mid) * 100).toFixed(3));
  const lastTradeDir = Math.random() > 0.5 ? 'up' : 'down';

  return { asks, bids, spread, spreadPct, midPrice: mid, lastTradeDir };
}

/* ══════════════════════════════════════════════════════
   TRADE TAPE (recent executions)
   ══════════════════════════════════════════════════════ */

interface Trade {
  id: number;
  price: number;
  qty: number;
  dir: 'buy' | 'sell';
  ts: number;
}

let tradeIdCounter = 0;

function makeTrade(symbol: string, mid: number): Trade {
  const tick = TICK_SIZES[symbol];
  const qScale = QTY_SCALE[symbol];
  return {
    id: tradeIdCounter++,
    price: parseFloat((mid + (Math.random() - 0.5) * tick * 2).toFixed(tick < 1 ? 2 : 1)),
    qty: parseFloat((qScale * 0.1 * (0.2 + Math.random() * 1.5)).toFixed(3)),
    dir: Math.random() > 0.5 ? 'buy' : 'sell',
    ts: Date.now(),
  };
}

/* ══════════════════════════════════════════════════════
   FORMAT HELPERS
   ══════════════════════════════════════════════════════ */

function fmtPrice(p: number, symbol: string): string {
  const tick = TICK_SIZES[symbol];
  if (p >= 10000) return p.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  if (p >= 100) return p.toFixed(2);
  if (p >= 1) return p.toFixed(3);
  return p.toFixed(4);
}

function fmtQty(q: number): string {
  if (q >= 1000) return (q / 1000).toFixed(1) + 'K';
  if (q >= 10) return q.toFixed(1);
  return q.toFixed(3);
}

/* ══════════════════════════════════════════════════════
   DEPTH BAR COMPONENT
   ══════════════════════════════════════════════════════ */

function DepthBar({ pct, side }: { pct: number; side: 'bid' | 'ask' }) {
  return (
    <div
      className={`ob-depth-bar ob-depth-${side}`}
      style={{ width: `${Math.min(pct, 100)}%` }}
    />
  );
}

/* ══════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════ */

export default function OrderBook() {
  const [symbol, setSymbol] = useState('BTC/USDT');
  const [book, setBook] = useState<OrderBookState>(() => generateBook('BTC/USDT'));
  const [trades, setTrades] = useState<Trade[]>([]);
  const [view, setView] = useState<'book' | 'tape'>('book');
  const bookRef = useRef<OrderBookState>(book);
  const flashTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Clear flash after 400ms
  const scheduleFlashClear = useCallback((key: string) => {
    if (flashTimers.current.has(key)) clearTimeout(flashTimers.current.get(key)!);
    const t = setTimeout(() => {
      setBook(prev => {
        const asks = prev.asks.map((l, i) => i === parseInt(key.replace('a','')) ? { ...l, flash: null } : l);
        const bids = prev.bids.map((l, i) => i === parseInt(key.replace('b','')) ? { ...l, flash: null } : l);
        return { ...prev, asks, bids };
      });
    }, 400);
    flashTimers.current.set(key, t);
  }, []);

  useEffect(() => {
    bookRef.current = book;
  }, [book]);

  // Book update loop: fast & variable (like real markets)
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    
    function scheduleUpdate() {
      const delay = 200 + Math.random() * 600; // 200–800ms, irregular
      timeoutId = setTimeout(() => {
        setBook(prev => {
          const next = generateBook(symbol, prev.asks, prev.bids);
          // Schedule flash clears
          next.asks.forEach((l, i) => { if (l.flash) scheduleFlashClear(`a${i}`); });
          next.bids.forEach((l, i) => { if (l.flash) scheduleFlashClear(`b${i}`); });
          return next;
        });
        scheduleUpdate();
      }, delay);
    }

    scheduleUpdate();
    return () => clearTimeout(timeoutId);
  }, [symbol, scheduleFlashClear]);

  // Trade tape: fires randomly, faster when market is active
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    
    function scheduleTrade() {
      const delay = 150 + Math.random() * 800;
      timeoutId = setTimeout(() => {
        const mid = bookRef.current.midPrice;
        const newTrade = makeTrade(symbol, mid);
        setTrades(prev => [newTrade, ...prev].slice(0, 20));
        scheduleTrade();
      }, delay);
    }

    scheduleTrade();
    return () => clearTimeout(timeoutId);
  }, [symbol]);

  // Reset on symbol change
  useEffect(() => {
    setBook(generateBook(symbol));
    setTrades([]);
  }, [symbol]);

  const maxTotal = Math.max(
    book.asks[book.asks.length - 1]?.total ?? 1,
    book.bids[book.bids.length - 1]?.total ?? 1
  );

  const midDir = book.lastTradeDir;
  const midColor = midDir === 'up' ? '#4DB86A' : '#D65C5C';

  return (
    <div className="ob-root">
      {/* HEADER */}
      <div className="ob-header">
        <div className="ob-header-left">
          <span className="ob-diamond">◆</span>
          <span className="ob-title">ORDER BOOK</span>
          <span className={`ob-live-dot ${midDir}`} />
        </div>
        <div className="ob-sym-pills">
          {SYMBOLS.map(s => (
            <button
              key={s}
              className={`ob-sym-pill${symbol === s ? ' active' : ''}`}
              onClick={() => setSymbol(s)}
            >
              {s.replace('/USDT', '')}
            </button>
          ))}
        </div>
      </div>

      {/* VIEW TOGGLE */}
      <div className="ob-view-toggle">
        <button className={`ob-vt-btn${view === 'book' ? ' active' : ''}`} onClick={() => setView('book')}>
          DEPTH
        </button>
        <button className={`ob-vt-btn${view === 'tape' ? ' active' : ''}`} onClick={() => setView('tape')}>
          TAPE
        </button>
      </div>

      {view === 'book' ? (
        <>
          {/* COLUMN HEADERS */}
          <div className="ob-col-headers">
            <span>PRICE ({symbol.replace('/USDT','')}/USDT)</span>
            <span>QTY</span>
            <span>TOTAL</span>
          </div>

          {/* ASK LEVELS (reversed: highest at top, closest to mid at bottom) */}
          <div className="ob-asks">
            {[...book.asks].reverse().map((level, i) => (
              <div
                key={`ask-${i}`}
                className={`ob-row ob-ask-row${level.flash ? ` flash-${level.flash}` : ''}`}
              >
                <DepthBar pct={(level.total / maxTotal) * 100} side="ask" />
                <span className="ob-price ob-ask-price">{fmtPrice(level.price, symbol)}</span>
                <span className="ob-qty">{fmtQty(level.qty)}</span>
                <span className="ob-total">{fmtQty(level.total)}</span>
              </div>
            ))}
          </div>

          {/* SPREAD ROW */}
          <div className="ob-spread-row">
            <span className="ob-spread-price" style={{ color: midColor }}>
              {fmtPrice(book.midPrice, symbol)}
              <span className={`ob-spread-arrow ${midDir}`}>{midDir === 'up' ? '▲' : '▼'}</span>
            </span>
            <span className="ob-spread-label">
              SPREAD <span className="ob-spread-val">{book.spread} ({book.spreadPct}%)</span>
            </span>
          </div>

          {/* BID LEVELS */}
          <div className="ob-bids">
            {book.bids.map((level, i) => (
              <div
                key={`bid-${i}`}
                className={`ob-row ob-bid-row${level.flash ? ` flash-${level.flash}` : ''}`}
              >
                <DepthBar pct={(level.total / maxTotal) * 100} side="bid" />
                <span className="ob-price ob-bid-price">{fmtPrice(level.price, symbol)}</span>
                <span className="ob-qty">{fmtQty(level.qty)}</span>
                <span className="ob-total">{fmtQty(level.total)}</span>
              </div>
            ))}
          </div>

          {/* FOOTER STATS */}
          <div className="ob-footer">
            <div className="ob-footer-stat">
              <span className="ob-fs-label">BID VOL</span>
              <span className="ob-fs-val ob-bid-price">{fmtQty(book.bids.reduce((s,l)=>s+l.qty,0))}</span>
            </div>
            <div className="ob-footer-divider" />
            <div className="ob-footer-stat">
              <span className="ob-fs-label">IMBALANCE</span>
              <span className="ob-fs-val" style={{ color: (() => {
                const bv = book.bids.reduce((s,l)=>s+l.qty,0);
                const av = book.asks.reduce((s,l)=>s+l.qty,0);
                return bv > av ? '#4DB86A' : '#D65C5C';
              })() }}>
                {(() => {
                  const bv = book.bids.reduce((s,l)=>s+l.qty,0);
                  const av = book.asks.reduce((s,l)=>s+l.qty,0);
                  const imb = ((bv - av) / (bv + av) * 100).toFixed(1);
                  return (parseFloat(imb) > 0 ? '+' : '') + imb + '%';
                })()}
              </span>
            </div>
            <div className="ob-footer-divider" />
            <div className="ob-footer-stat">
              <span className="ob-fs-label">ASK VOL</span>
              <span className="ob-fs-val ob-ask-price">{fmtQty(book.asks.reduce((s,l)=>s+l.qty,0))}</span>
            </div>
          </div>
        </>
      ) : (
        /* TRADE TAPE VIEW */
        <div className="ob-tape">
          <div className="ob-col-headers">
            <span>PRICE</span>
            <span>QTY</span>
            <span>SIDE</span>
          </div>
          <div className="ob-tape-rows">
            {trades.map((t, i) => (
              <div
                key={t.id}
                className={`ob-tape-row ob-tape-${t.dir}${i === 0 ? ' tape-new' : ''}`}
              >
                <span className={`ob-price ob-${t.dir === 'buy' ? 'bid' : 'ask'}-price`}>
                  {fmtPrice(t.price, symbol)}
                </span>
                <span className="ob-qty">{fmtQty(t.qty)}</span>
                <span className={`ob-tape-side ob-tape-side-${t.dir}`}>{t.dir === 'buy' ? 'BUY' : 'SELL'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
