import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, TrendingUp } from 'lucide-react';

export default function MarketScanner() {
  const opportunities = [
    {
      symbol: 'NVDA',
      description: 'High IV Rank',
      ivRank: 85,
      action: 'Sell Premium',
      probability: 75,
      price: 485.23,
      change: 2.45
    },
    {
      symbol: 'META',
      description: 'Earnings Play',
      ivRank: 92,
      action: 'Straddle',
      probability: 68,
      price: 342.18,
      change: -1.23
    },
    {
      symbol: 'AMZN',
      description: 'Technical Breakout',
      ivRank: 45,
      action: 'Buy Calls',
      probability: 72,
      price: 145.67,
      change: 3.89
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Market Scanner
        </CardTitle>
        <CardDescription>AI-powered trading opportunities</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {opportunities.map((opp, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{opp.symbol}</span>
                    <Badge variant="outline">${opp.price}</Badge>
                    <Badge variant={opp.change >= 0 ? 'default' : 'destructive'}>
                      {opp.change >= 0 ? '+' : ''}{opp.change}%
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{opp.description}</p>
                </div>
                <Button size="sm">Trade</Button>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">IV Rank</div>
                  <div className="font-medium">{opp.ivRank}%</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Strategy</div>
                  <div className="font-medium">{opp.action}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">Success Rate</div>
                  <div className="font-medium text-green-600">{opp.probability}%</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}