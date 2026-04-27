'use client';
import { useState } from 'react';
import { ArrowRight, Check } from 'lucide-react';
import './ConvertSmallAssets.css';

const SMALL_ASSETS = [
  { sym: 'BTC', name: 'Bitcoin', qty: 0.1141, value: 2.969, color: '#f59e0b', id: 'bitcoin-btc' },
  { sym: 'ETH', name: 'Ethereum', qty: 0.14227, value: 0.229, color: '#627eea', id: 'ethereum-eth' },
  { sym: 'SOL', name: 'Solana', qty: 2.607, value: 2.304, color: '#9945ff', id: 'solana-sol' },
  { sym: 'BNB', name: 'Binance COIN', qty: 1.068, value: 1.068, color: '#f0b90b', id: 'bnb-bnb' },
  { sym: 'LINK', name: 'Chainlink', qty: 0.799, value: 0.799, color: '#2a5ada', id: 'chainlink-link' },
];

const getLogoUrl = (id: string) => `https://cryptologos.cc/logos/${id}-logo.png`;

export default function ConvertSmallAssets() {
  const [imgError, setImgError] = useState<Record<string, boolean>>({});
  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set(SMALL_ASSETS.map(a => a.sym)));

  const toggleSelection = (sym: string) => {
    setSelectedAssets(prev => {
      const next = new Set(prev);
      if (next.has(sym)) next.delete(sym);
      else next.add(sym);
      return next;
    });
  };

  return (
    <div className="csa-container">
      {/* CARD 1: SMALL ASSETS LIST */}
      <div className="csa-card csa-list-card">
        <div className="csa-card-header">SMALL ASSETS</div>
        <div className="csa-list">
          {SMALL_ASSETS.map(a => (
            <div key={a.sym} className="csa-list-item" onClick={() => toggleSelection(a.sym)} style={{ cursor: 'pointer' }}>
              <div className="csa-item-left">
                <div className={`csa-checkbox ${selectedAssets.has(a.sym) ? 'checked' : ''}`}>
                  {selectedAssets.has(a.sym) && <Check size={12} strokeWidth={4} />}
                </div>
                <div className="csa-icon-wrap" style={{ background: `${a.color}22` }}>
                  {!imgError[a.sym] ? (
                    <img 
                      src={getLogoUrl(a.id)} 
                      alt={a.sym} 
                      onError={() => setImgError(prev => ({...prev, [a.sym]: true}))}
                      className="csa-real-logo"
                    />
                  ) : (
                    <span style={{ color: a.color, fontWeight: 'bold' }}>{a.sym[0]}</span>
                  )}
                </div>
                <div className="csa-item-info">
                  <div className="csa-item-sym">{a.sym}</div>
                  <div className="csa-item-name">{a.name}</div>
                </div>
              </div>
              <div className="csa-item-right">
                <div className="csa-item-val">${a.value.toFixed(3)}</div>
                <div className="csa-item-qty">{a.qty} {a.sym}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CARD 2: CONVERT TO BNB */}
      <div className="csa-card csa-convert-card">
        <div className="csa-card-header">CONVERT DUST TO BNB</div>
        
        <div className="csa-visual-area">
          <div className="csa-conversion-illustration">
             {/* Simple visual with BNB in center and others around with arrows */}
             <div className="csa-logo-cluster">
                <div className="csa-cluster-orb bnb-center">
                  <img src={getLogoUrl('bnb-bnb')} alt="BNB" />
                </div>
                <div className="csa-cluster-orb pos-top">
                  <img src={getLogoUrl('solana-sol')} alt="SOL" />
                </div>
                <div className="csa-cluster-orb pos-left">
                  <img src={getLogoUrl('ethereum-eth')} alt="ETH" />
                </div>
                <div className="csa-cluster-orb pos-bottom">
                  <img src={getLogoUrl('bitcoin-btc')} alt="BTC" />
                </div>
                
                {/* SVG Arrows indicating conversion flow to BNB */}
                <svg className="csa-cluster-arrows" viewBox="0 0 100 100">
                  <path d="M 50 20 Q 70 30 75 45" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeDasharray="3 3"/>
                  <polygon points="75,45 72,40 78,41" fill="rgba(255,255,255,0.4)" />
                  
                  <path d="M 25 50 Q 35 65 45 70" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeDasharray="3 3"/>
                  <polygon points="45,70 40,68 41,74" fill="rgba(255,255,255,0.4)" />
                  
                  <path d="M 50 80 Q 75 75 80 55" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" strokeDasharray="3 3"/>
                  <polygon points="80,55 77,60 83,58" fill="rgba(255,255,255,0.4)" />
                </svg>
             </div>
          </div>
          <div className="csa-convert-text">
            Convert your crypto dusts to BNB
          </div>
          <button className="csa-convert-btn">
            <span>Convert BNB</span>
            <ArrowRight size={16} className="csa-btn-icon" />
          </button>
        </div>
      </div>
    </div>
  );
}
