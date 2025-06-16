// filepath: lib/supabase/helpers.ts
import { supabase } from './client';
import type { Database } from './types';

// Type aliases for easier use
type Profile = Database['public']['Tables']['profiles']['Row'];
type OptionsTrade = Database['public']['Tables']['options_trades']['Row'];

// Helper functions for user management
export const getUserProfile = async (userId: string): Promise<Profile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return null;
  }
};

export const updateUserProfile = async (userId: string, updates: Partial<Profile>) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select();

    if (error) {
      console.error('Error updating user profile:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    return { data: null, error };
  }
};

// Helper functions for options trading
export const createOptionsTrade = async (trade: Database['public']['Tables']['options_trades']['Insert']) => {
  try {
    const { data, error } = await supabase
      .from('options_trades')
      .insert(trade)
      .select();

    if (error) {
      console.error('Error creating options trade:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error in createOptionsTrade:', error);
    return { data: null, error };
  }
};

export const getUserTrades = async (userId: string): Promise<OptionsTrade[]> => {
  try {
    const { data, error } = await supabase
      .from('options_trades')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user trades:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserTrades:', error);
    return [];
  }
};

export const updateOptionsTrade = async (tradeId: string, updates: Partial<OptionsTrade>) => {
  try {
    const { data, error } = await supabase
      .from('options_trades')
      .update(updates)
      .eq('id', tradeId)
      .select();

    if (error) {
      console.error('Error updating options trade:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error in updateOptionsTrade:', error);
    return { data: null, error };
  }
};

export const deleteOptionsTrade = async (tradeId: string) => {
  try {
    const { error } = await supabase
      .from('options_trades')
      .delete()
      .eq('id', tradeId);

    if (error) {
      console.error('Error deleting options trade:', error);
      return { error };
    }

    return { error: null };
  } catch (error) {
    console.error('Error in deleteOptionsTrade:', error);
    return { error };
  }
};

// Authentication helpers
export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Error getting current user:', error);
      return null;
    }

    return user;
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return null;
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Error signing out:', error);
      return { error };
    }

    return { error: null };
  } catch (error) {
    console.error('Error in signOut:', error);
    return { error };
  }
};

// Utility functions
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (date: string): string => {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const calculateOptionsPnL = (trades: OptionsTrade[]): number => {
  return trades.reduce((total, trade) => {
    const multiplier = trade.action === 'buy' ? -1 : 1;
    return total + (trade.premium * trade.quantity * 100 * multiplier);
  }, 0);
};

export const groupTradesBySymbol = (trades: OptionsTrade[]): Record<string, OptionsTrade[]> => {
  return trades.reduce((groups, trade) => {
    const symbol = trade.symbol;
    if (!groups[symbol]) {
      groups[symbol] = [];
    }
    groups[symbol].push(trade);
    return groups;
  }, {} as Record<string, OptionsTrade[]>);
};