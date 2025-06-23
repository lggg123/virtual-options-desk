// lib/market-data/simulator.ts
import { supabase } from '@/lib/supabase/client';

interface StockData {
  symbol: string;
  price: number;
  lastUpdate: Date;
  volatility: number;
  volume: number;
  high: number;
  low: number;
  open: number;
}

interface MarketEvent {
  type: 'earnings' | 'news' | 'volatility_spike' | 'normal';
  impact: number; // -1 to 1
  duration: number; // in minutes
}

export class MarketSimulator {
  private stocks: Map<string, StockData>;
  private isRunning: boolean;
  private updateInterval: NodeJS.Timeout | null;
  private readonly UPDATE_FREQUENCY = 2000; // 2 seconds
  
  constructor() {
    this.stocks = new Map();
    this.isRunning = false;
    this.updateInterval = null;
    this.initializeDefaultStocks();
  }

  private initializeDefaultStocks(): void {
    const defaultStocks = [
      { symbol: 'AAPL', price: 182.45, volatility: 0.25 },
      { symbol: 'GOOGL', price: 2845.67, volatility: 0.28 },
      { symbol: 'MSFT', price: 378.23, volatility: 0.22 },
      { symbol: 'TSLA', price: 248.91, volatility: 0.45 },
      { symbol: 'NVDA', price: 485.23, volatility: 0.35 },
      { symbol: 'AMZN', price: 145.67, volatility: 0.30 },
      { symbol: 'META', price: 342.18, volatility: 0.33 },
      { symbol: 'SPY', price: 445.23, volatility: 0.15 },
      { symbol: 'QQQ', price: 378.91, volatility: 0.20 },
      { symbol: 'IWM', price: 195.67, volatility: 0.25 },
    ];

    defaultStocks.forEach(stock => {
      this.stocks.set(stock.symbol, {
        symbol: stock.symbol,
        price: stock.price,
        lastUpdate: new Date(),
        volatility: stock.volatility,
        volume: Math.floor(Math.random() * 10000000) + 1000000,
        high: stock.price * (1 + Math.random() * 0.02),
        low: stock.price * (1 - Math.random() * 0.02),
        open: stock.price * (1 + (Math.random() - 0.5) * 0.01),
      });
    });
  }

  async generateRandomWalk(
    symbol: string,
    currentPrice: number,
    volatility: number,
    timeSteps: number
  ): Promise<number[]> {
    // Geometric Brownian Motion simulation
    const prices: number[] = [currentPrice];
    const dt = 1 / 252 / 24 / 60; // 1 minute in trading years
    const drift = 0.05; // 5% annual drift
    
    for (let i = 1; i < timeSteps; i++) {
      const randomShock = this.generateNormalRandom();
      const logReturn = (drift - 0.5 * volatility * volatility) * dt + 
                       volatility * Math.sqrt(dt) * randomShock;
      
      const newPrice = prices[i - 1] * Math.exp(logReturn);
      
      // Add market events occasionally
      const marketEvent = this.generateMarketEvent();
      const eventAdjustedPrice = newPrice * (1 + marketEvent.impact * 0.01);
      
      // Ensure price stays within reasonable bounds
      const boundedPrice = Math.max(eventAdjustedPrice, currentPrice * 0.5);
      prices.push(Math.min(boundedPrice, currentPrice * 2));
    }
    
    return prices;
  }

  private generateNormalRandom(): number {
    // Box-Muller transformation for normal distribution
    let u = 0, v = 0;
    while(u === 0) u = Math.random(); // Converting [0,1) to (0,1)
    while(v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  private generateMarketEvent(): MarketEvent {
    const random = Math.random();
    
    if (random < 0.95) {
      return { type: 'normal', impact: 0, duration: 1 };
    } else if (random < 0.98) {
      return { 
        type: 'news', 
        impact: (Math.random() - 0.5) * 2, 
        duration: Math.floor(Math.random() * 30) + 5 
      };
    } else if (random < 0.995) {
      return { 
        type: 'volatility_spike', 
        impact: (Math.random() - 0.5) * 4, 
        duration: Math.floor(Math.random() * 60) + 10 
      };
    } else {
      return { 
        type: 'earnings', 
        impact: (Math.random() - 0.5) * 6, 
        duration: Math.floor(Math.random() * 120) + 30 
      };
    }
  }

  async updatePrices(): Promise<void> {
    for (const [symbol, stockData] of this.stocks) {
      const timeElapsed = (Date.now() - stockData.lastUpdate.getTime()) / 60000; // minutes
      
      if (timeElapsed < 1) continue; // Only update if at least 1 minute has passed
      
      // Generate new price using random walk
      const newPrices = await this.generateRandomWalk(
        symbol,
        stockData.price,
        stockData.volatility,
        2
      );
      
      const newPrice = newPrices[1];
      const priceChange = newPrice - stockData.price;
      const volume = Math.floor(Math.random() * 1000000) + 500000;
      
      // Update stock data
      const updatedStock: StockData = {
        ...stockData,
        price: newPrice,
        lastUpdate: new Date(),
        volume: stockData.volume + volume,
        high: Math.max(stockData.high, newPrice),
        low: Math.min(stockData.low, newPrice),
      };
      
      this.stocks.set(symbol, updatedStock);
      
      // Trigger Supabase realtime updates
      await this.broadcastPriceUpdate(symbol, updatedStock, priceChange);
    }
  }

  private async broadcastPriceUpdate(
    symbol: string, 
    stockData: StockData, 
    priceChange: number
  ): Promise<void> {
    try {
      // Broadcast to Supabase realtime channel
      const channel = supabase.channel('market-data');
      
      await channel.send({
        type: 'broadcast',
        event: 'price-update',
        payload: {
          symbol,
          price: stockData.price,
          change: priceChange,
          changePercent: (priceChange / (stockData.price - priceChange)) * 100,
          volume: stockData.volume,
          high: stockData.high,
          low: stockData.low,
          open: stockData.open,
          timestamp: stockData.lastUpdate.toISOString(),
        }
      });

      // Also update a hypothetical prices table
      await supabase
        .from('stock_prices')
        .upsert({
          symbol,
          price: stockData.price,
          volume: stockData.volume,
          high: stockData.high,
          low: stockData.low,
          open: stockData.open,
          updated_at: stockData.lastUpdate.toISOString(),
        });
        
    } catch (error) {
      console.error(`Failed to broadcast price update for ${symbol}:`, error);
    }
  }

  public start(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.updateInterval = setInterval(() => {
      this.updatePrices().catch(error => {
        console.error('Error updating prices:', error);
      });
    }, this.UPDATE_FREQUENCY);
    
    console.log('Market simulator started');
  }

  public stop(): void {
    if (!this.isRunning) return;
    
    this.isRunning = false;
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    console.log('Market simulator stopped');
  }

  public getStock(symbol: string): StockData | undefined {
    return this.stocks.get(symbol);
  }

  public getAllStocks(): Map<string, StockData> {
    return new Map(this.stocks);
  }

  public addStock(symbol: string, initialPrice: number, volatility: number): void {
    if (this.stocks.has(symbol)) {
      console.warn(`Stock ${symbol} already exists`);
      return;
    }

    this.stocks.set(symbol, {
      symbol,
      price: initialPrice,
      lastUpdate: new Date(),
      volatility,
      volume: Math.floor(Math.random() * 10000000) + 1000000,
      high: initialPrice * (1 + Math.random() * 0.02),
      low: initialPrice * (1 - Math.random() * 0.02),
      open: initialPrice * (1 + (Math.random() - 0.5) * 0.01),
    });
  }

  public removeStock(symbol: string): boolean {
    return this.stocks.delete(symbol);
  }

  public updateVolatility(symbol: string, newVolatility: number): boolean {
    const stock = this.stocks.get(symbol);
    if (!stock) return false;

    this.stocks.set(symbol, {
      ...stock,
      volatility: newVolatility
    });
    
    return true;
  }

  public simulateMarketCrash(impactPercent: number): void {
    for (const [symbol, stockData] of this.stocks) {
      const crashImpact = 1 - (impactPercent / 100);
      const newPrice = stockData.price * crashImpact;
      
      this.stocks.set(symbol, {
        ...stockData,
        price: newPrice,
        low: Math.min(stockData.low, newPrice),
        lastUpdate: new Date(),
        volatility: stockData.volatility * 1.5, // Increase volatility during crash
      });
    }
    
    console.log(`Simulated market crash with ${impactPercent}% impact`);
  }

  public simulateMarketRally(impactPercent: number): void {
    for (const [symbol, stockData] of this.stocks) {
      const rallyImpact = 1 + (impactPercent / 100);
      const newPrice = stockData.price * rallyImpact;
      
      this.stocks.set(symbol, {
        ...stockData,
        price: newPrice,
        high: Math.max(stockData.high, newPrice),
        lastUpdate: new Date(),
      });
    }
    
    console.log(`Simulated market rally with ${impactPercent}% impact`);
  }
}