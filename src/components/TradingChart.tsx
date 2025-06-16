'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

export default function TradingChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Price Chart
        </CardTitle>
        <CardDescription>Real-time price and volume data</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Chart Controls */}
          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">1D</Button>
              <Button variant="outline" size="sm">5D</Button>
              <Button variant="default" size="sm">1M</Button>
              <Button variant="outline" size="sm">3M</Button>
              <Button variant="outline" size="sm">1Y</Button>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline">AAPL</Badge>
              <Badge variant="default">$182.45</Badge>
              <Badge variant="secondary" className="text-green-600">
                <TrendingUp className="h-3 w-3 mr-1" />
                +1.19%
              </Badge>
            </div>
          </div>

          {/* Placeholder for actual chart */}
          <div className="h-96 bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Trading chart will be integrated here</p>
              <p className="text-sm text-muted-foreground">Consider using TradingView, Chart.js, or similar</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Open</div>
              <div className="font-medium">$180.30</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">High</div>
              <div className="font-medium">$183.95</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Low</div>
              <div className="font-medium">$179.85</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-muted-foreground">Volume</div>
              <div className="font-medium">45.2M</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}