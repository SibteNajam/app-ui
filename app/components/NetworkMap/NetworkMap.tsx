'use client';
// import React, { useEffect, useRef } from 'react';
import './NetworkMap.css';

export default function NetworkMap() {
  return (
    <div className="nm-container">
      <div className="nm-header">
        <span className="nm-title">GLOBAL PING</span>
        <div className="nm-pulse-indicator"></div>
      </div>

      <div className="nm-map-display">
        {/* Abstract Map Background */}
        <div className="nm-grid-overlay"></div>

        {/* Nodes */}
        <div className="nm-node n-tokyo" title="Tokyo: 14ms">
          <div className="nm-ring"></div>
        </div>
        <div className="nm-node n-ny" title="NY: 42ms">
          <div className="nm-ring"></div>
        </div>
        <div className="nm-node n-lon" title="London: 28ms">
          <div className="nm-ring"></div>
        </div>
        <div className="nm-node n-fra" title="Frankfurt: 31ms">
          <div className="nm-ring"></div>
        </div>
        <div className="nm-node n-sgp" title="Singapore: 18ms">
          <div className="nm-ring"></div>
        </div>

        {/* Lines (SVG) */}
        <svg className="nm-connections" viewBox="0 0 200 150">
          <path className="nm-line" d="M160,50 Q120,40 100,70 T40,60" />
          <path className="nm-line delay-1" d="M100,70 Q90,90 80,100" />
          <path className="nm-line delay-2" d="M100,70 Q140,110 150,110" />
          <path className="nm-line delay-3" d="M160,50 Q180,80 150,110" />
        </svg>

        <div className="nm-scan-line"></div>
      </div>

      <div className="nm-stats">
        <div className="nm-stat">
          <span className="nm-stat-value">5</span>
          <span className="nm-stat-label">ACTIVE NODES</span>
        </div>
        <div className="nm-stat">
          <span className="nm-stat-value">26<small>ms</small></span>
          <span className="nm-stat-label">AVG LATENCY</span>
        </div>
      </div>
    </div>
  );
}
