import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useDashboardTrades } from '../../hooks/useDashboardTrades';

export default function ActivityHeatmap({ dk }: { dk: boolean }) {
  const { completedTrades } = useDashboardTrades();
  
  const { data, totalActivities } = useMemo(() => {
    // initialize empty 52x7 array
    const grid = Array.from({ length: 52 }, () => Array(7).fill(0));
    
    if (!completedTrades || completedTrades.length === 0) {
      return { data: grid, totalActivities: 0 };
    }

    // count trades by day "YYYY-M-D"
    const dayCounts: Record<string, number> = {};
    completedTrades.forEach(t => {
      const d = new Date(t.entryOrder?.filledAt || Date.now());
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      dayCounts[key] = (dayCounts[key] || 0) + 1;
    });

    const maxCount = Math.max(1, ...Object.values(dayCounts));
    const now = new Date();
    
    // Fill the past 364 days (52 weeks * 7 days)
    for (let i = 0; i < 364; i++) {
      const d = new Date(now.getTime() - i * 86400000);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const count = dayCounts[key] || 0;
      
      let level = 0;
      if (count > 0) {
        level = Math.ceil((count / maxCount) * 4); // maps to 1-4
      }

      // Calculate grid coordinates: 0 is oldest day, 363 is today
      const flatIndex = 363 - i; 
      const week = Math.floor(flatIndex / 7);
      const day = flatIndex % 7;
      
      if (week >= 0 && week < 52) {
        grid[week][day] = level;
      }
    }
    return { data: grid, totalActivities: completedTrades.length };
  }, [completedTrades]);

  const [activeYear, setActiveYear] = useState('2026');

  const months = useMemo(() => {
    const arr = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      arr.push(d.toLocaleDateString('en-US', { month: 'short' }));
    }
    return arr;
  }, []);
  const years = ['2026', '2025', '2024'];
  
  // Theme-based colors (Blue/Emerald theme to fit current UI)
  const emptyCell = dk ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.05)';
  // We use a blue progression (from light to bright blue)
  const levels = [
    emptyCell,
    dk ? 'rgba(79, 142, 247, 0.3)' : 'rgba(79, 142, 247, 0.3)',
    dk ? 'rgba(79, 142, 247, 0.55)' : 'rgba(79, 142, 247, 0.55)',
    dk ? 'rgba(79, 142, 247, 0.8)' : 'rgba(79, 142, 247, 0.8)',
    dk ? 'rgba(79, 142, 247, 1)' : 'rgba(79, 142, 247, 1)',
  ];

  return (
    <div style={{
      padding: '24px 32px',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: "'Inter', sans-serif",
      width: '100%',
      height: '100%',
    }}>
      <div style={{ marginBottom: 24, textAlign: 'center', fontSize: 18, fontWeight: 600, color: dk ? '#fff' : '#111', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.01em' }}>
        {totalActivities} Market Activities (Past Year)
      </div>

      <div style={{ display: 'flex', gap: 32, width: '100%', alignItems: 'stretch' }}>
        {/* Left labels + Grid + Top labels */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {/* Top labels (Months) */}
          <div style={{ display: 'flex', marginLeft: 28, marginBottom: 10, color: dk ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.5)', fontSize: 11, fontWeight: 500 }}>
            {months.map((m, i) => (
              <div key={m} style={{ flex: 1, textAlign: 'left' }}>{m}</div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            {/* Left labels (Days) */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: dk ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.5)', fontSize: 10, fontWeight: 500, paddingBottom: 2, paddingTop: 2 }}>
              <div style={{ visibility: 'hidden' }}>Sun</div>
              <div>Mon</div>
              <div style={{ visibility: 'hidden' }}>Tue</div>
              <div>Wed</div>
              <div style={{ visibility: 'hidden' }}>Thu</div>
              <div>Fri</div>
              <div style={{ visibility: 'hidden' }}>Sat</div>
            </div>

            {/* Grid */}
            <div style={{ display: 'flex', gap: 4, flex: 1 }}>
              {data.map((week, wi) => (
                <div key={wi} style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                  {week.map((val, di) => (
                    <motion.div
                      key={di}
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: (wi * 7 + di) * 0.0005 }}
                      style={{
                        width: '100%',
                        aspectRatio: '1/1',
                        borderRadius: 3,
                        backgroundColor: levels[val],
                        cursor: 'pointer',
                        transition: 'transform 0.1s, filter 0.1s'
                      }}
                      whileHover={{ scale: 1.25, filter: 'brightness(1.2)' }}
                      title={`Activity Level: ${val}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right side: Years and Legend */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between', minWidth: '80px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {years.map(y => (
              <div
                key={y}
                onClick={() => setActiveYear(y)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: activeYear === y ? (dk ? 'rgba(79, 142, 247, 0.15)' : 'rgba(79, 142, 247, 0.1)') : 'transparent',
                  color: activeYear === y ? '#4F8EF7' : (dk ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.5)'),
                  transition: 'all 0.2s',
                  textAlign: 'center'
                }}
              >
                {y}
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: dk ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.5)', fontWeight: 500 }}>
            <span style={{ marginRight: 2 }}>Less</span>
            {levels.map((c, i) => (
              <div key={i} style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: c }} />
            ))}
            <span style={{ marginLeft: 2 }}>More</span>
          </div>
        </div>
      </div>
    </div>
  );
}
