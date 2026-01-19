import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[]

// Database types based on our schema
export type Database = {
  public: {
    Tables: {
      products: {
        Row: {
          id: string
          sku: string
          name: string
          description: string
          composition: string | null
          price: number
          original_price: number | null
          images: string[]
          tags: string[]
          status: 'in_stock' | 'coming_soon' | 'out_of_stock'
          type: 'product' | 'bundle'
          is_featured: boolean
          likes_count: number
          reviews_count: number
          average_rating: number
          specifications: Record<string, string> | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sku: string
          name: string
          description: string
          composition?: string | null
          price: number
          original_price?: number | null
          images?: string[]
          tags?: string[]
          status?: 'in_stock' | 'coming_soon' | 'out_of_stock'
          type?: 'product' | 'bundle'
          is_featured?: boolean
          likes_count?: number
          reviews_count?: number
          average_rating?: number
          specifications?: Record<string, string> | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sku?: string
          name?: string
          description?: string
          composition?: string | null
          price?: number
          original_price?: number | null
          images?: string[]
          tags?: string[]
          status?: 'in_stock' | 'coming_soon' | 'out_of_stock'
          type?: 'product' | 'bundle'
          is_featured?: boolean
          likes_count?: number
          reviews_count?: number
          average_rating?: number
          specifications?: Record<string, string> | null
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          customer_name: string
          customer_email: string
          customer_phone: string
          customer_address: string | null
          items: Array<{
            product_id: string
            name: string
            price: number
            quantity: number
            image?: string
          }>
          total: number
          status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
          type: 'regular' | 'custom_bundle'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_name: string
          customer_email: string
          customer_phone: string
          customer_address?: string | null
          items: Array<{
            product_id: string
            name: string
            price: number
            quantity: number
            image?: string
          }>
          total: number
          status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
          type?: 'regular' | 'custom_bundle'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_name?: string
          customer_email?: string
          customer_phone?: string
          customer_address?: string | null
          items?: Array<{
            product_id: string
            name: string
            price: number
            quantity: number
            image?: string
          }>
          total?: number
          status?: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
          type?: 'regular' | 'custom_bundle'
          created_at?: string
          updated_at?: string
        }
      }
      banners: {
        Row: {
          id: string
          title: string
          image: string
          link: string | null
          is_active: boolean
          order: number
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          image: string
          link?: string | null
          is_active?: boolean
          order?: number
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          image?: string
          link?: string | null
          is_active?: boolean
          order?: number
          created_at?: string
        }
      }
      product_likes: {
        Row: {
          id: string
          product_id: string
          user_session: string
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          user_session: string
          created_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          user_session?: string
          created_at?: string
        }
      }
      site_settings: {
        Row: {
          id: string
          site_name: string
          site_description: string
          contact_email: string
          contact_phone: string
          address: string
          social_links: Json
          seo_settings: Json
          updated_at: string
        }
        Insert: {
          id?: string
          site_name: string
          site_description: string
          contact_email: string
          contact_phone: string
          address: string
          social_links?: Json
          seo_settings?: Json
          updated_at?: string
        }
        Update: {
          id?: string
          site_name?: string
          site_description?: string
          contact_email?: string
          contact_phone?: string
          address?: string
          social_links?: Json
          seo_settings?: Json
          updated_at?: string
        }
      }
      admins: {
        Row: {
          id: string
          username: string
          telegram_id: number | null
          first_name: string | null
          created_at: string
        }
        Insert: {
          id?: string
          username: string
          telegram_id?: number | null
          first_name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          telegram_id?: number | null
          first_name?: string | null
          created_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          product_id: string
          user_id: string
          user_name: string | null
          rating: number
          comment: string | null
          photos: string[]
          status: 'pending' | 'approved' | 'rejected'
          admin_reply: string | null
          admin_reply_at: string | null
          created_at: string
          updated_at: string
          moderated_by: string | null
          moderated_at: string | null
          can_edit_until: string
        }
        Insert: {
          id?: string
          product_id: string
          user_id: string
          user_name?: string | null
          rating: number
          comment?: string | null
          photos?: string[]
          status?: 'pending' | 'approved' | 'rejected'
          admin_reply?: string | null
          admin_reply_at?: string | null
          created_at?: string
          updated_at?: string
          moderated_by?: string | null
          moderated_at?: string | null
          can_edit_until?: string
        }
        Update: {
          id?: string
          product_id?: string
          user_id?: string
          user_name?: string | null
          rating?: number
          comment?: string | null
          photos?: string[]
          status?: 'pending' | 'approved' | 'rejected'
          admin_reply?: string | null
          admin_reply_at?: string | null
          created_at?: string
          updated_at?: string
          moderated_by?: string | null
          moderated_at?: string | null
          can_edit_until?: string
        }
      }
    }
  }
}