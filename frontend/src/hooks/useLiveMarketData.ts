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

      if (response.ok) {
        const data = await response.json();
        setOptions(data.options || []);
        setExpirations(data.expirations || []);
        setError(null);
      }
    } catch (err) {
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
