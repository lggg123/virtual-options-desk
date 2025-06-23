// lib/market-data/hybrid-provider.ts
import { MarketSimulator } from './simulator';

interface RealMarketData {
  symbol: string;
  price: number;
  change: number;
  volume: number;
}

export class HybridMarketProvider {
  private simulator: MarketSimulator;
  private useRealData: boolean;

  constructor(useRealData = false) {
    this.simulator = new MarketSimulator();
    this.useRealData = useRealData;
  }

  async fetchRealData(symbol: string): Promise<RealMarketData | null> {
    if (!this.useRealData) return null;
    
    try {
      // Example: Alpha Vantage API call
      const response = await fetch(
        `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=YOUR_API_KEY`
      );
      const data = await response.json();
      
      return {
        symbol,
        price: parseFloat(data['Global Quote']['05. price']),
        change: parseFloat(data['Global Quote']['09. change']),
        volume: parseInt(data['Global Quote']['06. volume'])
      };
    } catch (error) {
      console.warn(`Failed to fetch real data for ${symbol}, falling back to simulation:`, error);
      return null;
    }
  }

  async getMarketData(symbol: string) {
    // Try real data first, fallback to simulation
    const realData = await this.fetchRealData(symbol);
    
    if (realData) {
      return realData;
    }
    
    // Fallback to simulation
    const simulatedData = this.simulator.getStock(symbol);
    return simulatedData;
  }
}
