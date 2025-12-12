'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import DashboardHeader from '@/components/DashboardHeader';
import { ArrowUp, ArrowDown, Clock, TrendingUp, AlertCircle } from 'lucide-react';

interface FuturesContract {
  symbol: string;
  contract: string;
  name: string;
  price: number;
  change: number;
  change_percentage: number;
  open: number;
  high: number;
  low: number;
  previous_close: number;
  volume: number;
  open_interest: number;
  expiration_date: string;
  contract_size: number;
  tick_size: number;
  tick_value: number;
  margin_requirement: number;
  notional_value: number;
  exchange: string;
  category: string;
  trading_hours: string;
  available_contracts: string[];
  last_updated: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  index: 'Index Futures',
  currency: 'Currency Futures',
  commodity: 'Commodity Futures',
  interest_rate: 'Interest Rate',
  crypto: 'Crypto Futures',
};

export default function FuturesPage() {
  const [futures, setFutures] = useState<FuturesContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedContract, setSelectedContract] = useState<FuturesContract | null>(null);

  useEffect(() => {
    fetchFutures();
    const interval = setInterval(fetchFutures, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchFutures = async () => {
    try {
      const response = await fetch('/api/market/futures');
      if (!response.ok) throw new Error('Failed to fetch futures data');
      const data = await response.json();
      setFutures(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const filteredFutures = selectedCategory === 'all'
    ? futures
    : futures.filter(f => f.category === selectedCategory);

  const categories = ['all', ...new Set(futures.map(f => f.category))];

  const formatPrice = (price: number, symbol: string) => {
    if (['6E', '6J', '6B', '6A', '6C'].includes(symbol)) {
      return price.toFixed(5);
    }
    if (price >= 1000) return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return price.toFixed(2);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <main className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Futures Trading</h1>
            <p className="text-gray-400 text-sm mt-1">Simulated futures contracts across multiple asset classes</p>
          </div>
          <Badge variant="outline" className="w-fit">
            <Clock className="w-3 h-3 mr-1" />
            Simulation Mode
          </Badge>
        </div>

        {error && (
          <Card className="border-red-500/50 bg-red-500/10">
            <CardContent className="py-3">
              <div className="flex items-center gap-2 text-red-400">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="flex flex-wrap h-auto gap-1">
            {categories.map(cat => (
              <TabsTrigger key={cat} value={cat} className="text-xs sm:text-sm">
                {cat === 'all' ? 'All Futures' : CATEGORY_LABELS[cat] || cat}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Futures List */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {selectedCategory === 'all' ? 'All Contracts' : CATEGORY_LABELS[selectedCategory]}
                    </CardTitle>
                    <CardDescription>
                      {filteredFutures.length} contracts available
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-700">
                            <th className="text-left py-3 px-2 text-gray-400 font-medium">Contract</th>
                            <th className="text-right py-3 px-2 text-gray-400 font-medium">Price</th>
                            <th className="text-right py-3 px-2 text-gray-400 font-medium">Change</th>
                            <th className="text-right py-3 px-2 text-gray-400 font-medium hidden sm:table-cell">Volume</th>
                            <th className="text-right py-3 px-2 text-gray-400 font-medium hidden md:table-cell">Margin</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredFutures.map((contract) => (
                            <tr
                              key={`${contract.symbol}-${contract.contract}`}
                              className={`border-b border-slate-800 hover:bg-slate-800/50 cursor-pointer transition-colors ${
                                selectedContract?.symbol === contract.symbol ? 'bg-slate-800/50' : ''
                              }`}
                              onClick={() => setSelectedContract(contract)}
                            >
                              <td className="py-3 px-2">
                                <div className="font-medium text-white">{contract.symbol}</div>
                                <div className="text-xs text-gray-400">{contract.name}</div>
                              </td>
                              <td className="text-right py-3 px-2 font-mono text-white">
                                {formatPrice(contract.price, contract.symbol)}
                              </td>
                              <td className="text-right py-3 px-2">
                                <div className={`flex items-center justify-end gap-1 ${
                                  contract.change >= 0 ? 'text-green-400' : 'text-red-400'
                                }`}>
                                  {contract.change >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                                  <span className="font-mono">{contract.change_percentage.toFixed(2)}%</span>
                                </div>
                              </td>
                              <td className="text-right py-3 px-2 text-gray-300 hidden sm:table-cell">
                                {contract.volume.toLocaleString()}
                              </td>
                              <td className="text-right py-3 px-2 text-gray-300 hidden md:table-cell">
                                {contract.margin_requirement}%
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Contract Details */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Contract Details</CardTitle>
                    <CardDescription>
                      {selectedContract ? selectedContract.name : 'Select a contract'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedContract ? (
                      <div className="space-y-4">
                        {/* Price Display */}
                        <div className="text-center py-4 bg-slate-800/50 rounded-lg">
                          <div className="text-3xl font-bold text-white font-mono">
                            {formatPrice(selectedContract.price, selectedContract.symbol)}
                          </div>
                          <div className={`flex items-center justify-center gap-1 mt-1 ${
                            selectedContract.change >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {selectedContract.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                            <span>{formatPrice(selectedContract.change, selectedContract.symbol)} ({selectedContract.change_percentage.toFixed(2)}%)</span>
                          </div>
                        </div>

                        {/* Contract Info Grid */}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="bg-slate-800/30 p-3 rounded">
                            <div className="text-gray-400 text-xs">Exchange</div>
                            <div className="text-white font-medium">{selectedContract.exchange}</div>
                          </div>
                          <div className="bg-slate-800/30 p-3 rounded">
                            <div className="text-gray-400 text-xs">Contract</div>
                            <div className="text-white font-medium">{selectedContract.contract}</div>
                          </div>
                          <div className="bg-slate-800/30 p-3 rounded">
                            <div className="text-gray-400 text-xs">Contract Size</div>
                            <div className="text-white font-medium">{selectedContract.contract_size}</div>
                          </div>
                          <div className="bg-slate-800/30 p-3 rounded">
                            <div className="text-gray-400 text-xs">Tick Size</div>
                            <div className="text-white font-medium">{selectedContract.tick_size}</div>
                          </div>
                          <div className="bg-slate-800/30 p-3 rounded">
                            <div className="text-gray-400 text-xs">Tick Value</div>
                            <div className="text-white font-medium">{formatCurrency(selectedContract.tick_value)}</div>
                          </div>
                          <div className="bg-slate-800/30 p-3 rounded">
                            <div className="text-gray-400 text-xs">Margin Req.</div>
                            <div className="text-white font-medium">{selectedContract.margin_requirement}%</div>
                          </div>
                          <div className="bg-slate-800/30 p-3 rounded col-span-2">
                            <div className="text-gray-400 text-xs">Notional Value</div>
                            <div className="text-white font-medium">{formatCurrency(selectedContract.notional_value)}</div>
                          </div>
                          <div className="bg-slate-800/30 p-3 rounded">
                            <div className="text-gray-400 text-xs">Open Interest</div>
                            <div className="text-white font-medium">{selectedContract.open_interest.toLocaleString()}</div>
                          </div>
                          <div className="bg-slate-800/30 p-3 rounded">
                            <div className="text-gray-400 text-xs">Expiration</div>
                            <div className="text-white font-medium">{selectedContract.expiration_date}</div>
                          </div>
                        </div>

                        {/* OHLC */}
                        <div className="border-t border-slate-700 pt-4">
                          <div className="text-xs text-gray-400 mb-2">Today&apos;s Range</div>
                          <div className="flex justify-between text-sm">
                            <div>
                              <span className="text-gray-400">Open:</span>
                              <span className="text-white ml-2 font-mono">{formatPrice(selectedContract.open, selectedContract.symbol)}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Prev:</span>
                              <span className="text-white ml-2 font-mono">{formatPrice(selectedContract.previous_close, selectedContract.symbol)}</span>
                            </div>
                          </div>
                          <div className="flex justify-between text-sm mt-2">
                            <div>
                              <span className="text-green-400">High:</span>
                              <span className="text-white ml-2 font-mono">{formatPrice(selectedContract.high, selectedContract.symbol)}</span>
                            </div>
                            <div>
                              <span className="text-red-400">Low:</span>
                              <span className="text-white ml-2 font-mono">{formatPrice(selectedContract.low, selectedContract.symbol)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Trading Hours */}
                        <div className="border-t border-slate-700 pt-4">
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <Clock className="w-3 h-3" />
                            {selectedContract.trading_hours}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Click on a contract to view details</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
