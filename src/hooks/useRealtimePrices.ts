// hooks/useRealtimePrices.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';

export function useRealtimePrices(symbols: string[]) {
  const [prices, setPrices] = useState<Record<string, number>>({});
  
  useEffect(() => {
    const channel = supabase
      .channel('price-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'stocks',
          filter: `symbol=in.(${symbols.join(',')})`
        },
        (payload) => {
          setPrices(prev => ({
            ...prev,
            [payload.new.symbol]: payload.new.current_price
          }));
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [symbols]);
  
  return prices;
}