import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import { isAuthenticated } from '../lib/auth';
import type { AssetData } from '../components/Portfolio/HoldingsTable';

export const PORTFOLIO_DATA_KEY = ['portfolio', 'balances'] as const;

async function fetchPortfolioData({ signal }: { signal: AbortSignal }) {
  const [mexcRes, tickerRes] = await Promise.all([
    apiFetch<{ balances: { asset: string, free: string, locked: string }[] }>('/mexc-account/account', { signal }).catch(() => null),
    fetch('https://api.binance.com/api/v3/ticker/24hr', { signal }).then(r => r.json()).catch(() => [])
  ]);

  const priceMap: Record<string, number> = { USDT: 1, USDC: 1, FDUSD: 1, TUSD: 1, BUSD: 1 };
  const changeMap: Record<string, number> = { USDT: 0, USDC: 0, FDUSD: 0, TUSD: 0, BUSD: 0 };
  
  if (Array.isArray(tickerRes)) {
    tickerRes.forEach((t: any) => {
      if (t.symbol.endsWith('USDT')) {
        const sym = t.symbol.replace('USDT', '');
        priceMap[sym] = parseFloat(t.lastPrice || t.price);
        changeMap[sym] = parseFloat(t.priceChangePercent || '0');
      }
    });
  }

  return {
    spotBalances: mexcRes?.balances || [],
    prices: priceMap,
    changes: changeMap
  };
}

export function usePortfolioData() {
  const query = useQuery({
    queryKey: PORTFOLIO_DATA_KEY,
    queryFn: fetchPortfolioData,
    enabled: isAuthenticated(),           // Only fetch if logged in
    refetchInterval: 15 * 1000,          // Poll every 15 seconds for live balances/prices
    refetchIntervalInBackground: false,
    placeholderData: (prev) => prev,
  });

  const spotBalances = query.data?.spotBalances || [];
  const prices = query.data?.prices || {};
  const changes = query.data?.changes || {};

  const combinedAssets = useMemo(() => {
    const assets: (AssetData & { change24h: number })[] = [];
    
    spotBalances.forEach(b => {
      const free = parseFloat(b.free) || 0;
      const locked = parseFloat(b.locked) || 0;
      const qty = free + locked;
      if (qty > 0) {
        const price = prices[b.asset] || 0;
        const change24h = changes[b.asset] || 0;
        assets.push({
          sym: b.asset,
          name: b.asset,
          color: '#28b9ef', 
          qty, free, locked, price,
          value: qty * price,
          change24h,
          id: `${b.asset.toLowerCase()}-${b.asset.toLowerCase()}`,
          wallet: 'Spot'
        });
      }
    });

    return assets.sort((a, b) => b.value - a.value);
  }, [spotBalances, prices, changes]);

  const totalValue = combinedAssets.reduce((s, a) => s + a.value, 0);
  
  // Calculate 24H Gain/Loss
  const totalValue24hAgo = combinedAssets.reduce((s, a) => {
    // If today's price is $110 and it went up 10%, yesterday's price was $100. (110 / 1.1 = 100)
    const oldVal = a.value / (1 + a.change24h / 100);
    return s + oldVal;
  }, 0);
  
  const gain24h = totalValue - totalValue24hAgo;
  const gain24hPct = totalValue24hAgo > 0 ? (gain24h / totalValue24hAgo) * 100 : 0;
  
  // Find Best Performer (must have at least $1 in value to be considered)
  const validPerformers = combinedAssets.filter(a => a.value > 1);
  const bestPerformer = validPerformers.length > 0 
    ? validPerformers.reduce((best, a) => a.change24h > best.change24h ? a : best, validPerformers[0])
    : null;

  const totalBtc = (totalValue / (prices['BTC'] || 60000)).toFixed(4);
  const formattedValue = totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const [valInt, valDec] = formattedValue.split('.');

  return {
    assets: combinedAssets,
    totalValue,
    gain24h,
    gain24hPct,
    bestPerformer,
    totalBtc,
    valInt,
    valDec,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
  };
}
