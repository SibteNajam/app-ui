'use client';
import { useEffect, useRef, useState } from 'react';
import './LivePriceChart.css';

export default function LivePriceChart() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [displayedPrice, setDisplayedPrice] = useState('...');
  
  const targetPriceRef = useRef(0);
  const currentSmoothedPriceRef = useRef(0);
  const pointsRef = useRef<number[]>([]);
  const minScaleRef = useRef(0);
  const maxScaleRef = useRef(0);

  // ─────────────────────────────────────────────────────────────
  // 1. WebSocket for Real Live BTC Price
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@trade');
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const price = parseFloat(data.p);
        if (price > 0) {
          targetPriceRef.current = price;
          setDisplayedPrice(price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
          
          // Seed the initial value immediately
          if (currentSmoothedPriceRef.current === 0) {
            currentSmoothedPriceRef.current = price;
            const w = canvasRef.current?.width || 800;
            pointsRef.current = Array(w).fill(price);
          }
        }
      } catch (err) {}
    };

    return () => {
      ws.close();
    };
  }, []);

  // ─────────────────────────────────────────────────────────────
  // 2. Liquid Smooth 60FPS Canvas Render
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const resize = () => {
      const parent = canvas.parentElement;
      if (parent) {
        // Set actual pixel resolution to match display size exactly
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        
        // Fill empty array to match 70% of screen width (Head of chart at 70%)
        const headWidth = Math.floor(parent.clientWidth * 0.70);
        if (pointsRef.current.length === 0) {
           const initialPrice = targetPriceRef.current > 0 ? targetPriceRef.current : 76500;
           currentSmoothedPriceRef.current = initialPrice;
           pointsRef.current = Array(headWidth).fill(initialPrice);
        } else {
           // Pad array if resized
           while(pointsRef.current.length < headWidth) {
             pointsRef.current.unshift(pointsRef.current[0]);
           }
        }
      }
    };
    resize();
    window.addEventListener('resize', resize);

    function render() {
      const w = canvas!.width;
      const h = canvas!.height;
      const now = Date.now();

      // Ensure target price is realistic
      let target = targetPriceRef.current;
      if (target === 0) target = 76500; 
      
      // Update the 60FPS fluid history array
      let current = currentSmoothedPriceRef.current || target;
      
      // Much slower, honey-like easing so it constantly curves instead of flat-lining
      current += (target - current) * 0.015; 
      currentSmoothedPriceRef.current = current;

      // Shift points for continuous forward flow (leftwards scroll)
      const headLimit = Math.floor(w * 0.70);
      
      // Inject living micro-volatility (sine wave breathing) so it NEVER flatlines completely
      const microVolatility = Math.sin(now * 0.002) * 0.5 + Math.cos(now * 0.005) * 0.2; 
      const plottedCurrent = current + microVolatility;

      pointsRef.current.push(plottedCurrent);
      while (pointsRef.current.length > headLimit) {
        pointsRef.current.shift();
      }

      const points = pointsRef.current;

      let idealMin = Math.min(...points);
      let idealMax = Math.max(...points);

      // Pad mathematically by only $50 so the zooming is extreme and liquid
      if (idealMax - idealMin < 10) {
        idealMax = plottedCurrent + 25;
        idealMin = plottedCurrent - 25;
      } else {
        idealMax += (idealMax - idealMin) * 0.15;
        idealMin -= (idealMax - idealMin) * 0.15;
      }
      
      // Initialize scale instantly if un-set
      if (minScaleRef.current === 0) minScaleRef.current = idealMin;
      if (maxScaleRef.current === 0) maxScaleRef.current = idealMax;
      
      // CINEMATIC SCALE EASING to prevent sudden range flattening
      minScaleRef.current += (idealMin - minScaleRef.current) * 0.02;
      maxScaleRef.current += (idealMax - maxScaleRef.current) * 0.02;

      const minP = minScaleRef.current;
      const maxP = maxScaleRef.current;
      const range = Math.max(0.1, maxP - minP); // prevent divide by zero

      // Clear Screen
      ctx!.clearRect(0, 0, w, h);

      // Draw Dull Horizontal Grid Lines
      ctx!.lineWidth = 1;
      const numLines = 5;
      for (let i=0; i<numLines; i++) {
         const yVal = minP + (range * (i / (numLines-1)));
         const yPos = h - ((yVal - minP) / range) * h;
         
         ctx!.beginPath();
         ctx!.strokeStyle = 'rgba(255, 255, 255, 0.03)';
         ctx!.setLineDash([4, 4]); // dashed line
         ctx!.moveTo(0, yPos);
         ctx!.lineTo(w, yPos);
         ctx!.stroke();
         ctx!.setLineDash([]); // reset

         // Y-axis Value Label on right side
         ctx!.fillStyle = 'rgba(255, 255, 255, 0.3)';
         ctx!.font = '10px monospace';
         ctx!.textAlign = 'right';
         ctx!.fillText('$' + yVal.toFixed(0), w - 5, yPos - 5);
      }

      // Build Bezier Smooth Path for pure liquid rolling
      ctx!.beginPath();
      for (let i = 0; i < points.length; i++) {
        const x = i; 
        const y = h - ((points[i] - minP) / range) * h;
        
        if (i === 0) {
          ctx!.moveTo(x, y);
        } else {
          // Calculate completely smooth curve math to prevent jagged "steps"
          const prevX = i - 1;
          const prevY = h - ((points[i-1] - minP) / range) * h;
          const cpX = (prevX + x) / 2;
          ctx!.quadraticCurveTo(cpX, prevY, x, y);
        }
      }

      // Stroke Line (Clean line strictly, NO fill/shadow as requested)
      ctx!.strokeStyle = '#00E5FF';
      ctx!.lineWidth = 2.5;
      ctx!.lineJoin = 'round';
      ctx!.stroke();

      // Draw leading Tracker Dot
      const lastX = points.length - 1;
      const lastY = h - ((plottedCurrent - minP) / range) * h;

      ctx!.beginPath();
      ctx!.arc(lastX, lastY, 4, 0, Math.PI * 2);
      ctx!.fillStyle = '#FFF';
      ctx!.fill();
      ctx!.lineWidth = 2;
      ctx!.strokeStyle = '#00E5FF';
      ctx!.stroke();

      // Draw Tracker Horizontal line & "Target" badge (Right Side)
      ctx!.beginPath();
      ctx!.setLineDash([2, 4]);
      ctx!.strokeStyle = 'rgba(0, 229, 255, 0.4)';
      ctx!.moveTo(lastX, lastY); // Start dashed line exactly from the dot
      ctx!.lineTo(w, lastY); // Stretch to right edge
      ctx!.stroke();
      ctx!.setLineDash([]);

      const targetBoxW = 45;
      const targetBoxH = 18;
      ctx!.fillStyle = 'rgba(0, 229, 255, 0.2)';
      
      ctx!.fillRect(w - targetBoxW - 5, lastY - targetBoxH / 2, targetBoxW, targetBoxH);
      
      ctx!.fillStyle = '#00E5FF';
      ctx!.font = 'bold 9px monospace';
      ctx!.textAlign = 'center';
      ctx!.textBaseline = 'middle';
      ctx!.fillText('TARGET', w - targetBoxW/2 - 5, lastY);


      animId = requestAnimationFrame(render);
    }

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="lpc-wrapper">
      <div className="lpc-header">
        <div className="lpc-icon-wrap">
          <img src="https://cryptologos.cc/logos/bitcoin-btc-logo.svg?v=024" alt="BTC" />
        </div>
        <div className="lpc-title-col">
          <div className="lpc-asset-name">Bitcoin LIVE - Spot Market</div>
          <div className="lpc-timestamp">Current Price • Eased Execution Path</div>
        </div>
        <div className="lpc-hero-price">
          ${displayedPrice}
        </div>
      </div>

      <div className="lpc-canvas-container">
        <canvas ref={canvasRef} className="lpc-canvas"></canvas>
      </div>

      {/* Footer timeframe buttons matching exactly the reference UI */}
      <div className="lpc-chart-footer">
         <div className="lpc-btn">Past</div>
         <div className="lpc-btn" style={{color: '#ff3366'}}>• 1 Min</div>
         <div className="lpc-btn active" style={{color: '#00E5FF'}}>• Live</div>
         <div className="lpc-btn">1 Hour</div>
         <div className="lpc-btn more-btn">More ▾</div>
      </div>
    </div>
  );
}
