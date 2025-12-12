'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import DashboardHeader from '@/components/DashboardHeader';
import { ArrowUp, ArrowDown, Clock, TrendingUp, AlertCircle, ShoppingCart, Loader2 } from 'lucide-react';

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

  // Order state
  const [orderQuantity, setOrderQuantity] = useState<string>('1');
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);

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

  const handleSubmitOrder = async () => {
    const qty = parseInt(orderQuantity);
    if (!selectedContract || isNaN(qty) || qty <= 0) return;

    setIsSubmitting(true);
    setOrderError(null);
    setOrderSuccess(null);

    try {
      const response = await fetch('/api/market/futures/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: selectedContract.symbol,
          contract: selectedContract.contract,
          orderType,
          quantity: qty,
          price: selectedContract.price,
          contractSize: selectedContract.contract_size,
          marginRequirement: selectedContract.margin_requirement,
          tickValue: selectedContract.tick_value,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to place order');
      }

      setOrderSuccess(`${orderType.toUpperCase()} ${qty} ${selectedContract.symbol} @ ${formatPrice(selectedContract.price, selectedContract.symbol)} - ${data.message}`);
      setOrderQuantity('1');
    } catch (err) {
      setOrderError(err instanceof Error ? err.message : 'Failed to place order');
    } finally {
      setIsSubmitting(false);
    }
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
                            <th className="text-left py-3 px-2 text-slate-300 font-medium">Contract</th>
                            <th className="text-right py-3 px-2 text-slate-300 font-medium">Price</th>
                            <th className="text-right py-3 px-2 text-slate-300 font-medium">Change</th>
                            <th className="text-right py-3 px-2 text-slate-300 font-medium hidden sm:table-cell">Volume</th>
                            <th className="text-right py-3 px-2 text-slate-300 font-medium hidden md:table-cell">Margin</th>
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
                                <div className="text-xs text-slate-400">{contract.name}</div>
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
                              <td className="text-right py-3 px-2 text-slate-300 hidden sm:table-cell">
                                {contract.volume.toLocaleString()}
                              </td>
                              <td className="text-right py-3 px-2 text-cyan-400 hidden md:table-cell">
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
                          <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/20 border border-indigo-700/40 p-3 rounded-lg">
                            <div className="text-indigo-400 text-xs font-medium">Exchange</div>
                            <div className="text-white font-semibold mt-1">{selectedContract.exchange}</div>
                          </div>
                          <div className="bg-gradient-to-br from-cyan-900/40 to-blue-900/20 border border-cyan-700/40 p-3 rounded-lg">
                            <div className="text-cyan-400 text-xs font-medium">Contract</div>
                            <div className="text-white font-semibold mt-1">{selectedContract.contract}</div>
                          </div>
                          <div className="bg-gradient-to-br from-violet-900/40 to-purple-900/20 border border-violet-700/40 p-3 rounded-lg">
                            <div className="text-violet-400 text-xs font-medium">Contract Size</div>
                            <div className="text-white font-semibold mt-1">{selectedContract.contract_size}</div>
                          </div>
                          <div className="bg-gradient-to-br from-emerald-900/40 to-green-900/20 border border-emerald-700/40 p-3 rounded-lg">
                            <div className="text-emerald-400 text-xs font-medium">Tick Size</div>
                            <div className="text-white font-semibold mt-1">{selectedContract.tick_size}</div>
                          </div>
                          <div className="bg-gradient-to-br from-amber-900/40 to-orange-900/20 border border-amber-700/40 p-3 rounded-lg">
                            <div className="text-amber-400 text-xs font-medium">Tick Value</div>
                            <div className="text-white font-semibold mt-1">{formatCurrency(selectedContract.tick_value)}</div>
                          </div>
                          <div className="bg-gradient-to-br from-rose-900/40 to-pink-900/20 border border-rose-700/40 p-3 rounded-lg">
                            <div className="text-rose-400 text-xs font-medium">Margin Req.</div>
                            <div className="text-white font-semibold mt-1">{selectedContract.margin_requirement}%</div>
                          </div>
                          <div className="bg-gradient-to-br from-teal-900/40 to-cyan-900/20 border border-teal-700/40 p-3 rounded-lg col-span-2">
                            <div className="text-teal-400 text-xs font-medium">Notional Value</div>
                            <div className="text-white font-semibold mt-1">{formatCurrency(selectedContract.notional_value)}</div>
                          </div>
                          <div className="bg-gradient-to-br from-blue-900/40 to-indigo-900/20 border border-blue-700/40 p-3 rounded-lg">
                            <div className="text-blue-400 text-xs font-medium">Open Interest</div>
                            <div className="text-white font-semibold mt-1">{selectedContract.open_interest.toLocaleString()}</div>
                          </div>
                          <div className="bg-gradient-to-br from-fuchsia-900/40 to-purple-900/20 border border-fuchsia-700/40 p-3 rounded-lg">
                            <div className="text-fuchsia-400 text-xs font-medium">Expiration</div>
                            <div className="text-white font-semibold mt-1">{selectedContract.expiration_date}</div>
                          </div>
                        </div>

                        {/* OHLC */}
                        <div className="border-t border-indigo-700/30 pt-4">
                          <div className="text-xs text-indigo-400 mb-3 font-medium">Today&apos;s Range</div>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/40 border border-slate-600/40 p-2 rounded-lg">
                              <span className="text-slate-400 text-xs">Open:</span>
                              <div className="text-white font-mono font-semibold">{formatPrice(selectedContract.open, selectedContract.symbol)}</div>
                            </div>
                            <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/40 border border-slate-600/40 p-2 rounded-lg">
                              <span className="text-slate-400 text-xs">Prev:</span>
                              <div className="text-white font-mono font-semibold">{formatPrice(selectedContract.previous_close, selectedContract.symbol)}</div>
                            </div>
                            <div className="bg-gradient-to-br from-emerald-900/40 to-green-900/20 border border-emerald-700/40 p-2 rounded-lg">
                              <span className="text-emerald-400 text-xs">High:</span>
                              <div className="text-emerald-400 font-mono font-semibold">{formatPrice(selectedContract.high, selectedContract.symbol)}</div>
                            </div>
                            <div className="bg-gradient-to-br from-red-900/40 to-rose-900/20 border border-red-700/40 p-2 rounded-lg">
                              <span className="text-red-400 text-xs">Low:</span>
                              <div className="text-red-400 font-mono font-semibold">{formatPrice(selectedContract.low, selectedContract.symbol)}</div>
                            </div>
                          </div>
                        </div>

                        {/* Trading Hours */}
                        <div className="border-t border-indigo-700/30 pt-4">
                          <div className="flex items-center gap-2 text-xs text-indigo-400 bg-indigo-900/30 border border-indigo-700/30 rounded-lg px-3 py-2">
                            <Clock className="w-3 h-3" />
                            {selectedContract.trading_hours}
                          </div>
                        </div>

                        {/* Order Entry Form */}
                        <div className="border-t border-indigo-500/30 pt-4 mt-4 bg-gradient-to-b from-indigo-500/5 to-transparent -mx-6 px-6 pb-2">
                          <div className="flex items-center gap-2 mb-4">
                            <div className="p-2 bg-indigo-500/20 rounded-lg">
                              <ShoppingCart className="w-4 h-4 text-indigo-400" />
                            </div>
                            <span className="text-sm font-semibold text-white">Place Order</span>
                            <Badge variant="outline" className="ml-auto text-xs border-indigo-500/50 text-indigo-300">
                              Virtual Trading
                            </Badge>
                          </div>

                          {orderSuccess && (
                            <div className="mb-3 p-3 bg-emerald-500/20 border border-emerald-500/50 rounded-lg text-emerald-300 text-sm flex items-center gap-2">
                              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                              {orderSuccess}
                            </div>
                          )}

                          {orderError && (
                            <div className="mb-3 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
                              {orderError}
                            </div>
                          )}

                          <div className="space-y-4">
                            {/* Buy/Sell Toggle */}
                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                variant={orderType === 'buy' ? 'default' : 'outline'}
                                className={orderType === 'buy'
                                  ? 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-semibold shadow-lg shadow-emerald-500/25'
                                  : 'border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10'}
                                onClick={() => setOrderType('buy')}
                              >
                                Buy Long
                              </Button>
                              <Button
                                variant={orderType === 'sell' ? 'default' : 'outline'}
                                className={orderType === 'sell'
                                  ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-semibold shadow-lg shadow-red-500/25'
                                  : 'border-red-500/50 text-red-400 hover:bg-red-500/10'}
                                onClick={() => setOrderType('sell')}
                              >
                                Sell Short
                              </Button>
                            </div>

                            {/* Quantity */}
                            <div>
                              <Label className="text-xs text-slate-300 font-medium">Number of Contracts</Label>
                              <Input
                                type="text"
                                inputMode="numeric"
                                value={orderQuantity}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === '' || /^\d*$/.test(val)) {
                                    setOrderQuantity(val);
                                  }
                                }}
                                onBlur={() => {
                                  const num = parseInt(orderQuantity);
                                  if (isNaN(num) || num < 1) {
                                    setOrderQuantity('1');
                                  }
                                }}
                                className="mt-1 bg-slate-900/50 border-slate-600 focus:border-indigo-500 text-white font-mono text-lg"
                                placeholder="1"
                              />
                            </div>

                            {/* Order Summary */}
                            <div className="bg-slate-900/60 border border-slate-700/50 p-4 rounded-lg text-sm space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-slate-400">Notional Value</span>
                                <span className="text-white font-mono">{formatCurrency(selectedContract.notional_value * (parseInt(orderQuantity) || 0))}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-400">Margin Required</span>
                                <span className="text-cyan-400 font-mono font-semibold">{formatCurrency(selectedContract.notional_value * (parseInt(orderQuantity) || 0) * (selectedContract.margin_requirement / 100))}</span>
                              </div>
                              <div className="flex justify-between items-center pt-2 border-t border-slate-700">
                                <span className="text-slate-400">Tick Value</span>
                                <span className="text-amber-400 font-mono">{formatCurrency(selectedContract.tick_value)} per tick</span>
                              </div>
                            </div>

                            {/* Submit Button */}
                            <Button
                              className={`w-full h-12 text-base font-semibold transition-all ${
                                orderType === 'buy'
                                  ? 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 shadow-lg shadow-emerald-500/30'
                                  : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 shadow-lg shadow-red-500/30'
                              }`}
                              onClick={handleSubmitOrder}
                              disabled={isSubmitting}
                            >
                              {isSubmitting ? (
                                <>
                                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                  Processing...
                                </>
                              ) : (
                                <>
                                  {orderType === 'buy' ? '🚀 Buy' : '📉 Sell'} {parseInt(orderQuantity) || 0} {selectedContract.symbol}
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Click on a contract to view details and trade</p>
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
