import React, { useState, useEffect, useLayoutEffect, useMemo } from 'react';
import { PieChart, Pie, Cell } from 'recharts';
import { useDashboardTrades } from '../../hooks/useDashboardTrades';

export default function TradeAllocation({ dk }: { dk: boolean }) {
  const [chartReady, setChartReady] = useState(false);
  useEffect(() => { setChartReady(true); }, []);

  const { completedTrades } = useDashboardTrades();

  const data = useMemo(() => {
    const counts: Record<string, number> = {};
    completedTrades.forEach(t => {
      const sym = t.entryOrder?.symbol || 'UNKNOWN';
      counts[sym] = (counts[sym] || 0) + 1;
    });

    const sorted = Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    const total = completedTrades.length || 1;
    
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#0ea5e9'];
    const top = sorted.slice(0, 5).map((s, i) => ({
      name: s.name,
      value: s.value,
      color: colors[i],
      pct: ((s.value / total) * 100).toFixed(1) + '%'
    }));

    if (sorted.length > 5) {
      const othersValue = sorted.slice(5).reduce((sum, s) => sum + s.value, 0);
      top.push({
        name: `Others (${sorted.length - 5})`,
        value: othersValue,
        color: '#64748b',
        pct: ((othersValue / total) * 100).toFixed(1) + '%'
      });
    }

    return top.length > 0 ? top : [{ name: 'No Data', value: 1, color: '#64748b', pct: '100%' }];
  }, [completedTrades]);

  const uniqueSymbols = useMemo(() => new Set(completedTrades.map(t => t.entryOrder?.symbol)).size, [completedTrades]);
  const totalTrades = completedTrades.length;
  
  const top5Pct = useMemo(() => {
    if (totalTrades === 0) return 0;
    const top5sum = data.filter(d => !d.name.startsWith('Others')).reduce((s, d) => s + d.value, 0);
    return Math.round((top5sum / totalTrades) * 100);
  }, [data, totalTrades]);

  const stats = useMemo(() => {
    const wins = completedTrades.filter(t => t.pnl.realized >= 0);
    const losses = completedTrades.filter(t => t.pnl.realized < 0);
    const winRate = totalTrades > 0 ? (wins.length / totalTrades * 100).toFixed(1) : '0.0';
    const totalWinPnl = wins.reduce((s, t) => s + t.pnl.realized, 0);
    const totalLossPnl = Math.abs(losses.reduce((s, t) => s + t.pnl.realized, 0)) || 1;
    const profitFactor = (totalWinPnl / totalLossPnl).toFixed(2);
    return { winRate, profitFactor };
  }, [completedTrades, totalTrades]);

  return (
    <div style={{
      padding: '24px',
      borderLeft: `1px solid ${dk ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)'}`,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Inter', sans-serif",
      width: '100%',
      height: '100%',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: dk ? '#fff' : '#111', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Trade Allocation</div>
          <div style={{ fontSize: 11, color: dk ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.5)', marginTop: 4 }}>{uniqueSymbols} symbols traded · Top 5 represent {top5Pct}% of all trades</div>
        </div>
        <div style={{ display: 'flex', background: dk ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderRadius: 6, padding: 2 }}>
          <div style={{ padding: '4px 12px', fontSize: 11, fontWeight: 600, background: dk ? 'rgba(52, 211, 153, 0.15)' : 'rgba(52, 211, 153, 0.15)', color: '#34d399', borderRadius: 4, cursor: 'pointer' }}>Symbol</div>
          <div style={{ padding: '4px 12px', fontSize: 11, fontWeight: 600, color: dk ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', cursor: 'pointer' }}>Outcome</div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', flex: 1, gap: 16, alignItems: 'center' }}>
        {/* Donut Chart */}
        <div style={{ width: 130, height: 130, position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {chartReady && (
            <PieChart width={130} height={130}>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={65}
                stroke="none"
                dataKey="value"
                paddingAngle={1}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          )}
          {/* Inner Text */}
          <div style={{ position: 'absolute', textAlign: 'center', pointerEvents: 'none' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: dk ? '#fff' : '#111' }}>ALL</div>
            <div style={{ fontSize: 10, color: dk ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.5)' }}>{totalTrades} trades</div>
          </div>
        </div>

        {/* Legend / List */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {data.map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: 95 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: item.color, flexShrink: 0 }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: dk ? '#e2e8f0' : '#334155', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</span>
              </div>
              <div style={{ flex: 1, height: 4, background: dk ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ width: item.pct, height: '100%', background: dk ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }} />
              </div>
              <div style={{ width: 36, textAlign: 'right', fontSize: 11, fontWeight: 700, color: dk ? '#fff' : '#111' }}>{item.pct}</div>
              <div style={{ width: 32, textAlign: 'right', fontSize: 10, color: dk ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.5)' }}>{item.value}tdr</div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Stats */}
      <div style={{ display: 'flex', marginTop: 'auto', paddingTop: 16, borderTop: `1px solid ${dk ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`, gap: 40 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: dk ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.5)', letterSpacing: '0.05em' }}>WIN RATE</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#34d399', marginTop: 4 }}>{stats.winRate}%</div>
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: dk ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.5)', letterSpacing: '0.05em' }}>PROFIT FACTOR</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: dk ? '#fff' : '#111', marginTop: 4 }}>{stats.profitFactor}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: dk ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.5)', letterSpacing: '0.05em' }}>SYMBOLS</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: dk ? '#fff' : '#111', marginTop: 4 }}>{uniqueSymbols}</div>
        </div>
      </div>
    </div>
  );
}
