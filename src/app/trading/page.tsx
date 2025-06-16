import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DashboardHeader from '@/components/DashboardHeader';
import OptionsChainTrading from '@/components/OptionsChainTrading';
import OrderEntry from '@/components/OrderEntry';
import PositionManager from '@/components/PositionManager';
import TradingChart from '@/components/TradingChart';
import MarketScanner from '@/components/MarketScanner';
import RiskCalculator from '@/components/RiskCalculator';

export default function TradingPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Options Trading</h1>
            <p className="text-muted-foreground">Advanced options trading platform</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Chart and Scanner */}
          <div className="lg:col-span-2 space-y-6">
            <TradingChart />
            <MarketScanner />
          </div>
          
          {/* Right Column - Order Entry and Risk */}
          <div className="space-y-6">
            <OrderEntry />
            <RiskCalculator />
          </div>
        </div>

        {/* Main Trading Interface */}
        <Tabs defaultValue="chain" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="chain">Options Chain</TabsTrigger>
            <TabsTrigger value="positions">Positions</TabsTrigger>
            <TabsTrigger value="strategies">Strategies</TabsTrigger>
          </TabsList>

          <TabsContent value="chain" className="space-y-4">
            <OptionsChainTrading />
          </TabsContent>

          <TabsContent value="positions" className="space-y-4">
            <PositionManager />
          </TabsContent>

          <TabsContent value="strategies" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Options Strategies</CardTitle>
                <CardDescription>
                  Pre-built and custom options strategies
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Strategy builder coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}