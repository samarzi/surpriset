import { useState, useEffect } from 'react';
import { useTelegramWebApp } from './useTelegramWebApp';
import { telegramSupabase } from '@/lib/telegramSupabase';
import type { Database } from '@/lib/supabase';

type Product = Database['public']['Tables']['products']['Row'];

export function useTelegramProducts() {
  const { isTelegram } = useTelegramWebApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isTelegram) {
      setLoading(false);
      return;
    }

    const fetchProducts = async () => {
      try {
        console.log('🔍 Telegram: Fetching products...');
        setLoading(true);
        setError(null);

        // Добавляем задержку для Telegram WebApp
        await new Promise(resolve => setTimeout(resolve, 500));

        const data = await telegramSupabase.getProducts();
        
        console.log('✅ Telegram: Products loaded:', data?.length || 0);
        setProducts(data || []);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch products';
        console.error('❌ Telegram: Products error:', err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [isTelegram]);

  return { products, loading, error };
}