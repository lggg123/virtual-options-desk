import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DashboardHeader from '@/components/DashboardHeader';
import PortfolioOverview from '@/components/PortfolioOverview';
import ActivePositions from '@/components/ActivePositions';
import RecentTrades from '@/components/RecentTrades';

export default function PortfolioPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Portfolio</CardTitle>
            <CardDescription>
              Track your positions and performance across all your options trades
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-green-600">$45,231.89</div>
                <div className="text-sm text-muted-foreground">Total Value</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-blue-600">23</div>
                <div className="text-sm text-muted-foreground">Open Positions</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-orange-600">+18.5%</div>
                <div className="text-sm text-muted-foreground">Total Return</div>
              </div>
            </div>
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
