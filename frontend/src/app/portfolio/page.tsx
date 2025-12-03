'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DashboardHeader from '@/components/DashboardHeader';
import PortfolioOverview from '@/components/PortfolioOverview';
import ActivePositions from '@/components/ActivePositions';
import RecentTrades from '@/components/RecentTrades';
import { supabase } from '@/lib/supabase/client';

interface AccountData {
  cash_balance: number;
  portfolio_value: number;
  total_pnl: number;
  total_pnl_percent: number;
}

interface PositionData {
  id: string;
  symbol: string;
  type: string;
  quantity: number;
}

export default function PortfolioPage() {
  const [account, setAccount] = useState<AccountData | null>(null);
  const [positions, setPositions] = useState<PositionData[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPortfolioData();

    // Listen for order placement events to refresh data
    const handleOrderPlaced = () => {
      console.log('Order placed event detected, refreshing portfolio...');
      fetchPortfolioData();
    };

    window.addEventListener('orderPlaced', handleOrderPlaced);
    return () => window.removeEventListener('orderPlaced', handleOrderPlaced);
  }, []);

  async function fetchPortfolioData() {
    try {
      // Get current user for email display
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
      }

      // Fetch account data (includes P&L calculations)
      const accountResponse = await fetch('/api/account');
      if (accountResponse.ok) {
        const accountData = await accountResponse.json();
        setAccount(accountData.account);
      }

      // Fetch positions for count
      const positionsResponse = await fetch('/api/positions');
      if (positionsResponse.ok) {
        const positionsData = await positionsResponse.json();
        setPositions(positionsData.positions || []);
      }
    } catch (err) {
      console.error('Error fetching portfolio data:', err);
    } finally {
      setLoading(false);
    }
  }

  const portfolioValue = account?.portfolio_value ?? 2000000;
  const openPositions = positions.length;
  const totalReturn = account?.total_pnl_percent ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Portfolio</CardTitle>
            <CardDescription>
              Track your positions and performance across all your options trades
              {userEmail && ` - ${userEmail}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading portfolio data...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    ${portfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Value</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    ${(account?.cash_balance ?? 2000000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-sm text-muted-foreground">Cash Available</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{openPositions}</div>
                  <div className="text-sm text-muted-foreground">Open Positions</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className={`text-2xl font-bold ${(account?.total_pnl ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(account?.total_pnl ?? 0) >= 0 ? '+' : ''}${Math.abs(account?.total_pnl ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total P&L ({totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(2)}%)
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <PortfolioOverview />
            <ActivePositions />
          </div>
          <div>
            <RecentTrades />
          </div>
        </div>
      </main>
    </div>
  );
}
