// app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { Database } from '@/lib/types';

// Type definitions for better type safety
type OrderType = 'buy' | 'sell';
type OrderStatus = 'pending' | 'filled' | 'cancelled';

interface OrderRequest {
  optionId: string;
  orderType: OrderType;
  quantity: number;
  price: number;
}

interface MockUser {
  id: string;
  email: string;
}

type Profile = Database['public']['Tables']['profiles']['Row'];
type Portfolio = Database['public']['Tables']['portfolios']['Row'];

export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServer();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }
    
    // For development/testing, create a mock user if not authenticated
    const mockUser: MockUser = user
      ? { id: user.id, email: user.email ?? 'demo@example.com' }
      : {
          id: 'demo-user-id',
          email: 'demo@example.com'
        };
    
    console.log('Auth user:', user ? 'authenticated' : 'using mock user for testing');
    
    // In production, require authentication
    if (!user && process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized - Please log in' }, { status: 401 });
    }
    
    // Parse request body
    const body = await request.json() as OrderRequest;
    const { optionId, orderType, quantity, price } = body;
    
    // Validate required fields
    if (!optionId || !orderType || !quantity || !price) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Validate orderType
    if (!['buy', 'sell'].includes(orderType)) {
      return NextResponse.json({ error: 'Invalid order type' }, { status: 400 });
    }
    
    // Get or create user profile
    let profile: Profile | null = null;
    if (user) {
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', mockUser.id)
        .single();
        
      if (profileError && profileError.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Profile error:', profileError);
        return NextResponse.json({ error: 'Profile lookup failed' }, { status: 500 });
      }
      
      profile = profileData;
      
      // Create profile if it doesn't exist
      if (!profile) {
        const { data: newProfile, error: createProfileError } = await supabase
          .from('profiles')
          .insert({
            id: mockUser.id,
            username: mockUser.email.split('@')[0], // Use email prefix as username
            full_name: mockUser.email.split('@')[0],
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
          
        if (createProfileError) {
          console.error('Profile creation error:', createProfileError);
          return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
        }
        
        profile = newProfile;
      }
    }
    
    // Get or create portfolio
    let portfolio: Portfolio | null = null;
    
    if (user && profile) {
      const { data: portfolioData, error: portfolioError } = await supabase
        .from('portfolios')
        .select('*')
        .eq('user_id', mockUser.id)
        .single();
        
      if (portfolioError && portfolioError.code !== 'PGRST116') {
        console.error('Portfolio error:', portfolioError);
        return NextResponse.json({ error: 'Portfolio lookup failed' }, { status: 500 });
      }
      
      portfolio = portfolioData;
      
      // Create portfolio if it doesn't exist
      if (!portfolio) {
        const { data: newPortfolio, error: createError } = await supabase
          .from('portfolios')
          .insert({
            user_id: mockUser.id,
            cash_balance: 10000, // $10,000 starting balance
            total_value: 10000,
          })
          .select()
          .single();
          
        if (createError) {
          console.error('Portfolio creation error:', createError);
          return NextResponse.json({ error: 'Failed to create portfolio' }, { status: 500 });
        }
        
        portfolio = newPortfolio;
      }
    } else {
      // Mock portfolio for testing
      portfolio = {
        id: 'mock-portfolio-id',
        user_id: mockUser.id,
        cash_balance: 10000,
        total_value: 10000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }
    
    if (!portfolio) {
      return NextResponse.json({ error: 'Portfolio not found' }, { status: 404 });
    }
    
    // Calculate total cost (options are quoted per share, 100 shares per contract)
    const totalCost = quantity * price * 100;
    
    // Check if user has sufficient funds for buy orders
    if (orderType === 'buy' && portfolio.cash_balance < totalCost) {
      return NextResponse.json({ 
        error: `Insufficient funds. Required: $${totalCost.toFixed(2)}, Available: $${portfolio.cash_balance.toFixed(2)}` 
      }, { status: 400 });
    }
    
    // For mock user, simulate the order without database operations
    if (!user) {
      console.log('Simulating order for mock user:', {
        optionId,
        orderType,
        quantity,
        price,
        totalCost,
        currentBalance: portfolio.cash_balance
      });
      
      const newBalance = orderType === 'buy' 
        ? portfolio.cash_balance - totalCost
        : portfolio.cash_balance + totalCost;
      
      return NextResponse.json({ 
        success: true,
        order: {
          id: 'mock-order-' + Date.now(),
          user_id: mockUser.id,
          option_id: optionId,
          order_type: orderType,
          quantity,
          price,
          status: 'filled' as OrderStatus,
          total_cost: totalCost,
          created_at: new Date().toISOString()
        }, 
        newBalance,
        message: 'Order simulated successfully (demo mode)',
        profile: profile ? {
          username: profile.username,
          full_name: profile.full_name
        } : null
      });
    }
    
    // Real database operations for authenticated users
    try {
      // Create order record
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: mockUser.id,
          option_id: optionId,
          order_type: orderType,
          quantity,
          price,
          status: 'filled', // In a simulated environment, orders are instantly filled
          total_cost: totalCost,
        })
        .select()
        .single();
      
      if (orderError) {
        console.error('Order creation error:', orderError);
        throw new Error(`Failed to create order: ${orderError.message}`);
      }
      
      // Update portfolio balance
      const newBalance = orderType === 'buy' 
        ? portfolio.cash_balance - totalCost
        : portfolio.cash_balance + totalCost;
      
      const { error: portfolioUpdateError } = await supabase
        .from('portfolios')
        .update({
          cash_balance: newBalance,
          total_value: newBalance, // Simplified - in reality, this would include position values
          updated_at: new Date().toISOString()
        })
        .eq('user_id', mockUser.id);
      
      if (portfolioUpdateError) {
        console.error('Portfolio update error:', portfolioUpdateError);
        throw new Error(`Failed to update portfolio: ${portfolioUpdateError.message}`);
      }
      
      // Handle positions for buy orders
      if (orderType === 'buy') {
        const { data: existingPosition, error: positionError } = await supabase
          .from('positions')
          .select('*')
          .eq('user_id', mockUser.id)
          .eq('option_id', optionId)
          .is('closed_at', null)
          .single();
        
        if (positionError && positionError.code !== 'PGRST116') {
          console.error('Position lookup error:', positionError);
          throw new Error(`Failed to lookup position: ${positionError.message}`);
        }
        
        if (existingPosition) {
          // Update existing position
          const newQuantity = existingPosition.quantity + quantity;
          const newAverageCost = ((existingPosition.average_cost * existingPosition.quantity) + (price * quantity)) / newQuantity;
          
          const { error: updatePositionError } = await supabase
            .from('positions')
            .update({
              quantity: newQuantity,
              average_cost: newAverageCost,
              current_value: newQuantity * price * 100,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingPosition.id);
          
          if (updatePositionError) {
            console.error('Position update error:', updatePositionError);
            throw new Error(`Failed to update position: ${updatePositionError.message}`);
          }
        } else {
          // Create new position
          const { error: createPositionError } = await supabase
            .from('positions')
            .insert({
              user_id: mockUser.id,
              option_id: optionId,
              quantity,
              average_cost: price,
              current_value: quantity * price * 100
            });
          
          if (createPositionError) {
            console.error('Position creation error:', createPositionError);
            throw new Error(`Failed to create position: ${createPositionError.message}`);
          }
        }
      }
      
      return NextResponse.json({ 
        success: true,
        order, 
        newBalance,
        message: 'Order processed successfully',
        profile: profile ? {
          username: profile.username,
          full_name: profile.full_name,
          avatar_url: profile.avatar_url
        } : null
      });
      
    } catch (dbError) {
      console.error('Database operation failed:', dbError);
      return NextResponse.json({
        error: 'Database operation failed',
        details: dbError instanceof Error ? dbError.message : 'Unknown error'
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error('Error processing order:', error);
    return NextResponse.json({
      error: 'Failed to process order',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Add other HTTP methods if needed
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}