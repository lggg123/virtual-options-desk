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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Portfolio</h1>
            <p className="text-muted-foreground">Track your positions and performance</p>
          </div>
        </div>

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
