import React, { useState, useEffect, useLayoutEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

export default function TradeAllocation({ dk }: { dk: boolean }) {
  const [chartReady, setChartReady] = useState(false);
  useEffect(() => setChartReady(false), []);
  useLayoutEffect(() => { setChartReady(true); }, []);
  const data = [
    { name: 'BANANAS31', value: 31, color: '#ef4444', pct: '4.7%' },
    { name: 'ZRO', value: 22, color: '#f97316', pct: '3.4%' },
    { name: 'BTC', value: 33, color: '#eab308', pct: '5.1%' },
    { name: 'DEXE', value: 6, color: '#22c55e', pct: '0.9%' },
    { name: 'FET', value: 8, color: '#0ea5e9', pct: '1.2%' },
    { name: 'Others (172)', value: 553, color: '#64748b', pct: '84.7%' }
  ];

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
          <div style={{ fontSize: 11, color: dk ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.5)', marginTop: 4 }}>177 symbols traded · Top 5 represent 15% of all trades</div>
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
          {chartReady && <ResponsiveContainer width="100%" height={130} minWidth={1} minHeight={1}>
            <PieChart>
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
          </ResponsiveContainer>}
          {/* Inner Text */}
          <div style={{ position: 'absolute', textAlign: 'center', pointerEvents: 'none' }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: dk ? '#fff' : '#111' }}>ALL</div>
            <div style={{ fontSize: 10, color: dk ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.5)' }}>653 trades</div>
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
          <div style={{ fontSize: 18, fontWeight: 700, color: '#34d399', marginTop: 4 }}>26.2%</div>
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: dk ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.5)', letterSpacing: '0.05em' }}>PROFIT FACTOR</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: dk ? '#fff' : '#111', marginTop: 4 }}>0.05</div>
        </div>
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, color: dk ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.5)', letterSpacing: '0.05em' }}>SYMBOLS</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: dk ? '#fff' : '#111', marginTop: 4 }}>177</div>
        </div>
      </div>
    </div>
  );
}
