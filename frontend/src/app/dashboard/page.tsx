import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DashboardHeader from '@/components/DashboardHeader';
import DashboardMetrics from '@/components/DashboardMetrics';
import LiveOptionsChain from '@/components/LiveOptionsChain';
import PortfolioOverview from '@/components/PortfolioOverview';
import RecentTrades from '@/components/RecentTrades';
import MarketData from '@/components/MarketData';

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Key Metrics Cards - Now using real data */}
        <DashboardMetrics />

        {/* Main Dashboard Content */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <h2 className="text-xl sm:text-2xl font-bold">Dashboard Overview</h2>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
              Refresh Data
            </Button>
            <Button size="sm" className="flex-1 sm:flex-none">
              New Trade
            </Button>
            <Link href="/dashboard/breakouts" className="flex-1 sm:flex-none">
              <Button size="sm" variant="secondary" className="w-full">
                Breakout Picks
              </Button>
            </Link>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
            <TabsTrigger value="overview" className="text-xs sm:text-sm py-2">Overview</TabsTrigger>
            <TabsTrigger value="options" className="text-xs sm:text-sm py-2">Options Chain</TabsTrigger>
            <TabsTrigger value="portfolio" className="text-xs sm:text-sm py-2">Portfolio</TabsTrigger>
            <TabsTrigger value="analysis" className="text-xs sm:text-sm py-2">Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MarketData />
              <RecentTrades />
            </div>
            <PortfolioOverview />
          </TabsContent>

          <TabsContent value="options" className="space-y-4">
            <LiveOptionsChain />
          </TabsContent>

          <TabsContent value="portfolio" className="space-y-4">
            <PortfolioOverview />
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Risk Analysis</CardTitle>
                <CardDescription>
                  Portfolio risk metrics and Greeks analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Risk analysis tools coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}