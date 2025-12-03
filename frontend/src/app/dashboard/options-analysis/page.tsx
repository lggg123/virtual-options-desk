'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import DashboardHeader from '@/components/DashboardHeader';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  Target,
  RotateCcw,
  X,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Loader2,
  RefreshCw,
  Activity,
  Zap,
  Timer,
  Gauge
} from 'lucide-react';
import { toast } from 'sonner';

interface Position {
  id: string;
  symbol: string;
  type: string;
  strike: number;
  expiry: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  delta: number;
  theta: number;
  gamma: number;
  vega: number;
  impliedVolatility?: number;
  underlyingPrice?: number;
}

interface GreeksSummary {
  totalDelta: number;
  totalGamma: number;
  totalTheta: number;
  totalVega: number;
}

interface DecisionRecommendation {
  action: 'hold' | 'close' | 'roll' | 'monitor';
  reason: string;
  confidence: number;
  urgency: 'low' | 'medium' | 'high';
}

export default function OptionsAnalysisPage() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);

  const fetchPositions = useCallback(async () => {
    try {
      const response = await fetch('/api/positions');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch positions');
      }

      // Filter to only show options (calls and puts)
      const optionPositions = (result.positions || []).filter(
        (p: Position) => p.type === 'call' || p.type === 'put'
      );
      setPositions(optionPositions);

      if (optionPositions.length > 0 && !selectedPosition) {
        setSelectedPosition(optionPositions[0]);
      }
    } catch (error) {
      console.error('Error fetching positions:', error);
      toast.error('Failed to fetch positions');
      setPositions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedPosition]);

  const refreshData = useCallback(async () => {
    setRefreshing(true);
    await fetchPositions();
    toast.success('Data refreshed');
  }, [fetchPositions]);

  useEffect(() => {
    fetchPositions();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchPositions();
    }, 30000);

    // Listen for order events
    const handleOrderPlaced = () => fetchPositions();
    window.addEventListener('orderPlaced', handleOrderPlaced);

    return () => {
      clearInterval(interval);
      window.removeEventListener('orderPlaced', handleOrderPlaced);
    };
  }, [fetchPositions]);

  const closePosition = async (positionId: string) => {
    try {
      const response = await fetch(`/api/positions/${positionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to close position');
      }

      await fetchPositions();
      toast.success('Position closed successfully');
      setSelectedPosition(null);
    } catch (error) {
      console.error('Error closing position:', error);
      toast.error('Failed to close position');
    }
  };

  // Calculate Greeks Summary
  const greeksSummary: GreeksSummary = positions.reduce(
    (acc, pos) => ({
      totalDelta: acc.totalDelta + (pos.delta * pos.quantity * 100),
      totalGamma: acc.totalGamma + (pos.gamma * pos.quantity * 100),
      totalTheta: acc.totalTheta + (pos.theta * pos.quantity * 100),
      totalVega: acc.totalVega + (pos.vega * pos.quantity * 100),
    }),
    { totalDelta: 0, totalGamma: 0, totalTheta: 0, totalVega: 0 }
  );

  // Calculate total P&L
  const totalPnL = positions.reduce((acc, pos) => acc + pos.pnl, 0);

  // Generate decision recommendation for a position
  const getDecisionRecommendation = (position: Position): DecisionRecommendation => {
    const daysToExpiry = Math.ceil(
      (new Date(position.expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    // High urgency: expiring soon with significant theta decay
    if (daysToExpiry <= 7 && Math.abs(position.theta) > 0.05) {
      if (position.pnlPercent > 50) {
        return {
          action: 'close',
          reason: 'Take profits - expiring soon with high theta decay',
          confidence: 85,
          urgency: 'high'
        };
      }
      if (position.pnlPercent < -30) {
        return {
          action: 'close',
          reason: 'Cut losses - time decay accelerating near expiry',
          confidence: 75,
          urgency: 'high'
        };
      }
      return {
        action: 'roll',
        reason: 'Consider rolling to later expiry to preserve time value',
        confidence: 70,
        urgency: 'high'
      };
    }

    // Medium urgency: moderate decay or breakeven
    if (daysToExpiry <= 21 && daysToExpiry > 7) {
      if (position.pnlPercent > 75) {
        return {
          action: 'close',
          reason: 'Strong profits achieved - consider taking gains',
          confidence: 80,
          urgency: 'medium'
        };
      }
      if (position.pnlPercent < -50) {
        return {
          action: 'close',
          reason: 'Significant loss - reassess thesis or cut position',
          confidence: 70,
          urgency: 'medium'
        };
      }
      return {
        action: 'monitor',
        reason: 'Watch price action and theta decay closely',
        confidence: 60,
        urgency: 'medium'
      };
    }

    // Low urgency: plenty of time
    if (position.pnlPercent > 100) {
      return {
        action: 'close',
        reason: 'Exceptional gains - lock in profits',
        confidence: 85,
        urgency: 'low'
      };
    }

    return {
      action: 'hold',
      reason: 'Position has time - continue monitoring',
      confidence: 65,
      urgency: 'low'
    };
  };

  // Calculate P&L at different price points for chart
  const calculatePnLAtPrices = (position: Position) => {
    const currentPrice = position.underlyingPrice || position.strike;
    const priceRange = currentPrice * 0.2; // 20% range
    const points = [];

    for (let i = -10; i <= 10; i++) {
      const price = currentPrice + (priceRange * i / 10);
      let pnl: number;

      if (position.type === 'call') {
        const intrinsicValue = Math.max(0, price - position.strike);
        pnl = (intrinsicValue - position.avgPrice) * position.quantity * 100;
      } else {
        const intrinsicValue = Math.max(0, position.strike - price);
        pnl = (intrinsicValue - position.avgPrice) * position.quantity * 100;
      }

      points.push({ price: price.toFixed(2), pnl });
    }

    return points;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const getDaysToExpiry = (expiry: string) => {
    const days = Math.ceil(
      (new Date(expiry).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return days;
  };

  const getExpiryBadgeColor = (days: number) => {
    if (days <= 7) return 'destructive';
    if (days <= 21) return 'secondary';
    return 'outline';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardHeader />
        <main className="container mx-auto px-4 py-6">
          <Card>
            <CardContent className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-3 text-muted-foreground">Loading positions...</span>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Options Analysis</h1>
            <p className="text-muted-foreground">
              Monitor your options positions and make informed decisions
            </p>
          </div>
          <Button
            onClick={refreshData}
            disabled={refreshing}
            variant="outline"
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total P&L</p>
                  <p className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(totalPnL)}
                  </p>
                </div>
                {totalPnL >= 0 ? (
                  <TrendingUp className="h-8 w-8 text-green-600" />
                ) : (
                  <TrendingDown className="h-8 w-8 text-red-600" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Portfolio Delta</p>
                  <p className="text-2xl font-bold">{greeksSummary.totalDelta.toFixed(0)}</p>
                </div>
                <Activity className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Daily Theta</p>
                  <p className={`text-2xl font-bold ${greeksSummary.totalTheta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(greeksSummary.totalTheta)}
                  </p>
                </div>
                <Timer className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Open Positions</p>
                  <p className="text-2xl font-bold">{positions.length}</p>
                </div>
                <Target className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {positions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-20">
              <Target className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Option Positions</h3>
              <p className="text-muted-foreground text-center max-w-md">
                You don&apos;t have any open option positions. Start trading to see your positions and analysis here.
              </p>
              <Button className="mt-4" asChild>
                <a href="/trading">Go to Trading</a>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="positions" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
              <TabsTrigger value="positions" className="text-xs sm:text-sm py-2">
                Positions
              </TabsTrigger>
              <TabsTrigger value="greeks" className="text-xs sm:text-sm py-2">
                Greeks Analysis
              </TabsTrigger>
              <TabsTrigger value="pnl" className="text-xs sm:text-sm py-2">
                P&L Scenarios
              </TabsTrigger>
              <TabsTrigger value="decisions" className="text-xs sm:text-sm py-2">
                Decisions
              </TabsTrigger>
            </TabsList>

            {/* Positions Tab */}
            <TabsContent value="positions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Open Option Positions</CardTitle>
                  <CardDescription>
                    Click on a position to see detailed analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Contract</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>Entry</TableHead>
                          <TableHead>Current</TableHead>
                          <TableHead>P&L</TableHead>
                          <TableHead>Days Left</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {positions.map((position) => {
                          const daysLeft = getDaysToExpiry(position.expiry);
                          return (
                            <TableRow
                              key={position.id}
                              className={`cursor-pointer hover:bg-muted/50 ${
                                selectedPosition?.id === position.id ? 'bg-muted' : ''
                              }`}
                              onClick={() => setSelectedPosition(position)}
                            >
                              <TableCell>
                                <div className="space-y-1">
                                  <div className="font-medium flex items-center gap-2">
                                    {position.symbol}
                                    <Badge variant={position.type === 'call' ? 'default' : 'secondary'}>
                                      {position.type.toUpperCase()}
                                    </Badge>
                                  </div>
                                  <div className="text-sm text-muted-foreground">
                                    ${position.strike} • {position.expiry}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={position.quantity > 0 ? "outline" : "destructive"}>
                                  {position.quantity > 0 ? `+${position.quantity}` : position.quantity}
                                </Badge>
                              </TableCell>
                              <TableCell>{formatCurrency(position.avgPrice)}</TableCell>
                              <TableCell>{formatCurrency(position.currentPrice)}</TableCell>
                              <TableCell>
                                <div className="space-y-1">
                                  <div className={`font-medium ${position.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatCurrency(position.pnl)}
                                  </div>
                                  <div className={`text-sm ${position.pnlPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatPercent(position.pnlPercent)}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={getExpiryBadgeColor(daysLeft)}>
                                  {daysLeft} days
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toast.info('Roll functionality coming soon');
                                    }}
                                  >
                                    <RotateCcw className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      closePosition(position.id);
                                    }}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              {/* Selected Position Details */}
              {selectedPosition && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {selectedPosition.symbol} {selectedPosition.type.toUpperCase()}
                      <Badge>${selectedPosition.strike}</Badge>
                    </CardTitle>
                    <CardDescription>
                      Expires: {selectedPosition.expiry} ({getDaysToExpiry(selectedPosition.expiry)} days)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Delta (Δ)</p>
                        <p className="text-xl font-bold">{selectedPosition.delta.toFixed(3)}</p>
                        <p className="text-xs text-muted-foreground">
                          ${(selectedPosition.delta * 100).toFixed(0)} per $1 move
                        </p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Gamma (Γ)</p>
                        <p className="text-xl font-bold">{selectedPosition.gamma.toFixed(4)}</p>
                        <p className="text-xs text-muted-foreground">
                          Delta change rate
                        </p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Theta (Θ)</p>
                        <p className={`text-xl font-bold ${selectedPosition.theta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(selectedPosition.theta * selectedPosition.quantity * 100)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Daily time decay
                        </p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg">
                        <p className="text-sm text-muted-foreground">Vega (ν)</p>
                        <p className="text-xl font-bold">{selectedPosition.vega.toFixed(3)}</p>
                        <p className="text-xs text-muted-foreground">
                          ${(selectedPosition.vega * selectedPosition.quantity * 100).toFixed(0)} per 1% IV
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Greeks Analysis Tab */}
            <TabsContent value="greeks" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Delta Exposure
                    </CardTitle>
                    <CardDescription>
                      Your directional exposure to underlying price movements
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold">{greeksSummary.totalDelta.toFixed(0)}</span>
                        <Badge variant={greeksSummary.totalDelta > 0 ? 'default' : greeksSummary.totalDelta < 0 ? 'destructive' : 'secondary'}>
                          {greeksSummary.totalDelta > 0 ? 'Bullish' : greeksSummary.totalDelta < 0 ? 'Bearish' : 'Neutral'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        For every $1 move in underlying, your portfolio changes by approximately {formatCurrency(Math.abs(greeksSummary.totalDelta))}
                      </p>
                      <div className="space-y-2">
                        {positions.map(pos => (
                          <div key={pos.id} className="flex justify-between items-center text-sm">
                            <span>{pos.symbol} ${pos.strike}{pos.type.charAt(0)}</span>
                            <span className={pos.delta > 0 ? 'text-green-600' : 'text-red-600'}>
                              {(pos.delta * pos.quantity * 100).toFixed(0)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Gamma Exposure
                    </CardTitle>
                    <CardDescription>
                      Rate of change in delta - acceleration risk
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold">{greeksSummary.totalGamma.toFixed(2)}</span>
                        <Badge variant={greeksSummary.totalGamma > 0 ? 'default' : 'secondary'}>
                          {greeksSummary.totalGamma > 0 ? 'Long Gamma' : 'Short Gamma'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {greeksSummary.totalGamma > 0
                          ? 'Positive gamma: Benefits from large moves, needs volatility'
                          : 'Negative gamma: Benefits from stability, hurt by large moves'}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Timer className="h-5 w-5" />
                      Theta Decay
                    </CardTitle>
                    <CardDescription>
                      Daily time value erosion
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className={`text-2xl font-bold ${greeksSummary.totalTheta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(greeksSummary.totalTheta)}
                        </span>
                        <Badge variant={greeksSummary.totalTheta >= 0 ? 'default' : 'destructive'}>
                          {greeksSummary.totalTheta >= 0 ? 'Collecting' : 'Paying'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {greeksSummary.totalTheta >= 0
                          ? 'You collect this amount daily from time decay'
                          : 'You lose this amount daily to time decay'}
                      </p>
                      <div className="space-y-2">
                        {positions.map(pos => (
                          <div key={pos.id} className="flex justify-between items-center text-sm">
                            <span>{pos.symbol} ${pos.strike}{pos.type.charAt(0)}</span>
                            <span className={pos.theta * pos.quantity >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {formatCurrency(pos.theta * pos.quantity * 100)}/day
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Gauge className="h-5 w-5" />
                      Vega Exposure
                    </CardTitle>
                    <CardDescription>
                      Sensitivity to implied volatility changes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-2xl font-bold">{formatCurrency(greeksSummary.totalVega)}</span>
                        <Badge variant={greeksSummary.totalVega > 0 ? 'default' : 'secondary'}>
                          {greeksSummary.totalVega > 0 ? 'Long Vol' : 'Short Vol'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        For every 1% increase in IV, your portfolio changes by {formatCurrency(Math.abs(greeksSummary.totalVega))}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* P&L Scenarios Tab */}
            <TabsContent value="pnl" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Profit & Loss at Expiration</CardTitle>
                  <CardDescription>
                    See potential outcomes for each position at different price levels
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedPosition ? (
                    <div className="space-y-6">
                      <div className="flex items-center gap-4">
                        <Badge variant="outline" className="text-lg px-4 py-2">
                          {selectedPosition.symbol} ${selectedPosition.strike} {selectedPosition.type.toUpperCase()}
                        </Badge>
                        <span className="text-muted-foreground">
                          {selectedPosition.quantity} contract(s)
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm font-medium">
                          <span>Price Scenario</span>
                          <span>P&L at Expiry</span>
                        </div>
                        {calculatePnLAtPrices(selectedPosition).map((point, idx) => {
                          const isBreakeven = Math.abs(point.pnl) < 50;
                          const isCurrentPrice = idx === 10;
                          return (
                            <div
                              key={idx}
                              className={`flex justify-between items-center p-2 rounded ${
                                isCurrentPrice ? 'bg-muted font-medium' : ''
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                ${point.price}
                                {isCurrentPrice && <Badge variant="secondary" className="text-xs">Current</Badge>}
                              </span>
                              <span className={`font-medium ${
                                isBreakeven ? 'text-yellow-600' :
                                point.pnl > 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {formatCurrency(point.pnl)}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Max Profit</p>
                          <p className="text-lg font-bold text-green-600">
                            {selectedPosition.type === 'call' ? 'Unlimited' : formatCurrency(selectedPosition.strike * selectedPosition.quantity * 100 - selectedPosition.avgPrice * selectedPosition.quantity * 100)}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Max Loss</p>
                          <p className="text-lg font-bold text-red-600">
                            {formatCurrency(selectedPosition.avgPrice * selectedPosition.quantity * 100 * -1)}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Breakeven</p>
                          <p className="text-lg font-bold">
                            ${(selectedPosition.type === 'call'
                              ? selectedPosition.strike + selectedPosition.avgPrice
                              : selectedPosition.strike - selectedPosition.avgPrice
                            ).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      Select a position from the Positions tab to see P&L scenarios
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Decisions Tab */}
            <TabsContent value="decisions" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Position Recommendations
                  </CardTitle>
                  <CardDescription>
                    AI-assisted suggestions based on time decay, P&L, and market conditions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {positions.map(position => {
                      const recommendation = getDecisionRecommendation(position);
                      const daysLeft = getDaysToExpiry(position.expiry);

                      return (
                        <Alert
                          key={position.id}
                          variant={recommendation.urgency === 'high' ? 'destructive' : 'default'}
                          className="relative"
                        >
                          <div className="flex items-start gap-4">
                            {recommendation.action === 'close' ? (
                              <XCircle className="h-5 w-5" />
                            ) : recommendation.action === 'hold' ? (
                              <CheckCircle2 className="h-5 w-5" />
                            ) : recommendation.action === 'roll' ? (
                              <RotateCcw className="h-5 w-5" />
                            ) : (
                              <MinusCircle className="h-5 w-5" />
                            )}
                            <div className="flex-1">
                              <AlertTitle className="flex items-center gap-2">
                                {position.symbol} ${position.strike} {position.type.toUpperCase()}
                                <Badge variant={getExpiryBadgeColor(daysLeft)}>
                                  {daysLeft} days
                                </Badge>
                                <Badge variant={
                                  recommendation.urgency === 'high' ? 'destructive' :
                                  recommendation.urgency === 'medium' ? 'secondary' : 'outline'
                                }>
                                  {recommendation.urgency.toUpperCase()} Priority
                                </Badge>
                              </AlertTitle>
                              <AlertDescription className="mt-2">
                                <p className="mb-2">{recommendation.reason}</p>
                                <div className="flex items-center gap-4 text-sm">
                                  <span>
                                    P&L: <span className={position.pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                                      {formatCurrency(position.pnl)} ({formatPercent(position.pnlPercent)})
                                    </span>
                                  </span>
                                  <span>
                                    Theta: <span className={position.theta * position.quantity >= 0 ? 'text-green-600' : 'text-red-600'}>
                                      {formatCurrency(position.theta * position.quantity * 100)}/day
                                    </span>
                                  </span>
                                </div>
                                <div className="mt-2">
                                  <div className="flex justify-between text-xs mb-1">
                                    <span>Confidence</span>
                                    <span>{recommendation.confidence}%</span>
                                  </div>
                                  <Progress value={recommendation.confidence} className="h-2" />
                                </div>
                              </AlertDescription>
                            </div>
                            <div className="flex flex-col gap-2">
                              <Button
                                size="sm"
                                variant={recommendation.action === 'close' ? 'destructive' : 'default'}
                                onClick={() => {
                                  if (recommendation.action === 'close') {
                                    closePosition(position.id);
                                  } else {
                                    toast.info(`${recommendation.action.charAt(0).toUpperCase() + recommendation.action.slice(1)} functionality coming soon`);
                                  }
                                }}
                              >
                                {recommendation.action === 'close' ? 'Close' :
                                 recommendation.action === 'roll' ? 'Roll' :
                                 recommendation.action === 'hold' ? 'Keep' : 'Review'}
                              </Button>
                            </div>
                          </div>
                        </Alert>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Risk Alerts */}
              {positions.some(p => getDaysToExpiry(p.expiry) <= 7) && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Expiration Warning</AlertTitle>
                  <AlertDescription>
                    You have {positions.filter(p => getDaysToExpiry(p.expiry) <= 7).length} position(s)
                    expiring within 7 days. Time decay accelerates significantly in the final week.
                  </AlertDescription>
                </Alert>
              )}

              {Math.abs(greeksSummary.totalTheta) > 100 && (
                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertTitle>Significant Theta Exposure</AlertTitle>
                  <AlertDescription>
                    Your portfolio {greeksSummary.totalTheta > 0 ? 'collects' : 'loses'} approximately
                    {formatCurrency(Math.abs(greeksSummary.totalTheta))} per day from time decay.
                    {greeksSummary.totalTheta < 0 && ' Consider your timeline for these positions.'}
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
