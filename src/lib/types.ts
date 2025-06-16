export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}