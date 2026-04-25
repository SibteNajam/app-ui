'use client';
import { useState, useEffect } from 'react';
import './cards.css';

/* ══════════════════════════════════════════════════════
   DATA & UTILITIES
   ══════════════════════════════════════════════════════ */

const POOL = [
  { sym: 'BTC', pair: 'BTC/USDT', price: 64820, change: 3.42, vol: '$42.1B', high: 65400, low: 62100, dir: 'LONG', lev: '10x', pnl: 420.30 },
  { sym: 'ETH', pair: 'ETH/USDT', price: 3191, change: -1.18, vol: '$18.4B', high: 3310, low: 3140, dir: 'SHORT', lev: '5x', pnl: -88.50 },
  { sym: 'SOL', pair: 'SOL/USDT', price: 161, change: 5.67, vol: '$4.2B', high: 168, low: 148, dir: 'LONG', lev: '3x', pnl: 310.80 },
  { sym: 'BNB', pair: 'BNB/USDT', price: 594, change: 1.23, vol: '$1.8B', high: 601, low: 579, dir: 'LONG', lev: '7x', pnl: 199.70 },
];

const COLOR_MAP: Record<string, { neon: string; dark: string; hex: string }> = {
  BTC:  { neon: '255,170,0',    dark: '40,30,0',    hex: '#ffaa00' },
  ETH:  { neon: '98,126,234',   dark: '20,15,50',   hex: '#627eea' },
  SOL:  { neon: '0,255,136',    dark: '8,20,25',    hex: '#00ff88' },
  BNB:  { neon: '240,165,23',   dark: '40,30,0',    hex: '#f0a517' },
  AVAX: { neon: '232,65,66',    dark: '40,15,15',   hex: '#e84142' },
  ARB:  { neon: '40,185,239',   dark: '15,25,50',   hex: '#28b9ef' },
  LINK: { neon: '84,71,255',    dark: '15,12,50',   hex: '#5447ff' },
  INJ:  { neon: '244,208,63',   dark: '40,35,0',    hex: '#f4d03f' },
  TIA:  { neon: '98,71,234',    dark: '20,15,50',   hex: '#6247ea' },
  WIF:  { neon: '139,95,191',   dark: '30,20,45',   hex: '#8b5fbf' },
  JUP:  { neon: '255,215,0',    dark: '40,35,0',    hex: '#ffd700' },
  SEI:  { neon: '32,185,163',   dark: '10,30,25',   hex: '#20b9a3' },
};

function getColors(sym: string) {
  return COLOR_MAP[sym] || COLOR_MAP['SOL'];
}

function pnlStr(pnl: number) {
  return (pnl >= 0 ? '+$' : '-$') + Math.abs(pnl).toFixed(2);
}

type CardData = typeof POOL[0];

interface CardProps {
  d: CardData;
  logoUrl?: string;
}

/* ══════════════════════════════════════════════════════
   LOGO FETCHING HOOK
   ══════════════════════════════════════════════════════ */
function useLogos() {
  const [logos, setLogos] = useState<Record<string, string>>({});

  useEffect(() => {
    POOL.forEach(({ sym }) => {
      const name = sym.toLowerCase();
      const url = `https://raw.githubusercontent.com/atomiclabs/cryptocurrency-icons/master/128/color/${name}.png`;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => setLogos(prev => ({ ...prev, [sym]: url }));
      img.onerror = () => {
        const fb = `https://cryptologos.cc/logos/${name}-${name}-logo.png`;
        const img2 = new Image();
        img2.crossOrigin = 'anonymous';
        img2.onload = () => setLogos(prev => ({ ...prev, [sym]: fb }));
        img2.src = fb;
      };
      img.src = url;
    });
  }, []);

  return logos;
}

/* ══════════════════════════════════════════════════════
   D07 PRO - ENHANCED 3D FLIP WITH REAL LOGOS
   ══════════════════════════════════════════════════════ */
function CardD7Pro({ d, logoUrl }: CardProps) {
  const c = getColors(d.sym);
  const pos = d.pnl >= 0;
  return (
    <div className="hgc-card d7pro" style={{ '--neon-rgb': c.neon, '--dark-rgb': c.dark, '--hex-color': c.hex } as React.CSSProperties}>
      <div className="shell">
        <div className="face front">
          <div className="d7p-header">
            <span className="d7p-label">ACTIVE POSITION</span>
            <span className={`d7p-status-dot ${pos ? 'pos' : 'neg'}`} />
          </div>
          <div className="d7p-logo-wrap">
            <div className="d7p-ring" />
            <div className="d7p-ring-outer" />
            {logoUrl ? (
              <img src={logoUrl} alt={d.sym} className="d7p-logo-img" draggable={false} />
            ) : (
              <div className="d7p-logo-letter">{d.sym[0]}</div>
            )}
          </div>
          <div className="d7p-info">
            <div className="d7p-sym">{d.sym}</div>
            <div className="d7p-pair">{d.pair}</div>
            <div className="d7p-badges">
              <span className={`u-badge ${d.dir === 'LONG' ? 'long' : 'short'}`}>{d.dir}</span>
              <span className="d7p-lev">{d.lev}</span>
            </div>
          </div>
          <div className="d7p-footer">
            <span className="d7p-hint">&#x21BB; HOVER TO INSPECT</span>
          </div>
        </div>
        <div className="face back">
          <div className="d7p-back-top">
            <span className="d7p-back-label">// PNL BREAKDOWN</span>
            {logoUrl && <img src={logoUrl} alt={d.sym} className="d7p-back-logo" draggable={false} />}
          </div>
          <div className={`d7p-pnl ${pos ? 'pos' : 'neg'}`}>{pnlStr(d.pnl)}</div>
          <div className="u-divider" />
          <div className="d7p-rows">
            <div className="b-row"><span>SYMBOL</span><span>{d.sym}</span></div>
            <div className="b-row"><span>DIRECTION</span><span style={{ color: d.dir === 'LONG' ? '#4DB86A' : '#E84142' }}>{d.dir}</span></div>
            <div className="b-row"><span>LEVERAGE</span><span>{d.lev}</span></div>
            <div className="b-row"><span>PRICE</span><span>${d.price.toLocaleString()}</span></div>
            <div className="b-row"><span>24H CHG</span><span style={{ color: pos ? '#4DB86A' : '#E84142' }}>{d.change > 0 ? '+' : ''}{d.change}%</span></div>
            <div className="b-row"><span>VOLUME</span><span>{d.vol}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   D11 - EDGE PULSE STRIPS
   ══════════════════════════════════════════════════════ */
function CardD11({ d, logoUrl }: CardProps) {
  const c = getColors(d.sym);
  const pos = d.pnl >= 0;
  return (
    <div className="hgc-card d11" style={{ '--neon-rgb': c.neon, '--dark-rgb': c.dark, '--hex-color': c.hex } as React.CSSProperties}>
      <div className="shell">
        <div className="edge-strip top" />
        <div className="edge-strip right" />
        <div className="edge-strip bottom" />
        <div className="edge-strip left" />
        <div className="d11-idle">
          {logoUrl && <img src={logoUrl} alt={d.sym} className="d11-logo" draggable={false} />}
          <div className="u-sym">{d.sym}</div>
          <div className="u-pair">{d.pair}</div>
        </div>
        <div className="d11-content">
          <div>
            <div className="u-sym" style={{ fontSize: 22, marginBottom: 2 }}>{d.sym}</div>
            <div className="u-pair">{d.pair}</div>
          </div>
          <div className={`u-badge ${d.dir === 'LONG' ? 'long' : 'short'}`}>{d.dir} &middot; {d.lev}</div>
          <div className={`u-pnl ${pos ? 'pos' : 'neg'}`}>{pnlStr(d.pnl)}</div>
          <div className="u-divider" />
          <div className="u-stat"><span>PRICE</span><span>${d.price.toLocaleString()}</span></div>
          <div className="u-stat"><span>VOL</span><span>{d.vol}</span></div>
          <div className="u-stat"><span>CHG</span><span style={{ color: pos ? '#4DB86A' : '#E84142' }}>{d.change > 0 ? '+' : ''}{d.change}%</span></div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   D12 - IRIS APERTURE
   ══════════════════════════════════════════════════════ */
function CardD12({ d, logoUrl }: CardProps) {
  const c = getColors(d.sym);
  const pos = d.pnl >= 0;
  return (
    <div className="hgc-card d12" style={{ '--neon-rgb': c.neon, '--dark-rgb': c.dark, '--hex-color': c.hex } as React.CSSProperties}>
      <div className="shell">
        <div className="iris-overlay">
          <div className="iris-center">
            {logoUrl ? (
              <img src={logoUrl} alt={d.sym} className="iris-logo" draggable={false} />
            ) : (
              <span className="iris-letter">{d.sym[0]}</span>
            )}
          </div>
        </div>
        <div className="d12-content">
          <div>
            <div className="u-sym" style={{ fontSize: 24, marginBottom: 2 }}>{d.sym}</div>
            <div className="u-pair">{d.pair}</div>
          </div>
          <div className={`u-badge ${d.dir === 'LONG' ? 'long' : 'short'}`} style={{ alignSelf: 'flex-start' }}>{d.dir} &middot; {d.lev}</div>
          <div className={`u-pnl-lg ${pos ? 'pos' : 'neg'}`}>{pnlStr(d.pnl)}</div>
          <div className="u-divider" />
          <div className="u-stat"><span>PRICE</span><span>${d.price.toLocaleString()}</span></div>
          <div className="u-stat"><span>VOL</span><span>{d.vol}</span></div>
          <div className="u-stat"><span>24H CHG</span><span style={{ color: pos ? '#4DB86A' : '#E84142' }}>{d.change > 0 ? '+' : ''}{d.change}%</span></div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   D13 - CASCADE STRIPS
   ══════════════════════════════════════════════════════ */
function CardD13({ d }: CardProps) {
  const c = getColors(d.sym);
  const pos = d.pnl >= 0;
  return (
    <div className="hgc-card d13" style={{ '--neon-rgb': c.neon, '--dark-rgb': c.dark, '--hex-color': c.hex } as React.CSSProperties}>
      <div className="shell">
        {[1,2,3,4,5,6].map(i => <div key={i} className="cstrip" />)}
        <div className="d13-idle">
          <div className="u-sym">{d.sym}</div>
          <div className="u-pair">{d.pair}</div>
        </div>
        <div className="d13-content">
          <div>
            <div style={{ fontSize: 10, fontFamily: "'Space Mono', monospace", color: 'rgba(var(--neon-rgb),.5)', letterSpacing: '.12em', marginBottom: 6 }}>// POSITION</div>
            <div className="u-sym" style={{ fontSize: 22 }}>{d.sym}</div>
            <div className="u-pair" style={{ marginBottom: 8 }}>{d.pair}</div>
          </div>
          <div className={`u-badge ${d.dir === 'LONG' ? 'long' : 'short'}`} style={{ alignSelf: 'flex-start' }}>{d.dir} &middot; {d.lev}</div>
          <div className={`u-pnl ${pos ? 'pos' : 'neg'}`}>{pnlStr(d.pnl)}</div>
          <div className="u-divider" />
          <div className="u-stat"><span>PRICE</span><span>${d.price.toLocaleString()}</span></div>
          <div className="u-stat"><span>VOL</span><span>{d.vol}</span></div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   D14 - CORNER BRACKETS
   ══════════════════════════════════════════════════════ */
function CardD14({ d, logoUrl }: CardProps) {
  const c = getColors(d.sym);
  const pos = d.pnl >= 0;
  return (
    <div className="hgc-card d14" style={{ '--neon-rgb': c.neon, '--dark-rgb': c.dark, '--hex-color': c.hex } as React.CSSProperties}>
      <div className="shell">
        <div className="bracket tl" />
        <div className="bracket tr" />
        <div className="bracket bl" />
        <div className="bracket br" />
        <div className="d14-idle">
          {logoUrl && <img src={logoUrl} alt={d.sym} className="d14-logo" draggable={false} />}
          <div className="u-sym">{d.sym}</div>
          <div className="u-pair">{d.pair}</div>
        </div>
        <div className="d14-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            {logoUrl && <img src={logoUrl} alt={d.sym} style={{ width: 22, height: 22, borderRadius: '50%' }} draggable={false} />}
            <div>
              <div className="u-sym" style={{ fontSize: 20 }}>{d.sym}</div>
              <div className="u-pair">{d.pair}</div>
            </div>
          </div>
          <div className={`u-badge ${d.dir === 'LONG' ? 'long' : 'short'}`} style={{ marginBottom: 6 }}>{d.dir} &middot; {d.lev}</div>
          <div className={`u-pnl ${pos ? 'pos' : 'neg'}`} style={{ marginBottom: 6 }}>{pnlStr(d.pnl)}</div>
          <div className="u-divider" />
          <div className="u-stat"><span>PRICE</span><span>${d.price.toLocaleString()}</span></div>
          <div className="u-stat"><span>HIGH</span><span>${d.high.toLocaleString()}</span></div>
          <div className="u-stat"><span>LOW</span><span>${d.low.toLocaleString()}</span></div>
          <div className="u-stat"><span>CHG</span><span style={{ color: pos ? '#4DB86A' : '#E84142' }}>{d.change > 0 ? '+' : ''}{d.change}%</span></div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   D15 - FROST GLASS
   ══════════════════════════════════════════════════════ */
function CardD15({ d, logoUrl }: CardProps) {
  const c = getColors(d.sym);
  const pos = d.pnl >= 0;
  return (
    <div className="hgc-card d15" style={{ '--neon-rgb': c.neon, '--dark-rgb': c.dark, '--hex-color': c.hex } as React.CSSProperties}>
      <div className="shell">
        <div className="frost-bg-sym">{d.sym}</div>
        <div className="d15-data">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {logoUrl && <img src={logoUrl} alt={d.sym} style={{ width: 28, height: 28, borderRadius: '50%' }} draggable={false} />}
            <div>
              <div className="u-sym" style={{ fontSize: 22 }}>{d.sym}</div>
              <div className="u-pair">{d.pair}</div>
            </div>
          </div>
          <div className={`u-badge ${d.dir === 'LONG' ? 'long' : 'short'}`} style={{ alignSelf: 'flex-start', marginTop: 8 }}>{d.dir} &middot; {d.lev}</div>
          <div className={`u-pnl-lg ${pos ? 'pos' : 'neg'}`} style={{ marginTop: 6 }}>{pnlStr(d.pnl)}</div>
          <div className="u-divider" />
          <div className="u-stat"><span>PRICE</span><span>${d.price.toLocaleString()}</span></div>
          <div className="u-stat"><span>VOL</span><span>{d.vol}</span></div>
          <div className="u-stat"><span>CHG</span><span style={{ color: pos ? '#4DB86A' : '#E84142' }}>{d.change > 0 ? '+' : ''}{d.change}%</span></div>
        </div>
        <div className="frost-overlay" />
        <div className="frost-label">
          <div className="u-sym" style={{ fontSize: 28, textShadow: '0 0 20px rgba(var(--neon-rgb),.4)' }}>{d.sym}</div>
          <div className="u-pair">{d.pair}</div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   D16 - CONIC BORDER TRACE
   ══════════════════════════════════════════════════════ */
function CardD16({ d, logoUrl }: CardProps) {
  const c = getColors(d.sym);
  const pos = d.pnl >= 0;
  return (
    <div className="hgc-card d16" style={{ '--neon-rgb': c.neon, '--dark-rgb': c.dark, '--hex-color': c.hex } as React.CSSProperties}>
      <div className="conic-shell">
        <div className="conic-border" />
        <div className="d16-inner">
          <div className="d16-idle">
            {logoUrl && <img src={logoUrl} alt={d.sym} style={{ width: 24, height: 24, borderRadius: '50%', marginBottom: 6 }} draggable={false} />}
            <div className="u-sym" style={{ fontSize: 26 }}>{d.sym}</div>
            <div className="u-pair">{d.pair}</div>
          </div>
          <div className="d16-content">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              {logoUrl && <img src={logoUrl} alt={d.sym} style={{ width: 20, height: 20, borderRadius: '50%' }} draggable={false} />}
              <div className="u-sym" style={{ fontSize: 20 }}>{d.sym}</div>
            </div>
            <div className="u-pair" style={{ marginBottom: 6 }}>{d.pair}</div>
            <div className={`u-badge ${d.dir === 'LONG' ? 'long' : 'short'}`} style={{ marginBottom: 6 }}>{d.dir} &middot; {d.lev}</div>
            <div className={`u-pnl ${pos ? 'pos' : 'neg'}`} style={{ marginBottom: 6 }}>{pnlStr(d.pnl)}</div>
            <div className="u-divider" />
            <div className="u-stat"><span>PRICE</span><span>${d.price.toLocaleString()}</span></div>
            <div className="u-stat"><span>VOL</span><span>{d.vol}</span></div>
            <div className="u-stat"><span>CHG</span><span style={{ color: pos ? '#4DB86A' : '#E84142' }}>{d.change > 0 ? '+' : ''}{d.change}%</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   D17 - DEPTH PARALLAX
   ══════════════════════════════════════════════════════ */
function CardD17({ d, logoUrl }: CardProps) {
  const c = getColors(d.sym);
  const pos = d.pnl >= 0;
  return (
    <div className="hgc-card d17" style={{ '--neon-rgb': c.neon, '--dark-rgb': c.dark, '--hex-color': c.hex } as React.CSSProperties}>
      <div className="shell">
        <div className="plx-layer bg">
          <span className="plx-big-sym">{d.sym}</span>
        </div>
        <div className="plx-layer mid">
          <div className="plx-bar" />
          <div className="plx-bar" />
          <div className="plx-bar" />
        </div>
        <div className="plx-layer fore">
          <div className="d17-content">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {logoUrl && <img src={logoUrl} alt={d.sym} style={{ width: 22, height: 22, borderRadius: '50%' }} draggable={false} />}
              <div>
                <div className="u-sym" style={{ fontSize: 20 }}>{d.sym}</div>
                <div className="u-pair">{d.pair}</div>
              </div>
            </div>
            <div className={`u-badge ${d.dir === 'LONG' ? 'long' : 'short'}`} style={{ marginTop: 8 }}>{d.dir} &middot; {d.lev}</div>
            <div className={`u-pnl ${pos ? 'pos' : 'neg'}`} style={{ marginTop: 4 }}>{pnlStr(d.pnl)}</div>
            <div className="u-divider" />
            <div className="u-stat"><span>PRICE</span><span>${d.price.toLocaleString()}</span></div>
            <div className="u-stat"><span>VOL</span><span>{d.vol}</span></div>
            <div className="u-stat"><span>CHG</span><span style={{ color: pos ? '#4DB86A' : '#E84142' }}>{d.change > 0 ? '+' : ''}{d.change}%</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   D18 - HEX MORPH
   ══════════════════════════════════════════════════════ */
function CardD18({ d, logoUrl }: CardProps) {
  const c = getColors(d.sym);
  const pos = d.pnl >= 0;
  return (
    <div className="hgc-card d18" style={{ '--neon-rgb': c.neon, '--dark-rgb': c.dark, '--hex-color': c.hex } as React.CSSProperties}>
      <div className="shell">
        <div className="hex-mask">
          <div className="hex-inner">
            {logoUrl ? (
              <img src={logoUrl} alt={d.sym} className="hex-logo" draggable={false} />
            ) : (
              <span className="hex-letter">{d.sym[0]}</span>
            )}
            <div className="hex-sym">{d.sym}</div>
          </div>
        </div>
        <div className="d18-content">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {logoUrl && <img src={logoUrl} alt={d.sym} style={{ width: 20, height: 20, borderRadius: '50%' }} draggable={false} />}
              <div className="u-sym" style={{ fontSize: 20 }}>{d.sym}</div>
            </div>
            <div className="u-pair" style={{ marginTop: 2 }}>{d.pair}</div>
          </div>
          <div className={`u-badge ${d.dir === 'LONG' ? 'long' : 'short'}`}>{d.dir} &middot; {d.lev}</div>
          <div className={`u-pnl ${pos ? 'pos' : 'neg'}`}>{pnlStr(d.pnl)}</div>
          <div className="u-divider" />
          <div className="u-stat"><span>PRICE</span><span>${d.price.toLocaleString()}</span></div>
          <div className="u-stat"><span>VOL</span><span>{d.vol}</span></div>
          <div className="u-stat"><span>CHG</span><span style={{ color: pos ? '#4DB86A' : '#E84142' }}>{d.change > 0 ? '+' : ''}{d.change}%</span></div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   D19 - VERTICAL BLINDS
   ══════════════════════════════════════════════════════ */
function CardD19({ d }: CardProps) {
  const c = getColors(d.sym);
  const pos = d.pnl >= 0;
  return (
    <div className="hgc-card d19" style={{ '--neon-rgb': c.neon, '--dark-rgb': c.dark, '--hex-color': c.hex } as React.CSSProperties}>
      <div className="shell">
        <div className="blinds-wrap">
          {[1,2,3,4,5,6].map(i => <div key={i} className="blind" />)}
        </div>
        <div className="d19-back">
          <div className="u-sym" style={{ fontSize: 20, marginBottom: 4 }}>{d.sym}</div>
          <div className="u-pair" style={{ marginBottom: 8 }}>{d.pair}</div>
          <div className={`u-badge ${d.dir === 'LONG' ? 'long' : 'short'}`} style={{ alignSelf: 'flex-start', marginBottom: 6 }}>{d.dir} &middot; {d.lev}</div>
          <div className={`u-pnl ${pos ? 'pos' : 'neg'}`} style={{ marginBottom: 6 }}>{pnlStr(d.pnl)}</div>
          <div className="u-divider" />
          <div className="u-stat"><span>PRICE</span><span>${d.price.toLocaleString()}</span></div>
          <div className="u-stat"><span>VOL</span><span>{d.vol}</span></div>
          <div className="u-stat"><span>CHG</span><span style={{ color: pos ? '#4DB86A' : '#E84142' }}>{d.change > 0 ? '+' : ''}{d.change}%</span></div>
        </div>
        <div className="d19-idle-label">
          <div className="u-sym" style={{ fontSize: 28 }}>{d.sym}</div>
          <div className="u-pair">{d.pair}</div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   D20 - GLITCH RESOLVE
   ══════════════════════════════════════════════════════ */
function CardD20({ d, logoUrl }: CardProps) {
  const c = getColors(d.sym);
  const pos = d.pnl >= 0;
  return (
    <div className="hgc-card d20" style={{ '--neon-rgb': c.neon, '--dark-rgb': c.dark, '--hex-color': c.hex } as React.CSSProperties}>
      <div className="shell">
        <div className="glitch-layers">
          <div className="gl gl-r">{d.sym}</div>
          <div className="gl gl-g">{d.sym}</div>
          <div className="gl gl-b">{d.sym}</div>
          <div className="gl gl-main">{d.sym}</div>
        </div>
        <div className="d20-idle">
          <div className="d20-pair">{d.pair}</div>
          <div className="d20-hint">HOVER TO DECODE</div>
        </div>
        <div className="d20-content">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            {logoUrl && <img src={logoUrl} alt={d.sym} style={{ width: 22, height: 22, borderRadius: '50%' }} draggable={false} />}
            <div>
              <div className="u-sym" style={{ fontSize: 20 }}>{d.sym}</div>
              <div className="u-pair">{d.pair}</div>
            </div>
          </div>
          <div className={`u-badge ${d.dir === 'LONG' ? 'long' : 'short'}`} style={{ marginTop: 6, marginBottom: 6 }}>{d.dir} &middot; {d.lev}</div>
          <div className={`u-pnl ${pos ? 'pos' : 'neg'}`} style={{ marginBottom: 6 }}>{pnlStr(d.pnl)}</div>
          <div className="u-divider" />
          <div className="u-stat"><span>PRICE</span><span>${d.price.toLocaleString()}</span></div>
          <div className="u-stat"><span>VOL</span><span>{d.vol}</span></div>
          <div className="u-stat"><span>CHG</span><span style={{ color: pos ? '#4DB86A' : '#E84142' }}>{d.change > 0 ? '+' : ''}{d.change}%</span></div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   DESIGN REGISTRY & MAIN COMPONENT
   ══════════════════════════════════════════════════════ */

const DESIGNS: { id: string; label: string; desc: string; accent: string; Comp: React.FC<CardProps> }[] = [
  { id: '07+', label: '3D FLIP PRO',     desc: 'Enhanced 3D flip with real crypto logos and HUD rings',   accent: '244,208,63',  Comp: CardD7Pro },
  { id: '11',  label: 'EDGE PULSE',      desc: 'Neon edge strips slide outward revealing data',            accent: '255,170,0',   Comp: CardD11 },
  { id: '12',  label: 'IRIS APERTURE',   desc: 'Circular aperture opens from center outward',              accent: '98,126,234',  Comp: CardD12 },
  { id: '13',  label: 'CASCADE STRIPS',  desc: 'Thin horizontal strips cascade-slide away',                accent: '0,255,136',   Comp: CardD13 },
  { id: '14',  label: 'CORNER BRACKETS', desc: 'HUD brackets at corners expand with content reveal',       accent: '40,185,239',  Comp: CardD14 },
  { id: '15',  label: 'FROST GLASS',     desc: 'Frosted glass overlay clears on hover',                    accent: '139,95,191',  Comp: CardD15 },
  { id: '16',  label: 'CONIC TRACE',     desc: 'Rotating neon trace around border with card glow',         accent: '232,65,66',   Comp: CardD16 },
  { id: '17',  label: 'DEPTH PARALLAX',  desc: 'Multi-layer parallax depth separation on hover',           accent: '84,71,255',   Comp: CardD17 },
  { id: '18',  label: 'HEX MORPH',       desc: 'Hexagonal clip-path morphs to full rectangle',             accent: '32,185,163',  Comp: CardD18 },
  { id: '19',  label: 'VERTICAL BLINDS', desc: 'Thin vertical slats rotate open like venetian blinds',     accent: '240,165,23',  Comp: CardD19 },
  { id: '20',  label: 'GLITCH RESOLVE',  desc: 'RGB split glitch effect resolves to clean data display',   accent: '255,170,0',   Comp: CardD20 },
];

export default function HGC() {
  const logos = useLogos();

  return (
    <div className="hgc-root">
      <div className="hgc-hero">
        <div className="hgc-eyebrow">VAULTBOT / DESIGN SYSTEM v2</div>
        <h1 className="hgc-title">Position Card Designs</h1>
        <p className="hgc-subtitle">
          11 unique design variants with hover reveal animations.
          <br />Enhanced D07 with real cryptocurrency logos via API.
        </p>
      </div>

      {DESIGNS.map(({ id, label, desc, accent, Comp }) => (
        <div key={id} className="hgc-section" style={{ '--accent': `rgb(${accent})` } as React.CSSProperties}>
          <div className="hgc-label" style={{ '--neon-rgb': accent } as React.CSSProperties}>
            <span style={{ color: `rgb(${accent})`, fontFamily: "'Space Mono', monospace" }}>D{id}</span>
            {label}
            <span className="design-badge" style={{ '--neon-rgb': accent } as React.CSSProperties}>{desc}</span>
          </div>
          <div className="hgc-track">
            {POOL.map((d) => (
              <Comp key={d.sym} d={d} logoUrl={logos[d.sym]} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
