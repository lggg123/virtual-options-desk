// lib/market-data/real-market-data.ts
import { MarketData } from '../types';

export interface MarketDataConfig {
  provider: 'alpha_vantage' | 'finnhub' | 'polygon' | 'fmp' | 'eodhd';
  apiKey: string;
  symbol?: string;
  interval?: '1min' | '5min' | '15min' | '30min' | '60min' | '1day';
}

export class RealMarketDataService {
  private config: MarketDataConfig;

  constructor(config: MarketDataConfig) {
    this.config = {
      symbol: 'SPY',
      interval: '5min',
      ...config
    };
  }

  async getCurrentPrice(symbol: string = this.config.symbol!): Promise<{
    price: number;
    change: number;
    changePercent: number;
    volume: number;
  }> {
    try {
      switch (this.config.provider) {
        case 'alpha_vantage':
          return await this.getAlphaVantagePrice(symbol);
        case 'finnhub':
          return await this.getFinnhubPrice(symbol);
        case 'polygon':
          return await this.getPolygonPrice(symbol);
        case 'fmp':
          return await this.getFMPPrice(symbol);
        case 'eodhd':
          return await this.getEODHDPrice(symbol);
        default:
          throw new Error(`Unsupported provider: ${this.config.provider}`);
      }
    } catch (error) {
      console.error('Failed to fetch current price:', error);
      throw error;
    }
  }

  async getHistoricalData(
    symbol: string = this.config.symbol!,
    days: number = 30
  ): Promise<MarketData[]> {
    try {
      switch (this.config.provider) {
        case 'alpha_vantage':
          return await this.getAlphaVantageHistorical(symbol, days);
        case 'finnhub':
          return await this.getFinnhubHistorical(symbol, days);
        case 'polygon':
          return await this.getPolygonHistorical(symbol, days);
        case 'fmp':
          return await this.getFMPHistorical(symbol, days);
        case 'eodhd':
          return await this.getEODHDHistorical(symbol, days);
        default:
          throw new Error(`Unsupported provider: ${this.config.provider}`);
      }
    } catch (error) {
      console.error('Failed to fetch historical data:', error);
      throw error;
    }
  }

  // Alpha Vantage Implementation
  private async getAlphaVantagePrice(symbol: string) {
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${this.config.apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data['Error Message']) {
      throw new Error(`Alpha Vantage error: ${data['Error Message']}`);
    }

    const quote = data['Global Quote'];
    return {
      price: parseFloat(quote['05. price']),
      change: parseFloat(quote['09. change']),
      changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
      volume: parseInt(quote['06. volume'])
    };
  }

  private async getAlphaVantageHistorical(symbol: string, days: number): Promise<MarketData[]> {
    const url = `https://www.alphavantage.co/query?function=TIME_SERIES_INTRADAY&symbol=${symbol}&interval=${this.config.interval}&apikey=${this.config.apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data['Error Message']) {
      throw new Error(`Alpha Vantage error: ${data['Error Message']}`);
    }

    const timeSeries = data[`Time Series (${this.config.interval})`];
    const marketData: MarketData[] = [];

    for (const [timestamp, values] of Object.entries(timeSeries)) {
      marketData.push({
        price: parseFloat((values as any)['4. close']),
        volume: parseInt((values as any)['5. volume']),
        timestamp: new Date(timestamp).toISOString(),
        high: parseFloat((values as any)['2. high']),
        low: parseFloat((values as any)['3. low']),
        open: parseFloat((values as any)['1. open']),
        symbol
      });

      if (marketData.length >= days * 78) break; // ~78 5-min intervals per trading day
    }

    return marketData.reverse(); // Oldest first
  }

  // Finnhub Implementation
  private async getFinnhubPrice(symbol: string) {
    const url = `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${this.config.apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.error) {
      throw new Error(`Finnhub error: ${data.error}`);
    }

    return {
      price: data.c, // Current price
      change: data.d, // Change
      changePercent: data.dp, // Percent change
      volume: data.v || 0 // Volume (if available)
    };
  }

  private async getFinnhubHistorical(symbol: string, days: number): Promise<MarketData[]> {
    const to = Math.floor(Date.now() / 1000);
    const from = to - (days * 24 * 60 * 60);
    
    const url = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=5&from=${from}&to=${to}&token=${this.config.apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.s !== 'ok') {
      throw new Error(`Finnhub error: ${data.s}`);
    }

    const marketData: MarketData[] = [];
    for (let i = 0; i < data.c.length; i++) {
      marketData.push({
        price: data.c[i],
        volume: data.v[i],
        timestamp: new Date(data.t[i] * 1000).toISOString(),
        high: data.h[i],
        low: data.l[i],
        open: data.o[i],
        symbol
      });
    }

    return marketData;
  }

  // Polygon.io Implementation  
  private async getPolygonPrice(symbol: string) {
    const url = `https://api.polygon.io/v2/last/trade/${symbol}?apikey=${this.config.apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status !== 'OK') {
      throw new Error(`Polygon error: ${data.error || 'Unknown error'}`);
    }

    const prevCloseUrl = `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?adjusted=true&apikey=${this.config.apiKey}`;
    const prevResponse = await fetch(prevCloseUrl);
    const prevData = await prevResponse.json();
    
    const currentPrice = data.results.p;
    const prevClose = prevData.results?.[0]?.c || currentPrice;
    const change = currentPrice - prevClose;
    const changePercent = (change / prevClose) * 100;

    return {
      price: currentPrice,
      change,
      changePercent,
      volume: data.results.s || 0
    };
  }

  private async getPolygonHistorical(symbol: string, days: number): Promise<MarketData[]> {
    const to = new Date().toISOString().split('T')[0];
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/5/minute/${from}/${to}?adjusted=true&sort=asc&apikey=${this.config.apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.status !== 'OK') {
      throw new Error(`Polygon error: ${data.error || 'Unknown error'}`);
    }

    return data.results.map((item: any) => ({
      price: item.c,
      volume: item.v,
      timestamp: new Date(item.t).toISOString(),
      high: item.h,
      low: item.l,
      open: item.o,
      symbol
    }));
  }

  // Financial Modeling Prep Implementation
  private async getFMPPrice(symbol: string) {
    const url = `https://financialmodelingprep.com/api/v3/quote/${symbol}?apikey=${this.config.apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data || data.length === 0) {
      throw new Error('FMP: No data received');
    }

    const quote = data[0];
    return {
      price: quote.price,
      change: quote.change,
      changePercent: quote.changesPercentage,
      volume: quote.volume
    };
  }

  private async getFMPHistorical(symbol: string, days: number): Promise<MarketData[]> {
    const url = `https://financialmodelingprep.com/api/v3/historical-chart/5min/${symbol}?apikey=${this.config.apiKey}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      throw new Error('FMP: Invalid response format');
    }

    return data.slice(0, days * 78).reverse().map((item: any) => ({
      price: item.close,
      volume: item.volume,
      timestamp: new Date(item.date).toISOString(),
      high: item.high,
      low: item.low,
      open: item.open,
      symbol
    }));
  }

  // EODHD Implementation
  private async getEODHDPrice(symbol: string) {
    const url = `https://eodhd.com/api/real-time/${symbol}?api_token=${this.config.apiKey}&fmt=json`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.error) {
      throw new Error(`EODHD error: ${data.error}`);
    }

    return {
      price: data.close,
      change: data.change,
      changePercent: data.change_p,
      volume: data.volume || 0
    };
  }

  private async getEODHDHistorical(symbol: string, days: number): Promise<MarketData[]> {
    const to = new Date().toISOString().split('T')[0];
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const url = `https://eodhd.com/api/intraday/${symbol}?api_token=${this.config.apiKey}&interval=5m&from=${from}&to=${to}&fmt=json`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      throw new Error('EODHD: Invalid response format');
    }

    return data.map((item: any) => ({
      price: item.close,
      volume: item.volume,
      timestamp: new Date(`${item.datetime}Z`).toISOString(),
      high: item.high,
      low: item.low,
      open: item.open,
      symbol
    }));
  }
}

// Factory function for easy initialization
export function createMarketDataService(config: MarketDataConfig): RealMarketDataService {
  return new RealMarketDataService(config);
}

// Provider-specific helper functions
export const MarketDataProviders = {
  ALPHA_VANTAGE: {
    name: 'Alpha Vantage',
    freeLimit: '100 requests/day',
    features: ['Real-time', 'Historical', 'Technical indicators'],
    signupUrl: 'https://www.alphavantage.co/support/#api-key'
  },
  FINNHUB: {
    name: 'Finnhub',
    freeLimit: '60 calls/minute',
    features: ['Real-time', 'Company fundamentals', 'Alternative data'],
    signupUrl: 'https://finnhub.io/register'
  },
  POLYGON: {
    name: 'Polygon.io',
    freeLimit: '5 calls/minute',
    features: ['Real-time', 'Options data', 'News'],
    signupUrl: 'https://polygon.io/pricing'
  },
  FMP: {
    name: 'Financial Modeling Prep',
    freeLimit: '250 requests/day',
    features: ['Financial statements', 'Real-time prices', 'Ratios'],
    signupUrl: 'https://site.financialmodelingprep.com/developer/docs'
  },
  EODHD: {
    name: 'EODHD',
    freeLimit: '20 requests/day',
    features: ['End-of-day data', 'Intraday', 'Options'],
    signupUrl: 'https://eodhd.com/register'
  }
};