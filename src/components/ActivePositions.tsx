'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { X, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

export default function ActivePositions() {
  const [positions, setPositions] = useState([
    {
      id: 1,
      symbol: 'AAPL',
      type: 'Call',
      strike: 180,
      expiry: '2024-02-16',
      quantity: 5,
      avgPrice: 3.25,
      currentPrice: 3.85,
      pnl: 300,
      pnlPercent: 18.46,
      delta: 0.65,
      theta: -0.08,
      gamma: 0.015,
      vega: 0.12
    },
    {
      id: 2,
      symbol: 'TSLA',
      type: 'Put',
      strike: 250,
      expiry: '2024-02-23',
      quantity: -3,
      avgPrice: 8.50,
      currentPrice: 7.20,
      pnl: 390,
      pnlPercent: 15.29,
      delta: -0.42,
      theta: -0.12,
      gamma: 0.018,
      vega: 0.15
    },
    {
      id: 3,
      symbol: 'SPY',
      type: 'Call',
      strike: 450,
      expiry: '2024-02-09',
      quantity: 10,
      avgPrice: 2.15,
      currentPrice: 1.85,
      pnl: -300,
      pnlPercent: -13.95,
      delta: 0.38,
      theta: -0.15,
      gamma: 0.020,
      vega: 0.08
    }
  ]);

  const handleClosePosition = (positionId: number) => {
    const position = positions.find(p => p.id === positionId);
    if (position) {
      setPositions(prev => prev.filter(p => p.id !== positionId));
      toast.success(`Closed ${position.symbol} ${position.strike}${position.type.charAt(0)} position`);
    }
  };

  const handleRollPosition = (positionId: number) => {
    const position = positions.find(p => p.id === positionId);
    if (position) {
      toast.success(`Rolling ${position.symbol} ${position.strike}${position.type.charAt(0)} position`);
    }
  };

  const totalPnL = positions.reduce((sum, pos) => sum + pos.pnl, 0);
  const totalDelta = positions.reduce((sum, pos) => sum + (pos.delta * pos.quantity), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Positions</CardTitle>
        <CardDescription>Manage your current options positions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Portfolio Summary */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Total P&L</div>
              <div className={`text-lg font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(0)}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Portfolio Delta</div>
              <div className="text-lg font-bold">{totalDelta.toFixed(2)}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Open Positions</div>
              <div className="text-lg font-bold">{positions.length}</div>
            </div>
          </div>

          {/* Positions Table */}
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Position</TableHead>
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
                      <div>
                        <div className="font-medium">
                          {position.symbol} ${position.strike}{position.type.charAt(0)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Exp: {position.expiry}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={position.quantity > 0 ? 'default' : 'destructive'}>
                        {position.quantity > 0 ? '+' : ''}{position.quantity}
                      </Badge>
                    </TableCell>
                    <TableCell>${position.avgPrice.toFixed(2)}</TableCell>
                    <TableCell className="font-medium">${position.currentPrice.toFixed(2)}</TableCell>
                    <TableCell>
                      <div className={position.pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                        <div className="font-medium">
                          {position.pnl >= 0 ? '+' : ''}${position.pnl}
                        </div>
                        <div className="text-sm">
                          {position.pnlPercent >= 0 ? '+' : ''}{position.pnlPercent.toFixed(2)}%
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm space-y-1">
                        <div>Δ: {position.delta.toFixed(2)}</div>
                        <div>Θ: {position.theta.toFixed(2)}</div>
                        <div>Γ: {position.gamma.toFixed(3)}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleClosePosition(position.id)}
                        >
                          <X className="h-3 w-3 mr-1" />
                          Close
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleRollPosition(position.id)}
                        >
                          <RotateCcw className="h-3 w-3 mr-1" />
                          Roll
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {positions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No open positions. Start trading to see your positions here.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}