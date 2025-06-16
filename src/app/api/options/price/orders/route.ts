// app/api/orders/route.ts
import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const supabase = createSupabaseServer();
  
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { optionId, orderType, quantity, price } = body;
    
    // Start a transaction
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();
    
    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }
    
    // Get portfolio
    const { data: portfolio } = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (!portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
    }
    
    // Calculate total cost
    const totalCost = quantity * price * 100; // Options are quoted per share, 100 shares per contract
    
    if (orderType === 'buy' && portfolio.cash_balance < totalCost) {
      return NextResponse.json({ error: 'Insufficient funds' }, { status: 400 });
    }
    
    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
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
      ? portfolio.cash_balance - totalCost
      : portfolio.cash_balance + totalCost;
    
    await supabase
      .from('portfolios')
      .update({
        cash_balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id);
    
    // Create or update position
    if (orderType === 'buy') {
      const { data: existingPosition } = await supabase
        .from('positions')
        .select('*')
        .eq('user_id', user.id)
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
            user_id: user.id,
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