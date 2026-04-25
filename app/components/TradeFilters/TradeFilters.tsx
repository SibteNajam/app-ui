'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Search, SlidersHorizontal, ChevronDown, Clock, Activity } from 'lucide-react';
import './TradeFilters.css';

const TIME_FILTERS = ['24H', '7D', '30D', 'All'];
const STATUS_FILTERS = ['All', 'Active', 'Closed', 'Pending'];

// Reusable compact dropdown
function CompactDropdown({
  options,
  value,
  onChange,
  icon,
  accentActive,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
  icon: React.ReactNode;
  accentActive?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="tf-dropdown-wrap" ref={ref}>
      <button
        className={`tf-dropdown-btn ${open ? 'open' : ''} ${accentActive ? 'accent' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <span className="tf-dd-icon">{icon}</span>
        <span className="tf-dd-value">{value}</span>
        <ChevronDown size={10} className={`tf-chevron ${open ? 'open' : ''}`} />
      </button>

      {open && (
        <div className="tf-dd-menu">
          {options.map(opt => (
            <button
              key={opt}
              className={`tf-dd-option ${value === opt ? 'active' : ''} ${accentActive ? 'accent' : ''}`}
              onClick={() => { onChange(opt); setOpen(false); }}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TradeFilters() {
  const [activeTime, setActiveTime] = useState('24H');
  const [activeStatus, setActiveStatus] = useState('Active');
  const [searchValue, setSearchValue] = useState('');
  const [sortOpen, setSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState('Recent');
  const sortRef = useRef<HTMLDivElement>(null);

  const sortOptions = ['Recent', 'PNL High→Low', 'PNL Low→High', 'Volume', 'Win Rate'];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setSortOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="tf-root">
      {/* Row 1: Dropdowns */}
      <div className="tf-bar">
        {/* Time Dropdown */}
        <CompactDropdown
          options={TIME_FILTERS}
          value={activeTime}
          onChange={setActiveTime}
          icon={<Clock size={10} />}
        />

        <div className="tf-divider" />

        {/* Status Dropdown */}
        <CompactDropdown
          options={STATUS_FILTERS}
          value={activeStatus}
          onChange={setActiveStatus}
          icon={<Activity size={10} />}
          accentActive
        />

        <div className="tf-divider" />

        {/* Sort Dropdown */}
        <div className="tf-dropdown-wrap" ref={sortRef}>
          <button
            className={`tf-dropdown-btn ${sortOpen ? 'open' : ''}`}
            onClick={() => setSortOpen(o => !o)}
          >
            <span className="tf-dd-icon"><SlidersHorizontal size={10} /></span>
            <span className="tf-dd-value">{sortBy}</span>
            <ChevronDown size={10} className={`tf-chevron ${sortOpen ? 'open' : ''}`} />
          </button>
          {sortOpen && (
            <div className="tf-dd-menu">
              {sortOptions.map(opt => (
                <button
                  key={opt}
                  className={`tf-dd-option ${sortBy === opt ? 'active' : ''}`}
                  onClick={() => { setSortBy(opt); setSortOpen(false); }}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Search */}
      <div className="tf-bar-search">
        <div className="tf-search">
          <Search size={11} className="tf-search-icon" />
          <input
            type="text"
            placeholder="Search symbol..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
