'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { X, RotateCcw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Position {
  id: string;
  symbol: string;
  ticker: string;
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
  daysToExpiry: number;
  underlyingPrice: number;
  intrinsicValue: number;
  timeValue: number;
  breakeven: number;
  priceSource: 'live' | 'estimated' | 'entry';
  impliedVolatility: number;
}

export default function ActivePositions() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPositions = useCallback(async () => {
    try {
      const response = await fetch('/api/positions');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch positions');
      }

      setPositions(result.positions || []);
    } catch (error) {
      console.error('Error fetching positions:', error);
      toast.error('Failed to fetch positions');
      setPositions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const refreshPositions = useCallback(async () => {
    setRefreshing(true);
    await fetchPositions();
  }, [fetchPositions]);

  useEffect(() => {
    fetchPositions();

    // Listen for order placement events
    const handleOrderPlaced = () => {
      refreshPositions();
    };

    window.addEventListener('orderPlaced', handleOrderPlaced);
    return () => window.removeEventListener('orderPlaced', handleOrderPlaced);
  }, [fetchPositions, refreshPositions]);

  const closePosition = async (positionId: string) => {
    try {
      const response = await fetch(`/api/positions/${positionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to close position');
      }

      await refreshPositions();
      toast.success('Position closed successfully');
    } catch (error) {
      console.error('Error closing position:', error);
      toast.error('Failed to close position');
    }
  };

  const rollPosition = () => {
    toast.info('Roll position functionality coming soon');
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading Positions...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Active Positions</CardTitle>
            <CardDescription>
              {positions.length} active option{positions.length !== 1 ? 's' : ''}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshPositions}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4" />
            )}
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {positions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No active positions</p>
            <p className="text-sm">Place your first trade to see positions here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contract</TableHead>
                  <TableHead>Underlying</TableHead>
                  <TableHead>Entry / Current</TableHead>
                  <TableHead>Value Breakdown</TableHead>
                  <TableHead>P&L</TableHead>
                  <TableHead>Greeks</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {positions.map((position) => {
                  const isITM = position.intrinsicValue > 0;
                  const isProfitable = position.pnl >= 0;
                  const isExpiringSoon = position.daysToExpiry <= 7;

                  return (
                    <TableRow key={position.id} className={isExpiringSoon ? 'bg-yellow-50 dark:bg-yellow-950/20' : ''}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium flex items-center gap-2">
                            {position.ticker}
                            <Badge variant={position.type === 'call' ? 'default' : 'secondary'} className="text-xs">
                              {position.type.toUpperCase()}
                            </Badge>
                            <Badge variant={position.quantity > 0 ? "outline" : "destructive"} className="text-xs">
                              {position.quantity > 0 ? `+${position.quantity}` : position.quantity}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ${position.strike} Strike
                          </div>
                          <div className={`text-xs ${isExpiringSoon ? 'text-yellow-600 font-medium' : 'text-muted-foreground'}`}>
                            Exp: {position.expiry} ({position.daysToExpiry}d)
                          </div>
                          <div className="text-xs text-muted-foreground">
                            BE: ${position.breakeven.toFixed(2)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium text-lg">
                            ${position.underlyingPrice.toFixed(2)}
                          </div>
                          <Badge variant={isITM ? 'default' : 'outline'} className="text-xs">
                            {isITM ? 'ITM' : 'OTM'}
                          </Badge>
                          <div className="text-xs text-muted-foreground">
                            IV: {position.impliedVolatility.toFixed(0)}%
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm">
                            Entry: <span className="font-medium">{formatCurrency(position.avgPrice)}</span>
                          </div>
                          <div className="text-sm">
                            Now: <span className={`font-medium ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(position.currentPrice)}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {position.priceSource === 'live' ? '🟢 Live' : position.priceSource === 'estimated' ? '🟡 Est' : '⚪ Entry'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Intrinsic:</span>
                            <span className="font-medium">{formatCurrency(position.intrinsicValue)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Time:</span>
                            <span className="font-medium">{formatCurrency(position.timeValue)}</span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
                            <div
                              className="bg-blue-600 h-1.5 rounded-full"
                              style={{
                                width: `${position.currentPrice > 0 ? (position.intrinsicValue / position.currentPrice) * 100 : 0}%`
                              }}
                            />
                          </div>
                          <div className="text-xs text-muted-foreground text-center">
                            {position.currentPrice > 0 ? ((position.intrinsicValue / position.currentPrice) * 100).toFixed(0) : 0}% intrinsic
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className={`font-bold text-lg ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(position.pnl)}
                          </div>
                          <div className={`text-sm font-medium ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
                            {formatPercent(position.pnlPercent)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Per contract: {formatCurrency(position.pnl / Math.abs(position.quantity))}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
                          <div className="text-muted-foreground">Δ</div>
                          <div className="font-medium">{position.delta.toFixed(3)}</div>
                          <div className="text-muted-foreground">Θ</div>
                          <div className={`font-medium ${position.theta < 0 ? 'text-red-500' : ''}`}>{position.theta.toFixed(3)}</div>
                          <div className="text-muted-foreground">Γ</div>
                          <div className="font-medium">{position.gamma.toFixed(3)}</div>
                          <div className="text-muted-foreground">ν</div>
                          <div className="font-medium">{position.vega.toFixed(2)}</div>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Daily Θ: {formatCurrency(position.theta * position.quantity * 100)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => rollPosition()}
                          >
                            <RotateCcw className="h-3 w-3 mr-1" />
                            Roll
                          </Button>
                          <Button
                            variant={isProfitable ? "default" : "destructive"}
                            size="sm"
                            onClick={() => closePosition(position.id)}
                          >
                            <X className="h-3 w-3 mr-1" />
                            Close
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}