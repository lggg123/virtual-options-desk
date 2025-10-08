import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Get user from token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Fetch user account
    const { data: account, error: accountError } = await supabase
      .from('user_accounts')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (accountError) {
      // If account doesn't exist, create one
      if (accountError.code === 'PGRST116') {
        const { data: newAccount, error: createError } = await supabase
          .from('user_accounts')
          .insert({
            user_id: user.id,
            cash_balance: 100000.00,
            portfolio_value: 100000.00,
            total_pnl: 0.00,
            total_pnl_percent: 0.00
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating account:', createError);
          return NextResponse.json(
            { error: 'Failed to create account' },
            { status: 500 }
          );
        }

        return NextResponse.json({
          account: newAccount,
          message: 'New account created with $100,000 virtual cash'
        });
      }

      console.error('Error fetching account:', accountError);
      return NextResponse.json(
        { error: 'Failed to fetch account' },
        { status: 500 }
      );
    }

    return NextResponse.json({ account });
  } catch (error) {
    console.error('Account API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
