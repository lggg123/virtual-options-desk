import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function MarketData() {
  const marketData = [
    { symbol: 'SPY', price: 445.23, change: '+2.14', changePercent: '+0.48%', volume: '89.2M' },
    { symbol: 'QQQ', price: 378.91, change: '+1.85', changePercent: '+0.49%', volume: '45.8M' },
    { symbol: 'IWM', price: 195.67, change: '-0.32', changePercent: '-0.16%', volume: '32.1M' },
    { symbol: 'VIX', price: 18.42, change: '-0.85', changePercent: '-4.4%', volume: '15.6M' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Market Overview</CardTitle>
        <CardDescription>Real-time market data for major indices</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {marketData.map((item) => (
            <div key={item.symbol} className="flex items-center justify-between">
              <div>
                <div className="font-medium">{item.symbol}</div>
                <div className="text-sm text-muted-foreground">Vol: {item.volume}</div>
              </div>
              <div className="text-right">
                <div className="font-medium">${item.price}</div>
                <Badge variant={item.change.startsWith('+') ? 'default' : 'destructive'}>
                  {item.change} ({item.changePercent})
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}