'use client';

import { useState, useEffect } from 'react';
import { useLiveMarketData, useOptionsChain } from '@/hooks/useLiveMarketData';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';

import type { OptionsData } from '@/hooks/useLiveMarketData';

export default function LiveOptionsChain() {
  const [symbol, setSymbol] = useState('AAPL');
  const [expiry, setExpiry] = useState('');
  const { data: marketData, loading: loadingMarket } = useLiveMarketData(symbol);
  const { options, expirations, loading: loadingOptions, error: optionsError } = useOptionsChain(symbol, expiry);

  // Auto-select the first (nearest) expiration date when available
  useEffect(() => {
    if (Array.isArray(expirations) && expirations.length > 0 && !expiry) {
      setExpiry(expirations[0]);
    }
  }, [expirations, expiry]);

  // ...existing code...

  const handleTrade = (option: OptionsData, type: 'call' | 'put', action: 'buy' | 'sell') => {
    // Dispatch custom event to prefill the order form
    const orderData = {
      symbol,
      optionType: type,
      strike: option.strike,
      expiry: expiry,
      quantity: 1,
      price: action === 'buy' ? option.ask : option.bid,
      orderType: 'limit' as const,
      action: action
    };

    window.dispatchEvent(new CustomEvent('prefillOrder', { detail: orderData }));
    toast.success(`Order form prefilled: ${action.toUpperCase()} ${type.toUpperCase()} ${symbol} $${option.strike}`);
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
          <div className="flex flex-col sm:flex-row gap-4">
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
              <Select value={expiry} onValueChange={setExpiry}>
                <SelectTrigger id="chain-expiry">
                  <SelectValue placeholder="Select expiration date" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(expirations) && expirations.length > 0 ? (
                    expirations.map((date) => (
                      <SelectItem key={date} value={date}>
                        {new Date(date).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="" disabled>
                      No expirations available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
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
                <div className="text-2xl font-bold">
                  {loadingMarket || !marketData || typeof marketData.price !== 'number' ? 'Loading...' : `$${marketData.price.toFixed(2)}`}
                </div>
                {marketData && typeof marketData.change === 'number' && typeof marketData.changePercent === 'number' && typeof marketData.previousClose === 'number' ? (
                  <>
                    <div className={`text-sm flex items-center ${marketData.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {marketData.change >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                      {marketData.change >= 0 ? '+' : ''}${marketData.change.toFixed(2)} ({marketData.changePercent.toFixed(2)}%)
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center mt-1">
                      Previous: ${marketData.previousClose.toFixed(2)}
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          {/* Options Chain */}
          {optionsError && (
            <div className="text-red-600 text-sm">{optionsError}</div>
          )}
          {!Array.isArray(options) || options.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">No options data available for this symbol/expiry.</div>
          ) : (
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
                      {loadingOptions ? (
                        <TableRow><TableCell colSpan={9}>Loading...</TableCell></TableRow>
                      ) : (
                        options.filter(o => o.type === 'call').map((option) => (
                          <TableRow key={option.strike} className={marketData && typeof marketData.price === 'number' && Math.abs(option.strike - marketData.price) < 5 ? 'bg-muted/50' : ''}>
                            <TableCell className="font-medium">
                              ${option.strike}
                              {marketData && typeof marketData.price === 'number' && Math.abs(option.strike - marketData.price) < 5 && (
                                <Badge variant="secondary" className="ml-1 text-xs">ATM</Badge>
                              )}
                            </TableCell>
                            <TableCell>{typeof option.bid === 'number' ? `$${option.bid.toFixed(2)}` : '-'}</TableCell>
                            <TableCell>{typeof option.ask === 'number' ? `$${option.ask.toFixed(2)}` : '-'}</TableCell>
                            <TableCell className="font-medium">{typeof option.last === 'number' ? `$${option.last.toFixed(2)}` : '-'}</TableCell>
                            <TableCell>{typeof option.volume === 'number' ? option.volume.toLocaleString() : '-'}</TableCell>
                            <TableCell>{typeof option.openInterest === 'number' ? option.openInterest.toLocaleString() : '-'}</TableCell>
                            <TableCell>{typeof option.impliedVolatility === 'number' ? `${option.impliedVolatility.toFixed(1)}%` : '-'}</TableCell>
                            <TableCell>{typeof option.delta === 'number' ? option.delta.toFixed(2) : '-'}</TableCell>
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
                        ))
                      )}
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
                      {loadingOptions ? (
                        <TableRow><TableCell colSpan={9}>Loading...</TableCell></TableRow>
                      ) : (
                        options.filter(o => o.type === 'put').map((option) => (
                          <TableRow key={option.strike} className={marketData && typeof marketData.price === 'number' && Math.abs(option.strike - marketData.price) < 5 ? 'bg-muted/50' : ''}>
                            <TableCell className="font-medium">
                              ${option.strike}
                              {marketData && typeof marketData.price === 'number' && Math.abs(option.strike - marketData.price) < 5 && (
                                <Badge variant="secondary" className="ml-1 text-xs">ATM</Badge>
                              )}
                            </TableCell>
                            <TableCell>{typeof option.bid === 'number' ? `$${option.bid.toFixed(2)}` : '-'}</TableCell>
                            <TableCell>{typeof option.ask === 'number' ? `$${option.ask.toFixed(2)}` : '-'}</TableCell>
                            <TableCell className="font-medium">{typeof option.last === 'number' ? `$${option.last.toFixed(2)}` : '-'}</TableCell>
                            <TableCell>{typeof option.volume === 'number' ? option.volume.toLocaleString() : '-'}</TableCell>
                            <TableCell>{typeof option.openInterest === 'number' ? option.openInterest.toLocaleString() : '-'}</TableCell>
                            <TableCell>{typeof option.impliedVolatility === 'number' ? `${option.impliedVolatility.toFixed(1)}%` : '-'}</TableCell>
                            <TableCell>{typeof option.delta === 'number' ? option.delta.toFixed(2) : '-'}</TableCell>
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
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </CardContent>
    </Card>
  );
}