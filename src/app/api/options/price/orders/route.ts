// app/api/orders/route.ts
import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = await createSupabaseServer();
  
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    // Check for authentication error
    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }
    
    // For development/testing, create a mock user if not authenticated
    const mockUser = user || {
      id: 'demo-user-id',
      email: 'demo@example.com'
    };
    
    console.log('Auth user:', user ? 'authenticated' : 'using mock user for testing');
    
    if (!user && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized - Please log in' }, { status: 401 });
    }
    
    const body = await request.json();
    const { optionId, orderType, quantity, price } = body;
     // Start a transaction
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', mockUser.id)
      .single();

    // For mock user, create a mock profile if it doesn't exist
    if (!profile && !user) {
      console.log('Using mock profile for testing');
    } else if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Get portfolio
    const { data: portfolio } = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', mockUser.id)
      .single();

    // For mock user, create a mock portfolio if it doesn't exist
    const mockPortfolio = portfolio || {
      id: 'mock-portfolio-id',
      user_id: mockUser.id,
      cash_balance: 10000, // $10,000 starting balance for testing
      total_value: 10000,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (!portfolio && !user) {
      console.log('Using mock portfolio for testing with $10,000 balance');
    } else if (!portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
    }
     // Calculate total cost
    const totalCost = quantity * price * 100; // Options are quoted per share, 100 shares per contract

    if (orderType === 'buy' && mockPortfolio.cash_balance < totalCost) {
      return NextResponse.json({ error: 'Insufficient funds' }, { status: 400 });
    }

    // For mock user, simulate the order without database operations
    if (!user) {
      console.log('Simulating order for mock user:', {
        optionId,
        orderType,
        quantity,
        price,
        totalCost,
        currentBalance: mockPortfolio.cash_balance
      });

      const newBalance = orderType === 'buy' 
        ? mockPortfolio.cash_balance - totalCost
        : mockPortfolio.cash_balance + totalCost;

      return NextResponse.json({ 
        order: {
          id: 'mock-order-' + Date.now(),
          user_id: mockUser.id,
          option_id: optionId,
          order_type: orderType,
          quantity,
          price,
          status: 'filled',
          created_at: new Date().toISOString()
        }, 
        newBalance 
      });
    }

    // Real database operations for authenticated users
    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: mockUser.id,
        option_id: optionId,
        order_type: orderType,
        quantity,
        price,
        status: 'filled' // In a simulated environment, orders are instantly filled
      })
      .select()
      .single();
    
    if (orderError) {
      throw orderError;
    }
     // Update portfolio balance
    const newBalance = orderType === 'buy' 
      ? mockPortfolio.cash_balance - totalCost
      : mockPortfolio.cash_balance + totalCost;

    await supabase
      .from('portfolios')
      .update({
        cash_balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', mockUser.id);
    
    // Create or update position
    if (orderType === 'buy') {
      const { data: existingPosition } = await supabase
        .from('positions')
        .select('*')
        .eq('user_id', mockUser.id)
        .eq('option_id', optionId)
        .is('closed_at', null)
        .single();
      
      if (existingPosition) {
        // Update existing position
        const newQuantity = existingPosition.quantity + quantity;
        const newAverageCost = ((existingPosition.average_cost * existingPosition.quantity) + (price * quantity)) / newQuantity;
        
        await supabase
          .from('positions')
          .update({
            quantity: newQuantity,
            average_cost: newAverageCost,
            current_value: newQuantity * price * 100
          })
          .eq('id', existingPosition.id);
      } else {
        // Create new position
        await supabase
          .from('positions')
          .insert({
            user_id: mockUser.id,
            option_id: optionId,
            quantity,
            average_cost: price,
            current_value: quantity * price * 100
          });
      }
    }
    
    return NextResponse.json({ order, newBalance });
  } catch (error) {
    console.error('Error processing order:', error);
    return NextResponse.json(
      { error: 'Failed to process order' },
      { status: 500 }
    );
  }
}