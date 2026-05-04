'use client';
import { useState, useMemo } from 'react';
import { ArrowRight, Check, AlertCircle, X } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api';
import { PORTFOLIO_DATA_KEY } from '../../hooks/usePortfolioData';
import type { AssetData } from './HoldingsTable';
import './ConvertSmallAssets.css';

const getLogoUrl = (id: string) => `https://cryptologos.cc/logos/${id}-logo.png`;

export default function ConvertSmallAssets({ allAssets = [] }: { allAssets?: AssetData[] }) {
  const queryClient = useQueryClient();
  const [imgError, setImgError] = useState<Record<string, boolean>>({});
  
  // Filter for small assets (dust): value < $10 and not already USDT
  const smallAssets = useMemo(() => {
    return allAssets.filter(a => a.value < 10 && a.sym !== 'USDT');
  }, [allAssets]);

  const [selectedAssets, setSelectedAssets] = useState<Set<string>>(new Set());
  const [isConverting, setIsConverting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'} | null>(null);

  const toggleSelection = (sym: string) => {
    setSelectedAssets(prev => {
      const next = new Set(prev);
      if (next.has(sym)) next.delete(sym);
      else next.add(sym);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedAssets.size === smallAssets.length && smallAssets.length > 0) {
      setSelectedAssets(new Set());
    } else {
      setSelectedAssets(new Set(smallAssets.map(a => a.sym)));
    }
  };

  const handleConvertClick = () => {
    if (selectedAssets.size === 0) return;
    setShowModal(true);
  };

  const executeConversion = async () => {
    setIsConverting(true);
    setShowModal(false);
    try {
      const payloadAssets = smallAssets
        .filter(a => selectedAssets.has(a.sym))
        .map(a => ({ asset: a.sym, quantity: a.qty.toString() }));

      const res = await apiFetch<{ results: any[] }>('/mexc-account/convert-dust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assets: payloadAssets })
      });

      const successCount = res.results.filter(r => r.status === 'success').length;
      const skippedCount = res.results.filter(r => r.status === 'skipped').length;
      
      setToast({
        msg: `Conversion Complete: ${successCount} successful, ${skippedCount} skipped.`,
        type: 'success'
      });
      
      // Clear selection and refresh balances
      setSelectedAssets(new Set());
      queryClient.invalidateQueries({ queryKey: PORTFOLIO_DATA_KEY });

    } catch (e: any) {
      setToast({
        msg: e.message || 'Failed to execute conversion.',
        type: 'error'
      });
    } finally {
      setIsConverting(false);
      setTimeout(() => setToast(null), 5000);
    }
  };

  return (
    <div className="csa-container">
      {/* CARD 1: SMALL ASSETS LIST */}
      <div className="csa-card csa-list-card">
        <div className="csa-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <span>SMALL ASSETS</span>
          {smallAssets.length > 0 && (
            <div 
              style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', textTransform: 'none', fontSize: '12px', fontWeight: 500, color: '#94a3b8' }}
              onClick={toggleAll}
            >
              <span>Select All</span>
              <div className={`csa-checkbox ${selectedAssets.size === smallAssets.length ? 'checked' : ''}`}>
                {selectedAssets.size === smallAssets.length && <Check size={12} strokeWidth={4} />}
              </div>
            </div>
          )}
        </div>
        <div className="csa-list">
          {smallAssets.length === 0 ? (
            <div style={{ padding: '20px', color: '#64748b', textAlign: 'center', fontSize: '13px' }}>
              No small assets (dust) found.
            </div>
          ) : (
            smallAssets.map(a => (
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
            ))
          )}
        </div>
      </div>

      {/* CARD 2: CONVERT TO USDT */}
      <div className="csa-card csa-convert-card">
        <div className="csa-card-header">CONVERT DUST TO USDT</div>
        
        <div className="csa-visual-area">
          <div className="csa-conversion-illustration">
             <div className="csa-logo-cluster">
                <div className="csa-cluster-orb bnb-center" style={{ borderColor: '#26a17b' }}>
                  <img src={getLogoUrl('tether-usdt')} alt="USDT" />
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
            Market Sell crypto dusts for USDT
          </div>
          <button 
            className={`csa-convert-btn ${selectedAssets.size === 0 || isConverting ? 'disabled' : ''}`}
            onClick={handleConvertClick}
            disabled={selectedAssets.size === 0 || isConverting}
          >
            <span>{isConverting ? 'Processing...' : 'Convert to USDT'}</span>
            <ArrowRight size={16} className="csa-btn-icon" />
          </button>
        </div>
      </div>
      {/* TOAST */}
      {toast && (
        <div className={`csa-toast ${toast.type}`}>
          {toast.msg}
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      {showModal && (
        <div className="csa-modal-overlay">
          <div className="csa-modal">
            <button className="csa-modal-close" onClick={() => setShowModal(false)}><X size={18} /></button>
            <div className="csa-modal-icon"><AlertCircle size={32} color="#ef4444" /></div>
            <h3>Market Sell Dust</h3>
            <p>
              Are you sure you want to Market Sell the <strong>{selectedAssets.size} selected asset{selectedAssets.size > 1 ? 's' : ''}</strong> to USDT?
              This action executes live market orders on MEXC and is <strong>irreversible</strong>.
            </p>
            <div className="csa-modal-actions">
              <button className="csa-btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="csa-btn-confirm" onClick={executeConversion}>Yes, Market Sell</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
