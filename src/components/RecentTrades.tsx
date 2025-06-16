import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function RecentTrades() {
  const trades = [
    { 
      id: 1, 
      symbol: 'AAPL', 
      type: 'Call', 
      strike: 180, 
      expiry: '2024-01-19', 
      action: 'BUY', 
      quantity: 5, 
      price: 3.25, 
      time: '10:30 AM' 
    },
    { 
      id: 2, 
      symbol: 'TSLA', 
      type: 'Put', 
      strike: 250, 
      expiry: '2024-01-26', 
      action: 'SELL', 
      quantity: 3, 
      price: 8.50, 
      time: '11:15 AM' 
    },
    { 
      id: 3, 
      symbol: 'SPY', 
      type: 'Call', 
      strike: 450, 
      expiry: '2024-01-12', 
      action: 'BUY', 
      quantity: 10, 
      price: 2.15, 
      time: '2:45 PM' 
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Trades</CardTitle>
        <CardDescription>Your latest options transactions</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {trades.map((trade) => (
            <div key={trade.id} className="flex items-center justify-between border-b pb-2">
              <div>
                <div className="font-medium">
                  {trade.symbol} {trade.strike}{trade.type.charAt(0)} {trade.expiry}
                </div>
                <div className="text-sm text-muted-foreground">
                  {trade.quantity} contracts @ ${trade.price}
                </div>
              </div>
              <div className="text-right">
                <Badge variant={trade.action === 'BUY' ? 'default' : 'secondary'}>
                  {trade.action}
                </Badge>
                <div className="text-sm text-muted-foreground mt-1">{trade.time}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}