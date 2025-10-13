'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, TrendingUp, Star, ChevronRight } from 'lucide-react';

interface Stock {
  symbol: string;
  name: string;
  price?: number;
  change?: number;
  category?: string;
}

interface StockSelectorProps {
  onSelectStock: (symbol: string) => void;
  currentSymbol?: string;
}

export default function StockSelector({ onSelectStock, currentSymbol = 'AAPL' }: StockSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Stock[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [liveData, setLiveData] = useState<{ price?: number; change?: number; volume?: number } | null>(null);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // Comprehensive stock list with names and categories
  const stockDatabase: Stock[] = [
    // Mega Cap Tech
    { symbol: 'AAPL', name: 'Apple Inc.', category: 'Tech' },
    { symbol: 'MSFT', name: 'Microsoft Corporation', category: 'Tech' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', category: 'Tech' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', category: 'Tech' },
    { symbol: 'META', name: 'Meta Platforms Inc.', category: 'Tech' },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', category: 'Semiconductors' },
    { symbol: 'TSLA', name: 'Tesla Inc.', category: 'Automotive' },
    { symbol: 'NFLX', name: 'Netflix Inc.', category: 'Entertainment' },

    // Semiconductors
    { symbol: 'AMD', name: 'Advanced Micro Devices', category: 'Semiconductors' },
    { symbol: 'INTC', name: 'Intel Corporation', category: 'Semiconductors' },
    { symbol: 'QCOM', name: 'QUALCOMM Inc.', category: 'Semiconductors' },
    { symbol: 'AVGO', name: 'Broadcom Inc.', category: 'Semiconductors' },
    { symbol: 'TSM', name: 'Taiwan Semiconductor', category: 'Semiconductors' },

    // Software & Cloud
    { symbol: 'ORCL', name: 'Oracle Corporation', category: 'Software' },
    { symbol: 'ADBE', name: 'Adobe Inc.', category: 'Software' },
    { symbol: 'CRM', name: 'Salesforce Inc.', category: 'Software' },
    { symbol: 'NOW', name: 'ServiceNow Inc.', category: 'Software' },

    // Finance
    { symbol: 'JPM', name: 'JPMorgan Chase & Co.', category: 'Finance' },
    { symbol: 'BAC', name: 'Bank of America Corp.', category: 'Finance' },
    { symbol: 'WFC', name: 'Wells Fargo & Company', category: 'Finance' },
    { symbol: 'GS', name: 'Goldman Sachs Group', category: 'Finance' },
    { symbol: 'V', name: 'Visa Inc.', category: 'Finance' },
    { symbol: 'MA', name: 'Mastercard Inc.', category: 'Finance' },

    // Healthcare
    { symbol: 'JNJ', name: 'Johnson & Johnson', category: 'Healthcare' },
    { symbol: 'UNH', name: 'UnitedHealth Group', category: 'Healthcare' },
    { symbol: 'PFE', name: 'Pfizer Inc.', category: 'Healthcare' },
    { symbol: 'ABBV', name: 'AbbVie Inc.', category: 'Healthcare' },

    // Consumer & Retail
    { symbol: 'WMT', name: 'Walmart Inc.', category: 'Retail' },
    { symbol: 'HD', name: 'Home Depot Inc.', category: 'Retail' },
    { symbol: 'COST', name: 'Costco Wholesale', category: 'Retail' },
    { symbol: 'NKE', name: 'Nike Inc.', category: 'Consumer' },
    { symbol: 'SBUX', name: 'Starbucks Corporation', category: 'Consumer' },
    { symbol: 'MCD', name: 'McDonald\'s Corporation', category: 'Consumer' },
    { symbol: 'DIS', name: 'Walt Disney Company', category: 'Entertainment' },

    // Energy
    { symbol: 'XOM', name: 'Exxon Mobil Corporation', category: 'Energy' },
    { symbol: 'CVX', name: 'Chevron Corporation', category: 'Energy' },

    // Growth & Crypto
    { symbol: 'PLTR', name: 'Palantir Technologies', category: 'Software' },
    { symbol: 'COIN', name: 'Coinbase Global', category: 'Crypto' },
    { symbol: 'ROKU', name: 'Roku Inc.', category: 'Entertainment' },
    { symbol: 'SHOP', name: 'Shopify Inc.', category: 'E-Commerce' },
    { symbol: 'UBER', name: 'Uber Technologies', category: 'Transportation' },

    // ETFs
    { symbol: 'SPY', name: 'S&P 500 ETF', category: 'ETF' },
    { symbol: 'QQQ', name: 'Nasdaq-100 ETF', category: 'ETF' },
    { symbol: 'IWM', name: 'Russell 2000 ETF', category: 'ETF' },
    { symbol: 'DIA', name: 'Dow Jones ETF', category: 'ETF' },
  ];

  // Popular stocks for quick access
  const popularStocks = [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA',
    'META', 'NVDA', 'SPY', 'QQQ', 'AMD'
  ];

  // Most active options stocks
  const highVolumeStocks = [
    'SPY', 'QQQ', 'TSLA', 'AAPL', 'NVDA', 'AMD'
  ];

  // Handle search
  useEffect(() => {
    if (searchQuery.length > 0) {
      const filtered = stockDatabase.filter(stock =>
        stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stock.name.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 10);
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery, stockDatabase]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectStock = (symbol: string) => {
    onSelectStock(symbol);
    setSearchQuery('');
    setShowSuggestions(false);
  };

  // Fetch live price/volume when currentSymbol changes
  useEffect(() => {
    if (!currentSymbol) return;
    setLiveLoading(true);
    setLiveError(null);
    setLiveData(null);
    fetch(`/api/market/quote?symbol=${encodeURIComponent(currentSymbol)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to fetch market data');
        return res.json();
      })
      .then((data) => {
        setLiveData({
          price: data.regularMarketPrice,
          change: data.regularMarketChangePercent,
          volume: data.regularMarketVolume,
        });
      })
      .catch((err) => {
        setLiveError('Could not load live data');
      })
      .finally(() => setLiveLoading(false));
  }, [currentSymbol]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5" />
          Stock Selector
        </CardTitle>
        <CardDescription>Search or select from popular stocks</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search Bar */}
        <div className="relative" ref={searchRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              type="text"
              placeholder="Search stocks by symbol or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery && setShowSuggestions(true)}
              className="pl-10"
            />
          </div>

          {/* Autocomplete Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {suggestions.map((stock) => (
                <button
                  key={stock.symbol}
                  onClick={() => handleSelectStock(stock.symbol)}
                  className="w-full px-4 py-3 text-left hover:bg-muted transition-colors flex items-center justify-between group"
                >
                  <div>
                    <div className="font-semibold">{stock.symbol}</div>
                    <div className="text-sm text-muted-foreground">{stock.name}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">{stock.category}</Badge>
                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Currently Selected */}
        <div className="bg-muted p-4 rounded-lg">
          <div className="text-sm text-muted-foreground mb-1">Currently Selected</div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{currentSymbol}</div>
              {liveLoading ? (
                <div className="text-xs text-gray-400 mt-1">Loading price...</div>
              ) : liveError ? (
                <div className="text-xs text-red-500 mt-1">{liveError}</div>
              ) : liveData && (
                <div className="text-xs text-gray-400 mt-1 flex gap-4">
                  <span>Price: <span className="text-white font-semibold">${liveData.price?.toFixed(2) ?? '--'}</span></span>
                  <span>Change: <span className={liveData.change && liveData.change >= 0 ? 'text-green-500' : 'text-red-500'}>{liveData.change !== undefined ? `${liveData.change >= 0 ? '+' : ''}${liveData.change.toFixed(2)}%` : '--'}</span></span>
                  <span>Vol: <span className="text-white font-semibold">{liveData.volume?.toLocaleString() ?? '--'}</span></span>
                </div>
              )}
            </div>
            <Badge variant="outline">Active</Badge>
          </div>
        </div>

        {/* Popular Stocks */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Star className="w-4 h-4 text-yellow-500" />
            <h3 className="font-semibold">Popular Stocks</h3>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {popularStocks.map((symbol) => (
              <Button
                key={symbol}
                variant={currentSymbol === symbol ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSelectStock(symbol)}
                className="font-mono"
              >
                {symbol}
              </Button>
            ))}
          </div>
        </div>

        {/* High Volume Options */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <h3 className="font-semibold">High Options Volume</h3>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {highVolumeStocks.map((symbol) => (
              <Button
                key={symbol}
                variant={currentSymbol === symbol ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleSelectStock(symbol)}
                className="font-mono"
              >
                {symbol}
              </Button>
            ))}
          </div>
        </div>

        {/* Categories */}
        <div>
          <h3 className="font-semibold mb-3">Browse by Category</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {['Tech', 'Finance', 'Healthcare', 'Energy', 'Retail', 'ETF', 'Semiconductors', 'Software'].map((category) => (
              <Badge
                key={category}
                variant="outline"
                className="cursor-pointer hover:bg-muted transition-colors justify-center py-2"
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
