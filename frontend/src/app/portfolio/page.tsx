'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DashboardHeader from '@/components/DashboardHeader';
import PortfolioOverview from '@/components/PortfolioOverview';
import ActivePositions from '@/components/ActivePositions';
import RecentTrades from '@/components/RecentTrades';
import { supabase } from '@/lib/supabase/client';

interface UserProfile {
  id: string;
  email?: string;
  portfolio_value?: number;
  open_positions?: number;
  total_return?: number;
}

export default function PortfolioPage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          console.error('Error fetching user:', userError);
          setLoading(false);
          return;
        }

        // Try to fetch user profile from database
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.log('No profile found, using defaults:', profileError);
          // Use default values if no profile exists
          setUserProfile({
            id: user.id,
            email: user.email,
            portfolio_value: 100000, // Default $100k
            open_positions: 0,
            total_return: 0
          });
        } else {
          setUserProfile(profile);
        }
      } catch (err) {
        console.error('Exception fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const portfolioValue = userProfile?.portfolio_value ?? 100000;
  const openPositions = userProfile?.open_positions ?? 0;
  const totalReturn = userProfile?.total_return ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Portfolio</CardTitle>
            <CardDescription>
              Track your positions and performance across all your options trades
              {userProfile?.email && ` - ${userProfile.email}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading portfolio data...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    ${portfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Value</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{openPositions}</div>
                  <div className="text-sm text-muted-foreground">Open Positions</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <div className={`text-2xl font-bold ${totalReturn >= 0 ? 'text-orange-600' : 'text-red-600'}`}>
                    {totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Total Return</div>
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
