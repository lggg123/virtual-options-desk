'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Calculator, TrendingUp, TrendingDown, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface OrderData {
  symbol: string;
  optionType: 'call' | 'put';
  strike: number;
  expiry: string;
  quantity: number;
  price: number;
  orderType: 'market' | 'limit';
  action: 'buy' | 'sell';
  strategy: string;
}

const STRATEGY_OPTIONS = [
  { value: 'single', label: 'Single Leg' },
  { value: 'vertical_call', label: 'Vertical Call Spread' },
  { value: 'vertical_put', label: 'Vertical Put Spread' },
  { value: 'straddle', label: 'Straddle' },
  { value: 'strangle', label: 'Strangle' },
  { value: 'iron_condor', label: 'Iron Condor' },
  { value: 'covered_call', label: 'Covered Call' },
  { value: 'protective_put', label: 'Protective Put' },
];

export default function OrderEntry() {
  const [orderData, setOrderData] = useState<OrderData>({
    symbol: '',
    optionType: 'call',
    strike: 0,
    expiry: '',
    quantity: 1,
    price: 0,
    orderType: 'limit',
    action: 'buy',
    strategy: 'single',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Listen for prefillOrder events from options chain
  useEffect(() => {
    const handlePrefillOrder = (event: CustomEvent<Partial<OrderData>>) => {
      setOrderData(prev => ({ ...prev, ...event.detail }));
    };

    window.addEventListener('prefillOrder', handlePrefillOrder as EventListener);
    return () => {
      window.removeEventListener('prefillOrder', handlePrefillOrder as EventListener);
    };
  }, []);

  const calculateOrderValue = () => {
    return orderData.quantity * orderData.price * 100;
  };

  const isOrderValid = () => {
    return (
      orderData.symbol &&
      orderData.strike > 0 &&
      orderData.expiry &&
      orderData.quantity > 0 &&
      (orderData.orderType === 'market' || orderData.price > 0)
    );
  };

  const submitOrder = async () => {
    if (!isOrderValid()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/trades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol: orderData.symbol,
          type: orderData.optionType,
          action: orderData.action,
          strike: orderData.strike,
          expiry: orderData.expiry,
          quantity: orderData.quantity,
          price: orderData.price,
          strategy: orderData.strategy,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to place order');
      }

      const actionText = orderData.action === 'buy' ? 'BUY' : 'SELL';
      toast.success('Order Placed!', {
        description: `${actionText} ${orderData.quantity} ${orderData.symbol} $${orderData.strike}${orderData.optionType.charAt(0).toUpperCase()} ${orderData.expiry}`
      });

      // Reset form
      setOrderData({
        symbol: '',
        optionType: 'call',
        strike: 0,
        expiry: '',
        quantity: 1,
        price: 0,
        orderType: 'limit',
        action: 'buy',
        strategy: 'single',
      });

      // Notify other components
      window.dispatchEvent(new CustomEvent('orderPlaced', { detail: result }));

    } catch (error) {
      console.error('Order submission error:', error);
      toast.error(`Order Failed - ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Quick Order
        </CardTitle>
        <CardDescription>Place options orders</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Buy/Sell Toggle */}
        <RadioGroup
          value={orderData.action}
          onValueChange={(value: 'buy' | 'sell') => setOrderData({...orderData, action: value})}
          className="flex space-x-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="buy" id="buy" />
            <Label htmlFor="buy" className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Buy
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="sell" id="sell" />
            <Label htmlFor="sell" className="flex items-center gap-1">
              <TrendingDown className="h-4 w-4 text-red-600" />
              Sell
            </Label>
          </div>
        </RadioGroup>

        {/* Strategy Selection */}
        <div>
          <Label htmlFor="strategy">Strategy</Label>
          <Select
            value={orderData.strategy}
            onValueChange={(value) => setOrderData({...orderData, strategy: value})}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select strategy" />
            </SelectTrigger>
            <SelectContent>
              {STRATEGY_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Symbol and Option Type */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="symbol">Symbol</Label>
            <Input
              id="symbol"
              placeholder="SPY"
              value={orderData.symbol}
              onChange={(e) => setOrderData({...orderData, symbol: e.target.value.toUpperCase()})}
            />
          </div>
          <div>
            <Label htmlFor="option-type">Type</Label>
            <Select
              value={orderData.optionType}
              onValueChange={(value: 'call' | 'put') => setOrderData({...orderData, optionType: value})}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="call">Call</SelectItem>
                <SelectItem value="put">Put</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Strike and Expiry */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="strike">Strike</Label>
            <Input
              id="strike"
              type="number"
              step="0.01"
              placeholder="680"
              value={orderData.strike || ''}
              onChange={(e) => setOrderData({...orderData, strike: parseFloat(e.target.value) || 0})}
            />
          </div>
          <div>
            <Label htmlFor="expiry">Expiry</Label>
            <Input
              id="expiry"
              type="date"
              value={orderData.expiry}
              onChange={(e) => setOrderData({...orderData, expiry: e.target.value})}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        {/* Quantity and Price */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="quantity">Contracts</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={orderData.quantity}
              onChange={(e) => setOrderData({...orderData, quantity: parseFloat(e.target.value) || 1})}
            />
          </div>
          <div>
            <Label htmlFor="price">Price</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              placeholder="18.00"
              value={orderData.price || ''}
              onChange={(e) => setOrderData({...orderData, price: parseFloat(e.target.value) || 0})}
            />
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-muted p-3 rounded-lg space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Order Value:</span>
            <Badge variant="outline">${calculateOrderValue().toLocaleString()}</Badge>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Strategy:</span>
            <span>{STRATEGY_OPTIONS.find(s => s.value === orderData.strategy)?.label}</span>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          onClick={submitOrder}
          className="w-full"
          variant={orderData.action === 'buy' ? 'default' : 'destructive'}
          disabled={!isOrderValid() || isSubmitting}
        >
          {isSubmitting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Placing Order...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              {orderData.action === 'buy' ? 'Buy to Open' : 'Sell to Open'}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
