// lib/hooks/useMarketData.ts
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';

interface MarketDataUpdate {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  timestamp: string;
}

export function useMarketData(symbols?: string[]) {
  const [marketData, setMarketData] = useState<Map<string, MarketDataUpdate>>(new Map());
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Subscribe to market data updates
    const channel = supabase.channel('market-data');
    
    channel
      .on('broadcast', { event: 'price-update' }, (payload) => {
        const update = payload.payload as MarketDataUpdate;
        
        // Filter by symbols if provided
        if (symbols && !symbols.includes(update.symbol)) {
          return;
        }
        
        setMarketData(prev => new Map(prev.set(update.symbol, update)));
      })
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
        console.log('Market data subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [symbols]);

  return {
    marketData,
    isConnected,
    getSymbolData: (symbol: string) => marketData.get(symbol),
    getAllData: () => Array.from(marketData.values()),
  };
}
