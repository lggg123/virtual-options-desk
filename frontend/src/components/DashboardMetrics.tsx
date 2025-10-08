'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, Activity, Target, Loader2 } from 'lucide-react';

interface Account {
  cash_balance: number;
  portfolio_value: number;
  total_pnl: number;
  total_pnl_percent: number;
}

export default function DashboardMetrics() {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAccount();
  }, []);

  async function fetchAccount() {
    try {
      const response = await fetch('/api/account');
      
      if (!response.ok) {
        throw new Error('Failed to fetch account data');
      }

      const data = await response.json();
      setAccount(data.account);
    } catch (err) {
      console.error('Error fetching account:', err);
      setError(err instanceof Error ? err.message : 'Failed to load account data');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">--</div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error || !account) {
    return (
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Unable to load account data</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {error || 'Please make sure your account is set up correctly.'}
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            If this is your first time logging in, the database tables may need to be created.
            Contact support or run the SQL schema in your Supabase dashboard.
          </p>
        </CardContent>
      </Card>
    );
  }

  const portfolioValue = account.portfolio_value || 100000;
  const cashBalance = account.cash_balance || 100000;
  const totalPnL = account.total_pnl || 0;
  const totalPnLPercent = account.total_pnl_percent || 0;
  const investedAmount = portfolioValue - cashBalance;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${portfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {totalPnLPercent >= 0 ? (
              <span className="text-green-600">+{totalPnLPercent.toFixed(2)}%</span>
            ) : (
              <span className="text-red-600">{totalPnLPercent.toFixed(2)}%</span>
            )}
            {' '}all time
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Cash Available</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Available for trading
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {totalPnL >= 0 ? '+' : ''}${totalPnL.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Unrealized gains/losses
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Invested</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            ${investedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            In active positions
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
