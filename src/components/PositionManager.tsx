import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TrendingUp, TrendingDown, X } from 'lucide-react';

export default function PositionManager() {
  const positions = [
    {
      id: 1,
      symbol: 'AAPL',
      type: 'Call',
      strike: 180,
      expiry: '2024-01-19',
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
      expiry: '2024-01-26',
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
      expiry: '2024-01-12',
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
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Open Positions</CardTitle>
        <CardDescription>Manage your current options positions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg">
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
                        {position.symbol} {position.strike}{position.type.charAt(0)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {position.expiry}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={position.quantity > 0 ? 'default' : 'destructive'}>
                      {position.quantity > 0 ? '+' : ''}{position.quantity}
                    </Badge>
                  </TableCell>
                  <TableCell>${position.avgPrice.toFixed(2)}</TableCell>
                  <TableCell>${position.currentPrice.toFixed(2)}</TableCell>
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
                      <Button size="sm" variant="outline">
                        Close
                      </Button>
                      <Button size="sm" variant="outline">
                        Roll
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}