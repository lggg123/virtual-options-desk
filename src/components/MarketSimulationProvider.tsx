'use client';

import { useEffect } from 'react';
import { startMarketSimulation } from '@/lib/market-data';

export function MarketSimulationProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Start the market simulation when the app loads
    startMarketSimulation();
    
    // Optional: Stop simulation when component unmounts (page refresh/close)
    return () => {
      // Note: We don't stop here to keep simulation running across page changes
      // stopMarketSimulation();
    };
  }, []);

  return <>{children}</>;
}
