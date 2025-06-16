// components/options/OptionsChain.tsx
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { calculateBlackScholes } from '@/lib/calculations/black-scholes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';

interface Option {
  id: string;
  symbol: string;
  underlying_symbol: string;
  strike_price: number;
  expiration_date: string;
  option_type: 'call' | 'put';
}

interface OptionsChainProps {
  symbol: string;
  spotPrice: number;
}

export function OptionsChain({ symbol, spotPrice }: OptionsChainProps) {
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  useEffect(() => {
    fetchOptions();
  }, [symbol]);
  
  const fetchOptions = async () => {
    const { data, error } = await supabase
      .from('options')
      .select('*')
      .eq('underlying_symbol', symbol)
      .order('expiration_date', { ascending: true })
      .order('strike_price', { ascending: true });
    
    if (data) {
      setOptions(data);
    }
    setLoading(false);
  };
  
  const calculatePrice = (option: Option) => {
    const timeToExpiry = (new Date(option.expiration_date).getTime() - new Date().getTime()) / (365 * 24 * 60 * 60 * 1000);
    
    const result = calculateBlackScholes({
      spotPrice,
      strikePrice: option.strike_price,
      timeToExpiry,
      riskFreeRate: 0.05, // 5% risk-free rate
      volatility: 0.25, // 25% implied volatility (would be dynamic in real app)
      optionType: option.option_type
    });
    
    return result;
  };
  
  const handleTrade = async (option: Option, orderType: 'buy' | 'sell') => {
    const { price } = calculatePrice(option);
    
    const response = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        optionId: option.id,
        orderType,
        quantity: 1,
        price
      })
    });
    
    if (response.ok) {
      toast({
        title: "Order Placed",
        description: `Successfully ${orderType === 'buy' ? 'bought' : 'sold'} 1 contract at ${price}`,
      });
    } else {
      const error = await response.json();
      toast({
        title: "Order Failed",
        description: error.error,
        variant: "destructive",
      });
    }
  };
  
  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading options chain...</div>
        </CardContent>
      </Card>
    );
  }
  
  const calls = options.filter(o => o.option_type === 'call');
  const puts = options.filter(o => o.option_type === 'put');
  
  const OptionTable = ({ options, type }: { options: Option[], type: 'call' | 'put' }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Strike</TableHead>
          <TableHead>Expiry</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>Delta</TableHead>
          <TableHead>IV</TableHead>
          <TableHead className="text-center">Moneyness</TableHead>
          <TableHead className="text-right">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {options.map(option => {
          const { price, greeks } = calculatePrice(option);
          const moneyness = type === 'call' 
            ? spotPrice - option.strike_price
            : option.strike_price - spotPrice;
          
          return (
            <TableRow key={option.id}>
              <TableCell className="font-medium">${option.strike_price}</TableCell>
              <TableCell>{new Date(option.expiration_date).toLocaleDateString()}</TableCell>
              <TableCell>${price.toFixed(2)}</TableCell>
              <TableCell>{greeks.delta.toFixed(3)}</TableCell>
              <TableCell>25%</TableCell>
              <TableCell className="text-center">
                {moneyness > 0 ? (
                  <Badge variant="default">ITM</Badge>
                ) : moneyness < 0 ? (
                  <Badge variant="secondary">OTM</Badge>
                ) : (
                  <Badge variant="outline">ATM</Badge>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button size="sm" onClick={() => handleTrade(option, 'buy')}>
                  Buy
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Options Chain - {symbol}</CardTitle>
        <div className="text-sm text-muted-foreground">
          Spot Price: ${spotPrice.toFixed(2)}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="calls" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="calls">Calls</TabsTrigger>
            <TabsTrigger value="puts">Puts</TabsTrigger>
          </TabsList>
          <TabsContent value="calls">
            <OptionTable options={calls} type="call" />
          </TabsContent>
          <TabsContent value="puts">
            <OptionTable options={puts} type="put" />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}