'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, TrendingUp, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Position {
  id: string;
  symbol: string;
  type: string;
  assetClass: 'option' | 'crypto' | 'cfd' | 'stock' | 'future';
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  pnl: number;
}

export default function PortfolioOverview() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalValue, setTotalValue] = useState(0);

  const fetchPositions = useCallback(async () => {
    try {
      const response = await fetch('/api/positions');
      if (response.ok) {
        const data = await response.json();
        setPositions(data.positions || []);

        // Calculate total portfolio value
        const total = (data.positions || []).reduce((sum: number, pos: Position) => {
          // Options have a 100x multiplier, other assets don't
          const multiplier = pos.assetClass === 'option' ? 100 : 1;
          return sum + (pos.currentPrice * pos.quantity * multiplier);
        }, 0);
        setTotalValue(total);
      }
    } catch (error) {
      console.error('Error fetching positions:', error);
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading Portfolio...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (positions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Positions</CardTitle>
          <CardDescription>Current options positions breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No positions yet</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Start trading to build your portfolio. You have $2,000,000 in virtual cash to get started.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  interface GroupedPosition {
    symbol: string;
    type: string;
    assetClass: 'option' | 'crypto' | 'cfd' | 'stock' | 'future';
    quantity: number;
    value: number;
    percentage: number;
  }

  // Group positions by symbol and calculate percentages
  const groupedPositions = positions.reduce((acc: GroupedPosition[], pos) => {
    const existing = acc.find(p => p.symbol === pos.symbol && p.type === pos.type);

    // Calculate value based on asset class
    // Options have a 100x multiplier (1 contract = 100 shares)
    // Crypto, CFDs, stocks, and futures don't use the 100x multiplier
    const multiplier = pos.assetClass === 'option' ? 100 : 1;
    const value = pos.currentPrice * pos.quantity * multiplier;

    if (existing) {
      existing.quantity += pos.quantity;
      existing.value += value;
    } else {
      acc.push({
        symbol: pos.symbol,
        type: pos.type,
        assetClass: pos.assetClass,
        quantity: pos.quantity,
        value: value,
        percentage: 0
      });
    }
    return acc;
  }, []);

  // Calculate percentages
  groupedPositions.forEach(pos => {
    pos.percentage = totalValue > 0 ? (pos.value / totalValue) * 100 : 0;
  });

  // Helper function to format quantity display based on asset class
  const formatQuantityLabel = (position: GroupedPosition): string => {
    const qty = position.quantity.toFixed(4);

    switch (position.assetClass) {
      case 'crypto':
        // For crypto, show: "200.0000 SOL" or "1.0000 XRP"
        return `${qty} ${position.symbol}`;
      case 'future':
        // For futures, show: "1 contracts"
        return `${position.quantity} contract${position.quantity !== 1 ? 's' : ''}`;
      case 'option':
        // For options, show: "10 contracts"
        return `${position.quantity} contract${position.quantity !== 1 ? 's' : ''}`;
      case 'cfd':
        // For CFDs, show quantity with units
        return `${qty} ${position.symbol}`;
      case 'stock':
        // For stocks, show quantity as shares
        return `${position.quantity} share${position.quantity !== 1 ? 's' : ''}`;
      default:
        return `${position.quantity} contracts`;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Portfolio Positions</CardTitle>
            <CardDescription>Current options positions breakdown</CardDescription>
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
        <div className="space-y-6">
          {groupedPositions.map((position) => (
            <div key={`${position.symbol}-${position.type}`} className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{position.symbol} {position.type}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatQuantityLabel(position)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">${position.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  <div className="text-sm text-muted-foreground">{position.percentage.toFixed(1)}%</div>
                </div>
              </div>
              <Progress value={position.percentage} className="h-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}