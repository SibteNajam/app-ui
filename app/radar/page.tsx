'use client';

import { useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { SIGNALS } from './data/signals'
import RadarCard2D from '../components/3d/RadarCard2D'
import './radar.css'

// Dynamic import for RadarScene — it uses Three.js which can't SSR
const RadarScene = dynamic(() => import('../components/3d/RadarScene'), {
  ssr: false,
  loading: () => (
    <div style={{
      width: '100%', height: '100%', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: '#020c18', color: '#00e5ff',
      fontFamily: "'Orbitron', monospace", fontSize: '0.7rem',
      letterSpacing: '4px'
    }}>
      INITIALIZING HOLOGRAPHIC DISPLAY...
    </div>
  ),
})

export default function RadarPage() {
  const [phase, setPhase] = useState<'card' | 'expanding' | 'modal' | 'collapsing' | 'reappearing'>('card')
  const [activeBlip, setActiveBlip] = useState<number | null>(null)
  const [isCollapsing, setIsCollapsing] = useState(false)
  const [expandedCard, setExpandedCard] = useState<any>(null)

  const handleCardClick = useCallback(() => {
    if (phase !== 'card') return
    setPhase('expanding')
    setTimeout(() => setPhase('modal'), 700)
  }, [phase])

  const handleCollapse = useCallback(() => {
    if (phase !== 'modal') return
    setExpandedCard(null)
    setIsCollapsing(true)
    setPhase('collapsing')
  }, [phase])

  const handleCollapseComplete = useCallback(() => {
    setIsCollapsing(false)
    setActiveBlip(null)
    setExpandedCard(null)
    setPhase('reappearing')
    setTimeout(() => setPhase('card'), 600)
  }, [])

  const handleBlipClick = useCallback((blipData: any) => {
    setActiveBlip((prev: number | null) => prev === blipData.id ? null : blipData.id)
  }, [])

  const handleExpandCard = useCallback((cardData: any) => {
    setExpandedCard(cardData)
    setActiveBlip(cardData.id)
  }, [])

  const handleCloseCard = useCallback(() => {
    setExpandedCard(null)
  }, [])

  const longCount = SIGNALS.filter(s => s.type === 'LONG').length
  const shortCount = SIGNALS.filter(s => s.type === 'SHORT').length
  const avgConf = Math.round(SIGNALS.reduce((a, s) => a + s.conf, 0) / SIGNALS.length)

  return (
    <div className="radar-root">
      <div className="scanline-overlay" />

      {/* ═══ FLAT CARD VIEW ═══ */}
      {(phase === 'card' || phase === 'expanding' || phase === 'reappearing') && (
        <div className="dashboard">
          <div className="dashboard-title">⬡ BYTEBOOM.AI — SIGNAL INTELLIGENCE</div>
          <div className="dashboard-subtitle">CLICK RADAR TO ENTER 3D COMMAND VIEW</div>

          <div className={`radar-card ${phase === 'expanding' ? 'expanding' : ''} ${phase === 'reappearing' ? 'reappearing' : ''}`}>
            {phase !== 'expanding' && <RadarCard2D onClick={handleCardClick} />}
          </div>
        </div>
      )}

      {/* ═══ 3D MODAL VIEW ═══ */}
      {(phase === 'modal' || phase === 'collapsing') && (
        <div className="radar-modal-overlay">
          <div className="radar-modal-content">
            <RadarScene
              isCollapsing={isCollapsing}
              onCollapseComplete={handleCollapseComplete}
              onBlipClick={handleBlipClick}
              activeBlip={activeBlip}
              expandedCard={expandedCard}
              onExpandCard={handleExpandCard}
              onCloseCard={handleCloseCard}
            />
          </div>

          {/* Top HUD */}
          <div className="modal-hud-top">
            <div className="hud-left">
              <div className="hud-title">⬡ STARK INTELLIGENCE RADAR</div>
              <div className="hud-subtitle">HOLOGRAPHIC SCAN — CLICK CARDS TO EXPAND · DRAG TO REPOSITION</div>
            </div>
            <div className="hud-right">
              <div className="hud-stats">
                <div className="hud-stat">
                  <div className="hud-stat-value">{SIGNALS.length}</div>
                  <div className="hud-stat-label">Total</div>
                </div>
                <div className="hud-stat">
                  <div className="hud-stat-value" style={{ color: '#00ff9d' }}>{longCount}</div>
                  <div className="hud-stat-label">Long</div>
                </div>
                <div className="hud-stat">
                  <div className="hud-stat-value" style={{ color: '#ff6b6b' }}>{shortCount}</div>
                  <div className="hud-stat-label">Short</div>
                </div>
                <div className="hud-stat">
                  <div className="hud-stat-value" style={{ color: '#00e5ff' }}>{avgConf}%</div>
                  <div className="hud-stat-label">Avg Conf</div>
                </div>
              </div>
              <button className="collapse-btn" onClick={handleCollapse}>
                ◁ COLLAPSE
              </button>
            </div>
          </div>

          {/* Bottom HUD */}
          <div className="modal-hud-bottom">
            <div className="hud-instructions">
              <span>⟳</span> DRAG to rotate &nbsp;&nbsp;
              <span>⊕</span> SCROLL to zoom (follows cursor) &nbsp;&nbsp;
              <span>◉</span> CLICK dot to expand &nbsp;&nbsp;
              <span>🔍</span> FLY CLOSE for exploded view &nbsp;&nbsp;
              <span>↻</span> DRAG card/dot to rotate it &nbsp;&nbsp;
              <span>⌂</span> Press H to reset view
            </div>
            <div className="hud-timestamp">
              SYS.TIME {new Date().toLocaleTimeString('en-US', { hour12: false })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
