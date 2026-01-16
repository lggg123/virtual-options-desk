export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// Market Data Types
export interface MarketData {
  price: number;
  volume?: number;
  timestamp: string;
  high?: number;
  low?: number;
  open?: number;
  symbol?: string;
}

// Blog Post Market Data Type
export interface BlogMarketData {
  trend?: string;
  sentiment?: string;
  confidence?: number;
  keyStocks?: string[];
  sectors?: string[];
}

export interface OptionsPricing {
  id: string;
  symbol: string;
  option_type: 'call' | 'put';
  strike_price: number;
  expiry_date: string;
  bid: number;
  ask: number;
  last_price: number;
  volume: number;
  open_interest: number;
  implied_volatility: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
  created_at: string;
  updated_at: string;
}

// Asset class type for different trading instruments
export type AssetClass = 'stock' | 'option' | 'crypto' | 'commodity' | 'futures' | 'cfd';

// Extended position type to include new asset classes
export type ExtendedPositionType = 'stock' | 'call' | 'put' | 'spread' | 'crypto' | 'commodity' | 'futures' | 'cfd';

// Cryptocurrency types
export interface CryptoAsset {
  id: string;
  symbol: string;
  name: string;
  price: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap: number;
  volume_24h: number;
  high_24h: number;
  low_24h: number;
  circulating_supply: number;
  total_supply: number;
  image?: string;
  last_updated: string;
}

export interface CryptoQuote {
  symbol: string;
  name: string;
  price: number;
  change_24h: number;
  change_percentage_24h: number;
  volume_24h: number;
  market_cap: number;
  high_24h: number;
  low_24h: number;
}

// Commodity types
export interface CommodityAsset {
  symbol: string;
  name: string;
  price: number;
  unit: string;
  change: number;
  change_percentage: number;
  high: number;
  low: number;
  open: number;
  previous_close: number;
  category: 'energy' | 'metals' | 'agriculture' | 'livestock';
  exchange: string;
  last_updated: string;
}

export interface CommodityQuote {
  symbol: string;
  name: string;
  price: number;
  unit: string;
  change: number;
  change_percentage: number;
  category: 'energy' | 'metals' | 'agriculture' | 'livestock';
}

// Futures contract types
export interface FuturesContract {
  symbol: string;
  name: string;
  underlying: string;
  price: number;
  change: number;
  change_percentage: number;
  open: number;
  high: number;
  low: number;
  previous_close: number;
  volume: number;
  open_interest: number;
  expiration_date: string;
  contract_size: number;
  tick_size: number;
  tick_value: number;
  exchange: string;
  category: 'index' | 'currency' | 'commodity' | 'interest_rate';
  last_updated: string;
}

export interface FuturesQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  change_percentage: number;
  expiration_date: string;
  volume: number;
}

// CFD types (Contracts for Difference)
export interface CFDInstrument {
  symbol: string;
  name: string;
  underlying_asset: string;
  asset_class: 'forex' | 'index' | 'commodity' | 'crypto' | 'stock';
  price: number;
  bid: number;
  ask: number;
  spread: number;
  change: number;
  change_percentage: number;
  high: number;
  low: number;
  leverage: number;
  margin_requirement: number;
  pip_value: number;
  trading_hours: string;
  last_updated: string;
}

export interface CFDQuote {
  symbol: string;
  name: string;
  bid: number;
  ask: number;
  spread: number;
  change: number;
  change_percentage: number;
  leverage: number;
}

// Trade types for new asset classes
export interface CryptoTrade {
  id: string;
  user_id: string;
  portfolio_id: string;
  symbol: string;
  name: string;
  trade_type: 'buy' | 'sell';
  quantity: number;
  price: number;
  total_value: number;
  fees: number;
  executed_at: string;
}

export interface CommodityTrade {
  id: string;
  user_id: string;
  portfolio_id: string;
  symbol: string;
  name: string;
  trade_type: 'buy' | 'sell';
  quantity: number;
  price: number;
  unit: string;
  contract_size: number;
  total_value: number;
  fees: number;
  executed_at: string;
}

export interface FuturesTrade {
  id: string;
  user_id: string;
  portfolio_id: string;
  symbol: string;
  contract_month: string;
  trade_type: 'buy' | 'sell';
  quantity: number;
  price: number;
  contract_size: number;
  margin_required: number;
  total_value: number;
  fees: number;
  executed_at: string;
}

export interface CFDTrade {
  id: string;
  user_id: string;
  portfolio_id: string;
  symbol: string;
  trade_type: 'buy' | 'sell';
  position_type: 'long' | 'short';
  quantity: number;
  entry_price: number;
  leverage: number;
  margin_used: number;
  stop_loss?: number;
  take_profit?: number;
  total_value: number;
  fees: number;
  executed_at: string;
}

// Popular symbols for each asset class
export const POPULAR_CRYPTO = [
  { symbol: 'bitcoin', name: 'Bitcoin', ticker: 'BTC' },
  { symbol: 'ethereum', name: 'Ethereum', ticker: 'ETH' },
  { symbol: 'binancecoin', name: 'BNB', ticker: 'BNB' },
  { symbol: 'solana', name: 'Solana', ticker: 'SOL' },
  { symbol: 'ripple', name: 'XRP', ticker: 'XRP' },
  { symbol: 'cardano', name: 'Cardano', ticker: 'ADA' },
  { symbol: 'dogecoin', name: 'Dogecoin', ticker: 'DOGE' },
  { symbol: 'polkadot', name: 'Polkadot', ticker: 'DOT' },
];

export const POPULAR_COMMODITIES = [
  { symbol: 'CL', name: 'Crude Oil WTI', category: 'energy' as const },
  { symbol: 'BZ', name: 'Brent Crude Oil', category: 'energy' as const },
  { symbol: 'NG', name: 'Natural Gas', category: 'energy' as const },
  { symbol: 'GC', name: 'Gold', category: 'metals' as const },
  { symbol: 'SI', name: 'Silver', category: 'metals' as const },
  { symbol: 'HG', name: 'Copper', category: 'metals' as const },
  { symbol: 'PL', name: 'Platinum', category: 'metals' as const },
  { symbol: 'ZC', name: 'Corn', category: 'agriculture' as const },
  { symbol: 'ZW', name: 'Wheat', category: 'agriculture' as const },
  { symbol: 'ZS', name: 'Soybeans', category: 'agriculture' as const },
];

export const POPULAR_FUTURES = [
  { symbol: 'ES', name: 'E-mini S&P 500', category: 'index' as const },
  { symbol: 'NQ', name: 'E-mini NASDAQ 100', category: 'index' as const },
  { symbol: 'YM', name: 'E-mini Dow', category: 'index' as const },
  { symbol: 'RTY', name: 'E-mini Russell 2000', category: 'index' as const },
  { symbol: 'CL', name: 'Crude Oil', category: 'commodity' as const },
  { symbol: 'GC', name: 'Gold', category: 'commodity' as const },
  { symbol: '6E', name: 'Euro FX', category: 'currency' as const },
  { symbol: '6J', name: 'Japanese Yen', category: 'currency' as const },
  { symbol: 'ZB', name: '30-Year T-Bond', category: 'interest_rate' as const },
  { symbol: 'ZN', name: '10-Year T-Note', category: 'interest_rate' as const },
];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string | null
          full_name: string | null
          avatar_url: string | null
          trading_experience: string | null
          risk_tolerance: string | null
          preferred_strategies: string[] | null
          email_notifications: boolean
          push_notifications: boolean
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          trading_experience?: string | null
          risk_tolerance?: string | null
          preferred_strategies?: string[] | null
          email_notifications?: boolean
          push_notifications?: boolean
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          trading_experience?: string | null
          risk_tolerance?: string | null
          preferred_strategies?: string[] | null
          email_notifications?: boolean
          push_notifications?: boolean
          created_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      portfolios: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          cash_balance: number
          total_value: number
          unrealized_pl: number
          realized_pl: number
          is_default: boolean
          currency: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name?: string
          description?: string | null
          cash_balance?: number
          total_value?: number
          unrealized_pl?: number
          realized_pl?: number
          is_default?: boolean
          currency?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          cash_balance?: number
          total_value?: number
          unrealized_pl?: number
          realized_pl?: number
          is_default?: boolean
          currency?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolios_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      trades: {
        Row: {
          id: string
          portfolio_id: string
          user_id: string
          position_id: string | null
          symbol: string
          trade_type: 'buy' | 'sell'
          position_type: 'stock' | 'call' | 'put' | 'spread'
          strike_price: number | null
          expiration_date: string | null
          option_type: 'call' | 'put' | null
          quantity: number
          price: number
          total_cost: number
          fees: number
          realized_pl: number | null
          realized_pl_percent: number | null
          strategy: string | null
          notes: string | null
          executed_at: string
          created_at: string
        }
        Insert: {
          id?: string
          portfolio_id: string
          user_id: string
          position_id?: string | null
          symbol: string
          trade_type: 'buy' | 'sell'
          position_type: 'stock' | 'call' | 'put' | 'spread'
          strike_price?: number | null
          expiration_date?: string | null
          option_type?: 'call' | 'put' | null
          quantity: number
          price: number
          total_cost: number
          fees?: number
          realized_pl?: number | null
          realized_pl_percent?: number | null
          strategy?: string | null
          notes?: string | null
          executed_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          portfolio_id?: string
          user_id?: string
          position_id?: string | null
          symbol?: string
          trade_type?: 'buy' | 'sell'
          position_type?: 'stock' | 'call' | 'put' | 'spread'
          strike_price?: number | null
          expiration_date?: string | null
          option_type?: 'call' | 'put' | null
          quantity?: number
          price?: number
          total_cost?: number
          fees?: number
          realized_pl?: number | null
          realized_pl_percent?: number | null
          strategy?: string | null
          notes?: string | null
          executed_at?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trades_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_portfolio_id_fkey"
            columns: ["portfolio_id"]
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_position_id_fkey"
            columns: ["position_id"]
            referencedRelation: "positions"
            referencedColumns: ["id"]
          }
        ]
      }
      positions: {
        Row: {
          id: string
          portfolio_id: string
          user_id: string
          symbol: string
          position_type: 'stock' | 'call' | 'put' | 'spread'
          strike_price: number | null
          expiration_date: string | null
          option_type: 'call' | 'put' | null
          quantity: number
          entry_price: number
          current_price: number | null
          cost_basis: number
          market_value: number | null
          unrealized_pl: number | null
          unrealized_pl_percent: number | null
          delta: number | null
          gamma: number | null
          theta: number | null
          vega: number | null
          implied_volatility: number | null
          opened_at: string
          closed_at: string | null
          status: 'open' | 'closed' | 'expired'
          strategy: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          portfolio_id: string
          user_id: string
          symbol: string
          position_type: 'stock' | 'call' | 'put' | 'spread'
          strike_price?: number | null
          expiration_date?: string | null
          option_type?: 'call' | 'put' | null
          quantity: number
          entry_price: number
          current_price?: number | null
          cost_basis: number
          market_value?: number | null
          unrealized_pl?: number | null
          unrealized_pl_percent?: number | null
          delta?: number | null
          gamma?: number | null
          theta?: number | null
          vega?: number | null
          implied_volatility?: number | null
          opened_at?: string
          closed_at?: string | null
          status?: 'open' | 'closed' | 'expired'
          strategy?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          portfolio_id?: string
          user_id?: string
          symbol?: string
          position_type?: 'stock' | 'call' | 'put' | 'spread'
          strike_price?: number | null
          expiration_date?: string | null
          option_type?: 'call' | 'put' | null
          quantity?: number
          entry_price?: number
          current_price?: number | null
          cost_basis?: number
          market_value?: number | null
          unrealized_pl?: number | null
          unrealized_pl_percent?: number | null
          delta?: number | null
          gamma?: number | null
          theta?: number | null
          vega?: number | null
          implied_volatility?: number | null
          opened_at?: string
          closed_at?: string | null
          status?: 'open' | 'closed' | 'expired'
          strategy?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "positions_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "positions_portfolio_id_fkey"
            columns: ["portfolio_id"]
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          }
        ]
      }
      stock_prices: {
        Row: {
          id: string
          symbol: string
          price: number
          volume: number
          high: number
          low: number
          open: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          symbol: string
          price: number
          volume?: number
          high?: number
          low?: number
          open?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          symbol?: string
          price?: number
          volume?: number
          high?: number
          low?: number
          open?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      options: {
        Row: {
          id: string
          symbol: string
          option_type: 'call' | 'put'
          strike_price: number
          expiry_date: string
          bid: number
          ask: number
          last_price: number
          volume: number
          open_interest: number
          implied_volatility: number
          delta: number
          gamma: number
          theta: number
          vega: number
          rho: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          symbol: string
          option_type: 'call' | 'put'
          strike_price: number
          expiry_date: string
          bid?: number
          ask?: number
          last_price?: number
          volume?: number
          open_interest?: number
          implied_volatility?: number
          delta?: number
          gamma?: number
          theta?: number
          vega?: number
          rho?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          symbol?: string
          option_type?: 'call' | 'put'
          strike_price?: number
          expiry_date?: string
          bid?: number
          ask?: number
          last_price?: number
          volume?: number
          open_interest?: number
          implied_volatility?: number
          delta?: number
          gamma?: number
          theta?: number
          vega?: number
          rho?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      options_trades: {
        Row: {
          id: string
          user_id: string
          symbol: string
          option_type: 'call' | 'put'
          strike_price: number
          expiry_date: string
          quantity: number
          premium: number
          action: 'buy' | 'sell'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          symbol: string
          option_type: 'call' | 'put'
          strike_price: number
          expiry_date: string
          quantity: number
          premium: number
          action: 'buy' | 'sell'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          symbol?: string
          option_type?: 'call' | 'put'
          strike_price?: number
          expiry_date?: string
          quantity?: number
          premium?: number
          action?: 'buy' | 'sell'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "options_trades_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      blog_posts: {
        Row: {
          id: string
          title: string
          slug: string
          summary: string
          content: string
          author: string
          reading_time: number
          tags: string[]
          published_at: string
          view_count: number
          status: 'draft' | 'published' | 'archived'
          meta_description: string | null
          meta_keywords: string[] | null
          market_data: BlogMarketData | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          summary: string
          content: string
          author: string
          reading_time: number
          tags: string[]
          published_at?: string
          view_count?: number
          status?: 'draft' | 'published' | 'archived'
          meta_description?: string | null
          meta_keywords?: string[] | null
          market_data?: BlogMarketData | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          summary?: string
          content?: string
          author?: string
          reading_time?: number
          tags?: string[]
          published_at?: string
          view_count?: number
          status?: 'draft' | 'published' | 'archived'
          meta_description?: string | null
          meta_keywords?: string[] | null
          market_data?: BlogMarketData | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          id: string
          email: string
          status: 'pending' | 'confirmed' | 'unsubscribed'
          confirmation_token: string | null
          confirmed_at: string | null
          unsubscribed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          status?: 'pending' | 'confirmed' | 'unsubscribed'
          confirmation_token?: string | null
          confirmed_at?: string | null
          unsubscribed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          status?: 'pending' | 'confirmed' | 'unsubscribed'
          confirmation_token?: string | null
          confirmed_at?: string | null
          unsubscribed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      blog_comments: {
        Row: {
          id: string
          blog_post_id: string
          author_name: string
          author_email: string
          content: string
          status: 'pending' | 'approved' | 'rejected' | 'spam'
          ip_address: string | null
          user_agent: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          blog_post_id: string
          author_name: string
          author_email: string
          content: string
          status?: 'pending' | 'approved' | 'rejected' | 'spam'
          ip_address?: string | null
          user_agent?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          blog_post_id?: string
          author_name?: string
          author_email?: string
          content?: string
          status?: 'pending' | 'approved' | 'rejected' | 'spam'
          ip_address?: string | null
          user_agent?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_comments_blog_post_id_fkey"
            columns: ["blog_post_id"]
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          }
        ]
      }
      social_media_posts: {
        Row: {
          id: string
          blog_post_id: string
          platform: 'twitter' | 'linkedin' | 'facebook' | 'reddit'
          post_id: string | null
          post_url: string | null
          status: 'pending' | 'posted' | 'failed'
          error_message: string | null
          posted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          blog_post_id: string
          platform: 'twitter' | 'linkedin' | 'facebook' | 'reddit'
          post_id?: string | null
          post_url?: string | null
          status?: 'pending' | 'posted' | 'failed'
          error_message?: string | null
          posted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          blog_post_id?: string
          platform?: 'twitter' | 'linkedin' | 'facebook' | 'reddit'
          post_id?: string | null
          post_url?: string | null
          status?: 'pending' | 'posted' | 'failed'
          error_message?: string | null
          posted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_media_posts_blog_post_id_fkey"
            columns: ["blog_post_id"]
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_blog_view_count: {
        Args: {
          post_slug: string
        }
        Returns: void
      }
      get_approved_comment_count: {
        Args: {
          post_id: string
        }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}