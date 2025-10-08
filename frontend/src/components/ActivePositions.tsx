'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { X, RotateCcw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Position {
  id: number;
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

  const closePosition = async (positionId: number) => {
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
                  <TableHead>Qty</TableHead>
                  <TableHead>Avg Price</TableHead>
                  <TableHead>Current</TableHead>
                  <TableHead>P&L</TableHead>
                  <TableHead>Greeks</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {positions.map((position) => (
                  <TableRow key={position.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{position.symbol}</div>
                        <div className="text-sm text-muted-foreground">
                          {position.expiry} ${position.strike}{position.type.charAt(0)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={position.quantity > 0 ? "default" : "destructive"}>
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
                      <div className="space-y-1 text-sm">
                        <div>Δ {position.delta.toFixed(3)}</div>
                        <div>Θ {position.theta.toFixed(3)}</div>
                        <div>Γ {position.gamma.toFixed(3)}</div>
                        <div>ν {position.vega.toFixed(2)}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => rollPosition()}
                        >
                          <RotateCcw className="h-3 w-3" />
                          Roll
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => closePosition(position.id)}
                        >
                          <X className="h-3 w-3" />
                          Close
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}