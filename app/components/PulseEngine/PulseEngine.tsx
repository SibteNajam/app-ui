'use client';
import { useState, useRef } from 'react';
import './PulseEngine.css';

export default function PulseEngine() {
  const [phase, setPhase] = useState<'idle' | 'syncing' | 'optimal'>('idle');
  const timer1 = useRef<number | null>(null);
  const timer2 = useRef<number | null>(null);

  const handleHover = () => {
    if (phase !== 'idle') return;
    setPhase('syncing');

    // Smooth elegant delay before locking into optimal
    timer1.current = window.setTimeout(() => {
      setPhase('optimal');
    }, 1200);
  };

  const handleLeave = () => {
    if (timer1.current) clearTimeout(timer1.current);
    if (timer2.current) clearTimeout(timer2.current);
    setPhase('idle');
  };

  return (
    <div className={`pe-wrapper ${phase}`} onMouseEnter={handleHover} onMouseLeave={handleLeave}>
      
      {/* ── IDLE SPINE (50px wide) ── */}
      <div className="pe-spine">
        <div className="pe-s-top">
          <div className="pe-dot" />
        </div>
        <div className="pe-s-txt">SYSTEM_PULSE</div>
        <div className="pe-s-bot">
          {/* subtle sine wave dots */}
          <div className="pe-wave-dots">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="pe-w-dot" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      </div>

      {/* ── EXPANDED PANEL ── */}
      <div className="pe-panel">
        <div className="pe-grid-bg" />

        <div className="pe-header">
          <span className="pe-h-title">// ENGINE STATUS</span>
          <span className={`pe-h-badge ${phase}`}>
            {phase === 'optimal' ? 'ONLINE' : 'SYNCING'}
          </span>
        </div>

        <div className="pe-content">
          {/* Abstract elegant core visual */}
          <div className="pe-core-stage">
            <div className={`pe-core-ring r1 ${phase}`} />
            <div className={`pe-core-ring r2 ${phase}`} />
            <div className={`pe-core-ring r3 ${phase}`} />
            <div className={`pe-core-orb ${phase}`}>
               VB
            </div>
          </div>

          <div className="pe-status-text">
            {phase === 'syncing' ? 'CALIBRATING CORE...' : 'ALL SYSTEMS OPTIMAL'}
          </div>

          <div className={`pe-metrics ${phase}`}>
            <div className="pe-m-item">
              <span className="pe-m-lbl">UPTIME</span>
              <span className="pe-m-val">99.98%</span>
            </div>
            <div className="pe-m-item">
              <span className="pe-m-lbl">LATENCY</span>
              <span className="pe-m-val" style={{ color: '#00ff88' }}>14ms</span>
            </div>
            <div className="pe-m-item">
              <span className="pe-m-lbl">NETWORK</span>
              <span className="pe-m-val">SECURE</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
