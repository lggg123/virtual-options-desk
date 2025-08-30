'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function OptionsChainTrading() {
  const [symbol, setSymbol] = useState('AAPL');
  const [expiry, setExpiry] = useState('2024-01-19');

  // Mock options data
  const callOptions = [
    { strike: 175, bid: 8.20, ask: 8.30, last: 8.25, volume: 1250, openInterest: 4580, iv: 0.285, delta: 0.75, gamma: 0.012 },
    { strike: 180, bid: 4.80, ask: 4.90, last: 4.85, volume: 2150, openInterest: 6720, iv: 0.298, delta: 0.65, gamma: 0.015 },
    { strike: 185, bid: 2.15, ask: 2.25, last: 2.20, volume: 1890, openInterest: 3240, iv: 0.312, delta: 0.45, gamma: 0.018 },
    { strike: 190, bid: 0.85, ask: 0.95, last: 0.90, volume: 980, openInterest: 2140, iv: 0.328, delta: 0.28, gamma: 0.016 },
  ];

  const putOptions = [
    { strike: 175, bid: 1.20, ask: 1.30, last: 1.25, volume: 850, openInterest: 2580, iv: 0.275, delta: -0.25, gamma: 0.012 },
    { strike: 180, bid: 2.80, ask: 2.90, last: 2.85, volume: 1650, openInterest: 4720, iv: 0.288, delta: -0.35, gamma: 0.015 },
    { strike: 185, bid: 5.15, ask: 5.25, last: 5.20, volume: 1390, openInterest: 5240, iv: 0.302, delta: -0.55, gamma: 0.018 },
    { strike: 190, bid: 8.85, ask: 8.95, last: 8.90, volume: 780, openInterest: 3140, iv: 0.318, delta: -0.72, gamma: 0.016 },
  ];

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
                <div className="text-2xl font-bold">$182.45</div>
                <div className="text-sm text-green-600">+$2.15 (+1.19%)</div>
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
                    {callOptions.map((option) => (
                      <TableRow key={option.strike}>
                        <TableCell className="font-medium">${option.strike}</TableCell>
                        <TableCell>${option.bid.toFixed(2)}</TableCell>
                        <TableCell>${option.ask.toFixed(2)}</TableCell>
                        <TableCell>${option.last.toFixed(2)}</TableCell>
                        <TableCell>{option.volume.toLocaleString()}</TableCell>
                        <TableCell>{option.openInterest.toLocaleString()}</TableCell>
                        <TableCell>{(option.iv * 100).toFixed(1)}%</TableCell>
                        <TableCell>{option.delta.toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button size="sm" variant="outline">Buy</Button>
                            <Button size="sm" variant="outline">Sell</Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
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
                    {putOptions.map((option) => (
                      <TableRow key={option.strike}>
                        <TableCell className="font-medium">${option.strike}</TableCell>
                        <TableCell>${option.bid.toFixed(2)}</TableCell>
                        <TableCell>${option.ask.toFixed(2)}</TableCell>
                        <TableCell>${option.last.toFixed(2)}</TableCell>
                        <TableCell>{option.volume.toLocaleString()}</TableCell>
                        <TableCell>{option.openInterest.toLocaleString()}</TableCell>
                        <TableCell>{(option.iv * 100).toFixed(1)}%</TableCell>
                        <TableCell>{option.delta.toFixed(2)}</TableCell>
                        <TableCell>
                          <div className="flex space-x-1">
                            <Button size="sm" variant="outline">Buy</Button>
                            <Button size="sm" variant="outline">Sell</Button>
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