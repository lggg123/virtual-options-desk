'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import DashboardHeader from '@/components/DashboardHeader';
import StockSelector from '@/components/StockSelector';
import FullOrderEntry from '@/components/FullOrderEntry';
import LiveOptionsChain from '@/components/LiveOptionsChain';
import ActivePositions from '@/components/ActivePositions';
import TradingChart from '@/components/TradingChart';
import MarketScanner from '@/components/MarketScanner';
import RiskCalculator from '@/components/RiskCalculator';

export default function TradingPage() {
  const [selectedSymbol, setSelectedSymbol] = useState('SPY');

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Stock Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Stock Selector</CardTitle>
            <CardDescription>Select a stock to trade</CardDescription>
          </CardHeader>
          <CardContent>
            <StockSelector
              onSelectStock={setSelectedSymbol}
              currentSymbol={selectedSymbol}
            />
          </CardContent>
        </Card>

        {/* Top Row - Chart and Order Entry */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Trading Chart</CardTitle>
                <CardDescription>Visualize price and technicals</CardDescription>
              </CardHeader>
              <CardContent>
                <TradingChart symbol={selectedSymbol} />
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Order Entry</CardTitle>
                <CardDescription>Place trades</CardDescription>
              </CardHeader>
              <CardContent>
                <FullOrderEntry />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Trading Interface */}
        <Card>
          <CardHeader>
            <CardTitle>Trading Tools</CardTitle>
            <CardDescription>Options, positions, scanner, and risk</CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </main>
    </div>
  );
}