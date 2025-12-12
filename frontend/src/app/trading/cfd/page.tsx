'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import DashboardHeader from '@/components/DashboardHeader';
import { ArrowUp, ArrowDown, Clock, TrendingUp, AlertCircle, Scale, ShoppingCart, Loader2 } from 'lucide-react';

interface CFDInstrument {
  symbol: string;
  name: string;
  underlying_asset: string;
  asset_class: string;
  price: number;
  bid: number;
  ask: number;
  spread: number;
  spread_cost: number;
  change: number;
  change_percentage: number;
  open: number;
  high: number;
  low: number;
  previous_close: number;
  leverage: number;
  margin_requirement: number;
  margin_required_1_lot: number;
  pip_size: number;
  pip_value: number;
  min_trade_size: number;
  max_trade_size: number;
  swap_long: number;
  swap_short: number;
  trading_hours: string;
  last_updated: string;
}

const ASSET_CLASS_LABELS: Record<string, string> = {
  forex: 'Forex',
  index: 'Indices',
  commodity: 'Commodities',
  crypto: 'Crypto',
  stock: 'Stocks',
};

export default function CFDPage() {
  const [cfds, setCfds] = useState<CFDInstrument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAssetClass, setSelectedAssetClass] = useState<string>('all');
  const [selectedCFD, setSelectedCFD] = useState<CFDInstrument | null>(null);

  // Order state
  const [orderQuantity, setOrderQuantity] = useState<string>('1');
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [positionType, setPositionType] = useState<'long' | 'short'>('long');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);

  useEffect(() => {
    fetchCFDs();
    const interval = setInterval(fetchCFDs, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchCFDs = async () => {
    try {
      const response = await fetch('/api/market/cfd');
      if (!response.ok) throw new Error('Failed to fetch CFD data');
      const data = await response.json();
      setCfds(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const filteredCFDs = selectedAssetClass === 'all'
    ? cfds
    : cfds.filter(c => c.asset_class === selectedAssetClass);

  const assetClasses = ['all', ...new Set(cfds.map(c => c.asset_class))];

  const formatPrice = (price: number, pipSize: number) => {
    if (pipSize < 0.001) return price.toFixed(5);
    if (pipSize < 0.01) return price.toFixed(4);
    if (pipSize < 1) return price.toFixed(2);
    return price.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  };

  const handleSubmitOrder = async () => {
    const qty = parseFloat(orderQuantity);
    if (!selectedCFD || isNaN(qty) || qty <= 0) return;

    setIsSubmitting(true);
    setOrderError(null);
    setOrderSuccess(null);

    try {
      const response = await fetch('/api/market/cfd/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symbol: selectedCFD.symbol,
          name: selectedCFD.name,
          orderType,
          positionType,
          quantity: qty,
          price: orderType === 'buy' ? selectedCFD.ask : selectedCFD.bid,
          leverage: selectedCFD.leverage,
          pipValue: selectedCFD.pip_value,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to place order');
      }

      const price = orderType === 'buy' ? selectedCFD.ask : selectedCFD.bid;
      setOrderSuccess(`${orderType.toUpperCase()} ${qty} ${selectedCFD.symbol} @ ${formatPrice(price, selectedCFD.pip_size)} - ${data.message}`);
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
            <h1 className="text-2xl font-bold text-white">CFD Trading</h1>
            <p className="text-gray-400 text-sm mt-1">Contracts for Difference across forex, indices, commodities & more</p>
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

        {/* Asset Class Tabs */}
        <Tabs value={selectedAssetClass} onValueChange={setSelectedAssetClass}>
          <TabsList className="flex flex-wrap h-auto gap-1">
            {assetClasses.map(ac => (
              <TabsTrigger key={ac} value={ac} className="text-xs sm:text-sm">
                {ac === 'all' ? 'All CFDs' : ASSET_CLASS_LABELS[ac] || ac}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedAssetClass} className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* CFD List */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {selectedAssetClass === 'all' ? 'All Instruments' : ASSET_CLASS_LABELS[selectedAssetClass]}
                    </CardTitle>
                    <CardDescription>
                      {filteredCFDs.length} instruments available
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-700">
                            <th className="text-left py-3 px-2 text-gray-400 font-medium">Instrument</th>
                            <th className="text-right py-3 px-2 text-gray-400 font-medium">Bid</th>
                            <th className="text-right py-3 px-2 text-gray-400 font-medium">Ask</th>
                            <th className="text-right py-3 px-2 text-gray-400 font-medium">Change</th>
                            <th className="text-right py-3 px-2 text-gray-400 font-medium hidden sm:table-cell">Spread</th>
                            <th className="text-right py-3 px-2 text-gray-400 font-medium hidden md:table-cell">Leverage</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredCFDs.map((cfd) => (
                            <tr
                              key={cfd.symbol}
                              className={`border-b border-slate-800 hover:bg-slate-800/50 cursor-pointer transition-colors ${
                                selectedCFD?.symbol === cfd.symbol ? 'bg-slate-800/50' : ''
                              }`}
                              onClick={() => setSelectedCFD(cfd)}
                            >
                              <td className="py-3 px-2">
                                <div className="font-medium text-white">{cfd.symbol}</div>
                                <div className="text-xs text-gray-400">{cfd.name}</div>
                              </td>
                              <td className="text-right py-3 px-2 font-mono text-red-400">
                                {formatPrice(cfd.bid, cfd.pip_size)}
                              </td>
                              <td className="text-right py-3 px-2 font-mono text-green-400">
                                {formatPrice(cfd.ask, cfd.pip_size)}
                              </td>
                              <td className="text-right py-3 px-2">
                                <div className={`flex items-center justify-end gap-1 ${
                                  cfd.change >= 0 ? 'text-green-400' : 'text-red-400'
                                }`}>
                                  {cfd.change >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                                  <span className="font-mono">{cfd.change_percentage.toFixed(2)}%</span>
                                </div>
                              </td>
                              <td className="text-right py-3 px-2 text-gray-300 hidden sm:table-cell">
                                {cfd.spread} pips
                              </td>
                              <td className="text-right py-3 px-2 text-gray-300 hidden md:table-cell">
                                {cfd.leverage}:1
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* CFD Details */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Instrument Details</CardTitle>
                    <CardDescription>
                      {selectedCFD ? selectedCFD.name : 'Select an instrument'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedCFD ? (
                      <div className="space-y-4">
                        {/* Bid/Ask Display */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="text-center py-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                            <div className="text-xs text-red-400 mb-1">SELL</div>
                            <div className="text-2xl font-bold text-red-400 font-mono">
                              {formatPrice(selectedCFD.bid, selectedCFD.pip_size)}
                            </div>
                          </div>
                          <div className="text-center py-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                            <div className="text-xs text-green-400 mb-1">BUY</div>
                            <div className="text-2xl font-bold text-green-400 font-mono">
                              {formatPrice(selectedCFD.ask, selectedCFD.pip_size)}
                            </div>
                          </div>
                        </div>

                        {/* Spread indicator */}
                        <div className="text-center text-sm text-gray-400">
                          Spread: {selectedCFD.spread} pips ({formatCurrency(selectedCFD.spread_cost)})
                        </div>

                        {/* Change */}
                        <div className={`text-center py-2 rounded ${
                          selectedCFD.change >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'
                        }`}>
                          <div className={`flex items-center justify-center gap-2 ${
                            selectedCFD.change >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {selectedCFD.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                            <span className="font-medium">
                              {formatPrice(selectedCFD.change, selectedCFD.pip_size)} ({selectedCFD.change_percentage.toFixed(2)}%)
                            </span>
                          </div>
                        </div>

                        {/* Trading Specs */}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/10 border border-indigo-500/30 p-3 rounded-lg">
                            <div className="text-indigo-300 text-xs font-medium">Leverage</div>
                            <div className="text-white font-semibold flex items-center gap-1 mt-1">
                              <Scale className="w-3 h-3 text-indigo-400" />
                              {selectedCFD.leverage}:1
                            </div>
                          </div>
                          <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-cyan-500/30 p-3 rounded-lg">
                            <div className="text-cyan-300 text-xs font-medium">Margin Req.</div>
                            <div className="text-white font-semibold mt-1">{selectedCFD.margin_requirement}%</div>
                          </div>
                          <div className="bg-gradient-to-br from-violet-500/20 to-purple-500/10 border border-violet-500/30 p-3 rounded-lg">
                            <div className="text-violet-300 text-xs font-medium">Pip Size</div>
                            <div className="text-white font-semibold mt-1">{selectedCFD.pip_size}</div>
                          </div>
                          <div className="bg-gradient-to-br from-emerald-500/20 to-green-500/10 border border-emerald-500/30 p-3 rounded-lg">
                            <div className="text-emerald-300 text-xs font-medium">Pip Value</div>
                            <div className="text-white font-semibold mt-1">{formatCurrency(selectedCFD.pip_value)}</div>
                          </div>
                          <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/30 p-3 rounded-lg">
                            <div className="text-amber-300 text-xs font-medium">Min Size</div>
                            <div className="text-white font-semibold mt-1">{selectedCFD.min_trade_size}</div>
                          </div>
                          <div className="bg-gradient-to-br from-rose-500/20 to-pink-500/10 border border-rose-500/30 p-3 rounded-lg">
                            <div className="text-rose-300 text-xs font-medium">Max Size</div>
                            <div className="text-white font-semibold mt-1">{selectedCFD.max_trade_size}</div>
                          </div>
                        </div>

                        {/* Swap Rates */}
                        <div className="border-t border-indigo-500/20 pt-4">
                          <div className="text-xs text-indigo-300 mb-2 font-medium">Overnight Swap Rates</div>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className={`p-3 rounded-lg border ${selectedCFD.swap_long >= 0 ? 'bg-gradient-to-br from-emerald-500/20 to-green-500/10 border-emerald-500/30' : 'bg-gradient-to-br from-red-500/20 to-rose-500/10 border-red-500/30'}`}>
                              <div className={`text-xs font-medium ${selectedCFD.swap_long >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>Long</div>
                              <div className={`font-semibold mt-1 ${selectedCFD.swap_long >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {selectedCFD.swap_long > 0 ? '+' : ''}{selectedCFD.swap_long}
                              </div>
                            </div>
                            <div className={`p-3 rounded-lg border ${selectedCFD.swap_short >= 0 ? 'bg-gradient-to-br from-emerald-500/20 to-green-500/10 border-emerald-500/30' : 'bg-gradient-to-br from-red-500/20 to-rose-500/10 border-red-500/30'}`}>
                              <div className={`text-xs font-medium ${selectedCFD.swap_short >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>Short</div>
                              <div className={`font-semibold mt-1 ${selectedCFD.swap_short >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {selectedCFD.swap_short > 0 ? '+' : ''}{selectedCFD.swap_short}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* OHLC */}
                        <div className="border-t border-indigo-500/20 pt-4">
                          <div className="text-xs text-indigo-300 mb-3 font-medium">Today&apos;s Range</div>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="bg-gradient-to-br from-slate-500/20 to-slate-600/10 border border-slate-500/30 p-2 rounded-lg">
                              <span className="text-slate-400 text-xs">Open:</span>
                              <div className="text-white font-mono font-semibold">{formatPrice(selectedCFD.open, selectedCFD.pip_size)}</div>
                            </div>
                            <div className="bg-gradient-to-br from-slate-500/20 to-slate-600/10 border border-slate-500/30 p-2 rounded-lg">
                              <span className="text-slate-400 text-xs">Prev:</span>
                              <div className="text-white font-mono font-semibold">{formatPrice(selectedCFD.previous_close, selectedCFD.pip_size)}</div>
                            </div>
                            <div className="bg-gradient-to-br from-emerald-500/20 to-green-500/10 border border-emerald-500/30 p-2 rounded-lg">
                              <span className="text-emerald-400 text-xs">High:</span>
                              <div className="text-emerald-300 font-mono font-semibold">{formatPrice(selectedCFD.high, selectedCFD.pip_size)}</div>
                            </div>
                            <div className="bg-gradient-to-br from-red-500/20 to-rose-500/10 border border-red-500/30 p-2 rounded-lg">
                              <span className="text-red-400 text-xs">Low:</span>
                              <div className="text-red-300 font-mono font-semibold">{formatPrice(selectedCFD.low, selectedCFD.pip_size)}</div>
                            </div>
                          </div>
                        </div>

                        {/* Trading Hours */}
                        <div className="border-t border-indigo-500/20 pt-4">
                          <div className="flex items-center gap-2 text-xs text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-3 py-2">
                            <Clock className="w-3 h-3" />
                            {selectedCFD.trading_hours}
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
                                onClick={() => { setOrderType('buy'); setPositionType('long'); }}
                              >
                                Buy (Long)
                              </Button>
                              <Button
                                variant={orderType === 'sell' ? 'default' : 'outline'}
                                className={orderType === 'sell'
                                  ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-semibold shadow-lg shadow-red-500/25'
                                  : 'border-red-500/50 text-red-400 hover:bg-red-500/10'}
                                onClick={() => { setOrderType('sell'); setPositionType('short'); }}
                              >
                                Sell (Short)
                              </Button>
                            </div>

                            {/* Quantity (Lots) */}
                            <div>
                              <Label className="text-xs text-slate-300 font-medium">Lot Size</Label>
                              <Input
                                type="text"
                                inputMode="decimal"
                                value={orderQuantity}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                    setOrderQuantity(val);
                                  }
                                }}
                                onBlur={() => {
                                  const num = parseFloat(orderQuantity);
                                  if (isNaN(num) || num < selectedCFD.min_trade_size) {
                                    setOrderQuantity(selectedCFD.min_trade_size.toString());
                                  } else if (num > selectedCFD.max_trade_size) {
                                    setOrderQuantity(selectedCFD.max_trade_size.toString());
                                  }
                                }}
                                className="mt-1 bg-slate-900/50 border-slate-600 focus:border-indigo-500 text-white font-mono text-lg"
                                placeholder={selectedCFD.min_trade_size.toString()}
                              />
                              <div className="text-xs text-slate-400 mt-1">
                                Min: {selectedCFD.min_trade_size} | Max: {selectedCFD.max_trade_size}
                              </div>
                            </div>

                            {/* Order Summary */}
                            <div className="bg-slate-900/60 border border-slate-700/50 p-4 rounded-lg text-sm space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-slate-400">Entry Price</span>
                                <span className={`font-mono font-semibold ${orderType === 'buy' ? 'text-emerald-400' : 'text-red-400'}`}>
                                  {formatPrice(orderType === 'buy' ? selectedCFD.ask : selectedCFD.bid, selectedCFD.pip_size)}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-400">Position Value</span>
                                <span className="text-white font-mono">{formatCurrency((orderType === 'buy' ? selectedCFD.ask : selectedCFD.bid) * (parseFloat(orderQuantity) || 0) * 100000)}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-400">Margin Required</span>
                                <span className="text-cyan-400 font-mono font-semibold">{formatCurrency((orderType === 'buy' ? selectedCFD.ask : selectedCFD.bid) * (parseFloat(orderQuantity) || 0) * 100000 / selectedCFD.leverage)}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-400">Leverage</span>
                                <span className="text-indigo-400 font-semibold">{selectedCFD.leverage}:1</span>
                              </div>
                              <div className="flex justify-between items-center pt-2 border-t border-slate-700">
                                <span className="text-slate-400">Spread Cost</span>
                                <span className="text-amber-400 font-mono">{formatCurrency(selectedCFD.spread_cost * (parseFloat(orderQuantity) || 0))}</span>
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
                                  {orderType === 'buy' ? '🚀 Buy' : '📉 Sell'} {parseFloat(orderQuantity) || 0} {selectedCFD.symbol}
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <Scale className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Click on an instrument to view details and trade</p>
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
