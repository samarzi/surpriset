import { supabase } from './supabase';
import { logger } from './logger';
import type { Database } from './supabase';

type Product = Database['public']['Tables']['products']['Row'];
type Banner = Database['public']['Tables']['banners']['Row'];

// Mobile-specific network configuration
const MOBILE_TIMEOUT = 15000; // 15 seconds for mobile
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 second base delay

// Utility function to detect mobile environment
const isMobileEnvironment = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check for Telegram WebApp
  if ((window as any).Telegram?.WebApp) return true;
  
  // Check user agent for mobile devices
  const userAgent = navigator.userAgent.toLowerCase();
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
};

// Enhanced fetch with mobile-specific optimizations
const mobileOptimizedFetch = async (url: string, options: RequestInit, attempt = 1): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), MOBILE_TIMEOUT);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      // Mobile-specific headers
      headers: {
        ...options.headers,
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        // Add connection keep-alive for mobile networks
        'Connection': 'keep-alive',
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    // Retry logic for mobile network issues
    if (attempt < RETRY_ATTEMPTS && (
      error instanceof Error && (
        error.name === 'AbortError' ||
        error.message.includes('fetch') ||
        error.message.includes('network') ||
        error.message.includes('timeout')
      )
    )) {
      logger.warn('Mobile network retry', { 
        attempt, 
        error: error.message,
        url: url.replace(/\/rest\/v1\/.*/, '/rest/v1/[REDACTED]')
      });
      
      // Exponential backoff with jitter
      const delay = RETRY_DELAY * Math.pow(2, attempt - 1) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return mobileOptimizedFetch(url, options, attempt + 1);
    }
    
    throw error;
  }
};

// Специальный клиент для Telegram WebApp с дополнительными настройками
export const telegramSupabase = {
  async getProducts(): Promise<Product[]> {
    const isMobile = isMobileEnvironment();
    logger.info('Loading products', { isMobile, userAgent: navigator.userAgent });
    
    try {
      // For mobile, try direct REST API first (often more reliable)
      if (isMobile) {
        return await this.getProductsViaREST();
      }
      
      // Desktop: use Supabase client
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'in_stock')
        .not('tags', 'cs', '{__archive__}')
        .order('created_at', { ascending: false });

      if (error) {
        logger.warn('Supabase client error, falling back to REST', { error: error.message });
        return await this.getProductsViaREST();
      }

      logger.info('Products loaded successfully', { count: data?.length || 0, method: 'supabase-client' });
      return data || [];
      
    } catch (error) {
      logger.error('Failed to load products', { error: error instanceof Error ? error.message : 'Unknown error' });
      
      // Final fallback: try REST API
      try {
        return await this.getProductsViaREST();
      } catch (restError) {
        logger.error('All product loading methods failed', { 
          originalError: error instanceof Error ? error.message : 'Unknown error',
          restError: restError instanceof Error ? restError.message : 'Unknown error'
        });
        throw new Error('Не удалось загрузить товары. Проверьте подключение к интернету.');
      }
    }
  },

  async getProductsViaREST(): Promise<Product[]> {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/products?status=eq.in_stock&order=created_at.desc&tags=not.cs.{__archive__}`;
    
    const response = await mobileOptimizedFetch(url, {
      method: 'GET',
      headers: {
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });

    const data = await response.json();
    logger.info('Products loaded via REST', { count: data?.length || 0, method: 'rest-api' });
    return data || [];
  },

  async getBanners(): Promise<Banner[]> {
    const isMobile = isMobileEnvironment();
    logger.info('Loading banners', { isMobile });
    
    try {
      // For mobile, try direct REST API first
      if (isMobile) {
        return await this.getBannersViaREST();
      }
      
      // Desktop: use Supabase client
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        logger.warn('Supabase client error for banners, falling back to REST', { error: error.message });
        return await this.getBannersViaREST();
      }

      logger.info('Banners loaded successfully', { count: data?.length || 0, method: 'supabase-client' });
      return data || [];
      
    } catch (error) {
      logger.error('Failed to load banners', { error: error instanceof Error ? error.message : 'Unknown error' });
      
      // Final fallback: try REST API
      try {
        return await this.getBannersViaREST();
      } catch (restError) {
        logger.error('All banner loading methods failed', { 
          originalError: error instanceof Error ? error.message : 'Unknown error',
          restError: restError instanceof Error ? restError.message : 'Unknown error'
        });
        // Banners are not critical, return empty array
        return [];
      }
    }
  },

  async getBannersViaREST(): Promise<Banner[]> {
    const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/banners?is_active=eq.true&order=sort_order.asc`;
    
    const response = await mobileOptimizedFetch(url, {
      method: 'GET',
      headers: {
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }
    });

    const data = await response.json();
    logger.info('Banners loaded via REST', { count: data?.length || 0, method: 'rest-api' });
    return data || [];
  },

  // Health check method for diagnostics
  async checkConnection(): Promise<{ success: boolean; method: string; latency: number }> {
    const startTime = Date.now();
    
    try {
      // Try Supabase client first
      const { error } = await supabase
        .from('products')
        .select('id')
        .limit(1);
      
      if (!error) {
        return {
          success: true,
          method: 'supabase-client',
          latency: Date.now() - startTime
        };
      }
    } catch (clientError) {
      logger.warn('Supabase client health check failed', { error: clientError });
    }
    
    try {
      // Try REST API
      const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/products?select=id&limit=1`;
      await mobileOptimizedFetch(url, {
        method: 'GET',
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        }
      });
      
      return {
        success: true,
        method: 'rest-api',
        latency: Date.now() - startTime
      };
    } catch (restError) {
      logger.error('All connection methods failed', { error: restError });
      return {
        success: false,
        method: 'none',
        latency: Date.now() - startTime
      };
    }
  }
};