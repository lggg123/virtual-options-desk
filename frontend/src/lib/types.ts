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
          cash_balance: number
          total_value: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          cash_balance?: number
          total_value?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          cash_balance?: number
          total_value?: number
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
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}