'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import DashboardHeader from '@/components/DashboardHeader';
import { ArrowUp, ArrowDown, Clock, TrendingUp, AlertCircle, Coins, RefreshCw } from 'lucide-react';

interface CryptoAsset {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number | null;
  ath: number;
  ath_change_percentage: number;
  image: string;
  last_updated: string;
}

export default function CryptoPage() {
  const [cryptos, setCryptos] = useState<CryptoAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoAsset | null>(null);
  const [view, setView] = useState<'all' | 'top10' | 'gainers' | 'losers'>('all');

  useEffect(() => {
    fetchCryptos();
    const interval = setInterval(fetchCryptos, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchCryptos = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      const response = await fetch('/api/market/crypto?type=top&limit=50');
      if (!response.ok) throw new Error('Failed to fetch crypto data');
      const data = await response.json();
      setCryptos(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getFilteredCryptos = () => {
    switch (view) {
      case 'top10':
        return cryptos.slice(0, 10);
      case 'gainers':
        return [...cryptos].sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h).slice(0, 15);
      case 'losers':
        return [...cryptos].sort((a, b) => a.price_change_percentage_24h - b.price_change_percentage_24h).slice(0, 15);
      default:
        return cryptos;
    }
  };

  const filteredCryptos = getFilteredCryptos();

  const formatPrice = (price: number) => {
    if (price >= 1000) return price.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
    if (price >= 1) return price.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (price >= 0.01) return price.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 4, maximumFractionDigits: 4 });
    return price.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 6, maximumFractionDigits: 6 });
  };

  const formatLargeNumber = (num: number) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toLocaleString()}`;
  };

  const formatSupply = (num: number | null) => {
    if (!num) return 'N/A';
    if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    return num.toLocaleString();
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
            <h1 className="text-2xl font-bold text-white">Crypto Markets</h1>
            <p className="text-gray-400 text-sm mt-1">Real-time cryptocurrency prices powered by CoinGecko</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchCryptos(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <Badge variant="outline" className="w-fit">
              <Coins className="w-3 h-3 mr-1" />
              Live Data
            </Badge>
          </div>
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

        {/* View Tabs */}
        <Tabs value={view} onValueChange={(v) => setView(v as typeof view)}>
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="all" className="text-xs sm:text-sm">All Crypto</TabsTrigger>
            <TabsTrigger value="top10" className="text-xs sm:text-sm">Top 10</TabsTrigger>
            <TabsTrigger value="gainers" className="text-xs sm:text-sm text-green-400">Top Gainers</TabsTrigger>
            <TabsTrigger value="losers" className="text-xs sm:text-sm text-red-400">Top Losers</TabsTrigger>
          </TabsList>

          <TabsContent value={view} className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Crypto List */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {view === 'all' && 'All Cryptocurrencies'}
                      {view === 'top10' && 'Top 10 by Market Cap'}
                      {view === 'gainers' && 'Top Gainers (24h)'}
                      {view === 'losers' && 'Top Losers (24h)'}
                    </CardTitle>
                    <CardDescription>
                      {filteredCryptos.length} cryptocurrencies
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-700">
                            <th className="text-left py-3 px-2 text-gray-400 font-medium">#</th>
                            <th className="text-left py-3 px-2 text-gray-400 font-medium">Coin</th>
                            <th className="text-right py-3 px-2 text-gray-400 font-medium">Price</th>
                            <th className="text-right py-3 px-2 text-gray-400 font-medium">24h %</th>
                            <th className="text-right py-3 px-2 text-gray-400 font-medium hidden sm:table-cell">Market Cap</th>
                            <th className="text-right py-3 px-2 text-gray-400 font-medium hidden md:table-cell">Volume</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredCryptos.map((crypto) => (
                            <tr
                              key={crypto.id}
                              className={`border-b border-slate-800 hover:bg-slate-800/50 cursor-pointer transition-colors ${
                                selectedCrypto?.id === crypto.id ? 'bg-slate-800/50' : ''
                              }`}
                              onClick={() => setSelectedCrypto(crypto)}
                            >
                              <td className="py-3 px-2 text-gray-400">{crypto.market_cap_rank}</td>
                              <td className="py-3 px-2">
                                <div className="flex items-center gap-2">
                                  <img src={crypto.image} alt={crypto.name} className="w-6 h-6 rounded-full" />
                                  <div>
                                    <div className="font-medium text-white">{crypto.symbol.toUpperCase()}</div>
                                    <div className="text-xs text-gray-400 hidden sm:block">{crypto.name}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="text-right py-3 px-2 font-mono text-white">
                                {formatPrice(crypto.current_price)}
                              </td>
                              <td className="text-right py-3 px-2">
                                <div className={`flex items-center justify-end gap-1 ${
                                  crypto.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'
                                }`}>
                                  {crypto.price_change_percentage_24h >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                                  <span className="font-mono">{Math.abs(crypto.price_change_percentage_24h).toFixed(2)}%</span>
                                </div>
                              </td>
                              <td className="text-right py-3 px-2 text-gray-300 hidden sm:table-cell">
                                {formatLargeNumber(crypto.market_cap)}
                              </td>
                              <td className="text-right py-3 px-2 text-gray-300 hidden md:table-cell">
                                {formatLargeNumber(crypto.total_volume)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Crypto Details */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Coin Details</CardTitle>
                    <CardDescription>
                      {selectedCrypto ? selectedCrypto.name : 'Select a cryptocurrency'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {selectedCrypto ? (
                      <div className="space-y-4">
                        {/* Coin Header */}
                        <div className="flex items-center gap-3 pb-4 border-b border-slate-700">
                          <img src={selectedCrypto.image} alt={selectedCrypto.name} className="w-12 h-12 rounded-full" />
                          <div>
                            <div className="font-bold text-white text-lg">{selectedCrypto.name}</div>
                            <div className="text-gray-400">{selectedCrypto.symbol.toUpperCase()}</div>
                          </div>
                          <Badge className="ml-auto">#{selectedCrypto.market_cap_rank}</Badge>
                        </div>

                        {/* Price Display */}
                        <div className="text-center py-4 bg-slate-800/50 rounded-lg">
                          <div className="text-3xl font-bold text-white font-mono">
                            {formatPrice(selectedCrypto.current_price)}
                          </div>
                          <div className={`flex items-center justify-center gap-1 mt-1 ${
                            selectedCrypto.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {selectedCrypto.price_change_percentage_24h >= 0 ? <TrendingUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                            <span>
                              {formatPrice(selectedCrypto.price_change_24h)} ({selectedCrypto.price_change_percentage_24h.toFixed(2)}%)
                            </span>
                          </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="bg-slate-800/30 p-3 rounded">
                            <div className="text-gray-400 text-xs">Market Cap</div>
                            <div className="text-white font-medium">{formatLargeNumber(selectedCrypto.market_cap)}</div>
                          </div>
                          <div className="bg-slate-800/30 p-3 rounded">
                            <div className="text-gray-400 text-xs">24h Volume</div>
                            <div className="text-white font-medium">{formatLargeNumber(selectedCrypto.total_volume)}</div>
                          </div>
                          <div className="bg-slate-800/30 p-3 rounded">
                            <div className="text-gray-400 text-xs">Circulating</div>
                            <div className="text-white font-medium">{formatSupply(selectedCrypto.circulating_supply)}</div>
                          </div>
                          <div className="bg-slate-800/30 p-3 rounded">
                            <div className="text-gray-400 text-xs">Total Supply</div>
                            <div className="text-white font-medium">{formatSupply(selectedCrypto.total_supply)}</div>
                          </div>
                        </div>

                        {/* 24h Range */}
                        <div className="border-t border-slate-700 pt-4">
                          <div className="text-xs text-gray-400 mb-2">24h Range</div>
                          <div className="flex justify-between text-sm">
                            <div>
                              <span className="text-red-400">Low:</span>
                              <span className="text-white ml-2 font-mono">{formatPrice(selectedCrypto.low_24h)}</span>
                            </div>
                            <div>
                              <span className="text-green-400">High:</span>
                              <span className="text-white ml-2 font-mono">{formatPrice(selectedCrypto.high_24h)}</span>
                            </div>
                          </div>
                          {/* Price bar */}
                          <div className="mt-2 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                              style={{
                                width: `${Math.min(100, Math.max(0,
                                  ((selectedCrypto.current_price - selectedCrypto.low_24h) /
                                   (selectedCrypto.high_24h - selectedCrypto.low_24h)) * 100
                                ))}%`
                              }}
                            />
                          </div>
                        </div>

                        {/* ATH */}
                        <div className="border-t border-slate-700 pt-4">
                          <div className="text-xs text-gray-400 mb-2">All-Time High</div>
                          <div className="flex justify-between items-center">
                            <span className="text-white font-mono">{formatPrice(selectedCrypto.ath)}</span>
                            <span className={`text-sm ${selectedCrypto.ath_change_percentage >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                              {selectedCrypto.ath_change_percentage.toFixed(1)}% from ATH
                            </span>
                          </div>
                        </div>

                        {/* Last Updated */}
                        <div className="border-t border-slate-700 pt-4">
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <Clock className="w-3 h-3" />
                            Updated: {new Date(selectedCrypto.last_updated).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-400">
                        <Coins className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>Click on a cryptocurrency to view details</p>
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
