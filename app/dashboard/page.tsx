'use client';
import { useState, useEffect } from 'react';

import DashboardHeader from '../components/DashboardHeader/DashboardHeader';
import RotatingRingCards from '../components/RotatingRingCards/RotatingRingCards';
import TradeHistoryCards from '../components/TradeHistoryCards/TradeHistoryCards';
import TradeFilters from '../components/TradeFilters/TradeFilters';
import PanelScouter from '../components/LiveScouter/LiveScouter';
import AmbientField, { MarketPulseTicker } from '../components/AmbientField/AmbientField';
import SpaceBackground from '../components/SpaceBackground/SpaceBackground';
import { SideTelemetryRight } from '../components/SideTelemetry/SideTelemetry';
import PortfolioPage from '../components/Portfolio/PortfolioPage';
import './dashboard.css';

function useHash() {
  const [hash, setHash] = useState('');
  useEffect(() => {
    const update = () => setHash(window.location.hash);
    update();
    window.addEventListener('hashchange', update);
    return () => window.removeEventListener('hashchange', update);
  }, []);
  return hash;
}

export default function DashboardPage() {
  const hash = useHash();
  const isPortfolio = hash === '#/portfolio';

  return (
    <div className="db-root">
      <SpaceBackground />
      <DashboardHeader />

      {isPortfolio ? (
        /* ── PORTFOLIO VIEW ── */
        <div className="db-dashboard">
          <PortfolioPage />
        </div>
      ) : (
        /* ── DASHBOARD VIEW ── */
        <div className="db-dashboard">

          {/* SECTION 1: MAIN STAGE */}
          <div className="db-main-stage" style={{ position: 'relative' }}>

            {/* Ambient floating motes — z:1, behind everything */}
            <AmbientField />

            {/* CENTERED FILTER BAR */}
            <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', zIndex: 30, width: '100%', maxWidth: '760px' }}>
              <TradeFilters />
            </div>

            {/* LEFT: Scouter HUD */}
            <div style={{ position: 'absolute', left: 0, top: '52px', zIndex: 15, width: '240px', paddingLeft: '32px', paddingRight: '8px' }}>
              <PanelScouter />
            </div>

            {/* CENTER: Rotating Ring Cards — takes FULL width */}
            <div className="db-ring-container">
              <RotatingRingCards />
            </div>

            {/* RIGHT: Side Telemetry (absolute positioned) */}
            <SideTelemetryRight />
          </div>

          {/* DIVIDER: live scrolling market ticker */}
          <MarketPulseTicker />

          {/* SECTION 2: TRADE HISTORY */}
          <div className="db-bottom-stage">
            <div className="th-cards-wrapper">
              <TradeHistoryCards />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

