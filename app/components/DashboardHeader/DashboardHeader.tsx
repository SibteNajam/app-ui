'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { LayoutDashboard, Briefcase, Activity, Bell, Wifi, ChevronDown, Sun, Moon, Zap } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from '../../context/ThemeContext';
import './DashboardHeader.css';

const NAV_ITEMS = [
  { name: 'Dashboard', icon: <LayoutDashboard size={15} />, path: '/dashboard' },
  { name: 'Portfolio', icon: <Briefcase size={15} />, path: '/portfolio' },
  { name: 'Analytics', icon: <Activity size={15} />, path: '/analytics' },
  { name: 'Insights',  icon: <Zap size={15} />, path: '/insights' },
  { name: 'Alerts',    icon: <Bell size={15} />, path: '/alerts' },
];

export default function DashboardHeader() {
  const pathname = usePathname();
  const router = useRouter();

  const getActiveFromPath = useCallback(() => {
    if (!pathname) return 'Dashboard';
    const match = NAV_ITEMS.find(i => pathname.startsWith(i.path));
    return match ? match.name : 'Dashboard';
  }, [pathname]);

  const [activeTab, setActiveTab] = useState(getActiveFromPath());

  useEffect(() => {
    setActiveTab(getActiveFromPath());
  }, [getActiveFromPath]);
  const [time, setTime] = useState('');
  const [ping, setPing] = useState(12);
  const { theme, toggleTheme } = useTheme();

  /* Sliding indicator state */
  const navRef = useRef<HTMLElement>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });
  const [indicatorReady, setIndicatorReady] = useState(false);

  /* Measure active tab position → animate indicator */
  const updateIndicator = useCallback(() => {
    const nav = navRef.current;
    const btn = tabRefs.current[activeTab];
    if (!nav || !btn) return;
    const navRect = nav.getBoundingClientRect();
    const btnRect = btn.getBoundingClientRect();
    setIndicator({
      left: btnRect.left - navRect.left,
      width: btnRect.width,
    });
    /* Enable transition only after first measurement */
    if (!indicatorReady) requestAnimationFrame(() => setIndicatorReady(true));
  }, [activeTab, indicatorReady]);

  useEffect(() => {
    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [updateIndicator]);

  /* Clock */
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }));
      setPing(p => Math.max(6, Math.min(28, p + Math.floor(Math.random() * 5 - 2))));
    };
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, []);

  const pingColor = ping < 15 ? '#34d399' : ping < 22 ? '#fbbf24' : '#f87171';

  return (
    <header className="dh-root">
      {/* LEFT: Logo + Nav */}
      <div className="dh-left">
        {/* Logo */}
        <div className="dh-logo">
          <svg width="28" height="28" viewBox="0 0 100 100" className="dh-logo-svg">
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
          <span className="dh-logo-name">
            BYT
            <span className="dh-logo-e">
              <span className="dh-e-line" style={{ background: '#ff3b3b' }} />
              <span className="dh-e-line" style={{ background: '#3bff6f' }} />
              <span className="dh-e-line" style={{ background: '#3b8bff' }} />
            </span>
            BOOM
          </span>
        </div>

        {/* Nav with sliding indicator */}
        <nav className="dh-nav" ref={navRef}>
          {/* Floating sliding indicator */}
          <span
            className="dh-slider"
            style={{
              left: indicator.left,
              width: indicator.width,
              transition: indicatorReady ? 'left 0.35s cubic-bezier(0.4, 0, 0.2, 1), width 0.35s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
            }}
          />

          {NAV_ITEMS.map((item) => (
            <button
              key={item.name}
              ref={el => { tabRefs.current[item.name] = el; }}
              className={`dh-tab ${activeTab === item.name ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(item.name);
                router.push(item.path);
              }}
            >
              {item.icon}
              <span>{item.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* RIGHT: Status + Theme Toggle + Profile */}
      <div className="dh-right">
        {/* Ping chip */}
        <div className="dh-chip">
          <Wifi size={12} style={{ color: pingColor }} />
          <span className="dh-chip-val" style={{ color: pingColor }}>{ping}ms</span>
        </div>

        {/* Time chip */}
        <div className="dh-chip">
          <span className="dh-chip-val mono">{time}</span>
        </div>

        {/* Divider */}
        <div className="dh-divider" />

        {/* Theme Toggle */}
        <button
          className="dh-theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          <span className={`dh-toggle-icon ${theme === 'dark' ? 'active' : ''}`}>
            <Moon size={14} />
          </span>
          <span className={`dh-toggle-icon ${theme === 'light' ? 'active' : ''}`}>
            <Sun size={14} />
          </span>
        </button>

        {/* Divider */}
        <div className="dh-divider" />

        {/* Profile section */}
        <div className="dh-profile">
          <div className="dh-avatar">
            <span>S</span>
            <span className="dh-avatar-status" />
          </div>
          <div className="dh-profile-info">
            <span className="dh-profile-name">Sibte N.</span>
            <span className="dh-profile-role">Pro Trader</span>
          </div>
          <ChevronDown size={12} className="dh-profile-chevron" />
        </div>
      </div>
    </header>
  );
}
