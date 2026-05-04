import React from 'react';

export function BrandPanel() {
  return (
    <div className="new-brand-panel">
      {/* Background Orbs & Glass */}
      <div className="brand-bg-orb orb-1"></div>
      <div className="brand-bg-orb orb-2"></div>
      <div className="brand-glass-overlay"></div>

      {/* Slanted lines like the previous design */}
      <div className="brand-slanted-lines">
        <div className="slanted-line line-1"></div>
        <div className="slanted-line line-2"></div>
        <div className="slanted-line line-3"></div>
      </div>



      <div className="brand-content-wrapper">
        <div className="brand-hero-group">
          <div className="brand-header">
            <div className="brand-logo-icon">
               {/* eslint-disable-next-line @next/next/no-img-element */}
               <img src="/mainlogo.png" alt="ByteBoom" />
            </div>
            <div className="brand-logo-text">
              <h2>BYTEBOOM</h2>
              <span>COMMAND</span>
            </div>
          </div>

          <div className="brand-hero-text">
            <h1>
              Trade Smarter,<br />
              <span className="text-highlight">Execute Faster</span>
            </h1>
            <p className="brand-subtext">
              Automated liquidity bridging engineered for professional<br />market participants.
            </p>
          </div>
        </div>

        <div className="brand-status-bar">
          <div className="status-dot"></div>
          <span>ON AUTOPILOT</span>
          <span className="status-divider">|</span>
          <span>V1.0</span>
        </div>
      </div>
    </div>
  );
}
