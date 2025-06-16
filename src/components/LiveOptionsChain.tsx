'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';

export default function LiveOptionsChain() {
  const [symbol, setSymbol] = useState('AAPL');
  const [expiry, setExpiry] = useState('2024-02-16');
  const [isLoading, setIsLoading] = useState(false);
  const [stockPrice, setStockPrice] = useState(182.45);

  // Mock options data
  const [callOptions, setCallOptions] = useState([
    { strike: 175, bid: 8.20, ask: 8.30, last: 8.25, volume: 1250, openInterest: 4580, iv: 28.5, delta: 0.75, gamma: 0.012 },
    { strike: 180, bid: 4.80, ask: 4.90, last: 4.85, volume: 2150, openInterest: 6720, iv: 29.8, delta: 0.65, gamma: 0.015 },
    { strike: 185, bid: 2.15, ask: 2.25, last: 2.20, volume: 1890, openInterest: 3240, iv: 31.2, delta: 0.45, gamma: 0.018 },
    { strike: 190, bid: 0.85, ask: 0.95, last: 0.90, volume: 980, openInterest: 2140, iv: 32.8, delta: 0.28, gamma: 0.016 },
  ]);

  const [putOptions, setPutOptions] = useState([
    { strike: 175, bid: 1.20, ask: 1.30, last: 1.25, volume: 850, openInterest: 2580, iv: 27.5, delta: -0.25, gamma: 0.012 },
    { strike: 180, bid: 2.80, ask: 2.90, last: 2.85, volume: 1650, openInterest: 4720, iv: 28.8, delta: -0.35, gamma: 0.015 },
    { strike: 185, bid: 5.15, ask: 5.25, last: 5.20, volume: 1390, openInterest: 5240, iv: 30.2, delta: -0.55, gamma: 0.018 },
    { strike: 190, bid: 8.85, ask: 8.95, last: 8.90, volume: 780, openInterest: 3140, iv: 31.8, delta: -0.72, gamma: 0.016 },
  ]);

  const refreshChain = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock price updates
      setStockPrice(prev => prev + (Math.random() - 0.5) * 2);
      
      toast.success(`Options chain refreshed for ${symbol}`);
    } catch (error) {
      toast.error('Failed to refresh options chain');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrade = (option: any, type: 'call' | 'put', action: 'buy' | 'sell') => {
    toast.success(`${action.toUpperCase()} ${type.toUpperCase()} ${symbol} $${option.strike} initiated`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Options Chain</CardTitle>
        <CardDescription>Real-time options data with trading capabilities</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Controls */}
          <div className="flex space-x-4">
            <div className="flex-1">
              <Label htmlFor="chain-symbol">Symbol</Label>
              <Input
                id="chain-symbol"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                placeholder="Enter symbol"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="chain-expiry">Expiry Date</Label>
              <Input
                id="chain-expiry"
                type="date"
                value={expiry}
                onChange={(e) => setExpiry(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={refreshChain} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Stock Price */}
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-lg font-semibold">{symbol}</span>
                <Badge variant="outline" className="ml-2">Stock</Badge>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">${stockPrice.toFixed(2)}</div>
                <div className="text-sm text-green-600 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +$2.15 (+1.19%)
                </div>
              </div>
            </div>
          </div>

          {/* Options Chain */}
          <Tabs defaultValue="calls" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="calls">Calls</TabsTrigger>
              <TabsTrigger value="puts">Puts</TabsTrigger>
            </TabsList>

            <TabsContent value="calls">
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Strike</TableHead>
                      <TableHead>Bid</TableHead>
                      <TableHead>Ask</TableHead>
                      <TableHead>Last</TableHead>
                      <TableHead>Volume</TableHead>
                      <TableHead>OI</TableHead>
                      <TableHead>IV</TableHead>
                      <TableHead>Delta</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {callOptions.map((option) => (
                      <TableRow key={option.strike} className={option.strike === 180 ? 'bg-muted/50' : ''}>
                        <TableCell className="font-medium">
                          ${option.strike}
                          {Math.abs(option.strike - stockPrice) < 5 && (
                            <Badge variant="secondary" className="ml-1 text-xs">ATM</Badge>
                          )}
                        </TableCell>
                        <TableCell>${option.bid.toFixed(2)}</TableCell>
                        <TableCell>${option.ask.toFixed(2)}</TableCell>
                        <TableCell className="font-medium">${option.last.toFixed(2)}</TableCell>
                        <TableCell>{option.volume.toLocaleString()}</TableCell>
                        <TableCell>{option.openInterest.toLocaleString()}</TableCell>
                        <TableCell>{option.iv.toFixed(1)}%</TableCell>
                        <TableCell>{option.delta.toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleTrade(option, 'call', 'buy')}
                            >
                              Buy
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleTrade(option, 'call', 'sell')}
                            >
                              Sell
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="puts">
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Strike</TableHead>
                      <TableHead>Bid</TableHead>
                      <TableHead>Ask</TableHead>
                      <TableHead>Last</TableHead>
                      <TableHead>Volume</TableHead>
                      <TableHead>OI</TableHead>
                      <TableHead>IV</TableHead>
                      <TableHead>Delta</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {putOptions.map((option) => (
                      <TableRow key={option.strike} className={option.strike === 180 ? 'bg-muted/50' : ''}>
                        <TableCell className="font-medium">
                          ${option.strike}
                          {Math.abs(option.strike - stockPrice) < 5 && (
                            <Badge variant="secondary" className="ml-1 text-xs">ATM</Badge>
                          )}
                        </TableCell>
                        <TableCell>${option.bid.toFixed(2)}</TableCell>
                        <TableCell>${option.ask.toFixed(2)}</TableCell>
                        <TableCell className="font-medium">${option.last.toFixed(2)}</TableCell>
                        <TableCell>{option.volume.toLocaleString()}</TableCell>
                        <TableCell>{option.openInterest.toLocaleString()}</TableCell>
                        <TableCell>{option.iv.toFixed(1)}%</TableCell>
                        <TableCell>{option.delta.toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleTrade(option, 'put', 'buy')}
                            >
                              Buy
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleTrade(option, 'put', 'sell')}
                            >
                              Sell
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
}