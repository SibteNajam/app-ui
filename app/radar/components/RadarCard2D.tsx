'use client';
import { useEffect, useRef, useCallback } from 'react'
import { SIGNALS, POPUP_SLOTS } from '../data/signals'

interface RadarCard2DProps {
  onClick: () => void
}

export default function RadarCard2D({ onClick }: RadarCard2DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const uiRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<number | null>(null)
  const stateRef = useRef({
    sweep: 0,
    lastSweep: 0,
    slotIdx: 0,
    found: new Set<string>(),
    blips: [] as Array<{ angle: number; r: number; color: string; born: number }>,
  })

  const draw = useCallback(() => {
    const cv = canvasRef.current
    const ui = uiRef.current
    if (!cv || !ui) return

    const ctx = cv.getContext('2d')!
    const rect = cv.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1

    if (cv.width !== rect.width * dpr || cv.height !== rect.height * dpr) {
      cv.width = rect.width * dpr
      cv.height = rect.height * dpr
      ctx.scale(dpr, dpr)
    }

    const W = rect.width
    const H = rect.height
    const RCX = W * 0.38
    const RCY = H * 0.5
    const R = Math.min(W, H) * 0.22

    ctx.clearRect(0, 0, cv.width, cv.height)
    ctx.fillStyle = '#030810'
    ctx.fillRect(0, 0, cv.width, cv.height)

    // ── Warp function ──
    function warpPoint(x: number, y: number) {
      const ox = RCX, oy = RCY
      const dx = x - ox, dy = y - oy
      const dist = Math.sqrt(dx * dx + dy * dy)
      const warpRadius = 200
      const radialFactor = Math.max(0, 1 - (dist / warpRadius))
      const radial = Math.pow(radialFactor, 1.6) * 0.82
      const edgeDampX = Math.pow(Math.sin(Math.PI * (x / W)), 0.45)
      const edgeDampY = Math.pow(Math.sin(Math.PI * (y / H)), 0.45)
      return {
        x: x + (ox - x) * radial * edgeDampX,
        y: y + (oy - y) * radial * edgeDampY,
      }
    }

    // ── Warped grid ──
    const step = 30
    for (let gx = 0; gx <= W; gx += step) {
      ctx.beginPath()
      let first = true
      for (let t = 0; t <= 1; t += 0.004) {
        const p = warpPoint(gx, t * H)
        if (first) { ctx.moveTo(p.x, p.y); first = false }
        else ctx.lineTo(p.x, p.y)
      }
      const d = Math.abs(gx - RCX)
      const br = 0.07 + 0.18 * Math.exp(-d * d / (2 * 170 * 170))
      ctx.strokeStyle = `rgba(20,70,100,${br})`
      ctx.lineWidth = 0.65
      ctx.stroke()
    }
    for (let gy = 0; gy <= H; gy += step) {
      ctx.beginPath()
      let first = true
      for (let t = 0; t <= 1; t += 0.004) {
        const p = warpPoint(t * W, gy)
        if (first) { ctx.moveTo(p.x, p.y); first = false }
        else ctx.lineTo(p.x, p.y)
      }
      const d = Math.abs(gy - RCY)
      const br = 0.07 + 0.18 * Math.exp(-d * d / (2 * 150 * 150))
      ctx.strokeStyle = `rgba(100,40,180,${br})`
      ctx.lineWidth = 0.65
      ctx.stroke()
    }

    // ── Radial glow ──
    const grd = ctx.createRadialGradient(RCX, RCY, 0, RCX, RCY, 170)
    grd.addColorStop(0, 'rgba(0,80,120,0.28)')
    grd.addColorStop(0.45, 'rgba(0,40,65,0.1)')
    grd.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.beginPath()
    ctx.arc(RCX, RCY, 170, 0, Math.PI * 2)
    ctx.fillStyle = grd
    ctx.fill()

    // ── Inner rings ──
    ;[0.32, 0.62, 0.88].forEach(f => {
      ctx.beginPath()
      ctx.arc(RCX, RCY, R * f, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(0,160,200,0.22)'
      ctx.lineWidth = 0.5
      ctx.stroke()
    })

    // ── Crosshairs ──
    ctx.beginPath()
    ctx.moveTo(RCX - R, RCY)
    ctx.lineTo(RCX + R, RCY)
    ctx.strokeStyle = 'rgba(0,160,200,0.15)'
    ctx.lineWidth = 0.5
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(RCX, RCY - R)
    ctx.lineTo(RCX, RCY + R)
    ctx.stroke()

    const st = stateRef.current
    const now = Date.now()

    // ── Sweep trail ──
    for (let i = 0; i < 110; i++) {
      const a = st.sweep - (i / 110) * (Math.PI / 1.55)
      ctx.beginPath()
      ctx.moveTo(RCX, RCY)
      ctx.arc(RCX, RCY, R, a, a + 0.03)
      ctx.closePath()
      ctx.fillStyle = `rgba(0,210,240,${(1 - i / 110) * 0.2})`
      ctx.fill()
    }
    ctx.beginPath()
    ctx.moveTo(RCX, RCY)
    ctx.lineTo(RCX + Math.cos(st.sweep) * R, RCY + Math.sin(st.sweep) * R)
    ctx.strokeStyle = 'rgba(0,255,238,0.9)'
    ctx.lineWidth = 1.2
    ctx.stroke()

    // ── Blips ──
    st.blips.forEach(b => {
      const px = RCX + Math.cos(b.angle) * R * b.r
      const py = RCY + Math.sin(b.angle) * R * b.r
      const fl = 0.6 + 0.4 * Math.sin(now / 170 + b.angle * 8)
      ctx.beginPath()
      ctx.arc(px, py, 3, 0, Math.PI * 2)
      ctx.fillStyle = b.color
      ctx.globalAlpha = fl
      ctx.fill()
      ctx.globalAlpha = 1
      const age = (now - b.born) / 1000
      if (age < 1.8) {
        const rr = age * 22
        const ra = Math.max(0, 0.6 - age * 0.35)
        ctx.beginPath()
        ctx.arc(px, py, rr, 0, Math.PI * 2)
        const hex = Math.floor(ra * 255).toString(16).padStart(2, '0')
        ctx.strokeStyle = b.color + hex
        ctx.lineWidth = 1
        ctx.stroke()
      }
    })

    // ── Core glow ──
    const p = 0.5 + 0.5 * Math.sin(now / 430)
    for (let i = 3; i >= 0; i--) {
      const g = ctx.createRadialGradient(RCX, RCY, 0, RCX, RCY, 11 + i * 5)
      g.addColorStop(0, `rgba(0,210,255,${0.15 + p * 0.1 - i * 0.025})`)
      g.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.beginPath()
      ctx.arc(RCX, RCY, 11 + i * 5, 0, Math.PI * 2)
      ctx.fillStyle = g
      ctx.fill()
    }
    ctx.beginPath()
    ctx.arc(RCX, RCY, 4 + p * 1.5, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(0,230,255,${0.85 + p * 0.15})`
    ctx.fill()
    ctx.beginPath()
    ctx.arc(RCX, RCY, 2, 0, Math.PI * 2)
    ctx.fillStyle = '#fff'
    ctx.fill()

    // ── Sweep logic & popup spawn ──
    st.sweep = (st.sweep + 0.013) % (Math.PI * 2)
    if (st.sweep < st.lastSweep) st.found.clear()
    st.lastSweep = st.sweep

    SIGNALS.forEach(s => {
      const sa = ((s.angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
      const sw = ((st.sweep + Math.PI * 2) % (Math.PI * 2))
      const diff = (sw - sa + Math.PI * 2) % (Math.PI * 2)
      if (diff < 0.05 && !st.found.has(s.sym)) {
        st.found.add(s.sym)
        st.blips.push({ angle: s.angle, r: s.r, color: s.color, born: Date.now() })
        if (st.blips.length > 20) st.blips.shift()
        spawnPopup(s, W, H, ui, st)
      }
    })

    animRef.current = requestAnimationFrame(draw)
  }, [])

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw)
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [draw])

  return (
    <div className="radar-card" onClick={onClick}>
      <div className="card-header-overlay">
        <span className="card-label">Spacetime Radar</span>
        <span className="card-status">
          <span className="status-dot"></span>
          LIVE
        </span>
      </div>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      <div ref={uiRef} style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        pointerEvents: 'none', zIndex: 2,
      }} />
      <div className="card-footer-overlay">
        <span className="signal-count">8 SIGNALS TRACKED</span>
        <span className="click-hint">[ CLICK TO EXPAND ]</span>
      </div>
    </div>
  )
}

// Popup spawn
function spawnPopup(
  sig: { sym: string; color: string; conf: number; type: string },
  W: number, H: number,
  ui: HTMLDivElement,
  st: { slotIdx: number }
) {
  const slot = POPUP_SLOTS[st.slotIdx % POPUP_SLOTS.length]
  st.slotIdx++

  const el = document.createElement('div')
  el.className = 'popup'
  el.style.cssText = `
    position:absolute; pointer-events:none;
    background:rgba(2,10,24,0.92);
    border:1px solid ${sig.color}55; border-radius:4px;
    padding:5px 9px; opacity:0;
    transform:scale(0.75);
    transition:opacity 0.3s ease, transform 0.35s cubic-bezier(.2,1.3,.35,1);
    white-space:nowrap; z-index:5;
  `
  const tc = sig.type === 'LONG' ? '#00ff9d' : '#ff6b6b'
  const cc = sig.conf >= 85 ? '#00e5ff' : sig.conf >= 75 ? '#ffd60a' : '#ff6b6b'

  el.innerHTML = `
    <span style="font-size:11px;font-weight:700;letter-spacing:.08em;display:block;margin-bottom:2px;color:${sig.color}">${sig.sym}</span>
    <div style="display:flex;gap:6px;align-items:center">
      <span style="font-size:9px;font-weight:700;letter-spacing:.06em;color:${cc}">${sig.conf}%</span>
      <span style="font-size:9px;font-weight:700;letter-spacing:.1em;color:${tc}">${sig.type}</span>
    </div>
    <div style="height:1px;margin-top:4px;opacity:0.5;border-radius:1px;background:${sig.color};width:0%;transition:width 0.8s ease" data-w="${sig.conf}%"></div>
  `

  el.style.left = (slot.x * W) + 'px'
  el.style.top = (slot.y * H) + 'px'

  ui.appendChild(el)

  setTimeout(() => {
    el.style.opacity = '1'
    el.style.transform = 'scale(1)'
  }, 30)

  setTimeout(() => {
    const bar = el.querySelector('[data-w]') as HTMLElement | null
    if (bar) bar.style.width = bar.dataset.w || ''
  }, 100)

  setTimeout(() => {
    el.style.opacity = '0'
    el.style.transform = 'scale(0.7)'
    el.style.transition = 'opacity 0.35s, transform 0.25s'
    setTimeout(() => el.remove(), 400)
  }, 4200)
}
