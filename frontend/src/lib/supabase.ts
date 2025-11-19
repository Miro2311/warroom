import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database Types (werden später erweitert)
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string
          avatar_url: string | null
          current_xp: number
          level: number
          created_at: string
        }
        Insert: {
          id?: string
          username: string
          avatar_url?: string | null
          current_xp?: number
          level?: number
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          avatar_url?: string | null
          current_xp?: number
          level?: number
          created_at?: string
        }
      }
      groups: {
        Row: {
          id: string
          name: string
          invite_code: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          invite_code: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          invite_code?: string
          created_at?: string
        }
      }
      partners: {
        Row: {
          id: string
          user_id: string
          group_id: string
          nickname: string
          status: string
          financial_total: number
          time_total: number
          intimacy_score: number
          created_at: string
          last_updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          group_id: string
          nickname: string
          status?: string
          financial_total?: number
          time_total?: number
          intimacy_score?: number
          created_at?: string
          last_updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          group_id?: string
          nickname?: string
          status?: string
          financial_total?: number
          time_total?: number
          intimacy_score?: number
          created_at?: string
          last_updated_at?: string
        }
      }
    }
  }
}
