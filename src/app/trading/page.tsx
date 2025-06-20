import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DashboardHeader from '@/components/DashboardHeader';
import FullOrderEntry from '@/components/FullOrderEntry';
import LiveOptionsChain from '@/components/LiveOptionsChain';
import ActivePositions from '@/components/ActivePositions';
import TradingChart from '@/components/TradingChart';
import MarketScanner from '@/components/MarketScanner';
import RiskCalculator from '@/components/RiskCalculator';

export default function TradingPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl font-bold">Options Trading</CardTitle>
            <CardDescription>
              Advanced options trading platform with real-time data and analytics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-blue-600">SPY</div>
                <div className="text-sm text-muted-foreground">Active Symbol</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-green-600">$425.50</div>
                <div className="text-sm text-muted-foreground">Last Price</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-orange-600">0.25</div>
                <div className="text-sm text-muted-foreground">IV Rank</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-purple-600">7</div>
                <div className="text-sm text-muted-foreground">DTE</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Row - Chart and Order Entry */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TradingChart />
          </div>
          <div>
            <FullOrderEntry />
          </div>
        </div>

        {/* Main Trading Interface */}
        <Tabs defaultValue="chain" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="chain">Options Chain</TabsTrigger>
            <TabsTrigger value="positions">Positions</TabsTrigger>
            <TabsTrigger value="scanner">Scanner</TabsTrigger>
            <TabsTrigger value="risk">Risk</TabsTrigger>
          </TabsList>

          <TabsContent value="chain" className="space-y-4">
            <LiveOptionsChain />
          </TabsContent>

          <TabsContent value="positions" className="space-y-4">
            <ActivePositions />
          </TabsContent>

          <TabsContent value="scanner" className="space-y-4">
            <MarketScanner />
          </TabsContent>

          <TabsContent value="risk" className="space-y-4">
            <RiskCalculator />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}