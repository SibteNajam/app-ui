'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useTheme } from '../../context/ThemeContext';
import './RotatingRingCards.css';

/* ══════════════════════════════════════════════════════
   DATA & CONFIG
   ══════════════════════════════════════════════════════ */

const POOL = [
  { sym: 'BTC', pair: 'BTC/USDT', price: 64820, change: 3.42, vol: '$42.1B', dir: 'SPOT BUY', lev: '10x', pnl: 420.30 },
  { sym: 'ETH', pair: 'ETH/USDT', price: 3191, change: -1.18, vol: '$18.4B', dir: 'SPOT BUY', lev: '5x', pnl: -88.50 },
  { sym: 'SOL', pair: 'SOL/USDT', price: 161, change: 5.67, vol: '$4.2B', dir: 'SPOT BUY', lev: '3x', pnl: 310.80 },
  { sym: 'BNB', pair: 'BNB/USDT', price: 594, change: 1.23, vol: '$1.8B', dir: 'SPOT BUY', lev: '7x', pnl: 199.70 },
  { sym: 'AVAX', pair: 'AVAX/USDT', price: 38.4, change: -2.11, vol: '$620M', dir: 'SPOT BUY', lev: '4x', pnl: -44.20 },
  { sym: 'ARB', pair: 'ARB/USDT', price: 1.12, change: 7.34, vol: '$310M', dir: 'SPOT BUY', lev: '5x', pnl: 88.60 },
  { sym: 'LINK', pair: 'LINK/USDT', price: 14.82, change: 0.88, vol: '$540M', dir: 'SPOT BUY', lev: '3x', pnl: 22.10 },
];

type TradeData = typeof POOL[0];

function getCoinColors(symbol: string) {
  const colorMap: Record<string, { neon: string; dark: string; hex: string }> = {
    BTC: { neon: '255,170,0', dark: '40,30,0', hex: '#ffaa00' },
    ETH: { neon: '98,126,234', dark: '20,15,50', hex: '#627eea' },
    SOL: { neon: '0,255,136', dark: '8,20,25', hex: '#00ff88' },
    BNB: { neon: '240,165,23', dark: '40,30,0', hex: '#f0a517' },
    AVAX: { neon: '232,65,66', dark: '40,15,15', hex: '#e84142' },
    ARB: { neon: '40,185,239', dark: '15,25,50', hex: '#28b9ef' },
    LINK: { neon: '84,71,255', dark: '15,12,50', hex: '#5447ff' },
  };
  return colorMap[symbol] || { neon: '0,255,136', dark: '8,20,25', hex: '#00ff88' };
}

// jsDelivr CDN — sends Access-Control-Allow-Origin: * → safe for canvas drawImage()
// Source: npm package cryptocurrency-icons (atomiclabs)
const COINGECKO_URLS: Record<string, string> = {
  BTC:  'https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/128/color/btc.png',
  ETH:  'https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/128/color/eth.png',
  SOL:  'https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/128/color/sol.png',
  BNB:  'https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/128/color/bnb.png',
  AVAX: 'https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/128/color/avax.png',
  LINK: 'https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/128/color/link.png',
};



/* ══════════════════════════════════════════════════════
   POPUP COMPONENT
   ══════════════════════════════════════════════════════ */

function PopupCard({ data, onClose }: { data: TradeData | null; onClose: () => void }) {
  if (!data) return null;

  const ip = data.change >= 0;
  const acc = ip ? '#4DB86A' : '#D65C5C';
  const pnlVal = (data.pnl >= 0 ? '+$' : '−$') + Math.abs(data.pnl).toFixed(2);
  const changePct = (ip ? '+' : '') + data.change.toFixed(2) + '%';
  const winRateNum = ip ? 68.4 : 54.2;
  const avgProfit = ip ? '+$' + (Math.abs(data.pnl) * 0.42).toFixed(2) : '-$' + (Math.abs(data.pnl) * 0.28).toFixed(2);
  const maxDD = '-$' + (Math.abs(data.pnl) * 0.28).toFixed(2);

  const livePrice = data.price * (1 + (Math.random() * 0.02 - 0.005));
  const entryPrice = data.price;
  const tpPrice = ip ? data.price * 1.05 : data.price * 0.95;
  const lockPrice = ip ? data.price * 1.02 : data.price * 0.98;
  const slPrice = ip ? data.price * 0.92 : data.price * 1.08;

  const fmtP = (p: number) => p >= 1000 ? '$' + p.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) : p >= 10 ? '$' + p.toFixed(2) : '$' + p.toFixed(4);

  const priceRange = Math.abs(tpPrice - slPrice);
  const nodePos = (price: number) => {
    if (ip) return ((price - slPrice) / priceRange) * 100;
    return ((slPrice - price) / priceRange) * 100;
  };
  const lockPos = nodePos(lockPrice);
  const entryPos = nodePos(entryPrice);
  const currentPos = Math.max(0, Math.min(100, nodePos(livePrice)));

  const inProfit = ip ? livePrice > lockPrice : livePrice < lockPrice;
  const livePnlVal = ((livePrice - entryPrice) / entryPrice * 100);
  const livePnlStr = (livePnlVal >= 0 ? '+' : '') + livePnlVal.toFixed(2) + '%';
  const trades = Math.floor(12 + Math.random() * 30);
  const timeStr = `${Math.floor(Math.random() * 12) + 1}h ${Math.floor(Math.random() * 60)}m ago`;

  return (
    <div className={`popup-overlay visible`} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="popup-card">
        <button className="popup-close" onClick={onClose}>×</button>
        <div id="popupContent">
          <div className="cm-header">
            <div className="cm-logo" style={{ borderColor: acc + '30' }}>
              <span className="cm-letter" style={{ color: acc }}>{data.sym.charAt(0)}</span>
              <div className="cm-logo-ring" style={{ borderTopColor: acc }} />
            </div>
            <div className="cm-header-info">
              <div className="cm-sym">{data.sym}USDT</div>
              <div className="cm-pair">{data.pair} PERPETUAL</div>
              <div className="cm-badge" style={{ borderColor: acc + '30', background: acc + '0a', color: acc }}>
                <span className="cm-badge-dot" style={{ background: acc }} />
                {ip ? 'ACTIVE' : 'AT RISK'}
              </div>
            </div>
          </div>

          <div className="cm-body-split">
            <div className="cm-body-left">
              <div className="cm-pnl-section">
                <div className="cm-price-row">
                  <span className="cm-price">${data.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  <span className={`cm-change ${ip ? 'up' : 'down'}`}>{changePct}</span>
                </div>
                <div className="cm-pnl-label">TOTAL PNL</div>
                <div className={`cm-pnl ${ip ? 'pos' : 'neg'}`} style={{ color: acc }}>{pnlVal}</div>
              </div>

              <div className="cm-stats">
                <div className="cm-stat"><div className="cm-stat-label">TYPE</div><div className="cm-stat-val" style={{ color: acc }}>{data.dir}</div></div>
                <div className="cm-stat"><div className="cm-stat-label">VOLUME</div><div className="cm-stat-val">{data.vol}</div></div>
                <div className="cm-stat"><div className="cm-stat-label">AVG PROFIT</div><div className="cm-stat-val" style={{ color: acc }}>{avgProfit}</div></div>
                <div className="cm-stat"><div className="cm-stat-label">MAX DRAWDOWN</div><div className="cm-stat-val" style={{ color: '#D65C5C' }}>{maxDD}</div></div>
              </div>

              <div className="cm-winrate-section">
                <div className="cm-wr-header">
                  <span className="cm-wr-label">WIN RATE</span>
                  <span className="cm-wr-val" style={{ color: acc }}>{winRateNum}%</span>
                </div>
                <div className="cm-wr-track">
                  <div className="cm-wr-fill" style={{ width: winRateNum + '%', background: acc }} />
                </div>
              </div>
            </div>

            <div className="cm-body-right">
              <div className="vb-tracker-wrap">
                <div className="vb-tracker-header">
                  <span className="vb-tracker-pair">{data.sym}<em>USDT</em></span>
                  <span className={`vb-long-badge${ip ? '' : ' short'}`}>{ip ? '▲ SPOT' : '▼ SPOT'}</span>
                </div>
                <div className="vb-column">
                  <div className="vb-labels-left">
                    <div className="vb-label-left tp-color" style={{ top: '0%' }}><div className="vb-lbl-tag tp-color">TP</div><div className="vb-lbl-price">{fmtP(tpPrice)}</div></div>
                    <div className="vb-label-left tl-color" style={{ top: `${100 - lockPos}%` }}><div className="vb-lbl-tag tl-color">TL</div><div className="vb-lbl-price">{fmtP(lockPrice)}</div></div>
                    <div className="vb-label-left e-color" style={{ top: `${100 - entryPos}%` }}><div className="vb-lbl-tag e-color">E</div><div className="vb-lbl-price">{fmtP(entryPrice)}</div></div>
                    <div className="vb-label-left sl-color" style={{ top: '100%' }}><div className="vb-lbl-tag sl-color">SL</div><div className="vb-lbl-price">{fmtP(slPrice)}</div></div>
                  </div>
                  <div className="vb-track-col">
                    <div className="vb-track">
                      <div className="vb-fill-profit" style={{ height: `${100 - currentPos}%` }} />
                      <div className="vb-fill-entry-lock" style={{ top: `${100 - lockPos}%`, height: `${lockPos - entryPos}%` }} />
                      <div className="vb-fill-loss" />
                      <div className={`vb-mkt-dot${!inProfit ? ' neg' : ''}`} style={{ top: `${100 - currentPos}%` }} />
                      <div className="vb-tick tp-tick" style={{ top: '0%' }}><div className="vb-tick-dash" /></div>
                      <div className="vb-tick tl-tick" style={{ top: `${100 - lockPos}%` }}><div className="vb-tick-dash" /></div>
                      <div className="vb-tick e-tick" style={{ top: `${100 - entryPos}%` }}><div className="vb-tick-dash" /></div>
                      <div className="vb-tick sl-tick" style={{ top: '100%' }}><div className="vb-tick-dash" /></div>
                    </div>
                  </div>
                  <div className="vb-labels-right">
                    <div className="vb-label-right mk-color" style={{ top: `${100 - currentPos}%` }}>
                      <div className="vb-lbl-tag mk-color">{fmtP(livePrice)}</div>
                      <div className="vb-lbl-price mk-color">NOW</div>
                    </div>
                  </div>
                </div>
                <div className="vb-footer">
                  <div className="vb-stat"><div className="vb-stat-lbl">LIVE P&L</div><div className="vb-stat-val" style={{ color: acc }}>{livePnlStr}</div></div>
                  <div className="vb-stat" style={{ textAlign: 'right' }}><div className="vb-stat-lbl">LOCK P&L</div><div className="vb-stat-val" style={{ color: '#ffc107' }}>+{((lockPrice - entryPrice) / entryPrice * 100).toFixed(2)}%</div></div>
                  <div className="vb-stat"><div className="vb-stat-lbl">PNL</div><div className="vb-stat-val" style={{ color: acc }}>{pnlVal}</div></div>
                  <div className="vb-stat" style={{ textAlign: 'right' }}><div className="vb-stat-lbl">VOLUME</div><div className="vb-stat-val" style={{ color: 'rgba(255,255,255,0.7)' }}>{data.vol}</div></div>
                </div>
              </div>
            </div>
          </div>

          <div className="cm-bottom">
            <div className="cm-bottom-item"><div className="cm-bottom-label">LIQUIDITY</div><div className="cm-bottom-val">HIGH</div></div>
            <div className="cm-bottom-item"><div className="cm-bottom-label">TRADES</div><div className="cm-bottom-val">{trades}</div></div>
            <div className="cm-bottom-item"><div className="cm-bottom-label">TIME</div><div className="cm-bottom-val">{timeStr}</div></div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   ROTATING RING CARDS COMPONENT (Canvas-based)
   ══════════════════════════════════════════════════════ */

interface RCard {
  data: TradeData;
  angle: number;
  entryDone: boolean;
  entryAnim: number;
  logoImg: HTMLImageElement | null;
  tradeTime: string;
}

interface Star { x: number; y: number; r: number; a: number; ph: number; sp: number; }
interface Particle { x: number; y: number; vx: number; vy: number; r: number; life: number; maxLife: number; }
interface HitRect { px: number; py: number; w: number; h: number; depth: number; idx: number; }

export default function RotatingRingCards() {
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const logoImgsRef = useRef<Record<string, HTMLImageElement>>({});
  const [popupData, setPopupData] = useState<TradeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [skelDims, setSkelDims] = useState({ cw: 175, ch: 271, rx: 380, rcx: 500, rcy: 300 });
  const [isMounted, setIsMounted] = useState(false);
  const { theme } = useTheme();

  useEffect(() => {
    setIsMounted(true);
    function updateSkel() {
      if (!canvasRef.current || !canvasRef.current.parentElement) return;
      const rw = canvasRef.current.parentElement.offsetWidth;
      const rh = canvasRef.current.parentElement.offsetHeight;
      const cw = Math.min(rw * 0.16, 175);
      const rx = Math.min(rw * 0.42, 380);
      setSkelDims({ cw, ch: cw * 1.55, rx, rcx: rw / 2, rcy: rh * 0.50 });
    }
    updateSkel();
    window.addEventListener('resize', updateSkel);
    
    const t = setTimeout(() => setLoading(false), 4000);
    return () => { clearTimeout(t); window.removeEventListener('resize', updateSkel); };
  }, []);

  // Pre-load all logos: crossOrigin MUST be set before src to avoid canvas taint
  useEffect(() => {
    Object.entries(COINGECKO_URLS).forEach(([sym, url]) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';       // <-- set BEFORE src
      img.onload  = () => { logoImgsRef.current[sym] = img; };
      img.onerror = () => { /* letter fallback stays */ };
      img.src = url;                       // <-- triggers fetch in CORS mode
    });
  }, []);

  // Use refs for all mutable state to avoid re-renders
  const stateRef = useRef({
    RW: 0, RH: 0, RCX: 0, RCY: 0, RX: 0, RY: 0, CW: 0, CH: 0,
    rCards: [] as RCard[],
    rVel: 0.0055,
    rDrag: false,
    rLx: 0, rLvx: 0, rMdx: 0, rMdy: 0, rMdt: 0,
    rPaused: false,
    rTime: 0,
    rHitList: [] as HitRect[],
    particles: [] as Particle[],
    stars: [] as Star[],
    dealIdx: 7,
    animId: 0,
    dealInterval: 0,
  });

  const openPopup = useCallback((data: TradeData) => {
    setPopupData(data);
  }, []);

  const closePopup = useCallback(() => {
    setPopupData(null);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const s = stateRef.current;

    /* ── Helpers ── */
    function resize() {
      const el = canvas!.parentElement!;
      s.RW = el.offsetWidth; s.RH = el.offsetHeight;
      canvas!.width = s.RW; canvas!.height = s.RH;
      s.RCX = s.RW / 2; // Center exactly as it is flanked by two side panels
      s.RCY = s.RH * 0.50;
      s.RX = Math.min(s.RW * 0.42, 380);
      s.RY = s.RX * 0.28;
      s.CW = Math.min(s.RW * 0.16, 175);
      s.CH = s.CW * 1.55;
    }


    function initRCards() {
      s.rCards = [];
      POOL.slice(0, 7).forEach((d, i) => {
        const th = Math.floor(Math.random() * 12) + 1;
        const tm = Math.floor(Math.random() * 60);
        // logoImg is no longer used — canvas reads from logoImgsRef instead
        const card: RCard = { data: d, angle: (i / 7) * Math.PI * 2, entryDone: true, entryAnim: 1, logoImg: null, tradeTime: `${th}h ${tm}m ago` };
        s.rCards.push(card);
      });
    }

    function getT(a: number) {
      const si = Math.sin(a), co = Math.cos(a);
      const depth = (si + 1) / 2;
      const sc = .58 + .54 * depth;
      return { x: s.RCX + s.RX * co, y: s.RCY + s.RY * si, scale: sc, depth, alpha: .22 + .78 * depth, sinA: si, cosA: co };
    }

    function rrx(x: number, y: number, w: number, h: number, r: number) {
      ctx!.beginPath();
      ctx!.moveTo(x + r, y); ctx!.lineTo(x + w - r, y);
      ctx!.arc(x + w - r, y + r, r, -Math.PI / 2, 0);
      ctx!.lineTo(x + w, y + h - r); ctx!.arc(x + w - r, y + h - r, r, 0, Math.PI / 2);
      ctx!.lineTo(x + r, y + h); ctx!.arc(x + r, y + h - r, r, Math.PI / 2, Math.PI);
      ctx!.lineTo(x, y + r); ctx!.arc(x + r, y + r, r, Math.PI, -Math.PI / 2);
      ctx!.closePath();
    }

    function drawBg() {
      ctx!.clearRect(0, 0, s.RW, s.RH);
    }

    function drawCard(card: RCard): HitRect | null {
      const t = getT(card.angle), c = card.data;
      const ep = card.entryDone ? 1 : Math.min(1, card.entryAnim);
      const w = s.CW * t.scale, h = s.CH * t.scale;
      const px = t.x - w / 2, py = t.y - h / 2;
      const ip = c.change >= 0;
      const acc = ip ? '#4DB86A' : '#D65C5C';
      const rgb = ip ? '77,184,106' : '214,92,92';

      if (!Number.isFinite(px) || !Number.isFinite(py) || !Number.isFinite(w) || !Number.isFinite(h)) {
        return null;
      }

      const isLight = document.documentElement.getAttribute('data-theme') === 'light';

      ctx!.save();
      ctx!.globalAlpha = t.alpha * ep;

      const pulse = 0.5 + 0.5 * Math.sin(s.rTime * 2 + card.angle);
      if (t.sinA > 0) { 
        ctx!.shadowBlur = (17 + 8 * pulse) * t.scale; 
        ctx!.shadowColor = isLight ? `rgba(0, 0, 0, ${0.06 + 0.04 * pulse})` : `rgba(${rgb}, ${0.16 + 0.10 * pulse})`; 
      }

      rrx(px, py, w, h, 12 * t.scale);
      const bg = ctx!.createLinearGradient(px, py, px + w, py + h);
      if (isLight) {
        bg.addColorStop(0, 'rgba(255,255,255,0.98)'); bg.addColorStop(0.5, 'rgba(250,252,255,1)'); bg.addColorStop(1, 'rgba(245,248,255,1)');
      } else {
        bg.addColorStop(0, 'rgba(17,24,39,0.95)'); bg.addColorStop(0.5, 'rgba(10,14,26,0.98)'); bg.addColorStop(1, 'rgba(7,10,20,1)');
      }
      ctx!.fillStyle = bg; ctx!.fill(); ctx!.shadowBlur = 0;

      const isFront = t.sinA > -0.15;
      if (isFront) {
        ctx!.beginPath(); ctx!.lineWidth = 0.8 * t.scale; ctx!.strokeStyle = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.04)';
        for (let i = 8; i < h; i += 5 * t.scale) { ctx!.moveTo(px + 3 * t.scale, py + i); ctx!.lineTo(px + w - 3 * t.scale, py + i); }
        ctx!.stroke();

        rrx(px, py, w, h, 12 * t.scale); ctx!.strokeStyle = `rgba(${rgb}, ${0.3 + 0.2 * pulse})`; ctx!.lineWidth = 1 * t.scale; ctx!.stroke();

        ctx!.beginPath(); ctx!.lineWidth = 2 * t.scale; ctx!.strokeStyle = acc;
        ctx!.moveTo(px + 20 * t.scale, py); ctx!.lineTo(px, py); ctx!.lineTo(px, py + 20 * t.scale); ctx!.stroke();

        const m = 12 * t.scale, ir = 14 * t.scale;
        ctx!.beginPath(); ctx!.arc(px + m + ir, py + m + ir, ir, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${rgb}, 0.08)`; ctx!.fill();
        ctx!.strokeStyle = `rgba(${rgb}, 0.4)`; ctx!.lineWidth = 0.5 * t.scale; ctx!.stroke();

        ctx!.beginPath(); ctx!.arc(px + m + ir, py + m + ir, ir + 3 * t.scale, s.rTime * 2, s.rTime * 2 + Math.PI * 0.6);
        ctx!.strokeStyle = acc; ctx!.lineWidth = 1.2 * t.scale; ctx!.stroke();

        const logoImgEl = logoImgsRef.current[c.sym];
        if (logoImgEl && logoImgEl.complete && logoImgEl.naturalWidth > 0) {
          const logoSize = ir * 1.8;
          ctx!.save(); ctx!.beginPath(); ctx!.arc(px + m + ir, py + m + ir, ir - 1, 0, Math.PI * 2); ctx!.clip();
          ctx!.drawImage(logoImgEl, px + m + ir - logoSize / 2, py + m + ir - logoSize / 2, logoSize, logoSize);
          ctx!.restore();
        } else {
          ctx!.fillStyle = acc; ctx!.font = `800 ${12 * t.scale}px Space Mono`; ctx!.textAlign = 'center'; ctx!.textBaseline = 'middle';
          ctx!.fillText(c.sym.slice(0, 1), px + m + ir, py + m + ir + 0.5);
        }

        const pw = 52 * t.scale, ph = 15 * t.scale;
        const px2 = px + w - m - pw - 2 * t.scale, py2 = py + m;
        rrx(px2, py2, pw, ph, ph / 2); ctx!.fillStyle = isLight ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0.5)'; ctx!.fill();
        ctx!.strokeStyle = `rgba(${rgb}, 0.4)`; ctx!.lineWidth = 0.8 * t.scale; ctx!.stroke();

        const dr = 2.5 * t.scale;
        ctx!.beginPath(); ctx!.arc(px2 + 9 * t.scale, py2 + ph / 2, dr, 0, Math.PI * 2);
        ctx!.fillStyle = acc; ctx!.globalAlpha = t.alpha * ep * (0.4 + 0.6 * pulse); ctx!.fill();
        ctx!.globalAlpha = t.alpha * ep;

        ctx!.fillStyle = acc; ctx!.font = `700 ${7.5 * t.scale}px Space Mono`; ctx!.textAlign = 'left'; ctx!.textBaseline = 'middle';
        ctx!.fillText(ip ? 'ACTIVE' : 'RISK', px2 + 16 * t.scale, py2 + ph / 2 + 1 * t.scale);

        ctx!.fillStyle = isLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.2)'; ctx!.font = `600 ${6 * t.scale}px Space Mono`;
        ctx!.textAlign = 'right'; ctx!.textBaseline = 'alphabetic'; ctx!.fillText("SEC_LVL: 04", px + w - m, py + h - m);
        ctx!.textAlign = 'left'; ctx!.textBaseline = 'alphabetic'; ctx!.fillText(`SIG_CONF: ${(70 + (Math.abs(card.angle * 10) % 20)).toFixed(0)}%`, px + m, py + h - m);

        const contentY = py + m + ir * 2 + 15 * t.scale;
        ctx!.fillStyle = isLight ? '#1e293b' : '#E8EAF6'; ctx!.font = `800 ${16 * t.scale}px Space Grotesk`; ctx!.textAlign = 'left'; ctx!.textBaseline = 'top';
        ctx!.fillText(c.sym + ' USDT', px + m, contentY);

        const fmtP = (p: number) => p >= 1000 ? '$' + p.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '$' + p.toFixed(2);
        const chStr = (c.change >= 0 ? '+' : '') + c.change.toFixed(2) + '%';
        ctx!.fillStyle = isLight ? '#64748b' : 'rgba(154,168,188,0.6)'; ctx!.font = `600 ${9 * t.scale}px Space Mono`;
        ctx!.fillText(fmtP(c.price) + ` (${chStr})`, px + m, contentY + 22 * t.scale);

        ctx!.beginPath(); ctx!.moveTo(px + m, contentY + 41 * t.scale); ctx!.lineTo(px + w - m, contentY + 41 * t.scale);
        ctx!.strokeStyle = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'; ctx!.lineWidth = 0.5 * t.scale; ctx!.stroke();

        const pnlY = contentY + 52 * t.scale;
        ctx!.fillStyle = isLight ? '#94a3b8' : 'rgba(74,80,112,0.8)'; ctx!.font = `700 ${8 * t.scale}px Space Mono`;
        ctx!.fillText('TOTAL PNL // REALTIME', px + m, pnlY);

        const pnlValStr = (c.pnl >= 0 ? '+$' : '−$') + Math.abs(c.pnl).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        ctx!.fillStyle = acc; ctx!.font = `800 ${22 * t.scale}px Space Grotesk`;
        ctx!.fillText(pnlValStr, px + m, pnlY + 16 * t.scale);

        const stY = pnlY + 46 * t.scale;
        ctx!.fillStyle = isLight ? '#94a3b8' : 'rgba(58,64,96,0.7)'; ctx!.font = `700 ${7.5 * t.scale}px Space Mono`;
        ctx!.fillText('WIN RATE', px + m, stY); ctx!.fillText('VOLUME', px + w / 2 + 2 * t.scale, stY);

        ctx!.fillStyle = isLight ? '#64748b' : '#9AA8BC'; ctx!.font = `700 ${11 * t.scale}px Space Grotesk`;
        ctx!.fillText('81%', px + m, stY + 12 * t.scale);
        ctx!.fillStyle = acc; ctx!.fillText(c.vol, px + w / 2 + 2 * t.scale, stY + 12 * t.scale);

        // const fy = py + h - 24 * t.scale;
        // ctx!.fillStyle = 'rgba(255,255,255,0.15)'; ctx!.font = `700 ${8 * t.scale}px Space Grotesk`; ctx!.textAlign = 'center';
        // ctx!.fillText('--- CLICK TO INSPECT MODULE ---', px + w / 2, fy);
      } else {
        rrx(px, py, w, h, 12 * t.scale); ctx!.strokeStyle = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.05)'; ctx!.lineWidth = 0.5 * t.scale; ctx!.stroke();
        ctx!.fillStyle = isLight ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.02)'; ctx!.font = `700 ${10 * t.scale}px Space Mono`; ctx!.textAlign = 'center';
        ctx!.fillText("VB_NODE_" + card.data.sym, px + w / 2, py + h / 2);
      }

      ctx!.restore();
      return { px, py, w, h, depth: t.sinA, idx: s.rCards.indexOf(card) };
    }

    function drawFrame() {
      drawBg();
      const sorted = [...s.rCards].sort((a, b) => Math.sin(a.angle) - Math.sin(b.angle));
      s.rHitList = [];
      sorted.forEach(card => { const r = drawCard(card); if (r) s.rHitList.unshift(r); });
      s.rHitList.sort((a, b) => b.depth - a.depth);

      s.particles = s.particles.filter(p => p.life < p.maxLife);
      s.particles.forEach(p => {
        p.life++; p.x += p.vx; p.y += p.vy; p.vy += .05;
        const a = (1 - p.life / p.maxLife) * .8;
        ctx!.beginPath(); ctx!.arc(p.x, p.y, p.r * (1 - p.life / p.maxLife * .5), 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(77,184,106,${a})`; ctx!.fill();
      });
    }

    function hitTest(mx: number, my: number) {
      for (const r of s.rHitList) {
        if (r.depth < -.05) continue;
        if (mx >= r.px && mx <= r.px + r.w && my >= r.py && my <= r.py + r.h) return r.idx;
      }
      return -1;
    }

    function animate() {
      if (s.RW === 0 || s.RH === 0 || s.CW === 0 || s.CH === 0) {
        s.animId = requestAnimationFrame(animate);
        return;
      }
      s.rTime += 0.016;
      if (!s.rPaused && !s.rDrag) { s.rCards.forEach(c => c.angle += s.rVel); s.rVel += (.0038 - s.rVel) * .03; }
      drawFrame();
      s.animId = requestAnimationFrame(animate);
    }

    function dealNew() {
      const data = POOL[s.dealIdx % POOL.length];
      s.dealIdx++;
      if (s.rCards.length < 12) {
        const th = Math.floor(Math.random() * 12) + 1; const tm = Math.floor(Math.random() * 60);
        const card: RCard = { data, angle: Math.PI, entryDone: false, entryAnim: 0, logoImg: null, tradeTime: `${th}h ${tm}m ago` };
        s.rCards.push(card);
        const nc = s.rCards[s.rCards.length - 1];
        // logo now sourced from logoImgsRef DOM pool — no fetch needed
        const iv = setInterval(() => { nc.entryAnim += .04; if (nc.entryAnim >= 1) { nc.entryDone = true; clearInterval(iv); } }, 16);
        const N = s.rCards.length; const ta = s.rCards.map((_, i) => (i / N) * Math.PI * 2); const sa = s.rCards.map(c => c.angle);
        let t2 = 0;
        const iv2 = setInterval(() => { t2 += .04; if (t2 >= 1) { t2 = 1; clearInterval(iv2); } const e = t2 < .5 ? 2 * t2 * t2 : (4 - 2 * t2) * t2 - 1; s.rCards.forEach((c, i) => { c.angle = sa[i] + (ta[i] - sa[i]) * e; }); }, 16);
        for (let i = 0; i < 12; i++) { const a = Math.random() * Math.PI * 2; const sp = 1.5 + Math.random() * 2.5; s.particles.push({ x: s.RCX + s.RX * Math.cos(Math.PI), y: s.RCY + s.RY * Math.sin(Math.PI), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - .8, r: 1 + Math.random() * 2, life: 0, maxLife: 44 + Math.random() * 24 }); }
      }
    }

    /* ── Mouse Events ── */
    const onMouseDown = (e: MouseEvent) => { if (s.rPaused) return; s.rDrag = true; s.rLx = e.clientX; s.rLvx = 0; s.rMdx = e.clientX; s.rMdy = e.clientY; s.rMdt = Date.now(); s.rVel = 0; };
    const onMouseMove = (e: MouseEvent) => { if (!s.rDrag) return; const dx = e.clientX - s.rLx; s.rLvx = dx * .0065; s.rCards.forEach(c => c.angle += s.rLvx); s.rLx = e.clientX; };
    const onMouseUp = (e: MouseEvent) => { if (!s.rDrag) return; s.rDrag = false; const dist = Math.hypot(e.clientX - s.rMdx, e.clientY - s.rMdy); if (dist < 6 && Date.now() - s.rMdt < 280) { const bnd = canvas!.getBoundingClientRect(); const hit = hitTest(e.clientX - bnd.left, e.clientY - bnd.top); if (hit >= 0) { openPopup(s.rCards[hit].data); return; } } s.rVel = s.rLvx; };
    const onMouseLeave = () => { if (s.rDrag) { s.rDrag = false; s.rVel = s.rLvx; } };
    const onTouchStart = (e: TouchEvent) => { if (s.rPaused) return; const tt = e.touches[0]; s.rDrag = true; s.rLx = tt.clientX; s.rLvx = 0; s.rMdx = tt.clientX; s.rMdy = tt.clientY; s.rMdt = Date.now(); s.rVel = 0; };
    const onTouchMove = (e: TouchEvent) => { if (!s.rDrag) return; const tt = e.touches[0]; s.rLvx = (tt.clientX - s.rLx) * .0065; s.rCards.forEach(c => c.angle += s.rLvx); s.rLx = tt.clientX; };
    const onTouchEnd = (e: TouchEvent) => { s.rDrag = false; const tt = e.changedTouches[0]; const dist = Math.hypot(tt.clientX - s.rMdx, tt.clientY - s.rMdy); if (dist < 8) { const bnd = canvas!.getBoundingClientRect(); const hit = hitTest(tt.clientX - bnd.left, tt.clientY - bnd.top); if (hit >= 0) openPopup(s.rCards[hit].data); } s.rVel = s.rLvx; };

    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('mouseleave', onMouseLeave);
    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas.addEventListener('touchmove', onTouchMove, { passive: true });
    canvas.addEventListener('touchend', onTouchEnd);

    window.addEventListener('resize', resize);
    resize();
    initRCards();
    animate();
    s.dealInterval = window.setInterval(() => { if (!s.rPaused && s.rCards.length < 12) dealNew(); }, 12000);

    return () => {
      cancelAnimationFrame(s.animId);
      clearInterval(s.dealInterval);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('mouseleave', onMouseLeave);
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove', onTouchMove);
      canvas.removeEventListener('touchend', onTouchEnd);
    };
  }, [openPopup]);

  const isLight = theme === 'light';
  const skeletonCardBg = isLight ? '#ffffff' : 'rgba(10, 14, 26, 0.9)';
  const skeletonCardBorder = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.04)';

  // Calculate precise 3D bounds for the front card and the two adjacent side cards
  const getCardStyle = (angle: number) => {
    const si = Math.sin(angle), co = Math.cos(angle);
    const depth = (si + 1) / 2;
    const sc = 0.58 + 0.54 * depth;
    const w = skelDims.cw * sc;
    const h = skelDims.ch * sc;
    const x = skelDims.rcx + skelDims.rx * co - w / 2;
    const y = skelDims.rcy + (skelDims.rx * 0.28) * si - h / 2;
    return { w, h, x, y, depth };
  };

  const frontA = Math.PI / 2; // 90 deg
  const offsetA = (Math.PI * 2) / 7; // 51.4 deg
  const cards = [
    { ...getCardStyle(frontA - offsetA), isFront: false },
    { ...getCardStyle(frontA + offsetA), isFront: false },
    { ...getCardStyle(frontA), isFront: true },
  ];

  return (
    <>
      <div className="ring-sec" style={{ position: 'relative' }}>
        <canvas ref={canvasRef} className="ring-cv" style={{ opacity: loading ? 0 : 1, transition: 'opacity 0.5s ease' }} />
        {isMounted && loading && (
          <div style={{ position: 'absolute', inset: 0 }}>
            {cards.sort((a, b) => a.depth - b.depth).map((c, i) => (
              <div key={i} style={{ 
                position: 'absolute',
                left: `${c.x}px`,
                top: `${c.y}px`,
                width: `${c.w}px`, 
                height: `${c.h}px`, 
                borderRadius: '12px', 
                background: skeletonCardBg,
                border: `1px solid ${skeletonCardBorder}`,
                boxShadow: isLight ? '0 10px 30px rgba(0,0,0,0.04)' : 'none',
                padding: c.isFront ? '24px' : '20px',
                display: 'flex',
                flexDirection: 'column',
                zIndex: c.isFront ? 10 : 5,
                opacity: c.isFront ? 1 : 0.8
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: c.isFront ? '40px' : '24px' }}>
                  <div className="skeleton-box" style={{ width: c.isFront ? '34px' : '28px', height: c.isFront ? '34px' : '28px', borderRadius: '50%' }} />
                  <div className="skeleton-box" style={{ width: '40px', height: '16px', borderRadius: '4px' }} />
                </div>
                <div className="skeleton-box" style={{ width: '70%', height: c.isFront ? '20px' : '16px', marginBottom: '12px', borderRadius: '4px' }} />
                <div className="skeleton-box" style={{ width: '50%', height: c.isFront ? '14px' : '12px', marginBottom: 'auto', borderRadius: '4px' }} />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', marginTop: '32px' }}>
                  <div className="skeleton-box" style={{ width: '45%', height: '10px', borderRadius: '4px' }} />
                  <div className="skeleton-box" style={{ width: '25%', height: '10px', borderRadius: '4px' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div className="skeleton-box" style={{ width: '30%', height: '14px', borderRadius: '4px' }} />
                  <div className="skeleton-box" style={{ width: '40%', height: '14px', borderRadius: '4px' }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {popupData && <PopupCard data={popupData} onClose={closePopup} />}
    </>
  );
}
