import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import DashboardHeader from '@/components/DashboardHeader';
import DashboardMetrics from '@/components/DashboardMetrics';
import OptionsChain from '@/components/OptionsChain';
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
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Dashboard Overview</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Refresh Data
            </Button>
            <Button size="sm">
              New Trade
            </Button>
            <Link href="/dashboard/breakouts">
              <Button size="sm" variant="secondary">
                Breakout Picks
              </Button>
            </Link>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="options">Options Chain</TabsTrigger>
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MarketData />
              <RecentTrades />
            </div>
            <PortfolioOverview />
          </TabsContent>

          <TabsContent value="options" className="space-y-4">
            <OptionsChain />
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