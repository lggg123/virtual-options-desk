'use client';

import { useState, useEffect, useCallback } from 'react';

export interface LiveMarketData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  timestamp: Date;
}

export interface OptionsData {
  strike: number;
  bid: number;
  ask: number;
  last: number;
  volume: number;
  openInterest: number;
  impliedVolatility: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  expiration: string;
  type: 'call' | 'put';
}

export function useLiveMarketData(symbol: string, refreshInterval = 5000) {
  const [data, setData] = useState<LiveMarketData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      // Use yfinance via your backend or a quote API
      const response = await fetch(`/api/market/quote?symbol=${symbol}`);

      if (response.ok) {
        const quote = await response.json();
        setData({
          symbol: quote.symbol,
          price: quote.regularMarketPrice || quote.price,
          change: quote.regularMarketChange || 0,
          changePercent: quote.regularMarketChangePercent || 0,
          volume: quote.regularMarketVolume || 0,
          high: quote.regularMarketDayHigh || 0,
          low: quote.regularMarketDayLow || 0,
          open: quote.regularMarketOpen || 0,
          previousClose: quote.regularMarketPreviousClose || 0,
          timestamp: new Date()
        });
        setError(null);
      } else {
        // Handle API errors gracefully
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        setError(errorData.error || `Failed to fetch data for ${symbol}`);
        // Keep previous data instead of clearing it
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch market data');
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchData, refreshInterval]);

  return { data, loading, error, refresh: fetchData };
}

// Generate fallback expiration dates (next 6 monthly expirations - 3rd Friday of each month)
function generateFallbackExpirations(): string[] {
  const expirations: string[] = [];
  const now = new Date();
  let currentMonth = now.getMonth();
  let currentYear = now.getFullYear();

  for (let i = 0; i < 6; i++) {
    // Find 3rd Friday of the month
    const firstDay = new Date(currentYear, currentMonth, 1);
    const firstFriday = (5 - firstDay.getDay() + 7) % 7 + 1;
    const thirdFriday = firstFriday + 14;
    const expirationDate = new Date(currentYear, currentMonth, thirdFriday);

    // Only add if it's in the future
    if (expirationDate > now) {
      expirations.push(expirationDate.toISOString().split('T')[0]);
    }

    // Move to next month
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
  }

  return expirations;
}

export function useOptionsChain(symbol: string, expirationDate?: string, refreshInterval = 10000) {
  const [options, setOptions] = useState<OptionsData[]>([]);
  const [expirations, setExpirations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOptions = useCallback(async () => {
    try {
      const url = expirationDate
        ? `/api/market/options?symbol=${symbol}&expiration=${expirationDate}`
        : `/api/market/options?symbol=${symbol}`;

      const response = await fetch(url);
      const data = await response.json();

      if (response.ok && data.expirations && data.expirations.length > 0) {
        setOptions(data.options || []);
        setExpirations(data.expirations);
        setError(null);
      } else {
        // API failed or returned empty expirations - use fallback dates
        console.warn('Options API returned no expirations, using fallback dates');
        const fallbackExpirations = generateFallbackExpirations();
        setExpirations(fallbackExpirations);
        setOptions([]);
        setError(null);
      }
    } catch (err) {
      console.error('Failed to fetch options:', err);
      // On error, still provide fallback expiration dates so the dropdown isn't empty
      const fallbackExpirations = generateFallbackExpirations();
      setExpirations(fallbackExpirations);
      setOptions([]);
      setError(err instanceof Error ? err.message : 'Failed to fetch options data');
    } finally {
      setLoading(false);
    }
  }, [symbol, expirationDate]);

  useEffect(() => {
    fetchOptions();
    const interval = setInterval(fetchOptions, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchOptions, refreshInterval]);

  return { options, expirations, loading, error, refresh: fetchOptions };
}
