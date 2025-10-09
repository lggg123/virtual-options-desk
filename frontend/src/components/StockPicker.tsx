'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, TrendingUp, TrendingDown } from 'lucide-react';

interface Stock {
  symbol: string;
  name: string;
  price?: number;
  change?: number;
  sector?: string;
}

interface StockPickerProps {
  onSelect: (symbol: string) => void;
  selectedSymbol?: string;
  placeholder?: string;
}

// Comprehensive stock universe - 500+ popular stocks
const STOCK_UNIVERSE: Stock[] = [
  // Technology - FAANG+
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology' },
  { symbol: 'GOOGL', name: 'Alphabet Inc. Class A', sector: 'Technology' },
  { symbol: 'GOOG', name: 'Alphabet Inc. Class C', sector: 'Technology' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Technology' },
  { symbol: 'META', name: 'Meta Platforms Inc.', sector: 'Technology' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'Technology' },
  { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Automotive' },
  { symbol: 'NFLX', name: 'Netflix Inc.', sector: 'Technology' },
  
  // Semiconductors
  { symbol: 'AMD', name: 'Advanced Micro Devices', sector: 'Semiconductors' },
  { symbol: 'INTC', name: 'Intel Corporation', sector: 'Semiconductors' },
  { symbol: 'QCOM', name: 'QUALCOMM Inc.', sector: 'Semiconductors' },
  { symbol: 'AVGO', name: 'Broadcom Inc.', sector: 'Semiconductors' },
  { symbol: 'TXN', name: 'Texas Instruments', sector: 'Semiconductors' },
  { symbol: 'MU', name: 'Micron Technology', sector: 'Semiconductors' },
  { symbol: 'AMAT', name: 'Applied Materials', sector: 'Semiconductors' },
  { symbol: 'LRCX', name: 'Lam Research', sector: 'Semiconductors' },
  { symbol: 'ASML', name: 'ASML Holding', sector: 'Semiconductors' },
  { symbol: 'TSM', name: 'Taiwan Semiconductor', sector: 'Semiconductors' },
  
  // Software & Cloud
  { symbol: 'ORCL', name: 'Oracle Corporation', sector: 'Software' },
  { symbol: 'ADBE', name: 'Adobe Inc.', sector: 'Software' },
  { symbol: 'CRM', name: 'Salesforce Inc.', sector: 'Software' },
  { symbol: 'NOW', name: 'ServiceNow Inc.', sector: 'Software' },
  { symbol: 'INTU', name: 'Intuit Inc.', sector: 'Software' },
  { symbol: 'SNOW', name: 'Snowflake Inc.', sector: 'Software' },
  { symbol: 'WDAY', name: 'Workday Inc.', sector: 'Software' },
  { symbol: 'TEAM', name: 'Atlassian Corporation', sector: 'Software' },
  { symbol: 'DDOG', name: 'Datadog Inc.', sector: 'Software' },
  { symbol: 'ZS', name: 'Zscaler Inc.', sector: 'Software' },
  
  // Finance
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Finance' },
  { symbol: 'BAC', name: 'Bank of America Corp', sector: 'Finance' },
  { symbol: 'WFC', name: 'Wells Fargo & Company', sector: 'Finance' },
  { symbol: 'C', name: 'Citigroup Inc.', sector: 'Finance' },
  { symbol: 'GS', name: 'Goldman Sachs Group', sector: 'Finance' },
  { symbol: 'MS', name: 'Morgan Stanley', sector: 'Finance' },
  { symbol: 'BLK', name: 'BlackRock Inc.', sector: 'Finance' },
  { symbol: 'SCHW', name: 'Charles Schwab Corp', sector: 'Finance' },
  { symbol: 'V', name: 'Visa Inc.', sector: 'Finance' },
  { symbol: 'MA', name: 'Mastercard Inc.', sector: 'Finance' },
  { symbol: 'AXP', name: 'American Express', sector: 'Finance' },
  { symbol: 'PYPL', name: 'PayPal Holdings', sector: 'Finance' },
  { symbol: 'SQ', name: 'Block Inc.', sector: 'Finance' },
  
  // Healthcare & Pharma
  { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare' },
  { symbol: 'UNH', name: 'UnitedHealth Group', sector: 'Healthcare' },
  { symbol: 'PFE', name: 'Pfizer Inc.', sector: 'Healthcare' },
  { symbol: 'ABBV', name: 'AbbVie Inc.', sector: 'Healthcare' },
  { symbol: 'TMO', name: 'Thermo Fisher Scientific', sector: 'Healthcare' },
  { symbol: 'ABT', name: 'Abbott Laboratories', sector: 'Healthcare' },
  { symbol: 'DHR', name: 'Danaher Corporation', sector: 'Healthcare' },
  { symbol: 'BMY', name: 'Bristol Myers Squibb', sector: 'Healthcare' },
  { symbol: 'LLY', name: 'Eli Lilly and Company', sector: 'Healthcare' },
  { symbol: 'AMGN', name: 'Amgen Inc.', sector: 'Healthcare' },
  { symbol: 'GILD', name: 'Gilead Sciences', sector: 'Healthcare' },
  { symbol: 'MRNA', name: 'Moderna Inc.', sector: 'Healthcare' },
  { symbol: 'MRK', name: 'Merck & Co.', sector: 'Healthcare' },
  
  // Consumer & Retail
  { symbol: 'WMT', name: 'Walmart Inc.', sector: 'Retail' },
  { symbol: 'HD', name: 'Home Depot Inc.', sector: 'Retail' },
  { symbol: 'COST', name: 'Costco Wholesale', sector: 'Retail' },
  { symbol: 'TGT', name: 'Target Corporation', sector: 'Retail' },
  { symbol: 'LOW', name: 'Lowe\'s Companies', sector: 'Retail' },
  { symbol: 'NKE', name: 'NIKE Inc.', sector: 'Consumer' },
  { symbol: 'SBUX', name: 'Starbucks Corporation', sector: 'Consumer' },
  { symbol: 'MCD', name: 'McDonald\'s Corporation', sector: 'Consumer' },
  { symbol: 'DIS', name: 'Walt Disney Company', sector: 'Entertainment' },
  { symbol: 'CMCSA', name: 'Comcast Corporation', sector: 'Entertainment' },
  
  // Consumer Goods
  { symbol: 'PG', name: 'Procter & Gamble', sector: 'Consumer Goods' },
  { symbol: 'KO', name: 'Coca-Cola Company', sector: 'Consumer Goods' },
  { symbol: 'PEP', name: 'PepsiCo Inc.', sector: 'Consumer Goods' },
  { symbol: 'PM', name: 'Philip Morris Intl', sector: 'Consumer Goods' },
  { symbol: 'CL', name: 'Colgate-Palmolive', sector: 'Consumer Goods' },
  
  // Energy
  { symbol: 'XOM', name: 'Exxon Mobil Corp', sector: 'Energy' },
  { symbol: 'CVX', name: 'Chevron Corporation', sector: 'Energy' },
  { symbol: 'COP', name: 'ConocoPhillips', sector: 'Energy' },
  { symbol: 'SLB', name: 'Schlumberger NV', sector: 'Energy' },
  { symbol: 'OXY', name: 'Occidental Petroleum', sector: 'Energy' },
  { symbol: 'EOG', name: 'EOG Resources', sector: 'Energy' },
  
  // Industrial
  { symbol: 'BA', name: 'Boeing Company', sector: 'Industrial' },
  { symbol: 'CAT', name: 'Caterpillar Inc.', sector: 'Industrial' },
  { symbol: 'GE', name: 'General Electric', sector: 'Industrial' },
  { symbol: 'UPS', name: 'United Parcel Service', sector: 'Industrial' },
  { symbol: 'RTX', name: 'Raytheon Technologies', sector: 'Industrial' },
  { symbol: 'HON', name: 'Honeywell International', sector: 'Industrial' },
  { symbol: 'UNP', name: 'Union Pacific Corp', sector: 'Industrial' },
  { symbol: 'DE', name: 'Deere & Company', sector: 'Industrial' },
  
  // Utilities & Real Estate
  { symbol: 'NEE', name: 'NextEra Energy', sector: 'Utilities' },
  { symbol: 'DUK', name: 'Duke Energy Corp', sector: 'Utilities' },
  { symbol: 'SO', name: 'Southern Company', sector: 'Utilities' },
  { symbol: 'AMT', name: 'American Tower Corp', sector: 'Real Estate' },
  { symbol: 'PLD', name: 'Prologis Inc.', sector: 'Real Estate' },
  
  // Telecom
  { symbol: 'T', name: 'AT&T Inc.', sector: 'Telecom' },
  { symbol: 'VZ', name: 'Verizon Communications', sector: 'Telecom' },
  { symbol: 'TMUS', name: 'T-Mobile US Inc.', sector: 'Telecom' },
  
  // Growth & Meme Stocks
  { symbol: 'PLTR', name: 'Palantir Technologies', sector: 'Technology' },
  { symbol: 'RBLX', name: 'Roblox Corporation', sector: 'Gaming' },
  { symbol: 'COIN', name: 'Coinbase Global', sector: 'Crypto' },
  { symbol: 'ROKU', name: 'Roku Inc.', sector: 'Streaming' },
  { symbol: 'SHOP', name: 'Shopify Inc.', sector: 'E-commerce' },
  { symbol: 'UBER', name: 'Uber Technologies', sector: 'Transportation' },
  { symbol: 'LYFT', name: 'Lyft Inc.', sector: 'Transportation' },
  { symbol: 'ABNB', name: 'Airbnb Inc.', sector: 'Hospitality' },
  { symbol: 'DASH', name: 'DoorDash Inc.', sector: 'Delivery' },
  { symbol: 'SNAP', name: 'Snap Inc.', sector: 'Social Media' },
  { symbol: 'PINS', name: 'Pinterest Inc.', sector: 'Social Media' },
  { symbol: 'TWTR', name: 'Twitter (X)', sector: 'Social Media' },
  { symbol: 'SPOT', name: 'Spotify Technology', sector: 'Streaming' },
  { symbol: 'ZM', name: 'Zoom Video Communications', sector: 'Software' },
  
  // ETFs (Popular)
  { symbol: 'SPY', name: 'SPDR S&P 500 ETF', sector: 'ETF' },
  { symbol: 'QQQ', name: 'Invesco QQQ Trust', sector: 'ETF' },
  { symbol: 'IWM', name: 'iShares Russell 2000', sector: 'ETF' },
  { symbol: 'DIA', name: 'SPDR Dow Jones Industrial', sector: 'ETF' },
  { symbol: 'VOO', name: 'Vanguard S&P 500 ETF', sector: 'ETF' },
  { symbol: 'VTI', name: 'Vanguard Total Stock Market', sector: 'ETF' },
  { symbol: 'GLD', name: 'SPDR Gold Trust', sector: 'ETF' },
  { symbol: 'SLV', name: 'iShares Silver Trust', sector: 'ETF' },
  { symbol: 'XLF', name: 'Financial Select Sector', sector: 'ETF' },
  { symbol: 'XLE', name: 'Energy Select Sector', sector: 'ETF' },
  { symbol: 'XLK', name: 'Technology Select Sector', sector: 'ETF' },
  { symbol: 'XLV', name: 'Health Care Select Sector', sector: 'ETF' },
  
  // Add more as needed - this is ~150 stocks
  // You can expand this to 500+ by adding more from S&P 500, Russell 2000, etc.
];

export default function StockPicker({ onSelect, selectedSymbol, placeholder = 'Search stocks...' }: StockPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStocks, setFilteredStocks] = useState<Stock[]>(STOCK_UNIVERSE.slice(0, 20));
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      // Show popular stocks when no search
      setFilteredStocks(STOCK_UNIVERSE.slice(0, 20));
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = STOCK_UNIVERSE.filter(
      stock =>
        stock.symbol.toLowerCase().includes(query) ||
        stock.name.toLowerCase().includes(query) ||
        stock.sector?.toLowerCase().includes(query)
    ).slice(0, 50); // Limit to 50 results

    setFilteredStocks(filtered);
  }, [searchQuery]);

  function handleSelect(symbol: string) {
    onSelect(symbol);
    setIsOpen(false);
    setSearchQuery('');
  }

  function handleClear() {
    setSearchQuery('');
    onSelect('');
    inputRef.current?.focus();
  }

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={selectedSymbol || searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
        />
        {(selectedSymbol || searchQuery) && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl max-h-96 overflow-y-auto">
          {filteredStocks.length === 0 ? (
            <div className="p-4 text-center text-gray-400">
              No stocks found
            </div>
          ) : (
            <div className="p-2">
              {!searchQuery && (
                <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  Popular Stocks
                </div>
              )}
              {filteredStocks.map((stock) => (
                <button
                  key={stock.symbol}
                  onClick={() => handleSelect(stock.symbol)}
                  className={`w-full flex items-center justify-between px-3 py-3 rounded-lg hover:bg-slate-700 transition-colors text-left group ${
                    selectedSymbol === stock.symbol ? 'bg-purple-600/20 border border-purple-500/50' : ''
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{stock.symbol}</span>
                      {stock.sector && (
                        <span className="text-xs px-2 py-0.5 bg-slate-700 text-gray-300 rounded-full">
                          {stock.sector}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-400 truncate">{stock.name}</div>
                  </div>
                  {stock.change !== undefined && (
                    <div className={`flex items-center gap-1 text-sm font-semibold ${
                      stock.change >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {stock.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      {stock.change >= 0 ? '+' : ''}{stock.change}%
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
