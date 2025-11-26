'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp, TrendingDown, BarChart3, Signal, Bell, Target } from 'lucide-react';
import { useLiveMarketData } from '@/hooks/useLiveMarketData';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface PriceData {
  timestamp: number;
  price: number;
  volume: number;
}

interface TradingSignal {
  id: string;
  type: 'buy' | 'sell' | 'neutral';
  strength: number;
  price: number;
  message: string;
  changePercent: number;
  timestamp: number;
}

interface TooltipContext {
  parsed: {
    y: number;
  };
}

interface TradingChartProps {
  symbol?: string;
}

export default function TradingChart({ symbol: propSymbol }: TradingChartProps = {}) {
  const [symbol, setSymbol] = useState(propSymbol || 'AAPL');
  const [timeframe, setTimeframe] = useState('1M');
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [signals, setSignals] = useState<TradingSignal[]>([]);
  const [currentPrice, setCurrentPrice] = useState(182.45);
  const [priceChange, setPriceChange] = useState(0);
  const [priceChangePercent, setPriceChangePercent] = useState(0);
  const [isLive, setIsLive] = useState(true);

  // Use real market data from live API
  const { data: marketData, loading: loadingMarket } = useLiveMarketData(symbol);

  useEffect(() => {
    if (propSymbol && propSymbol !== symbol) {
      setSymbol(propSymbol);
      setPriceData([]);
      setSignals([]);
    }
  }, [propSymbol, symbol]);

  // Update price data when market data changes
  useEffect(() => {
    if (marketData) {
      setCurrentPrice(marketData.price);
      setPriceChange(marketData.change);
      setPriceChangePercent(marketData.changePercent);

      // Add new price data point
      const newDataPoint: PriceData = {
        timestamp: Date.now(),
        price: marketData.price,
        volume: marketData.volume
      };

      setPriceData(prev => {
        const updated = [...prev.slice(-99), newDataPoint];
        return updated;
      });

      // Generate trading signal based on real data
      if (Math.abs(marketData.changePercent) > 1) {
        const signal: TradingSignal = {
          id: Math.random().toString(36).substr(2, 9),
          type: marketData.changePercent > 0 ? 'buy' : 'sell',
          strength: Math.min(Math.abs(marketData.changePercent) * 50, 100),
          price: marketData.price,
          message: marketData.changePercent > 0
            ? 'Strong upward momentum - Consider call options'
            : 'Bearish pressure detected - Put options recommended',
          changePercent: marketData.changePercent,
          timestamp: Date.now()
        };
        setSignals(prev => [signal, ...prev.slice(0, 4)]);
      }
    }
  }, [marketData]);

  // Initialize with historical data
  useEffect(() => {
    if (marketData && priceData.length === 0) {
      // Generate some initial historical data points
      const now = Date.now();
      const basePrice = marketData.price;
      const historical: PriceData[] = Array.from({ length: 50 }, (_, i) => ({
        timestamp: now - (50 - i) * 60000, // 1 minute intervals
        price: basePrice + (Math.random() - 0.5) * 5,
        volume: Math.floor(Math.random() * 1000000) + 500000
      }));

      setPriceData(historical);
    }
  }, [marketData, priceData.length]);

  // Toggle live data
  const toggleLiveData = () => {
    setIsLive(!isLive);
  };

  // Filter out invalid price data and calculate bounds
  const validPriceData = priceData.filter(d => d.price > 0 && isFinite(d.price));
  const prices = validPriceData.map(d => d.price);
  const minPrice = prices.length > 0 ? Math.min(...prices) : currentPrice * 0.99;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : currentPrice * 1.01;
  const priceRange = maxPrice - minPrice;
  const padding = Math.max(priceRange * 0.1, 0.5); // At least $0.50 padding

  // Chart configuration
  const chartData = {
    labels: validPriceData.map(d => new Date(d.timestamp)),
    datasets: [
      {
        label: `${symbol} Price`,
        data: validPriceData.map(d => d.price),
        borderColor: priceChange >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)',
        backgroundColor: priceChange >= 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: (context: TooltipContext) => `Price: $${context.parsed.y.toFixed(2)}`,
        },
      },
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          displayFormats: {
            minute: 'HH:mm',
            hour: 'HH:mm',
          },
        },
        grid: {
          display: false,
        },
      },
      y: {
        beginAtZero: false,
        suggestedMin: minPrice - padding,
        suggestedMax: maxPrice + padding,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          callback: (value: string | number) => `$${Number(value).toFixed(2)}`,
        },
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
  };
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Live Trading Chart
            {isLive && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
          </CardTitle>
          <CardDescription>Real-time price data with AI-powered trading signals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Chart Controls */}
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                <Button 
                  variant={timeframe === '1D' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setTimeframe('1D')}
                >
                  1D
                </Button>
                <Button 
                  variant={timeframe === '5D' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setTimeframe('5D')}
                >
                  5D
                </Button>
                <Button 
                  variant={timeframe === '1M' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setTimeframe('1M')}
                >
                  1M
                </Button>
                <Button 
                  variant={timeframe === '3M' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setTimeframe('3M')}
                >
                  3M
                </Button>
                <Button 
                  variant={timeframe === '1Y' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setTimeframe('1Y')}
                >
                  1Y
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={toggleLiveData}
                >
                  {isLive ? 'Pause' : 'Resume'} Live
                </Button>
                <div className="flex items-center space-x-2 ml-4">
                  <Signal className="h-3 w-3" />
                  <span className="text-sm">{!loadingMarket ? 'Live Data' : 'Connecting...'}</span>
                  {!loadingMarket && <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                  className="px-2 py-1 border rounded text-sm w-20"
                  placeholder="Symbol"
                />
                <Badge variant="outline">{symbol}</Badge>
                <Badge variant="default">${currentPrice.toFixed(2)}</Badge>
                <Badge variant="secondary" className={priceChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {priceChange >= 0 ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)} ({priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)
                </Badge>
              </div>
            </div>

            {/* Live Chart */}
            <div className="h-96 bg-white rounded-lg border p-4">
              {validPriceData.length > 0 ? (
                <Line data={chartData} options={chartOptions} />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Loading chart data...</p>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Open</div>
                <div className="font-medium">${marketData?.open?.toFixed(2) || '180.30'}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">High</div>
                <div className="font-medium">${marketData?.high?.toFixed(2) || (priceData.length > 0 ? Math.max(...priceData.map(d => d.price)).toFixed(2) : '185.50')}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Low</div>
                <div className="font-medium">${marketData?.low?.toFixed(2) || (priceData.length > 0 ? Math.min(...priceData.map(d => d.price)).toFixed(2) : '178.20')}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Volume</div>
                <div className="font-medium">{marketData?.volume ? (marketData.volume / 1000000).toFixed(1) : '45.2'}M</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Trading Signals */}
      {signals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Live Trading Signals
              <Badge variant="secondary">{signals.length}</Badge>
            </CardTitle>
            <CardDescription>AI-powered trading opportunities based on real-time analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {signals.map((signal) => (
                <Alert key={signal.id} className={`border-l-4 ${
                  signal.type === 'buy' ? 'border-l-green-500' : 
                  signal.type === 'sell' ? 'border-l-red-500' : 'border-l-yellow-500'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {signal.type === 'buy' ? (
                        <TrendingUp className="h-4 w-4 text-green-600 mt-0.5" />
                      ) : signal.type === 'sell' ? (
                        <TrendingDown className="h-4 w-4 text-red-600 mt-0.5" />
                      ) : (
                        <Bell className="h-4 w-4 text-yellow-600 mt-0.5" />
                      )}
                      <div>
                        <AlertDescription className="font-medium">
                          {signal.message}
                        </AlertDescription>
                        <div className="text-sm text-muted-foreground mt-1">
                          Signal strength: {signal.strength.toFixed(0)}% | Price: ${signal.price.toFixed(2)} | 
                          {new Date(signal.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                    <Badge variant={signal.type === 'buy' ? 'default' : signal.type === 'sell' ? 'destructive' : 'secondary'}>
                      {signal.type.toUpperCase()}
                    </Badge>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}