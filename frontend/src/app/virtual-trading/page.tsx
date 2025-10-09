'use client';

import { useState } from 'react';
import StockPicker from '@/components/StockPicker';
import { TrendingUp, DollarSign, Activity } from 'lucide-react';

export default function VirtualTradingPage() {
  const [selectedStock, setSelectedStock] = useState('');
  const [portfolio] = useState({
    cash: 100000,
    positions: []
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Virtual Options Trading</h1>
          <p className="text-gray-300 text-lg">
            Practice with $100,000 virtual capital - Choose from 150+ stocks
          </p>
        </div>

        {/* Portfolio Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Portfolio Value</p>
                <p className="text-3xl font-bold text-white">
                  ${portfolio.cash.toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-12 h-12 text-green-400" />
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Today&apos;s P&L</p>
                <p className="text-3xl font-bold text-green-400">
                  +$0.00
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-green-400" />
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Active Positions</p>
                <p className="text-3xl font-bold text-white">
                  {portfolio.positions.length}
                </p>
              </div>
              <Activity className="w-12 h-12 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Stock Picker Demo */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Select a Stock to Trade</h2>
          <p className="text-gray-400 mb-6">
            Search from our comprehensive universe of 150+ stocks including tech, finance, healthcare, and more
          </p>
          
          <div className="max-w-2xl">
            <StockPicker
              onSelect={setSelectedStock}
              selectedSymbol={selectedStock}
              placeholder="Search for stocks (AAPL, TSLA, NVDA, etc.)"
            />
          </div>

          {selectedStock && (
            <div className="mt-6 p-6 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/50 rounded-lg">
              <p className="text-white text-lg">
                ✅ <span className="font-bold">{selectedStock}</span> selected! 
                <span className="text-gray-300 ml-2">
                  Options chain and trading interface would appear here.
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-3">150+ Stocks</h3>
            <p className="text-gray-400">
              Trade options on major stocks across all sectors - Technology, Finance, Healthcare, Energy, and more.
            </p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-3">Real-Time Search</h3>
            <p className="text-gray-400">
              Instantly search by symbol, company name, or sector. Lightning-fast autocomplete for quick trading.
            </p>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-3">Risk-Free Practice</h3>
            <p className="text-gray-400">
              Learn options trading with $100,000 virtual capital. No real money risk, just pure learning experience.
            </p>
          </div>
        </div>

        {/* Stock Universe Preview */}
        <div className="mt-8 bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-white mb-4">Available Stock Universe</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META', 'NFLX', 'AMD', 'INTC', 'JPM', 'BAC', 'WMT', 'DIS', 'UBER', 'COIN', 'SPY', 'QQQ'].map(symbol => (
              <button
                key={symbol}
                onClick={() => setSelectedStock(symbol)}
                className={`px-4 py-3 rounded-lg font-semibold transition-all ${
                  selectedStock === symbol
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                }`}
              >
                {symbol}
              </button>
            ))}
          </div>
          <p className="text-gray-400 text-center mt-4">
            + 130 more stocks available
          </p>
        </div>
      </div>
    </div>
  );
}
