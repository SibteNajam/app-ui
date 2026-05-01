'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Eye, EyeOff, ArrowRight, Mail, Lock, User, Shield,
  Zap, TrendingUp, Activity, BarChart3, ChevronRight
} from 'lucide-react';
import './Auth.css';

/* ═══════════════════════════════════════════════════════
   Particle Field — animated background canvas
   ═══════════════════════════════════════════════════════ */
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let particles: Array<{
      x: number; y: number; vx: number; vy: number;
      size: number; opacity: number; hue: number;
    }> = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Initialize particles
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.5 + 0.1,
        hue: Math.random() > 0.7 ? 160 : 220, // emerald or blue
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 80%, 65%, ${p.opacity})`;
        ctx.fill();

        // Draw connections
        for (let j = i + 1; j < particles.length; j++) {
          const dx = p.x - particles[j].x;
          const dy = p.y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `hsla(${p.hue}, 60%, 50%, ${0.06 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      });

      animId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="auth-particles" />;
}

/* ═══════════════════════════════════════════════════════
   Floating HUD Stats — cinematic floating data
   ═══════════════════════════════════════════════════════ */
function FloatingHUD() {
  const [stats, setStats] = useState({
    volume: '2.4B',
    trades: '142K',
    uptime: '99.97%',
    latency: '12ms',
  });

  useEffect(() => {
    const iv = setInterval(() => {
      setStats({
        volume: `${(Math.random() * 3 + 1.5).toFixed(1)}B`,
        trades: `${Math.floor(Math.random() * 50 + 120)}K`,
        uptime: `99.${Math.floor(Math.random() * 5 + 95)}%`,
        latency: `${Math.floor(Math.random() * 10 + 8)}ms`,
      });
    }, 3000);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="auth-hud">
      <div className="auth-hud-item">
        <TrendingUp size={14} />
        <span className="auth-hud-label">24H VOL</span>
        <span className="auth-hud-value">${stats.volume}</span>
      </div>
      <div className="auth-hud-item">
        <Activity size={14} />
        <span className="auth-hud-label">TRADES</span>
        <span className="auth-hud-value">{stats.trades}</span>
      </div>
      <div className="auth-hud-item">
        <Shield size={14} />
        <span className="auth-hud-label">UPTIME</span>
        <span className="auth-hud-value">{stats.uptime}</span>
      </div>
      <div className="auth-hud-item">
        <Zap size={14} />
        <span className="auth-hud-label">LATENCY</span>
        <span className="auth-hud-value">{stats.latency}</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   XP Progress Ring — gamified level indicator
   ═══════════════════════════════════════════════════════ */
function XPRing({ level, xp, maxXp }: { level: number; xp: number; maxXp: number }) {
  const pct = (xp / maxXp) * 100;
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <div className="auth-xp-ring">
      <svg viewBox="0 0 80 80" className="auth-xp-svg">
        <circle cx="40" cy="40" r={r} className="auth-xp-track" />
        <circle
          cx="40" cy="40" r={r}
          className="auth-xp-fill"
          strokeDasharray={circ}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="auth-xp-center">
        <span className="auth-xp-level">LV.{level}</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   Achievement Badge
   ═══════════════════════════════════════════════════════ */
function AchievementBadge({ icon, label, unlocked }: { icon: React.ReactNode; label: string; unlocked: boolean }) {
  return (
    <div className={`auth-badge ${unlocked ? 'unlocked' : 'locked'}`}>
      <div className="auth-badge-icon">{icon}</div>
      <span className="auth-badge-label">{label}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN AUTH PAGE COMPONENT
   ═══════════════════════════════════════════════════════ */
interface AuthPageProps {
  initialMode?: 'login' | 'signup';
}

export default function AuthPage({ initialMode }: AuthPageProps) {
  const router = useRouter();
  const pathname = usePathname();

  // Derive mode from pathname so URL changes drive state
  const mode: 'login' | 'signup' = pathname?.includes('/signup') ? 'signup' : (initialMode === 'signup' ? 'signup' : 'login');

  const [showPassword, setShowPassword] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [formReady, setFormReady] = useState(false);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password strength
  const getPasswordStrength = useCallback((pass: string) => {
    if (!pass) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    const labels = ['', 'Weak', 'Fair', 'Strong', 'Elite'];
    const colors = ['', '#f87171', '#fbbf24', '#34d399', '#22d3ee'];
    return { score, label: labels[score], color: colors[score] };
  }, []);

  const strength = getPasswordStrength(password);

  // Entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setFormReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Handle mode switch with smooth transition
  const switchMode = useCallback((target: 'login' | 'signup') => {
    if (mode === target || isTransitioning) return;
    setIsTransitioning(true);
    setFormReady(false);

    setTimeout(() => {
      router.push(target === 'login' ? '/auth/login' : '/auth/signup');
      setTimeout(() => {
        setIsTransitioning(false);
        setFormReady(true);
      }, 50);
    }, 400);
  }, [mode, isTransitioning, router]);

  return (
    <div className="auth-root">
      {/* Background layers */}
      <div className="auth-bg-grid" />
      <ParticleField />
      <div className="auth-bg-glow auth-bg-glow-1" />
      <div className="auth-bg-glow auth-bg-glow-2" />
      <div className="auth-bg-glow auth-bg-glow-3" />

      {/* Floating HUD */}
      <FloatingHUD />

      {/* Scan line effect */}
      <div className="auth-scanline" />

      {/* Main content */}
      <div className="auth-container">
        {/* Left panel — branding & gamification */}
        <div className="auth-left-panel">
          <div className="auth-brand-section">
            {/* Logo */}
            <div className="auth-logo">
              <svg width="48" height="48" viewBox="0 0 100 100" className="auth-logo-svg">
                <line x1="50" y1="22" x2="50" y2="8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                <circle cx="50" cy="5" r="4" fill="currentColor" />
                <rect x="22" y="24" width="56" height="42" rx="12" ry="12" fill="none" stroke="currentColor" strokeWidth="5" />
                <circle cx="38" cy="46" r="5" fill="currentColor" />
                <circle cx="62" cy="46" r="5" fill="currentColor" />
                <line x1="38" y1="56" x2="62" y2="56" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <rect x="12" y="36" width="8" height="16" rx="3" fill="currentColor" opacity="0.7" />
                <rect x="80" y="36" width="8" height="16" rx="3" fill="currentColor" opacity="0.7" />
                <line x1="38" y1="66" x2="38" y2="82" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                <line x1="62" y1="66" x2="62" y2="82" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                <line x1="32" y1="82" x2="44" y2="82" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
                <line x1="56" y1="82" x2="68" y2="82" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
              </svg>
              <span className="auth-logo-text">
                BYT
                <span className="auth-logo-e">
                  <span className="auth-e-line" style={{ background: '#ff3b3b' }} />
                  <span className="auth-e-line" style={{ background: '#3bff6f' }} />
                  <span className="auth-e-line" style={{ background: '#3b8bff' }} />
                </span>
                BOOM
              </span>
            </div>

            <h1 className="auth-tagline">
              {mode === 'login' ? (
                <>Welcome back,<br /><span className="auth-tagline-accent">Commander.</span></>
              ) : (
                <>Initialize<br /><span className="auth-tagline-accent">your station.</span></>
              )}
            </h1>
            <p className="auth-subtitle">
              {mode === 'login'
                ? 'Your trading terminal awaits. Resume your mission.'
                : 'Join the network. Unlock AI-powered trading intelligence.'}
            </p>
          </div>

          {/* Gamification section */}
          <div className="auth-gamification">
            <div className="auth-game-header">
              <XPRing level={7} xp={2400} maxXp={3000} />
              <div className="auth-game-stats">
                <span className="auth-game-rank">DIAMOND RANK</span>
                <div className="auth-game-xp-bar">
                  <div className="auth-game-xp-fill" style={{ width: '80%' }} />
                </div>
                <span className="auth-game-xp-text">2,400 / 3,000 XP</span>
              </div>
            </div>

            <div className="auth-badges">
              <AchievementBadge icon={<Zap size={16} />} label="First Trade" unlocked={true} />
              <AchievementBadge icon={<TrendingUp size={16} />} label="10x Returns" unlocked={true} />
              <AchievementBadge icon={<BarChart3 size={16} />} label="Data Master" unlocked={true} />
              <AchievementBadge icon={<Shield size={16} />} label="Sentinel" unlocked={false} />
            </div>
          </div>

          {/* Live data ticker */}
          <div className="auth-ticker">
            <div className="auth-ticker-track">
              <span className="auth-ticker-item gain">BTC +2.4%</span>
              <span className="auth-ticker-divider">•</span>
              <span className="auth-ticker-item loss">ETH -0.8%</span>
              <span className="auth-ticker-divider">•</span>
              <span className="auth-ticker-item gain">SOL +5.1%</span>
              <span className="auth-ticker-divider">•</span>
              <span className="auth-ticker-item gain">AVAX +3.2%</span>
              <span className="auth-ticker-divider">•</span>
              <span className="auth-ticker-item loss">DOGE -1.5%</span>
              <span className="auth-ticker-divider">•</span>
              <span className="auth-ticker-item gain">BTC +2.4%</span>
              <span className="auth-ticker-divider">•</span>
              <span className="auth-ticker-item loss">ETH -0.8%</span>
              <span className="auth-ticker-divider">•</span>
              <span className="auth-ticker-item gain">SOL +5.1%</span>
              <span className="auth-ticker-divider">•</span>
              <span className="auth-ticker-item gain">AVAX +3.2%</span>
              <span className="auth-ticker-divider">•</span>
              <span className="auth-ticker-item loss">DOGE -1.5%</span>
            </div>
          </div>
        </div>

        {/* Right panel — form */}
        <div className={`auth-right-panel ${formReady ? 'ready' : ''}`}>
          {/* Mode toggle */}
          <div className="auth-mode-toggle">
            <button
              className={`auth-mode-btn ${mode === 'login' ? 'active' : ''}`}
              onClick={() => switchMode('login')}
            >
              Login
            </button>
            <button
              className={`auth-mode-btn ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => switchMode('signup')}
            >
              Sign Up
            </button>
            <div
              className="auth-mode-slider"
              style={{ transform: mode === 'signup' ? 'translateX(100%)' : 'translateX(0)' }}
            />
          </div>

          {/* Form card */}
          <div className={`auth-form-card ${isTransitioning ? 'transitioning' : ''}`}>
            <div className="auth-form-inner">
              <h2 className="auth-form-title">
                {mode === 'login' ? 'Access Terminal' : 'Create Account'}
              </h2>
              <p className="auth-form-desc">
                {mode === 'login'
                  ? 'Enter your credentials to access your station'
                  : 'Set up your trading identity'}
              </p>

              <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
                {/* Username (signup only) */}
                {mode === 'signup' && (
                  <div className="auth-field auth-field-enter">
                    <label className="auth-label">
                      <User size={14} />
                      CALLSIGN
                    </label>
                    <div className="auth-input-wrap">
                      <input
                        type="text"
                        className="auth-input"
                        placeholder="Choose your trader name"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        autoComplete="username"
                      />
                      <div className="auth-input-glow" />
                    </div>
                  </div>
                )}

                {/* Email */}
                <div className="auth-field auth-field-enter">
                  <label className="auth-label">
                    <Mail size={14} />
                    {mode === 'login' ? 'EMAIL' : 'COMM LINK'}
                  </label>
                  <div className="auth-input-wrap">
                    <input
                      type="email"
                      className="auth-input"
                      placeholder="trader@bytboom.io"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                    />
                    <div className="auth-input-glow" />
                  </div>
                </div>

                {/* Password */}
                <div className="auth-field auth-field-enter">
                  <label className="auth-label">
                    <Lock size={14} />
                    {mode === 'login' ? 'ACCESS CODE' : 'ENCRYPTION KEY'}
                  </label>
                  <div className="auth-input-wrap">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="auth-input"
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    />
                    <button
                      type="button"
                      className="auth-eye-btn"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                    <div className="auth-input-glow" />
                  </div>

                  {/* Password strength (signup) */}
                  {mode === 'signup' && password && (
                    <div className="auth-strength">
                      <div className="auth-strength-bars">
                        {[1, 2, 3, 4].map(i => (
                          <div
                            key={i}
                            className={`auth-strength-bar ${i <= strength.score ? 'filled' : ''}`}
                            style={{ background: i <= strength.score ? strength.color : undefined }}
                          />
                        ))}
                      </div>
                      <span className="auth-strength-label" style={{ color: strength.color }}>
                        {strength.label}
                      </span>
                    </div>
                  )}
                </div>

                {/* Confirm Password (signup) */}
                {mode === 'signup' && (
                  <div className="auth-field auth-field-enter">
                    <label className="auth-label">
                      <Shield size={14} />
                      CONFIRM KEY
                    </label>
                    <div className="auth-input-wrap">
                      <input
                        type="password"
                        className="auth-input"
                        placeholder="Re-enter encryption key"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        autoComplete="new-password"
                      />
                      <div className="auth-input-glow" />
                    </div>
                  </div>
                )}

                {/* Remember / Forgot */}
                {mode === 'login' && (
                  <div className="auth-options">
                    <label className="auth-remember">
                      <input type="checkbox" className="auth-checkbox" />
                      <span className="auth-checkmark" />
                      Remember station
                    </label>
                    <a href="#" className="auth-forgot">Reset access code</a>
                  </div>
                )}

                {/* Terms (signup) */}
                {mode === 'signup' && (
                  <label className="auth-terms">
                    <input type="checkbox" className="auth-checkbox" />
                    <span className="auth-checkmark" />
                    I agree to the <a href="#">Protocol</a> and <a href="#">Data Policy</a>
                  </label>
                )}

                {/* Submit */}
                <button type="submit" className="auth-submit">
                  <span className="auth-submit-bg" />
                  <span className="auth-submit-content">
                    {mode === 'login' ? 'LAUNCH TERMINAL' : 'INITIALIZE STATION'}
                    <ArrowRight size={18} />
                  </span>
                  <span className="auth-submit-shine" />
                </button>
              </form>

              {/* Divider */}
              <div className="auth-divider">
                <span>or continue with</span>
              </div>

              {/* Social logins */}
              <div className="auth-socials">
                <button className="auth-social-btn" type="button">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                </button>
                <button className="auth-social-btn" type="button">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                  GitHub
                </button>
              </div>

              {/* Switch prompt */}
              <p className="auth-switch">
                {mode === 'login' ? (
                  <>New to BytBoom? <button type="button" onClick={() => switchMode('signup')}>Create Station <ChevronRight size={14} /></button></>
                ) : (
                  <>Already enlisted? <button type="button" onClick={() => switchMode('login')}>Access Terminal <ChevronRight size={14} /></button></>
                )}
              </p>
            </div>
          </div>

          {/* Security footer */}
          <div className="auth-security">
            <Shield size={12} />
            <span>256-bit AES encryption • SOC2 Compliant • Zero-knowledge architecture</span>
          </div>
        </div>
      </div>
    </div>
  );
}
