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
          updated_at: string | null
          username: string | null
          full_name: string | null
          avatar_url: string | null
          website: string | null
        }
        Insert: {
          id: string
          updated_at?: string | null
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          website?: string | null
        }
        Update: {
          id?: string
          updated_at?: string | null
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          website?: string | null
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
      orders: {
        Row: {
          id: string
          user_id: string
          option_id: string
          order_type: 'buy' | 'sell'
          quantity: number
          price: number
          status: 'pending' | 'filled' | 'cancelled'
          total_cost: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          option_id: string
          order_type: 'buy' | 'sell'
          quantity: number
          price: number
          status?: 'pending' | 'filled' | 'cancelled'
          total_cost: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          option_id?: string
          order_type?: 'buy' | 'sell'
          quantity?: number
          price?: number
          status?: 'pending' | 'filled' | 'cancelled'
          total_cost?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_option_id_fkey"
            columns: ["option_id"]
            referencedRelation: "options"
            referencedColumns: ["id"]
          }
        ]
      }
      positions: {
        Row: {
          id: string
          user_id: string
          option_id: string
          quantity: number
          average_cost: number
          current_value: number
          realized_pnl: number
          unrealized_pnl: number
          opened_at: string
          closed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          option_id: string
          quantity: number
          average_cost: number
          current_value: number
          realized_pnl?: number
          unrealized_pnl?: number
          opened_at?: string
          closed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          option_id?: string
          quantity?: number
          average_cost?: number
          current_value?: number
          realized_pnl?: number
          unrealized_pnl?: number
          opened_at?: string
          closed_at?: string | null
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
            foreignKeyName: "positions_option_id_fkey"
            columns: ["option_id"]
            referencedRelation: "options"
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