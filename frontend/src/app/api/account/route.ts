import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

// TypeScript interface for user_accounts table
interface UserAccount {
  id: string;
  user_id: string;
  cash_balance: number;
  portfolio_value: number;
  total_pnl: number;
  total_pnl_percent: number;
  created_at: string;
  updated_at: string;
}

// Service role client for admin operations (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    // Use server-side Supabase client that reads from cookies
    const supabase = await createSupabaseServer();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Fetch user account using admin client (bypasses RLS)
    const { data: account, error: accountError } = await supabaseAdmin
      .from('user_accounts')
      .select<'*', UserAccount>('*')
      .eq('user_id', user.id)
      .single();

    if (accountError) {
      // If account doesn't exist, create one
      if (accountError.code === 'PGRST116') {
        const { data: newAccount, error: createError } = await supabaseAdmin
          .from('user_accounts')
          .insert({
            user_id: user.id,
            cash_balance: 100000.00,
            portfolio_value: 100000.00,
            total_pnl: 0.00,
            total_pnl_percent: 0.00
          })
          .select<'*', UserAccount>('*')
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
