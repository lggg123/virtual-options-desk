'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calculator, TrendingUp, TrendingDown, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner'; // Changed from useToast to sonner

interface OrderData {
  symbol: string;
  optionType: 'call' | 'put';
  strike: number;
  expiry: string;
  quantity: number;
  price: number;
  orderType: 'market' | 'limit' | 'stop';
  action: 'buy' | 'sell';
}

interface OrderPreview {
  contract: string;
  action: string;
  quantity: number;
  orderType: string;
  price: string;
  totalValue: number;
  estimatedCommission: number;
}

export default function FullOrderEntry() {
  const [orderData, setOrderData] = useState<OrderData>({
    symbol: '',
    optionType: 'call',
    strike: 0,
    expiry: '',
    quantity: 1,
    price: 0,
    orderType: 'limit',
    action: 'buy'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderPreview, setOrderPreview] = useState<OrderPreview | null>(null);

  // Listen for prefillOrder events from options chain
  useEffect(() => {
    const handlePrefillOrder = (event: CustomEvent<OrderData>) => {
      setOrderData(event.detail);
      setOrderPreview(null); // Clear any existing preview
    };

    window.addEventListener('prefillOrder', handlePrefillOrder as EventListener);
    return () => {
      window.removeEventListener('prefillOrder', handlePrefillOrder as EventListener);
    };
  }, []);

  const calculateOrderValue = () => {
    return orderData.quantity * orderData.price * 100;
  };

  const validateOrder = () => {
    const errors = [];
    
    if (!orderData.symbol) errors.push('Symbol is required');
    if (orderData.strike <= 0) errors.push('Strike price must be greater than 0');
    if (!orderData.expiry) errors.push('Expiry date is required');
    if (orderData.quantity <= 0) errors.push('Quantity must be greater than 0');
    if (orderData.orderType === 'limit' && orderData.price <= 0) errors.push('Limit price is required');
    
    return errors;
  };

  const isOrderValid = () => {
    return validateOrder().length === 0;
  };

  const previewOrder = () => {
    const errors = validateOrder();
    if (errors.length > 0) {
      toast.error(`Validation Error: ${errors.join(', ')}`);
      return;
    }

    const preview = {
      contract: `${orderData.symbol} ${orderData.expiry} ${orderData.strike}${orderData.optionType.charAt(0).toUpperCase()}`,
      action: orderData.action.toUpperCase(),
      quantity: orderData.quantity,
      orderType: orderData.orderType.toUpperCase(),
      price: orderData.orderType === 'market' ? 'Market' : `$${orderData.price.toFixed(2)}`,
      totalValue: calculateOrderValue(),
      estimatedCommission: orderData.quantity * 0.65, // $0.65 per contract
    };

    setOrderPreview(preview);
    toast.success('Order preview generated successfully!');
  };

  const submitOrder = async () => {
    console.log('Submit order clicked!'); // Debug log
    
    const errors = validateOrder();
    if (errors.length > 0) {
      toast.error(`Validation Error: ${errors.join(', ')}`);
      return;
    }

    setIsSubmitting(true);

    try {
      // Create option identifier for the backend
      const optionId = `${orderData.symbol}-${orderData.expiry}-${orderData.strike}-${orderData.optionType}`;
      
      // Prepare order data for API
      const orderPayload = {
        optionId,
        orderType: orderData.action, // 'buy' or 'sell'
        quantity: orderData.quantity,
        price: orderData.orderType === 'market' ? 0 : orderData.price, // Use 0 for market orders
      };

      console.log('Placing order:', orderPayload);

      // Make actual API call to place the order
      const response = await fetch('/api/options/price/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderPayload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to place order');
      }

      const actionText = orderData.action === 'buy' ? 'BUY TO OPEN' : 'SELL TO OPEN';
      const contractText = `${orderData.symbol} $${orderData.strike}${orderData.optionType.charAt(0).toUpperCase()} ${orderData.expiry}`;
      
      toast.success('Order Placed Successfully!', {
        description: `${actionText} ${orderData.quantity} ${contractText} - New Balance: $${result.newBalance?.toLocaleString()}`
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
        action: 'buy'
      });
      setOrderPreview(null);

      // Trigger a custom event to notify other components to refresh
      window.dispatchEvent(new CustomEvent('orderPlaced', { detail: result }));

    } catch (error) {
      console.error('Order submission error:', error);
      toast.error(`Order Failed - ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick fill function for testing
  const quickFillAAPL = () => {
    // Calculate a future expiry date (next Friday, roughly 3 weeks out)
    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + 21); // 3 weeks from now
    // Adjust to next Friday
    const dayOfWeek = futureDate.getDay();
    const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7;
    futureDate.setDate(futureDate.getDate() + daysUntilFriday);
    const expiryDate = futureDate.toISOString().split('T')[0];

    setOrderData({
      symbol: 'AAPL',
      optionType: 'call',
      strike: 230,
      expiry: expiryDate,
      quantity: 1,
      price: 3.25,
      orderType: 'limit',
      action: 'buy'
    });
    toast.info('Form filled with AAPL sample data');
  };

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Order Entry
        </CardTitle>
        <CardDescription>Place options orders</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Fill Button for Testing */}
        <Button 
          onClick={quickFillAAPL}
          variant="outline" 
          size="sm"
          className="w-full"
        >
          Quick Fill AAPL (For Testing)
        </Button>

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
              Buy to Open
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="sell" id="sell" />
            <Label htmlFor="sell" className="flex items-center gap-1">
              <TrendingDown className="h-4 w-4 text-red-600" />
              Sell to Open
            </Label>
          </div>
        </RadioGroup>

        <Separator />

        {/* Symbol and Option Type */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="symbol">Symbol *</Label>
            <Input
              id="symbol"
              placeholder="AAPL"
              value={orderData.symbol}
              onChange={(e) => setOrderData({...orderData, symbol: e.target.value.toUpperCase()})}
            />
          </div>
          <div>
            <Label htmlFor="option-type">Option Type *</Label>
            <Select value={orderData.optionType} onValueChange={(value: 'call' | 'put') => setOrderData({...orderData, optionType: value})}>
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
            <Label htmlFor="strike">Strike Price *</Label>
            <Input
              id="strike"
              type="number"
              step="0.01"
              placeholder="180.00"
              value={orderData.strike || ''}
              onChange={(e) => setOrderData({...orderData, strike: parseFloat(e.target.value) || 0})}
            />
          </div>
          <div>
            <Label htmlFor="expiry">Expiry Date *</Label>
            <Input
              id="expiry"
              type="date"
              value={orderData.expiry}
              onChange={(e) => setOrderData({...orderData, expiry: e.target.value})}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        {/* Quantity and Order Type */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="quantity">Quantity *</Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              value={orderData.quantity}
              onChange={(e) => setOrderData({...orderData, quantity: parseFloat(e.target.value) || 1})}
            />
          </div>
          <div>
            <Label htmlFor="order-type">Order Type *</Label>
            <Select value={orderData.orderType} onValueChange={(value: 'market' | 'limit' | 'stop') => setOrderData({...orderData, orderType: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="market">Market</SelectItem>
                <SelectItem value="limit">Limit</SelectItem>
                <SelectItem value="stop">Stop</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Price (only for limit orders) */}
        {orderData.orderType === 'limit' && (
          <div>
            <Label htmlFor="price">Limit Price *</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="3.25"
              value={orderData.price || ''}
              onChange={(e) => setOrderData({...orderData, price: parseFloat(e.target.value) || 0})}
            />
          </div>
        )}

        {/* Order Preview */}
        {orderPreview && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div className="font-medium">Order Preview:</div>
                <div className="text-sm space-y-1">
                  <div>{orderPreview.action} {orderPreview.quantity} {orderPreview.contract}</div>
                  <div>Order Type: {orderPreview.orderType}</div>
                  <div>Price: {orderPreview.price}</div>
                  <div>Total Value: ${orderPreview.totalValue.toLocaleString()}</div>
                  <div>Est. Commission: ${orderPreview.estimatedCommission.toFixed(2)}</div>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Order Summary */}
        <div className="bg-muted p-4 rounded-lg space-y-2">
          <div className="flex justify-between">
            <span>Order Value:</span>
            <Badge variant="outline">${calculateOrderValue().toLocaleString()}</Badge>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Contracts:</span>
            <span>{orderData.quantity}</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Per Contract:</span>
            <span>${orderData.price.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Commission:</span>
            <span>${(orderData.quantity * 0.65).toFixed(2)}</span>
          </div>
        </div>

        {/* Validation Status */}
        <div className="text-sm">
          Form Valid: {isOrderValid() ? '✅ Yes' : '❌ No'}
          {!isOrderValid() && (
            <div className="text-red-600 text-xs mt-1">
              {validateOrder().join(', ')}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button 
            onClick={previewOrder} 
            variant="outline" 
            className="w-full"
            disabled={!isOrderValid()}
          >
            Preview Order
          </Button>
          
          {/* MAIN BUY TO OPEN BUTTON - This is the key fix */}
          <Button 
            onClick={submitOrder} 
            className="w-full" 
            variant={orderData.action === 'buy' ? 'default' : 'destructive'}
            disabled={!isOrderValid() || isSubmitting} // Removed orderPreview requirement
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
        </div>

        {!isOrderValid() && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Please fill in all required fields marked with *
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}