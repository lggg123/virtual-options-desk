'use client';

import { useState } from 'react';
import { useLiveMarketData, useOptionsChain, OptionsData } from '@/hooks/useLiveMarketData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function OptionsChainTrading() {
  const [symbol, setSymbol] = useState('AAPL');
  const [expiry, setExpiry] = useState('');
  const { data: marketData, loading: loadingMarket } = useLiveMarketData(symbol);
  const { options, loading: loadingOptions } = useOptionsChain(symbol, expiry);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Options Chain</CardTitle>
        <CardDescription>Live options data with trading capabilities</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Symbol and Expiry Selection */}
          <div className="flex space-x-4">
            <div className="flex-1">
              <Label htmlFor="chain-symbol">Symbol</Label>
              <Input
                id="chain-symbol"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
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
              <Button>Refresh</Button>
            </div>
          </div>

          {/* Current Stock Price */}
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-lg font-semibold">{symbol}</span>
                <Badge variant="outline" className="ml-2">Stock</Badge>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  {loadingMarket || !marketData ? 'Loading...' : `$${marketData.price.toFixed(2)}`}
                </div>
                {marketData && (
                  <div className={`text-sm flex items-center ${marketData.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {marketData.change >= 0 ? '+' : ''}${marketData.change.toFixed(2)} ({marketData.changePercent.toFixed(2)}%)
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Options Chain Tables */}
          <Tabs defaultValue="calls" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="calls">Calls</TabsTrigger>
              <TabsTrigger value="puts">Puts</TabsTrigger>
            </TabsList>

            <TabsContent value="calls">
              <div className="border rounded-lg">
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
                    {loadingOptions ? (
                      <TableRow><TableCell colSpan={9}>Loading...</TableCell></TableRow>
                    ) : (
                      options.filter(o => o.type === 'call').map((option: OptionsData) => (
                        <TableRow key={option.strike}>
                          <TableCell className="font-medium">${option.strike}</TableCell>
                          <TableCell>${option.bid.toFixed(2)}</TableCell>
                          <TableCell>${option.ask.toFixed(2)}</TableCell>
                          <TableCell>${option.last.toFixed(2)}</TableCell>
                          <TableCell>{option.volume?.toLocaleString()}</TableCell>
                          <TableCell>{option.openInterest?.toLocaleString()}</TableCell>
                          <TableCell>{option.impliedVolatility?.toFixed(1)}%</TableCell>
                          <TableCell>{option.delta?.toFixed(2)}</TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              <Button size="sm" variant="outline">Buy</Button>
                              <Button size="sm" variant="outline">Sell</Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="puts">
              <div className="border rounded-lg">
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
                    {loadingOptions ? (
                      <TableRow><TableCell colSpan={9}>Loading...</TableCell></TableRow>
                    ) : (
                      options.filter(o => o.type === 'put').map((option: OptionsData) => (
                        <TableRow key={option.strike}>
                          <TableCell className="font-medium">${option.strike}</TableCell>
                          <TableCell>${option.bid.toFixed(2)}</TableCell>
                          <TableCell>${option.ask.toFixed(2)}</TableCell>
                          <TableCell>${option.last.toFixed(2)}</TableCell>
                          <TableCell>{option.volume?.toLocaleString()}</TableCell>
                          <TableCell>{option.openInterest?.toLocaleString()}</TableCell>
                          <TableCell>{option.impliedVolatility?.toFixed(1)}%</TableCell>
                          <TableCell>{option.delta?.toFixed(2)}</TableCell>
                          <TableCell>
                            <div className="flex space-x-1">
                              <Button size="sm" variant="outline">Buy</Button>
                              <Button size="sm" variant="outline">Sell</Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
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