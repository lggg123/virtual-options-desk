'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';

interface MarketQuote {
  symbol: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketVolume: number;
}

interface MarketItem {
  symbol: string;
  price: number;
  change: string;
  changePercent: string;
  volume: string;
}

const SYMBOLS = ['SPY', 'QQQ', 'IWM', 'DIA'];

function formatVolume(volume: number): string {
  if (volume >= 1000000000) {
    return (volume / 1000000000).toFixed(1) + 'B';
  }
  if (volume >= 1000000) {
    return (volume / 1000000).toFixed(1) + 'M';
  }
  if (volume >= 1000) {
    return (volume / 1000).toFixed(1) + 'K';
  }
  return volume.toString();
}

export default function MarketData() {
  const [marketData, setMarketData] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchMarketData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    }
    setError(null);

    try {
      const quotes = await Promise.all(
        SYMBOLS.map(async (symbol) => {
          const response = await fetch(`/api/market/quote?symbol=${symbol}`);
          if (!response.ok) {
            throw new Error(`Failed to fetch ${symbol}`);
          }
          return response.json() as Promise<MarketQuote>;
        })
      );

      const formattedData: MarketItem[] = quotes.map((quote) => ({
        symbol: quote.symbol,
        price: quote.regularMarketPrice,
        change: (quote.regularMarketChange >= 0 ? '+' : '') + quote.regularMarketChange.toFixed(2),
        changePercent: (quote.regularMarketChangePercent >= 0 ? '+' : '') + quote.regularMarketChangePercent.toFixed(2) + '%',
        volume: formatVolume(quote.regularMarketVolume || 0),
      }));

      setMarketData(formattedData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching market data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load market data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMarketData();

    // Refresh every 60 seconds
    const interval = setInterval(() => {
      fetchMarketData(true);
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchMarketData]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Market Overview</CardTitle>
          <CardDescription>Loading real-time market data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && marketData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Market Overview</CardTitle>
          <CardDescription>Unable to load market data</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => fetchMarketData()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Market Overview</CardTitle>
            <CardDescription>
              Real-time market data for major indices
              {lastUpdated && (
                <span className="ml-2 text-xs">
                  Updated: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fetchMarketData(true)}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {marketData.map((item) => (
            <div key={item.symbol} className="flex items-center justify-between">
              <div>
                <div className="font-medium">{item.symbol}</div>
                <div className="text-sm text-muted-foreground">Vol: {item.volume}</div>
              </div>
              <div className="text-right">
                <div className="font-medium">${item.price.toFixed(2)}</div>
                <Badge variant={item.change.startsWith('+') ? 'default' : 'destructive'}>
                  {item.change} ({item.changePercent})
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
