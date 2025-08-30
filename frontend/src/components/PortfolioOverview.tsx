import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export default function PortfolioOverview() {
  const positions = [
    { symbol: 'AAPL', type: 'Calls', quantity: 15, value: 4875, percentage: 32 },
    { symbol: 'TSLA', type: 'Puts', quantity: 8, value: 3200, percentage: 21 },
    { symbol: 'SPY', type: 'Calls', quantity: 25, value: 5375, percentage: 35 },
    { symbol: 'QQQ', type: 'Puts', quantity: 6, value: 1800, percentage: 12 },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Positions</CardTitle>
        <CardDescription>Current options positions breakdown</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {positions.map((position) => (
            <div key={`${position.symbol}-${position.type}`} className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{position.symbol} {position.type}</div>
                  <div className="text-sm text-muted-foreground">
                    {position.quantity} contracts
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">${position.value.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">{position.percentage}%</div>
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