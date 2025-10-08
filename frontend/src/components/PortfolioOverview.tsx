'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, TrendingUp } from 'lucide-react';

interface Position {
  id: string;
  symbol: string;
  type: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  pnl: number;
}

export default function PortfolioOverview() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalValue, setTotalValue] = useState(0);

  useEffect(() => {
    fetchPositions();
  }, []);

  async function fetchPositions() {
    try {
      const response = await fetch('/api/positions');
      if (response.ok) {
        const data = await response.json();
        setPositions(data.positions || []);
        
        // Calculate total portfolio value
        const total = (data.positions || []).reduce((sum: number, pos: Position) => {
          return sum + (pos.currentPrice * pos.quantity * 100);
        }, 0);
        setTotalValue(total);
      }
    } catch (error) {
      console.error('Error fetching positions:', error);
    } finally {
      setLoading(false);
    }
  }

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
              Start trading to build your portfolio. You have $100,000 in virtual cash to get started.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group positions by symbol and calculate percentages
  const groupedPositions = positions.reduce((acc: any[], pos) => {
    const existing = acc.find(p => p.symbol === pos.symbol && p.type === pos.type);
    const value = pos.currentPrice * pos.quantity * 100;
    
    if (existing) {
      existing.quantity += pos.quantity;
      existing.value += value;
    } else {
      acc.push({
        symbol: pos.symbol,
        type: pos.type,
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Positions</CardTitle>
        <CardDescription>Current options positions breakdown</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {groupedPositions.map((position) => (
            <div key={`${position.symbol}-${position.type}`} className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{position.symbol} {position.type}</div>
                  <div className="text-sm text-muted-foreground">
                    {position.quantity} contracts
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