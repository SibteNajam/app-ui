'use client';

import React, { useState, useEffect, lazy, Suspense } from 'react';
import dynamic from 'next/dynamic';
import DashboardHeader from '../DashboardHeader/DashboardHeader';
import './Atomic3D.css';

/* ── Dynamically import the R3F Scene (no SSR — Three.js needs the browser) ── */
const Scene = dynamic(
  () => import('./r3f/Scene').then(mod => ({ default: mod.Scene })),
  { ssr: false }
);

/* ── Radar chart data ── */
const RADAR_AXES = [
  { label: 'Lipo: 2.21',      angle: -90 },
  { label: 'Size: 206 g/mol', angle: -30 },
  { label: 'Polar: 2.7',      angle: 30 },
  { label: 'INSOLU: -4.12',   angle: 90 },
  { label: 'NSATU: 0.48',     angle: 150 },
  { label: 'Flex: 4',         angle: 210 },
];
const RADAR_VALUES = [0.55, 0.82, 0.45, 0.68, 0.35, 0.72];

/* ── Property tables ── */
const PHYSCHEM = [
  { key: 'GI absorption',      val: 'LOW', type: 'low' },
  { key: 'BBB permeant',       val: 'NO',  type: 'no' },
  { key: 'P-gp substrate',     val: 'YES', type: 'yes' },
  { key: 'CYP1A2 inhibitor',   val: 'NO',  type: 'no' },
  { key: 'CYP2C19 inhibitor',  val: 'NO',  type: 'no' },
  { key: 'CYP2C9 inhibitor',   val: 'NO',  type: 'no' },
  { key: 'CYP2D6 inhibitor',   val: 'NO',  type: 'no' },
  { key: 'CYP3A4 inhibitor',   val: 'YES', type: 'yes' },
];
const PHARMA = [
  { key: 'Lipinski', val: 'NO', type: 'no' },
  { key: 'Ghose',    val: 'NO', type: 'no' },
  { key: 'Veber',    val: 'NO', type: 'no' },
  { key: 'Egan',     val: 'NO', type: 'no' },
  { key: 'Muegge',   val: 'NO', type: 'no' },
];

/* ── Bottom card data ── */
const RESULT_CARDS = [
  {
    name: '1,2-Dimethoxy-12-methyl-8H-[1,3] benzodioxolo[5,6-c]phenanthridin-12-ium',
    formula: 'C21H18NO4', mass: '348.378 g·mol⁻¹', logp: '2.65', energy: 12.5,
  },
  {
    name: '(1E,6E)-1,7-Bis(4-hydroxy-3-methoxyphenyl) hepta-1,6-diene-3,5-dione',
    formula: 'C21H20O6', mass: '401.163 g·mol⁻¹', logp: '2.31', energy: 10.4,
  },
  {
    name: '1-methyl-4-(2-tricyclo [9,4,0,03,8] pentadeca-1(15),3,5,7,9,11,13-heptaenylidene) piperidine',
    formula: 'C21H21N', mass: '361.983 g·mol⁻¹', logp: '2.90', energy: 16.1,
  },
  {
    name: 'tris (4-methylphenyl) phosphate',
    formula: 'C21H21O4P', mass: '392.115 g·mol⁻¹', logp: '2.82', energy: 11.1,
  },
  {
    name: '1,2-Dimethoxy-12-methyl-8H-[1,3] benzodioxolo[5,6-c] phenanthridin-12-ium',
    formula: 'C21H22N2O2', mass: '314.358 g·mol⁻¹', logp: '2.10', energy: 19.3,
  },
];

/* ── SVG Radar Chart ── */
function RadarChart() {
  const cx = 140, cy = 120, maxR = 90;
  const points = RADAR_AXES.map((axis, i) => {
    const a = (axis.angle * Math.PI) / 180;
    const r = maxR * RADAR_VALUES[i];
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  });
  const polyPoints = points.map(p => `${p.x},${p.y}`).join(' ');

  return (
    <svg className="mol-radar-svg" viewBox="0 0 280 240">
      {[0.25, 0.5, 0.75, 1].map(s => (
        <polygon key={s}
          points={RADAR_AXES.map(axis => {
            const a = (axis.angle * Math.PI) / 180;
            return `${cx + maxR * s * Math.cos(a)},${cy + maxR * s * Math.sin(a)}`;
          }).join(' ')}
          fill="none" stroke="rgba(52,211,153,0.08)" strokeWidth="0.5"
        />
      ))}
      {RADAR_AXES.map((axis, i) => {
        const a = (axis.angle * Math.PI) / 180;
        return (
          <line key={i}
            x1={cx} y1={cy}
            x2={cx + maxR * Math.cos(a)} y2={cy + maxR * Math.sin(a)}
            stroke="rgba(52,211,153,0.06)" strokeWidth="0.5"
          />
        );
      })}
      <polygon points={polyPoints} fill="rgba(52,211,153,0.12)" stroke="#34d399" strokeWidth="1.5" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#34d399" />
      ))}
      {RADAR_AXES.map((axis, i) => {
        const a = (axis.angle * Math.PI) / 180;
        const lx = cx + (maxR + 20) * Math.cos(a);
        const ly = cy + (maxR + 20) * Math.sin(a);
        return (
          <text key={i} x={lx} y={ly}
            fill="rgba(255,255,255,0.45)" fontSize="8"
            textAnchor="middle" dominantBaseline="middle"
            fontFamily="'Space Grotesk', sans-serif"
          >{axis.label}</text>
        );
      })}
    </svg>
  );
}

/* ── Mini molecule SVG for cards (lightweight, no Three.js) ── */
const MINI_MOLECULES = [
  { nodes: [[0,-15],[18,-8],[18,8],[0,15],[-18,8],[-18,-8]], color: '#34d399' },
  { nodes: [[0,-18],[16,-6],[12,12],[-12,12],[-16,-6]], color: '#3aa9ff' },
  { nodes: [[-12,-15],[12,-15],[20,0],[12,15],[-12,15],[-20,0]], color: '#ff5da2' },
  { nodes: [[0,-18],[15,-9],[15,9],[0,18],[-15,9],[-15,-9]], color: '#b46bff' },
  { nodes: [[-10,-15],[10,-15],[18,0],[10,15],[-10,15],[-18,0]], color: '#ffd84d' },
];

function MiniMolSVG({ idx }: { idx: number }) {
  const mol = MINI_MOLECULES[idx % MINI_MOLECULES.length];
  const cx = 50, cy = 50;
  return (
    <svg viewBox="0 0 100 100" className="mol-mini-svg">
      {/* Bonds */}
      {mol.nodes.map((n, i) => {
        const next = mol.nodes[(i + 1) % mol.nodes.length];
        return (
          <line key={`b${i}`}
            x1={cx + n[0]} y1={cy + n[1]}
            x2={cx + next[0]} y2={cy + next[1]}
            stroke="rgba(255,255,255,0.15)" strokeWidth="1.5"
          />
        );
      })}
      {/* Cross bonds */}
      {mol.nodes.length >= 6 && (
        <>
          <line x1={cx + mol.nodes[0][0]} y1={cy + mol.nodes[0][1]}
                x2={cx + mol.nodes[3][0]} y2={cy + mol.nodes[3][1]}
                stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
          <line x1={cx + mol.nodes[1][0]} y1={cy + mol.nodes[1][1]}
                x2={cx + mol.nodes[4][0]} y2={cy + mol.nodes[4][1]}
                stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
        </>
      )}
      {/* Atoms */}
      {mol.nodes.map((n, i) => (
        <g key={`a${i}`}>
          <circle cx={cx + n[0]} cy={cy + n[1]} r="5" fill={mol.color} opacity="0.85" />
          <circle cx={cx + n[0]} cy={cy + n[1]} r="5" fill="none" stroke={mol.color} strokeWidth="0.5" opacity="0.4">
            <animate attributeName="r" from="5" to="10" dur="2.5s" begin={`${i * 0.3}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" from="0.4" to="0" dur="2.5s" begin={`${i * 0.3}s`} repeatCount="indefinite" />
          </circle>
          <circle cx={cx + n[0] - 1.5} cy={cy + n[1] - 1.5} r="1.5" fill="rgba(255,255,255,0.35)" />
        </g>
      ))}
    </svg>
  );
}

export default function Atomic3DPage() {
  const [mode, setMode] = useState<'3d' | '2d'>('3d');
  const [editMode, setEditMode] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) {
    return (
      <div className="mol-root">
        <div className="mol-ambient" />
        <DashboardHeader />
        <div className="mol-content">
          <div className="mol-hero" style={{ minHeight: 480 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gridColumn: '1/-1', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
              Loading 3D Scene...
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mol-root">
      <div className="mol-ambient" />
      <DashboardHeader />

      <div className="mol-content">
        {/* Top bar */}
        <div className="mol-topbar">
          <button className="mol-back" onClick={() => window.history.back()}>‹</button>
          <h2>Generation based on Lopinavir</h2>
        </div>

        {/* ═══ HERO: Formula | 3D Scene | Info Panel ═══ */}
        <div className="mol-hero">
          {/* Left — Chemical Formulas */}
          <div className="mol-formulas">
            <div className="mol-formula-block">
              <h5>Ligand</h5>
              <pre>{`CCC(CC)COC(=O)[C@H]
(C)NP(=O)OC[C@H]O[C@@]
[C#N][c2ccc3c(N)ncnn23]
[C@H]O[C@@H]O)Oc1ccccc1`}</pre>
            </div>
            <div className="mol-formula-block">
              <h5>Generated</h5>
              <pre>{`CCC1CC[C@H]2CC[C#N]O[C@
@H]2COP(=O)(c2cccc(N)
c2)N[C@@H](C)(C(=O)OC1`}</pre>
            </div>
          </div>

          {/* Center — Three.js 3D Viewport */}
          <div className="mol-viewport">
            {/* Vignette overlay on top of the 3D canvas */}
            <div className="mol-scene-overlay" />
            <Scene />
            {/* Edit overlay */}
            <div className={`mol-edit-overlay ${editMode ? 'visible' : ''}`}>
              <h4>⚙ Edit Molecular Parameters</h4>
              <div className="mol-edit-field">
                <label>Compound Name</label>
                <input defaultValue="Lopinavir Derivative" />
              </div>
              <div className="mol-edit-field">
                <label>Target Binding Energy</label>
                <input type="number" defaultValue={-6.5} step={0.1} />
              </div>
              <div className="mol-edit-field">
                <label>Optimization Method</label>
                <select defaultValue="gradient">
                  <option value="gradient">Gradient Descent</option>
                  <option value="genetic">Genetic Algorithm</option>
                  <option value="bayesian">Bayesian Optimization</option>
                </select>
              </div>
              <div className="mol-edit-field">
                <label>Max Iterations</label>
                <input type="number" defaultValue={1000} />
              </div>
              <div className="mol-edit-actions">
                <button className="btn-discard" onClick={() => setEditMode(false)}>Discard</button>
                <button className="btn-apply" onClick={() => setEditMode(false)}>Apply & Re-generate</button>
              </div>
            </div>
          </div>

          {/* Right — Info Panel */}
          <div className="mol-info-panel">
            <div className="mol-toggle-bar">
              <button className={`mol-toggle-btn ${mode === '3d' ? 'active' : ''}`}
                onClick={() => setMode('3d')}>3D</button>
              <button className={`mol-toggle-btn ${mode === '2d' ? 'active' : ''}`}
                onClick={() => setMode('2d')}>2D</button>
              <button className={`mol-edit-btn ${editMode ? 'active' : ''}`}
                onClick={() => setEditMode(!editMode)}>
                ✎ Edit mode
              </button>
            </div>

            <div className="mol-radar-wrap">
              <RadarChart />
            </div>

            <div className="mol-prop-section">
              <div className="mol-prop-table">
                <h5>Physicochemical Properties</h5>
                {PHYSCHEM.map((p, i) => (
                  <div className="mol-prop-row" key={i}>
                    <span className={`mol-prop-val ${p.type}`}>{p.val}</span>
                    <span className="mol-prop-key">{p.key}</span>
                  </div>
                ))}
              </div>
              <div className="mol-prop-table">
                <h5>Pharmacokinetics</h5>
                {PHARMA.map((p, i) => (
                  <div className="mol-prop-row" key={i}>
                    <span className={`mol-prop-val ${p.type}`}>{p.val}</span>
                    <span className="mol-prop-key">{p.key}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ═══ BOTTOM: Stats + Molecule Result Cards ═══ */}
        <div className="mol-bottom">
          <div className="mol-stats-card">
            <div>
              <div className="mol-stats-big">620</div>
              <div className="mol-stats-label">Generated</div>
            </div>
            <div>
              <div className="mol-stats-row">
                <span className="mol-stats-key">AVG Molar mass</span>
                <span className="mol-stats-val">378.278<br /><span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>g·mol⁻¹</span></span>
              </div>
              <div className="mol-stats-row">
                <span className="mol-stats-key">AVG LogP</span>
                <span className="mol-stats-val">3.74</span>
              </div>
              <div className="mol-stats-row">
                <span className="mol-stats-key">AVG Binding Energy</span>
                <span className="mol-stats-val">-6.5</span>
              </div>
            </div>
            <button className="mol-download-btn">
              Download results ↓
            </button>
          </div>

          {RESULT_CARDS.map((card, i) => (
            <div className="mol-result-card" key={i}>
              <div className="mol-mini-preview">
                <MiniMolSVG idx={i} />
              </div>
              <div className="mol-result-name">{card.name}</div>
              <div className="mol-result-row">
                <span className="mol-result-key">Chemical formula</span>
                <span className="mol-result-val">{card.formula}</span>
              </div>
              <div className="mol-result-row">
                <span className="mol-result-key">Molar mass</span>
                <span className="mol-result-val">{card.mass}</span>
              </div>
              <div className="mol-result-row">
                <span className="mol-result-key">LogP</span>
                <span className="mol-result-val">{card.logp}</span>
              </div>
              <div className="mol-result-energy">
                <span className="energy-label">Binding Energy</span>
                <span className="energy-val">{card.energy}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
