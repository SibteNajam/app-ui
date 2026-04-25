'use client';
import { useEffect, useRef } from 'react';
import './AmbientField.css';

/* ═══════════════════════════════════════════════════════════
   AMBIENT PARTICLE FIELD — subtle floating motes behind cards
   Pure CSS: no canvas overhead, no overlap with any component
   ═══════════════════════════════════════════════════════════ */

interface Mote {
  x: number;   // % from left
  y: number;   // % from top
  s: number;   // size px
  d: number;   // duration s
  dl: number;  // delay s
  o: number;   // opacity
}

function makeMotes(n: number): Mote[] {
  const out: Mote[] = [];
  for (let i = 0; i < n; i++) {
    out.push({
      x:  10 + Math.random() * 80,
      y:  5  + Math.random() * 90,
      s:  1  + Math.random() * 2.5,
      d:  18 + Math.random() * 32,
      dl: Math.random() * 20,
      o:  0.06 + Math.random() * 0.14,
    });
  }
  return out;
}

const motes = makeMotes(50);

export default function AmbientField() {
  return (
    <div className="amb-field" aria-hidden="true">
      {motes.map((m, i) => (
        <div
          key={i}
          className="amb-mote"
          style={{
            left:  `${m.x}%`,
            top:   `${m.y}%`,
            width:  m.s,
            height: m.s,
            opacity: m.o,
            animationDuration:  `${m.d}s`,
            animationDelay:     `${m.dl}s`,
          }}
        />
      ))}
      {/* Subtle radial glow in center */}
      <div className="amb-glow" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   MARKET PULSE TICKER — scrolling live feed between sections
   ═══════════════════════════════════════════════════════════ */

const FEED_ITEMS = [
  { sym: 'BTC',  price: '$64,820', chg: '+3.42%', up: true  },
  { sym: 'ETH',  price: '$3,191',  chg: '-1.18%', up: false },
  { sym: 'SOL',  price: '$161.40', chg: '+5.67%', up: true  },
  { sym: 'BNB',  price: '$594.00', chg: '+1.23%', up: true  },
  { sym: 'AVAX', price: '$38.40',  chg: '-2.11%', up: false },
  { sym: 'ARB',  price: '$1.12',   chg: '+7.34%', up: true  },
  { sym: 'LINK', price: '$14.82',  chg: '+0.88%', up: true  },
  { sym: 'TIA',  price: '$9.14',   chg: '+4.12%', up: true  },
];

export function MarketPulseTicker() {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Duplicate items for seamless scroll loop
    const track = trackRef.current;
    if (!track) return;
    const clone = track.innerHTML;
    track.innerHTML = clone + clone;
  }, []);

  return (
    <div className="mpt-wrap">
      <div className="mpt-label">
        <span className="mpt-dot" />
        <span>LIVE MARKET</span>
      </div>
      <div className="mpt-overflow">
        <div className="mpt-track" ref={trackRef}>
          {FEED_ITEMS.map((f) => (
            <div className="mpt-item" key={f.sym}>
              <span className="mpt-sym">{f.sym}</span>
              <span className="mpt-price">{f.price}</span>
              <span className={`mpt-chg ${f.up ? 'up' : 'dn'}`}>{f.chg}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="mpt-label" style={{ marginLeft: 'auto' }}>
        <span>REALTIME</span>
        <span className="mpt-dot" />
      </div>
    </div>
  );
}
