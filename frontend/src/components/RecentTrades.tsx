'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

interface Trade {
  id: string;
  symbol: string;
  option_type: 'call' | 'put';
  strike_price: number;
  expiry_date: string;
  action: 'buy' | 'sell';
  quantity: number;
  premium: number;
  created_at: string;
  updated_at: string;
}

export default function RecentTrades() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrades = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/trades');
        
        if (!response.ok) {
          throw new Error('Failed to fetch trades');
        }

        const data = await response.json();
        
        if (data.success) {
          setTrades(data.data || []);
        } else {
          setError(data.error || 'Failed to load trades');
        }
      } catch (err) {
        console.error('Error fetching trades:', err);
        setError('Failed to load recent trades');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrades();
  }, []);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Trades</CardTitle>
        <CardDescription>Your latest options transactions</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading trades...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>{error}</p>
          </div>
        ) : trades.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No trades yet. Start trading to see your history here!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {trades.map((trade) => (
              <div key={trade.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                <div>
                  <div className="font-medium">
                    {trade.symbol} ${trade.strike_price}{trade.option_type === 'call' ? 'C' : 'P'} {formatDate(trade.expiry_date)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {trade.quantity} contracts @ ${trade.premium.toFixed(2)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Total: ${(trade.premium * trade.quantity * 100).toFixed(2)}
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={trade.action === 'buy' ? 'default' : 'secondary'}>
                    {trade.action.toUpperCase()}
                  </Badge>
                  <div className="text-sm text-muted-foreground mt-1">
                    {formatTime(trade.created_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}