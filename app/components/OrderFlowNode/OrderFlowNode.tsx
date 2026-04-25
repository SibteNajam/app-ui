'use client';
import { useState, useRef } from 'react';
import './OrderFlowNode.css';

export default function OrderFlowNode() {
  const [phase, setPhase] = useState<'standby' | 'detecting' | 'executed'>('standby');
  const [logs, setLogs] = useState<string[]>([]);
  const detectTimeout = useRef<number | null>(null);
  const logInterval = useRef<number | null>(null);

  const MOCK_LOGS = [
    '0x8A1... APPROVE 50M USDT',
    'PRE-COMPUTE ROUTE: UNISWAP V3',
    'MEMPOOL: PENDING BLOCK 19022',
    'GAS GWEI SPIKE DETECTED: 110',
    '0x2F4... SWAP 1800 ETH',
    'CALCULATING SLIPPAGE...',
    'MEV BOT: BYPASS PROTOCOL ENGAGED'
  ];

  const onHover = () => {
    if (phase !== 'standby') return;
    setPhase('detecting');
    setLogs([]);

    let idx = 0;
    logInterval.current = window.setInterval(() => {
      setLogs(prev => [...prev.slice(-2), MOCK_LOGS[idx % MOCK_LOGS.length]]);
      idx++;
    }, 180);

    detectTimeout.current = window.setTimeout(() => {
      if (logInterval.current) clearInterval(logInterval.current);
      setPhase('executed');
    }, 1800);
  };

  const onLeave = () => {
    if (logInterval.current) clearInterval(logInterval.current);
    if (detectTimeout.current) clearTimeout(detectTimeout.current);
    setPhase('standby');
    setLogs([]);
  };

  return (
    <div className="ofn-container">
      <div className={`ofn-card ${phase}`} onMouseEnter={onHover} onMouseLeave={onLeave}>
        
        {/* Left Spine (Always Visible 80px) */}
        <div className="ofn-spine">
          <div className="ofn-s-top">
            <div className={`ofn-s-dot ${phase}`} />
            <div className="ofn-s-lbl">FLOW</div>
          </div>
          <div className="ofn-s-txt">MEV_SNIPER_04</div>
          <div className="ofn-s-bottom">
            <div className="ofn-s-ping" />
          </div>
        </div>

        {/* Expanded Panel (Left 80px visible, expands to 340px to reveal) */}
        <div className="ofn-panel">
          <div className="ofn-p-grid" /> {/* Background texture */}

          <div className="ofn-p-header">
            <span className="ofn-ph-title">// MEMPOOL SCANNER</span>
            <span className={`ofn-ph-badge ${phase}`}>
              {phase === 'executed' ? 'LOCKED' : phase.toUpperCase()}
            </span>
          </div>

          <div className="ofn-p-content">
            {phase === 'standby' && (
              <div className="ofn-standby">
                <div className="ofn-pulse-ring" />
                <div className="ofn-st-txt">MONITORING PENDING BLOCKS...</div>
              </div>
            )}

            {phase === 'detecting' && (
              <div className="ofn-detecting">
                <div className="ofn-d-bars">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="ofn-d-bar" style={{ animationDelay: `${i * 0.05}s` }} />
                  ))}
                </div>
                <div className="ofn-d-logs">
                  {logs.map((L, i) => <div key={i} className="ofn-d-log-row">{L}</div>)}
                </div>
              </div>
            )}

            {phase === 'executed' && (
              <div className="ofn-executed">
                <div className="ofn-hi-lbl">SNIPE SUCCESSFUL</div>
                <div className="ofn-hi-val">+ $4,280.50</div>
                <div className="ofn-hi-sub">FRONT-RUN SUCCESS // PROFIT SECURED</div>
                <div className="ofn-hi-div" />
                
                <div className="ofn-stats">
                  <div className="ofn-stat-box">
                    <span className="ofn-bx-lbl">TARGET</span>
                    <span className="ofn-bx-val" style={{ color: '#E8EAF6' }}>WETH/USDT</span>
                  </div>
                  <div className="ofn-stat-box">
                    <span className="ofn-bx-lbl">LATENCY</span>
                    <span className="ofn-bx-val">12ms</span>
                  </div>
                  <div className="ofn-stat-box">
                    <span className="ofn-bx-lbl">GAS PAID</span>
                    <span className="ofn-bx-val" style={{ color: '#E84142' }}>$112.40</span>
                  </div>
                  <div className="ofn-stat-box">
                    <span className="ofn-bx-lbl">ROUTER</span>
                    <span className="ofn-bx-val">ETH_DARKPOOL</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="ofn-p-footer">
            <div className="ofn-pf-line" />
            <span>VAULTBOT MEV PROTOCOL V1.2</span>
          </div>
        </div>

      </div>
    </div>
  );
}
