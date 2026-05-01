# Dashboard API Integration — Implementation Guide
> Ready for AI agent to implement. Follow in exact order.

## Directory Approach: A (everything inside `app/`)

Do NOT create a `src/` folder. All new files go directly inside the existing `app/` folder.
The project already uses `app/` as its root — adding `src/` would require moving 50+ files.

```
my-app/          ← project root
  app/           ← ALL code lives here (routing + lib + hooks)
  public/
  .env.local     ← create this (gitignored)
  package.json
  next.config.ts
```

---

## Core Architecture (5 Layers)

```
UI Component  (RotatingRingCards, TradeHistoryCards, SideTelemetry)
      ↓ calls
Custom Hook   (app/hooks/useDashboardTrades.ts)
      ↓ uses
TanStack Query (polls every 10s, caches, deduplicates, retries)
      ↓ calls
api.ts         (app/lib/api.ts) — attaches token, handles errors
      ↓ hits
Backend REST API
```

**Key rule:** Multiple components calling the same hook → **1 API call only**.  
TanStack Query matches `queryKey: ['dashboard', 'trades']` across all callers → reads from shared cache.

---

## Performance Rules — Mandatory for All Code

### 1. Components only take what they need from the hook
```typescript
// ✅ CORRECT — component only subscribes to completedTrades
// Re-renders ONLY when completedTrades changes
const { completedTrades } = useDashboardTrades();

// ❌ WRONG — subscribes to everything, re-renders on any data change
const data = useDashboardTrades();
```

### 2. Map API data with useMemo — never inline
```typescript
// ✅ CORRECT — recalculates only when completedTrades array changes
const POOL = useMemo(() =>
  completedTrades.map(trade => ({
    sym: trade.entryOrder.symbol?.replace('USDT', '') ?? 'N/A',
    pnl: trade.pnl.realized,
    // ... rest of mapping
  })),
[completedTrades]
);

// ❌ WRONG — recalculates on EVERY render
const POOL = completedTrades.map(trade => ({ ... }));
```

### 3. Callbacks must use useCallback
```typescript
// ✅ CORRECT — stable reference, doesn't cause child re-renders
const handleClose = useCallback(() => setPopupData(null), []);

// ❌ WRONG — new function reference on every render = child re-renders
const handleClose = () => setPopupData(null);
```

### 4. AbortController in apiFetch — cancel stale requests
Update `app/lib/api.ts` to accept and use a signal:
```typescript
export async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  // TanStack Query passes signal automatically via queryFn context
  // It cancels in-flight requests when component unmounts mid-fetch
  const token = getToken();
  // ... existing fetch code, options already includes signal from TanStack
}
```
TanStack Query passes `AbortSignal` automatically via `queryFn` context parameter — no extra code needed:
```typescript
// In useDashboardTrades.ts:
async function fetchTrades({ signal }: { signal: AbortSignal }): Promise<TradesApiResponse> {
  return apiFetch<TradesApiResponse>('ENDPOINT_HERE', { signal });
}
```

### 5. Select only needed fields from query (advanced — optional)
For large datasets (100+ trades) use TanStack `select` to avoid re-renders when unrelated fields change:
```typescript
// RotatingRingCards only needs active trades — won't re-render when completedTrades changes
const { data: activeTrades } = useQuery({
  queryKey: DASHBOARD_TRADES_KEY,
  queryFn: fetchTrades,
  select: (data) => data.data.trades.filter(t => !t.pnl.isComplete),
});
```

### 6. Never store API data in local useState
```typescript
// ❌ WRONG — duplicates state, causes double renders, gets out of sync
const [trades, setTrades] = useState([]);
useEffect(() => { fetchTrades().then(setTrades); }, []);

// ✅ CORRECT — TanStack Query IS the state. No useState needed.
const { trades } = useDashboardTrades();
```

---

## Files to Create (in this order)

```
app/
  lib/
    types/
      dashboard.ts      ← Trade, Order, TradePnl, TradesSummary, TradesApiResponse
      portfolio.ts      ← (future — add when portfolio API ready)
      insights.ts       ← (future — add when insights API ready)
      radar.ts          ← (future — add when radar API ready)
      common.ts         ← (future — shared types used across multiple pages)
    auth.ts             ← Token read/write (sessionStorage)
    api.ts              ← Central fetch + token attachment + error handling
    queryClient.ts      ← TanStack Query config (NOT a singleton — used by Providers only)

  hooks/
    useDashboardTrades.ts   ← Dashboard data hook (polls every 10s)

  components/
    shared/
      Providers.tsx          ← 'use client' wrapper — creates QueryClient per user session
      DataStatus.tsx         ← Error/loading banner shown in UI
```

**Scalability rule for types:**
- `lib/types/` is a folder, NOT a single file
- Each page feature gets its own type file (`dashboard.ts`, `portfolio.ts`, etc.)
- This keeps each file short and focused as the app grows
- `api.ts`, `auth.ts`, `queryClient.ts` are single files and **never grow** — freeze them

---

## Step 1 — `app/lib/types/dashboard.ts`

Interfaces for dashboard API only. Each page feature gets its own type file.
Do NOT put all types in one file — it becomes unmaintainable as the app grows.

```typescript
export interface Order {
  orderId: string;
  symbol?: string;
  exchange?: string;
  side?: 'BUY' | 'SELL';
  role?: string;
  type: 'LIMIT' | 'MARKET';
  quantity: number;
  executedQty: number;
  price: number;
  status: 'FILLED' | 'PENDING' | 'CANCELLED';
  commission: number;
  commissionAsset: string;
  commissionUsdt: number;
  filledAt: number;
  createdAt: string;
  updatedAt?: string;
}

export interface TradePnl {
  grossRealized: number;
  totalCommission: number;
  realized: number;
  unrealized: number;
  total: number;
  realizedPercent: number;
  unrealizedPercent: number;
  totalPercent: number;
  entryCost: number;
  realizedQty: number;
  unrealizedQty: number;
  currentMarketPrice: number;
  isComplete: boolean;
  hasDataIntegrityIssue: boolean;
}

export interface Trade {
  tradeId: string;
  entryOrder: Order;
  exitOrders: Order[];
  pnl: TradePnl;
}

export interface TradesSummary {
  totalTrades: number;
  completedTrades: number;
  activeTrades: number;
  totalRealizedPnl: number;
  totalUnrealizedPnl: number;
  totalPnl: number;
  initialBalance: number;
  pnlPercentage: number;
}

export interface TradesApiResponse {
  status: string;
  statusCode: number;
  message: string;
  data: {
    trades: Trade[];
    summary: TradesSummary;
  };
}
```

---

## Step 2 — `app/lib/auth.ts`

Token stored in `sessionStorage` (cleared on tab close, safer than localStorage).  
One place to change if storage method changes in future.

```typescript
const TOKEN_KEY = 'bb_auth_token';

export function setToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null; // SSR guard
  return sessionStorage.getItem(TOKEN_KEY);
}

export function clearToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
```

---

## Step 3 — `app/lib/api.ts`

Single fetch function used by ALL hooks in the app.  
Attaches token, classifies errors, never leaks token to console or URL.

```typescript
import { getToken, clearToken } from './auth';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Custom error classes — lets components show the right message
export class NetworkError extends Error {
  constructor() {
    super('Unable to reach server. Check your connection.');
    this.name = 'NetworkError';
  }
}

export class AuthError extends Error {
  constructor() {
    super('Session expired. Please log in again.');
    this.name = 'AuthError';
  }
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiFetch<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const token = getToken();

  let response: Response;
  try {
    response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    });
  } catch {
    throw new NetworkError();
  }

  if (response.status === 401) {
    clearToken();
    throw new AuthError();
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(response.status, body?.message ?? 'Request failed');
  }

  return response.json() as Promise<T>;
}
```

---

## Step 4 — `app/lib/queryClient.ts`

Exports config options only — NOT a singleton instance.
The actual `QueryClient` is created per-user inside `Providers.tsx` to prevent data leaks between users on the server.

```typescript
import type { QueryClientConfig } from '@tanstack/react-query';

export const queryClientConfig: QueryClientConfig = {
  defaultOptions: {
    queries: {
      staleTime: 8 * 1000,        // Data considered fresh for 8s (won't re-fetch unnecessarily)
      gcTime: 5 * 60 * 1000,      // Cache kept 5 min after component unmounts, then garbage collected
      retry: 1,                   // Retry failed request once, then show error
      retryDelay: 3000,           // Wait 3s before retry
      refetchOnWindowFocus: true, // Re-fetch when user returns to browser tab
    },
  },
};
```

---

## Step 4b — `app/components/shared/Providers.tsx`

> [!IMPORTANT]  
> **Fix #1 & #2:** This component solves the SSR data leak AND the missing `'use client'` issue.  
> `useState(() => new QueryClient(...))` ensures each browser session gets its own isolated cache.  
> Never share one QueryClient instance at module level — it leaks cached data between users.

```typescript
'use client';
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { queryClientConfig } from '../../lib/queryClient';

export default function Providers({ children }: { children: React.ReactNode }) {
  // useState ensures a NEW QueryClient is created per browser session
  // NOT shared between users on the server
  const [queryClient] = useState(() => new QueryClient(queryClientConfig));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

---

## Step 5 — `app/layout.tsx`

`layout.tsx` stays a **Server Component** (no `'use client'`).  
Client-only providers go into `Providers.tsx` (Step 4b) which is imported here.

```typescript
import type { Metadata } from 'next';
import { ThemeProvider } from './context/ThemeContext';
import Providers from './components/shared/Providers';
import SwKiller from './components/SwKiller/SwKiller';
import './globals.css';

export const metadata: Metadata = {
  title: 'BytBoom — Trading Dashboard',
  description: 'Professional crypto trading bot dashboard with real-time analytics',
};

// This stays a Server Component — no 'use client' here
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>          {/* handles QueryClientProvider — see Step 4b */}
          <ThemeProvider>
            <SwKiller />
            {children}
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
```

---

## Step 6 — `app/hooks/useDashboardTrades.ts`

The only hook for all dashboard data.  
Three components call this → **1 API request every 10s**, result shared across all three.  
Stops polling automatically when user navigates away from dashboard.

> [!IMPORTANT]  
> **Fix #4 & #5 applied here:**  
> `useMemo` prevents new array references on every call (stops unnecessary re-renders).  
> `enabled: isAuthenticated()` prevents API calls when user has no token.

```typescript
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import { isAuthenticated } from '../lib/auth';
import type { TradesApiResponse, Trade, TradesSummary } from '../lib/types/dashboard';

// This key links all callers to the same cache entry — 1 API call for N components
export const DASHBOARD_TRADES_KEY = ['dashboard', 'trades'] as const;

// Replace 'ENDPOINT_HERE' with actual endpoint when provided
// { signal } comes from TanStack automatically — cancels request on unmount
async function fetchTrades({ signal }: { signal: AbortSignal }): Promise<TradesApiResponse> {
  return apiFetch<TradesApiResponse>('ENDPOINT_HERE', { signal });
}

export function useDashboardTrades() {
  const query = useQuery({
    queryKey: DASHBOARD_TRADES_KEY,
    queryFn: fetchTrades,
    enabled: isAuthenticated(),            // Fix #5: never fetch without a token
    refetchInterval: 10 * 1000,           // Poll every 10 seconds
    refetchIntervalInBackground: false,    // Stop polling when user switches tab/window
    placeholderData: (prev) => prev,       // Keep showing old data while re-fetching
  });

  const trades: Trade[] = query.data?.data?.trades ?? [];
  const summary: TradesSummary | null = query.data?.data?.summary ?? null;

  // Fix #4: useMemo prevents new array references on every hook call
  // Components only re-render when the actual trade data changes
  const activeTrades = useMemo(() => trades.filter(t => !t.pnl.isComplete), [trades]);
  const completedTrades = useMemo(() => trades.filter(t => t.pnl.isComplete), [trades]);

  return {
    trades,
    summary,
    activeTrades,
    completedTrades,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
  };
}
```

---

## Step 7 — `app/components/shared/DataStatus.tsx`

Reusable banner. Drop into any page component to handle all error/loading states.

> [!IMPORTANT]  
> **Fix #3 applied here:** Redirect must be inside `useEffect`, never during render.  
> Calling `window.location.href` during React render causes a crash.

```typescript
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { NetworkError, AuthError } from '../../lib/api';

interface Props {
  isError: boolean;
  isFetching: boolean;
  error: Error | null;
}

export default function DataStatus({ isError, isFetching, error }: Props) {
  const router = useRouter();

  // Fix #3: redirect must be in useEffect, not during render
  useEffect(() => {
    if (isError && error instanceof AuthError) {
      router.replace('/auth/login');
    }
  }, [isError, error, router]);

  if (isError && error instanceof AuthError) return null; // redirect pending
  if (isError && error instanceof NetworkError) {
    return <div className="data-status offline">⚡ Connection lost — retrying...</div>;
  }
  if (isError) {
    return <div className="data-status error">⚠ Data unavailable — retrying shortly</div>;
  }
  if (isFetching) {
    return <div className="data-status syncing" />;
  }
  return null;
}
```

---

## Step 8 — Wire into Dashboard Components

### `RotatingRingCards.tsx`
```typescript
// Add import at top:
import { useDashboardTrades } from '../../hooks/useDashboardTrades';

// Inside component, replace const POOL = [...] with:
const { activeTrades, isLoading } = useDashboardTrades();

const POOL = activeTrades.map(trade => ({
  sym: trade.entryOrder.symbol?.replace('USDT', '') ?? 'N/A',
  pair: `${trade.entryOrder.symbol?.replace('USDT', '')}/USDT`,
  price: trade.pnl.currentMarketPrice,
  change: trade.pnl.totalPercent,
  vol: `$${trade.pnl.entryCost.toFixed(2)}`,
  dir: trade.entryOrder.side ?? 'BUY',
  pnl: trade.pnl.total,
}));
```

### `TradeHistoryCards.tsx`
```typescript
import { useDashboardTrades } from '../../hooks/useDashboardTrades';

// Replace const POOL = [...] with:
const { completedTrades } = useDashboardTrades(); // same hook, same cache, 0 extra API calls

const POOL = completedTrades.map(trade => ({
  sym: trade.entryOrder.symbol?.replace('USDT', '') ?? 'N/A',
  pair: `${trade.entryOrder.symbol} SPOT`,
  qty: `${trade.entryOrder.executedQty} ${trade.entryOrder.symbol?.replace('USDT', '')}`,
  buyAt: trade.entryOrder.price,
  sellAt: trade.exitOrders[0]?.price ?? 0,
  vol: `$${trade.pnl.entryCost.toFixed(2)}`,
  pnl: trade.pnl.realized,
  roi: trade.pnl.realizedPercent,
}));
```

### `SideTelemetryRight` (or equivalent component)
```typescript
import { useDashboardTrades } from '../../hooks/useDashboardTrades';
import DataStatus from '../shared/DataStatus';

const { summary, isLoading, isError, isFetching, error } = useDashboardTrades();

// Render DataStatus at top of return:
<DataStatus isError={isError} isFetching={isFetching} error={error as Error} />

// Use summary fields:
// summary.totalPnl, summary.pnlPercentage, summary.totalTrades
```

---

## Environment Variable

Create `.env.local` in project root (this file is gitignored by default):

```bash
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
# For local dev:
# NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Install Command

```bash
npm install @tanstack/react-query
```

---

## What This Achieves

| Requirement | How |
|---|---|
| Poll every 10s | `refetchInterval: 10_000` in hook |
| Stop when off page | `refetchIntervalInBackground: false` + auto-stops on unmount |
| 3 components, 1 API call | All use same `queryKey: ['dashboard','trades']` |
| Token in every request | `apiFetch` reads from `auth.ts`, adds `Authorization: Bearer` header |
| Token never in URL/console/Redux | Only in `sessionStorage`, only read in `auth.ts` |
| 401 → redirect to login | Handled in `apiFetch`, clears token |
| Network down → show message | `NetworkError` class → `DataStatus` component |
| No memory leaks | TanStack auto-cleanup + `gcTime` garbage collection |
| Old cache cleared | Auto after `gcTime: 5min` of no subscribers |

---

## This Pattern Repeats for Every Other Page

```
Portfolio page  →  app/hooks/usePortfolio.ts       →  apiFetch('/api/portfolio')
Insights page   →  app/hooks/useInsightsData.ts    →  apiFetch('/api/insights')
Radar page      →  app/hooks/useRadarSignals.ts    →  apiFetch('/api/signals')
```

`api.ts`, `auth.ts`, `queryClient.ts`, and `layout.tsx` are written **once** and never touched again.  
For types: add a new file inside `lib/types/` per feature — never put all types in one file.

---

## Final Project Structure (Approach A)

```
my-app/
  app/
    lib/
      types/
        dashboard.ts    ← Trade, Order, TradePnl, TradesSummary, TradesApiResponse
        portfolio.ts    ← (future)
        insights.ts     ← (future)
        radar.ts        ← (future)
        common.ts       ← (future — shared across pages)
      auth.ts           ← token get/set/clear — FROZEN, never grows
      api.ts            ← central fetch wrapper — FROZEN, never grows
      queryClient.ts    ← TanStack Query CONFIG only — FROZEN, never grows
    hooks/
      useDashboardTrades.ts  ← with useMemo + enabled guard
      usePortfolio.ts        (future — add 1 file per new API)
      useInsightsData.ts     (future)
      useRadarSignals.ts     (future)
    components/
      shared/
        Providers.tsx   ← 'use client' — creates QueryClient per session (fixes SSR leak)
        DataStatus.tsx  ← error/loading banner (redirect in useEffect, not render)
      (all existing visual components — unchanged)
    context/              ← (unchanged, ThemeContext)
    dashboard/            ← (unchanged, page route)
    insights/             ← (unchanged, page route)
    radar/                ← (unchanged, page route)
    portfolio/            ← (unchanged, page route)
    layout.tsx            ← Server Component, uses <Providers> not QueryClientProvider directly
  public/
  .env.local              ← create this, add NEXT_PUBLIC_API_URL
  package.json
  next.config.ts
```

**File growth rules:**

| File/Folder | Grows? | Rule |
|---|---|---|
| `lib/api.ts` | ❌ Never | Single file, frozen |
| `lib/auth.ts` | ❌ Never | Single file, frozen |
| `lib/queryClient.ts` | ❌ Never | Single file, frozen |
| `lib/types/` | ✅ Yes | Add 1 new file per page feature |
| `hooks/` | ✅ Yes | Add 1 new file per API endpoint |

---

## Vulnerabilities Fixed Summary

| # | Issue | Fix Applied |
|---|---|---|
| 1 | `queryClient` singleton leaks data between users on server | `useState(() => new QueryClient(...))` inside `Providers.tsx` |
| 2 | `QueryClientProvider` in Server Component → runtime crash | Moved to `Providers.tsx` with `'use client'` |
| 3 | `window.location.href` during render → React crash | Moved redirect into `useEffect` with `useRouter` |
| 4 | `.filter()` creates new array refs → unnecessary re-renders | Wrapped in `useMemo` inside hook |
| 5 | API fires without token → 401 loop | Added `enabled: isAuthenticated()` to query |
