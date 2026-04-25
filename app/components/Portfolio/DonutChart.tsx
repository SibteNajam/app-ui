'use client';
import { useRef, useEffect } from 'react';
import './DonutChart.css';

/* ══════════════════════════════════════════════════════
   DONUT CHART — SVG-based animated portfolio donut
   ══════════════════════════════════════════════════════ */

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
  centerLabel?: string;
  centerValue?: string;
}

export default function DonutChart({
  segments,
  size = 200,
  strokeWidth = 18,
  centerLabel,
  centerValue,
}: DonutChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;

  /* Animate segments on mount */
  useEffect(() => {
    const paths = svgRef.current?.querySelectorAll('.donut-segment');
    paths?.forEach((path, i) => {
      const el = path as SVGCircleElement;
      el.style.transition = 'none';
      el.style.strokeDashoffset = `${circumference}`;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.style.transition = `stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1) ${i * 0.15}s`;
          el.style.strokeDashoffset = el.dataset.targetOffset || '0';
        });
      });
    });
  }, [segments, circumference]);

  let accumulated = 0;

  return (
    <div className="donut-wrapper" style={{ width: size, height: size }}>
      <svg
        ref={svgRef}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="donut-svg"
      >
        {/* Background track */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.03)"
          strokeWidth={strokeWidth}
        />

        {/* Segments */}
        {segments.map((seg, i) => {
          const pct = total > 0 ? seg.value / total : 0;
          const dashLen = pct * circumference;
          const gapLen = circumference - dashLen;
          const offset = -accumulated * circumference + circumference * 0.25;
          accumulated += pct;

          return (
            <circle
              key={i}
              className="donut-segment"
              cx={cx}
              cy={cy}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dashLen} ${gapLen}`}
              strokeDashoffset={offset}
              strokeLinecap="butt"
              data-target-offset={offset}
              style={{ filter: `drop-shadow(0 0 6px ${seg.color}40)` }}
            />
          );
        })}
      </svg>

      {/* Center text */}
      {(centerLabel || centerValue) && (
        <div className="donut-center">
          {centerLabel && <span className="donut-center-label">{centerLabel}</span>}
          {centerValue && <span className="donut-center-value">{centerValue}</span>}
        </div>
      )}
    </div>
  );
}
