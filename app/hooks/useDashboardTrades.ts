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
  // Use the backend trades endpoint. Optionally accept query params in the future.
  return apiFetch<TradesApiResponse>('/exchanges/trades', { signal });
}

export function useDashboardTrades() {
  const query = useQuery({
    queryKey: DASHBOARD_TRADES_KEY,
    queryFn: fetchTrades,
    enabled: isAuthenticated(),            // Never fetch without a token
    refetchInterval: 10 * 1000,           // Poll every 10 seconds
    refetchIntervalInBackground: false,    // Stop polling when user switches tab/window
    placeholderData: (prev) => prev,       // Keep showing old data while re-fetching
  });

  const trades: Trade[] = query.data?.data?.trades ?? [];
  const summary: TradesSummary | null = query.data?.data?.summary ?? null;

  // useMemo prevents new array references on every hook call
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
