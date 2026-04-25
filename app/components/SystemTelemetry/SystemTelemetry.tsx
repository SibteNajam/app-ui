'use client';
import { useState, useEffect } from 'react';
const worldMapUrl = '/world.svg';
import './SystemTelemetry.css';

export default function SystemTelemetry() {
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  
  const initialFeed = [
    { id: 1, src: '192.168.1.1', dest: 'ETH_POOL_A', type: 'MEV Snipe', status: 'Optimal', color: '#4DB86A', tag: 'Execution' },
    { id: 2, src: '0x8A1...F90', dest: 'BINANCE_HOT', type: 'Flash Loan', status: 'Warning', color: '#f0a517', tag: 'Volume Spike' },
    { id: 3, src: 'DARKPOOL_7', dest: 'UNISWAP_V3', type: 'Slippage Alert', status: 'Critical', color: '#ff3366', tag: 'Trade Reverted' },
  ];

  const [feed, setFeed] = useState(initialFeed);

  useEffect(() => {
    const clock = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    const feedCycle = setInterval(() => {
      setFeed(prev => {
        const next = [...prev];
        const first = next.shift();
        if (first) next.push({ ...first, id: Date.now() });
        return next;
      });
    }, 2500);
    return () => { clearInterval(clock); clearInterval(feedCycle); };
  }, []);

  return (
    <div className="telem-wrapper">
      <div className="telem-hex-bg" />

      {/* Top Header */}
      <div className="telem-header-area">
        <div className="telem-title-box">
          <h2>VAULT TELEMETRY</h2>
          <p>Real-Time Liquidity Routing & Threat Analysis</p>
        </div>
      </div>

      <div className="telem-content">
        
        {/* Trading Bot Geo-Map */}
        <div className="telem-visual-map">
          <div style={{ position: 'absolute', inset: 0, opacity: 0.15, backgroundImage: `url(${worldMapUrl})`, backgroundSize: '150%', backgroundPosition: 'center', mixBlendMode: 'screen' }} />
          <svg viewBox="0 0 280 110" className="telem-svg-net" style={{ position: 'relative', zIndex: 2 }}>
            {/* Global Arbitrage Routes */}
            <path d="M 60 40 Q 100 0 140 30" className="telem-net-line f2" /> {/* NY -> LDN */}
            <path d="M 140 30 Q 180 60 235 45" className="telem-net-line f3" /> {/* LDN -> HK */}
            <path d="M 235 45 Q 150 90 60 40" className="telem-net-line" /> {/* HK -> NY */}
            
            {/* Exchange Nodes */}
            <circle cx="60" cy="40" r="3" className="node n-blue" />
            <circle cx="140" cy="30" r="3" className="node n-red" />
            <circle cx="235" cy="45" r="3" className="node n-green" />
            
            {/* Liquidity Packets travelling on routes */}
            <circle r="2" fill="#00E5FF">
              <animateMotion dur="4.5s" repeatCount="indefinite" path="M 235 45 Q 150 90 60 40" />
            </circle>
            <circle r="2" fill="#ff3366">
              <animateMotion dur="3.2s" repeatCount="indefinite" path="M 60 40 Q 100 0 140 30" />
            </circle>
            <circle r="2" fill="#4DB86A">
              <animateMotion dur="3.8s" repeatCount="indefinite" path="M 140 30 Q 180 60 235 45" />
            </circle>

            {/* Floating Trade Profits */}
            <text x="50" y="30" className="telem-profit-pop">+$240 (ARB)</text>
            <text x="130" y="20" className="telem-profit-pop p2">MEV EXEC</text>
            <text x="225" y="35" className="telem-profit-pop p3">-$12 (GAS)</text>
          </svg>
          <div className="telem-map-labels">
             <span style={{ position: 'absolute', top: '45px', left: '10px' }}>COINBASE<br/>[USA]</span>
             <span style={{ position: 'absolute', top: '10px', left: '135px' }}>KRAKEN<br/>[EU]</span>
             <span style={{ position: 'absolute', top: '50px', left: '220px' }}>BINANCE<br/>[HK]</span>
          </div>
        </div>

        {/* Top Assets */}
        <div className="telem-target-card">
          <div className="telem-tc-header">TOP ROUTED ASSETS</div>
          <div className="telem-bar-list">
            <div className="tb-item">
              <div className="tb-info"><span>BTC/USDT</span><span className="tb-val">198,662</span></div>
              <div className="tb-track"><div className="tb-fill" style={{width: '85%', background: '#4DB86A'}} /></div>
            </div>
            <div className="tb-item">
              <div className="tb-info"><span>ETH/USDT</span><span className="tb-val">126,617</span></div>
              <div className="tb-track"><div className="tb-fill" style={{width: '55%', background: '#4DB86A'}} /></div>
            </div>
            <div className="tb-item">
              <div className="tb-info"><span>SOL/USDT</span><span className="tb-val">87,756</span></div>
              <div className="tb-track"><div className="tb-fill" style={{width: '35%', background: '#f0a517'}} /></div>
            </div>
          </div>
        </div>

        {/* Real-Time Attack Feed */}
        <div className="telem-live-feed">
          <div className="telem-lf-head">LIVE ROUTES @ {time}</div>
          <div className="telem-feed-list">
            {feed.map((item, idx) => (
              <div key={item.id} className="telem-feed-row" style={{ animationDelay: `${idx * 0.1}s` }}>
                <div className="tf-top">
                  <div className="tf-route">
                    <span>{item.src}</span>
                    <span className="tf-arr">→</span>
                    <span>{item.dest}</span>
                  </div>
                  <div className="tf-status" style={{color: item.color}}>
                    {item.status} <span className="tf-badge-small" style={{background: item.color}}>{item.type}</span>
                  </div>
                </div>
                <div className="tf-bot">
                  <span>{item.tag}</span>
                  <span style={{fontFamily: 'Space Grotesk'}}>{item.id.toString().slice(-6)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
