'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase/client';
import { TrendingUp, TrendingDown, Activity, AlertTriangle, Shield, Gauge } from 'lucide-react';

interface Position {
  id: string;
  symbol: string;
  position_type: 'stock' | 'call' | 'put' | 'spread';
  quantity: number;
  entry_price: number;
  current_price: number | null;
  market_value: number | null;
  unrealized_pl: number | null;
  delta: number | null;
  gamma: number | null;
  theta: number | null;
  vega: number | null;
  implied_volatility: number | null;
}

interface PortfolioGreeks {
  totalDelta: number;
  totalGamma: number;
  totalTheta: number;
  totalVega: number;
  avgIV: number;
}

export default function RiskAnalysis() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [greeks, setGreeks] = useState<PortfolioGreeks>({
    totalDelta: 0,
    totalGamma: 0,
    totalTheta: 0,
    totalVega: 0,
    avgIV: 0,
  });

  useEffect(() => {
    fetchPositions();
  }, []);

  async function fetchPositions() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('positions')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('status', 'open');

      if (error) throw error;

      const positionsData = data || [];
      setPositions(positionsData);

      // Calculate portfolio Greeks
      const optionsPositions = positionsData.filter(p => p.position_type !== 'stock');
      const totalDelta = positionsData.reduce((sum, p) => sum + (p.delta || 0) * p.quantity, 0);
      const totalGamma = optionsPositions.reduce((sum, p) => sum + (p.gamma || 0) * p.quantity, 0);
      const totalTheta = optionsPositions.reduce((sum, p) => sum + (p.theta || 0) * p.quantity, 0);
      const totalVega = optionsPositions.reduce((sum, p) => sum + (p.vega || 0) * p.quantity, 0);

      const ivSum = optionsPositions.reduce((sum, p) => sum + (p.implied_volatility || 0), 0);
      const avgIV = optionsPositions.length > 0 ? ivSum / optionsPositions.length : 0;

      setGreeks({ totalDelta, totalGamma, totalTheta, totalVega, avgIV });
    } catch (error) {
      console.error('Error fetching positions:', error);
    } finally {
      setLoading(false);
    }
  }

  const totalValue = positions.reduce((sum, p) => sum + (p.market_value || 0), 0);
  const totalPL = positions.reduce((sum, p) => sum + (p.unrealized_pl || 0), 0);
  const optionsCount = positions.filter(p => p.position_type !== 'stock').length;
  const stocksCount = positions.filter(p => p.position_type === 'stock').length;

  // Risk score calculation (simplified)
  const riskScore = Math.min(100, Math.abs(greeks.totalDelta * 10) + Math.abs(greeks.totalGamma * 100) + Math.abs(greeks.totalVega * 5));
  const riskLevel = riskScore < 30 ? 'Low' : riskScore < 60 ? 'Moderate' : 'High';
  const riskColor = riskScore < 30 ? 'text-green-500' : riskScore < 60 ? 'text-yellow-500' : 'text-red-500';

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Risk Analysis</CardTitle>
          <CardDescription>Portfolio risk metrics and Greeks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Portfolio Greeks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Portfolio Greeks
          </CardTitle>
          <CardDescription>Aggregate options sensitivity metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Delta</div>
              <div className={`text-2xl font-bold ${greeks.totalDelta >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {greeks.totalDelta >= 0 ? '+' : ''}{greeks.totalDelta.toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Directional exposure</div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Gamma</div>
              <div className="text-2xl font-bold text-blue-500">
                {greeks.totalGamma.toFixed(3)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Delta sensitivity</div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Theta</div>
              <div className={`text-2xl font-bold ${greeks.totalTheta >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                ${greeks.totalTheta.toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Daily time decay</div>
            </div>
            <div className="p-4 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">Vega</div>
              <div className="text-2xl font-bold text-purple-500">
                ${greeks.totalVega.toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Volatility exposure</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Risk Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5" />
              Risk Score
            </CardTitle>
            <CardDescription>Overall portfolio risk assessment</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className={`text-5xl font-bold ${riskColor}`}>
                {riskScore.toFixed(0)}
              </div>
              <div>
                <div className={`text-lg font-semibold ${riskColor}`}>{riskLevel} Risk</div>
                <div className="text-sm text-muted-foreground">
                  Based on Greeks exposure
                </div>
              </div>
            </div>
            <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full ${riskScore < 30 ? 'bg-green-500' : riskScore < 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                style={{ width: `${riskScore}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Portfolio Summary
            </CardTitle>
            <CardDescription>Position breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Value</span>
                <span className="font-semibold">${totalValue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Unrealized P/L</span>
                <span className={`font-semibold flex items-center gap-1 ${totalPL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {totalPL >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  {totalPL >= 0 ? '+' : ''}${totalPL.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Options Positions</span>
                <span className="font-semibold">{optionsCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Stock Positions</span>
                <span className="font-semibold">{stocksCount}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Avg Implied Volatility</span>
                <span className="font-semibold">{(greeks.avgIV * 100).toFixed(1)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Alerts */}
      {positions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Risk Alerts
            </CardTitle>
            <CardDescription>Important considerations for your portfolio</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Math.abs(greeks.totalDelta) > 5 && (
                <div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm">High directional exposure (Delta: {greeks.totalDelta.toFixed(2)})</span>
                </div>
              )}
              {greeks.totalTheta < -50 && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="text-sm">Significant time decay (Theta: ${greeks.totalTheta.toFixed(2)}/day)</span>
                </div>
              )}
              {greeks.avgIV > 0.5 && (
                <div className="flex items-center gap-2 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <span className="text-sm">High implied volatility exposure ({(greeks.avgIV * 100).toFixed(0)}%)</span>
                </div>
              )}
              {Math.abs(greeks.totalDelta) <= 5 && greeks.totalTheta >= -50 && greeks.avgIV <= 0.5 && (
                <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <Shield className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Portfolio risk levels appear balanced</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {positions.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No open positions. Risk metrics will appear once you have active trades.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
