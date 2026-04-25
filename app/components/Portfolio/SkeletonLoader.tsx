'use client';
import './SkeletonLoader.css';

/* ══════════════════════════════════════════════════════
   SKELETON LOADER — Reusable shimmer placeholders
   ══════════════════════════════════════════════════════ */

interface SkeletonProps {
  width?: string;
  height?: string;
  borderRadius?: string;
  variant?: 'text' | 'circle' | 'rect' | 'card';
  className?: string;
}

export function Skeleton({
  width = '100%',
  height = '14px',
  borderRadius = '6px',
  variant = 'rect',
  className = '',
}: SkeletonProps) {
  const variantStyles: Record<string, React.CSSProperties> = {
    text: { width, height, borderRadius: '4px' },
    circle: {
      width: width === '100%' ? '40px' : width,
      height: width === '100%' ? '40px' : width,
      borderRadius: '50%',
    },
    rect: { width, height, borderRadius },
    card: { width: '100%', height: height || '180px', borderRadius: '12px' },
  };

  return (
    <div
      className={`skeleton-shimmer ${className}`}
      style={variantStyles[variant]}
    />
  );
}

/* ── Exchange Card Skeleton ── */
export function ExchangeCardSkeleton() {
  return (
    <div className="skel-exchange-card">
      <div className="skel-card-header">
        <div className="skel-card-header-left">
          <Skeleton variant="circle" width="32px" />
          <div className="skel-card-header-text">
            <Skeleton width="120px" height="14px" />
            <Skeleton width="90px" height="10px" />
          </div>
        </div>
        <Skeleton variant="circle" width="20px" />
      </div>
      <div className="skel-card-bars">
        <Skeleton width="85%" height="6px" borderRadius="3px" />
        <Skeleton width="60%" height="6px" borderRadius="3px" />
      </div>
      <div className="skel-card-stats">
        <div className="skel-stat-row">
          <span className="skel-stat-label">Total:</span>
          <Skeleton width="80px" height="12px" />
          <Skeleton width="50px" height="12px" />
        </div>
        <div className="skel-stat-row">
          <span className="skel-stat-label">24hr changes:</span>
          <Skeleton width="60px" height="12px" />
          <Skeleton width="40px" height="12px" />
        </div>
      </div>
      <div className="skel-card-bottom">
        <Skeleton width="70%" height="8px" borderRadius="4px" />
        <Skeleton width="40%" height="8px" borderRadius="4px" />
      </div>
    </div>
  );
}

/* ── Full Section Skeleton ── */
export function PortfolioSkeleton() {
  return (
    <div className="skel-portfolio-section">
      <div className="skel-section-divider">
        <span className="skel-section-label">EXCHANGES</span>
      </div>
      <div className="skel-cards-grid">
        <ExchangeCardSkeleton />
        <ExchangeCardSkeleton />
        <ExchangeCardSkeleton />
      </div>
      <div className="skel-section-divider" style={{ marginTop: 24 }}>
        <span className="skel-section-label">VIRTUAL PORTFOLIO</span>
      </div>
      <div className="skel-cards-grid">
        <ExchangeCardSkeleton />
        <ExchangeCardSkeleton />
        <ExchangeCardSkeleton />
      </div>
    </div>
  );
}

export default Skeleton;
