// Signal data — scattered in true 3D space (not on a plane)
// angle/r derived from pos for 2D radar preview compatibility

export interface Signal {
  id: number;
  sym: string;
  conf: number;
  color: string;
  type: 'LONG' | 'SHORT';
  pos: [number, number, number];
  angle: number;
  r: number;
  price: string;
  change: string;
  vol: string;
  desc: string;
}

export interface PopupSlot {
  x: number;
  y: number;
}

export const SIGNALS: Signal[] = [
  { id: 1, sym: 'BTCUSDT',   conf: 94, color: '#00e5ff', type: 'LONG',  pos: [3.2, 1.8, -2.5],   angle: 0.42, r: 0.52, price: '67,842.50', change: '+2.34%', vol: '1.2B', desc: 'Strong momentum breakout above 67K resistance with volume confirmation' },
  { id: 2, sym: 'ETHUSDT',   conf: 87, color: '#00ff9d', type: 'LONG',  pos: [-2.8, -1.2, 3.0],  angle: 1.15, r: 0.68, price: '3,456.78', change: '+1.89%', vol: '890M', desc: 'Ascending triangle formation completing, RSI divergence bullish' },
  { id: 3, sym: 'SOLUSDT',   conf: 76, color: '#c77dff', type: 'SHORT', pos: [1.5, 3.5, 2.8],    angle: 2.35, r: 0.38, price: '142.35', change: '-3.12%', vol: '456M', desc: 'Double top pattern at resistance, bearish engulfing on 4H' },
  { id: 4, sym: 'BNBUSDT',   conf: 91, color: '#ffd60a', type: 'LONG',  pos: [-3.5, 0.5, -3.2],  angle: 3.7,  r: 0.62, price: '598.20', change: '+1.45%', vol: '320M', desc: 'Cup and handle breakout confirmed, strong buy pressure accumulating' },
  { id: 5, sym: 'ADAUSDT',   conf: 68, color: '#ff6b6b', type: 'SHORT', pos: [4.0, -2.5, 1.0],   angle: 4.5,  r: 0.76, price: '0.4523', change: '-2.78%', vol: '210M', desc: 'Head and shoulders forming on daily, volume declining on rallies' },
  { id: 6, sym: 'XRPUSDT',   conf: 83, color: '#00e5ff', type: 'LONG',  pos: [-1.0, 2.8, -4.0],  angle: 5.2,  r: 0.44, price: '0.6234', change: '+4.12%', vol: '780M', desc: 'Breaking out of 6-month consolidation range with momentum' },
  { id: 7, sym: 'DOTUSDT',   conf: 72, color: '#00ff9d', type: 'SHORT', pos: [2.5, -3.0, -1.5],  angle: 0.95, r: 0.82, price: '7.85', change: '-1.56%', vol: '145M', desc: 'Bearish flag pattern, lower highs on 1H with increasing sell volume' },
  { id: 8, sym: 'MATICUSDT', conf: 89, color: '#c77dff', type: 'LONG',  pos: [-2.0, 0.0, 2.0],   angle: 2.8,  r: 0.3,  price: '0.8912', change: '+3.67%', vol: '290M', desc: 'Strong accumulation zone, whale wallets increasing position size' },
]

// Popup slot positions for 2D card view
export const POPUP_SLOTS: PopupSlot[] = [
  { x: 0.65, y: 0.08 },
  { x: 0.80, y: 0.22 },
  { x: 0.88, y: 0.48 },
  { x: 0.78, y: 0.70 },
  { x: 0.62, y: 0.82 },
  { x: 0.54, y: 0.20 },
  { x: 0.70, y: 0.58 },
  { x: 0.56, y: 0.62 },
]
