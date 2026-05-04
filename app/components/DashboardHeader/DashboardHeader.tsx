'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { LayoutDashboard, Briefcase, Bell, Wifi, ChevronDown, Sun, Moon, Zap, LogOut } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useTheme } from '../../context/ThemeContext';
import { logoutUser } from '../../lib/authApi';
import { clearToken } from '../../lib/auth';
import './DashboardHeader.css';

const NAV_ITEMS = [
  { name: 'Dashboard', icon: <LayoutDashboard size={15} />, path: '/dashboard' },
  { name: 'Portfolio', icon: <Briefcase size={15} />, path: '/portfolio' },
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const { theme, toggleTheme } = useTheme();

  /* Close dropdown on outside click */
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [menuOpen]);

  const handleLogout = useCallback(async () => {
    setLoggingOut(true);
    try {
      await logoutUser();
    } catch {
      // token may already be expired — proceed anyway
    } finally {
      clearToken();
      router.push('/auth/login');
    }
  }, [router]);

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
          <img src="/robot-only.png" alt="ByteBoom" width={28} height={28} style={{ objectFit: 'contain' }} />
          <span className="dh-logo-name">BYTEBOOM</span>
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
        <div className="dh-profile-wrapper" ref={profileRef}>
          <div
            className={`dh-profile${menuOpen ? ' open' : ''}`}
            onClick={() => setMenuOpen(o => !o)}
            role="button"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            <div className="dh-avatar">
              <span>S</span>
              <span className="dh-avatar-status" />
            </div>
            <div className="dh-profile-info">
              <span className="dh-profile-name">Sibte N.</span>
              <span className="dh-profile-role">Pro Trader</span>
            </div>
            <ChevronDown size={12} className={`dh-profile-chevron${menuOpen ? ' rotated' : ''}`} />
          </div>

          {menuOpen && (
            <div className="dh-profile-menu" role="menu">
              <button
                className="dh-menu-item dh-menu-item--logout"
                onClick={handleLogout}
                disabled={loggingOut}
                role="menuitem"
              >
                <LogOut size={13} />
                <span>{loggingOut ? 'Logging out…' : 'Logout'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
