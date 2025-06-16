import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function OptionsChain() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Options Chain</CardTitle>
        <CardDescription>Live options data and trading interface</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex space-x-4">
            <div className="flex-1">
              <Label htmlFor="symbol">Symbol</Label>
              <Input id="symbol" placeholder="Enter symbol (e.g., AAPL)" />
            </div>
            <div className="flex-1">
              <Label htmlFor="expiry">Expiry Date</Label>
              <Input id="expiry" type="date" />
            </div>
            <div className="flex items-end">
              <Button>Load Chain</Button>
            </div>
          </div>
          
          <div className="text-center py-8 text-muted-foreground">
            Enter a symbol and expiry date to view the options chain
          </div>
        </div>
      </CardContent>
    </Card>
  );
}