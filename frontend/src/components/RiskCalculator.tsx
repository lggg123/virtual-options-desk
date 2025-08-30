'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Shield, AlertTriangle } from 'lucide-react';

export default function RiskCalculator() {
  const [portfolioValue, setPortfolioValue] = useState('50000');
  const [positionSize, setPositionSize] = useState('2500');
  
  const calculateRisk = () => {
    const portfolio = parseFloat(portfolioValue) || 0;
    const position = parseFloat(positionSize) || 0;
    const riskPercentage = (position / portfolio) * 100;
    return {
      percentage: riskPercentage,
      maxLoss: position,
      riskLevel: riskPercentage > 10 ? 'high' : riskPercentage > 5 ? 'medium' : 'low'
    };
  };

  const risk = calculateRisk();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Risk Calculator
        </CardTitle>
        <CardDescription>Position sizing and risk management</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="portfolio-value">Portfolio Value</Label>
          <Input
            id="portfolio-value"
            placeholder="50000"
            value={portfolioValue}
            onChange={(e) => setPortfolioValue(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="position-size">Position Size</Label>
          <Input
            id="position-size"
            placeholder="2500"
            value={positionSize}
            onChange={(e) => setPositionSize(e.target.value)}
          />
        </div>

        <div className="bg-muted p-4 rounded-lg space-y-3">
          <div className="flex justify-between items-center">
            <span>Risk Percentage:</span>
            <Badge variant={
              risk.riskLevel === 'high' ? 'destructive' : 
              risk.riskLevel === 'medium' ? 'secondary' : 'default'
            }>
              {risk.percentage.toFixed(2)}%
            </Badge>
          </div>
          
          <Progress 
            value={Math.min(risk.percentage, 100)} 
            className="h-2"
          />
          
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Max Loss:</span>
            <span>${risk.maxLoss.toLocaleString()}</span>
          </div>

          {risk.riskLevel === 'high' && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <AlertTriangle className="h-4 w-4" />
              High risk position - consider reducing size
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center">
            <div className="text-green-600 font-medium">Low Risk</div>
            <div className="text-muted-foreground">{"<5%"}</div>
          </div>
          <div className="text-center">
            <div className="text-yellow-600 font-medium">Medium Risk</div>
            <div className="text-muted-foreground">5-10%</div>
          </div>
          <div className="text-center">
            <div className="text-red-600 font-medium">High Risk</div>
            <div className="text-muted-foreground">{">10%"}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}