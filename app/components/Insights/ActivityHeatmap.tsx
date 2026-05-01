import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';

// Helper to generate a year of data
const generateHeatmapData = () => {
  const data = [];
  for (let w = 0; w < 52; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      // Randomly assign a value between 0 and 4 with some clustering
      const val = Math.random() > 0.75 ? Math.floor(Math.random() * 4) + 1 : 0;
      week.push(val);
    }
    data.push(week);
  }
  return data;
};

export default function ActivityHeatmap({ dk }: { dk: boolean }) {
  const data = useMemo(() => generateHeatmapData(), []);
  const [activeYear, setActiveYear] = useState('2026');

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
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
        2,431 Market Activities this year
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
