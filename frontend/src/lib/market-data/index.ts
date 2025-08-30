// lib/market-data/index.ts
import { MarketSimulator } from './simulator';

// Global market simulator instance
let marketSimulator: MarketSimulator | null = null;

export function getMarketSimulator(): MarketSimulator {
  if (!marketSimulator) {
    marketSimulator = new MarketSimulator();
  }
  return marketSimulator;
}

export function startMarketSimulation(): void {
  const simulator = getMarketSimulator();
  simulator.start();
  console.log('🚀 Market simulation started with real-time price updates');
}

export function stopMarketSimulation(): void {
  const simulator = getMarketSimulator();
  simulator.stop();
  console.log('⏹️ Market simulation stopped');
}

export * from './simulator';
