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
  const [orderQuantity, setOrderQuantity] = useState<number>(1);
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
    if (!selectedCFD || orderQuantity <= 0) return;

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
          quantity: orderQuantity,
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
      setOrderSuccess(`${orderType.toUpperCase()} ${orderQuantity} ${selectedCFD.symbol} @ ${formatPrice(price, selectedCFD.pip_size)} - ${data.message}`);
      setOrderQuantity(1);
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
                          <div className="bg-slate-800/30 p-3 rounded">
                            <div className="text-gray-400 text-xs">Leverage</div>
                            <div className="text-white font-medium flex items-center gap-1">
                              <Scale className="w-3 h-3" />
                              {selectedCFD.leverage}:1
                            </div>
                          </div>
                          <div className="bg-slate-800/30 p-3 rounded">
                            <div className="text-gray-400 text-xs">Margin Req.</div>
                            <div className="text-white font-medium">{selectedCFD.margin_requirement}%</div>
                          </div>
                          <div className="bg-slate-800/30 p-3 rounded">
                            <div className="text-gray-400 text-xs">Pip Size</div>
                            <div className="text-white font-medium">{selectedCFD.pip_size}</div>
                          </div>
                          <div className="bg-slate-800/30 p-3 rounded">
                            <div className="text-gray-400 text-xs">Pip Value</div>
                            <div className="text-white font-medium">{formatCurrency(selectedCFD.pip_value)}</div>
                          </div>
                          <div className="bg-slate-800/30 p-3 rounded">
                            <div className="text-gray-400 text-xs">Min Size</div>
                            <div className="text-white font-medium">{selectedCFD.min_trade_size}</div>
                          </div>
                          <div className="bg-slate-800/30 p-3 rounded">
                            <div className="text-gray-400 text-xs">Max Size</div>
                            <div className="text-white font-medium">{selectedCFD.max_trade_size}</div>
                          </div>
                        </div>

                        {/* Swap Rates */}
                        <div className="border-t border-slate-700 pt-4">
                          <div className="text-xs text-gray-400 mb-2">Overnight Swap Rates</div>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="bg-slate-800/30 p-3 rounded">
                              <div className="text-gray-400 text-xs">Long</div>
                              <div className={selectedCFD.swap_long >= 0 ? 'text-green-400' : 'text-red-400'}>
                                {selectedCFD.swap_long > 0 ? '+' : ''}{selectedCFD.swap_long}
                              </div>
                            </div>
                            <div className="bg-slate-800/30 p-3 rounded">
                              <div className="text-gray-400 text-xs">Short</div>
                              <div className={selectedCFD.swap_short >= 0 ? 'text-green-400' : 'text-red-400'}>
                                {selectedCFD.swap_short > 0 ? '+' : ''}{selectedCFD.swap_short}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* OHLC */}
                        <div className="border-t border-slate-700 pt-4">
                          <div className="text-xs text-gray-400 mb-2">Today&apos;s Range</div>
                          <div className="flex justify-between text-sm">
                            <div>
                              <span className="text-gray-400">Open:</span>
                              <span className="text-white ml-2 font-mono">{formatPrice(selectedCFD.open, selectedCFD.pip_size)}</span>
                            </div>
                            <div>
                              <span className="text-gray-400">Prev:</span>
                              <span className="text-white ml-2 font-mono">{formatPrice(selectedCFD.previous_close, selectedCFD.pip_size)}</span>
                            </div>
                          </div>
                          <div className="flex justify-between text-sm mt-2">
                            <div>
                              <span className="text-green-400">High:</span>
                              <span className="text-white ml-2 font-mono">{formatPrice(selectedCFD.high, selectedCFD.pip_size)}</span>
                            </div>
                            <div>
                              <span className="text-red-400">Low:</span>
                              <span className="text-white ml-2 font-mono">{formatPrice(selectedCFD.low, selectedCFD.pip_size)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Trading Hours */}
                        <div className="border-t border-slate-700 pt-4">
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <Clock className="w-3 h-3" />
                            {selectedCFD.trading_hours}
                          </div>
                        </div>

                        {/* Order Entry Form */}
                        <div className="border-t border-slate-700 pt-4 mt-4">
                          <div className="flex items-center gap-2 mb-3">
                            <ShoppingCart className="w-4 h-4 text-indigo-400" />
                            <span className="text-sm font-medium text-white">Place Order</span>
                          </div>

                          {orderSuccess && (
                            <div className="mb-3 p-2 bg-green-500/10 border border-green-500/30 rounded text-green-400 text-xs">
                              {orderSuccess}
                            </div>
                          )}

                          {orderError && (
                            <div className="mb-3 p-2 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-xs">
                              {orderError}
                            </div>
                          )}

                          <div className="space-y-3">
                            {/* Buy/Sell Toggle */}
                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                variant={orderType === 'buy' ? 'default' : 'outline'}
                                className={orderType === 'buy' ? 'bg-green-600 hover:bg-green-700' : ''}
                                onClick={() => { setOrderType('buy'); setPositionType('long'); }}
                              >
                                Buy (Long)
                              </Button>
                              <Button
                                variant={orderType === 'sell' ? 'default' : 'outline'}
                                className={orderType === 'sell' ? 'bg-red-600 hover:bg-red-700' : ''}
                                onClick={() => { setOrderType('sell'); setPositionType('short'); }}
                              >
                                Sell (Short)
                              </Button>
                            </div>

                            {/* Quantity (Lots) */}
                            <div>
                              <Label className="text-xs text-gray-400">Lots</Label>
                              <Input
                                type="number"
                                min={selectedCFD.min_trade_size}
                                max={selectedCFD.max_trade_size}
                                step={0.01}
                                value={orderQuantity}
                                onChange={(e) => setOrderQuantity(Math.max(selectedCFD.min_trade_size, parseFloat(e.target.value) || selectedCFD.min_trade_size))}
                                className="mt-1"
                              />
                              <div className="text-xs text-gray-500 mt-1">
                                Min: {selectedCFD.min_trade_size} | Max: {selectedCFD.max_trade_size}
                              </div>
                            </div>

                            {/* Order Summary */}
                            <div className="bg-slate-800/50 p-3 rounded text-xs space-y-1">
                              <div className="flex justify-between">
                                <span className="text-gray-400">Entry Price:</span>
                                <span className={orderType === 'buy' ? 'text-green-400' : 'text-red-400'}>
                                  {formatPrice(orderType === 'buy' ? selectedCFD.ask : selectedCFD.bid, selectedCFD.pip_size)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Position Value:</span>
                                <span className="text-white">{formatCurrency((orderType === 'buy' ? selectedCFD.ask : selectedCFD.bid) * orderQuantity * 100000)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Margin Required:</span>
                                <span className="text-white">{formatCurrency((orderType === 'buy' ? selectedCFD.ask : selectedCFD.bid) * orderQuantity * 100000 / selectedCFD.leverage)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Leverage:</span>
                                <span className="text-indigo-400">{selectedCFD.leverage}:1</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-400">Spread Cost:</span>
                                <span className="text-yellow-400">{formatCurrency(selectedCFD.spread_cost * orderQuantity)}</span>
                              </div>
                            </div>

                            {/* Submit Button */}
                            <Button
                              className={`w-full ${orderType === 'buy' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                              onClick={handleSubmitOrder}
                              disabled={isSubmitting}
                            >
                              {isSubmitting ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  Processing...
                                </>
                              ) : (
                                <>
                                  {orderType === 'buy' ? 'Buy' : 'Sell'} {orderQuantity} {selectedCFD.symbol}
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
