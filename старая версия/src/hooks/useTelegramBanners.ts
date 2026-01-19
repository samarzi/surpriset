import { useState, useEffect } from 'react';
import { useTelegramWebApp } from './useTelegramWebApp';
import { telegramSupabase } from '@/lib/telegramSupabase';
import type { Database } from '@/lib/supabase';

type Banner = Database['public']['Tables']['banners']['Row'];

export function useTelegramBanners() {
  const { isTelegram } = useTelegramWebApp();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isTelegram) {
      setLoading(false);
      return;
    }

    const fetchBanners = async () => {
      try {
        console.log('🔍 Telegram: Fetching banners...');
        setLoading(true);
        setError(null);

        // Добавляем задержку для Telegram WebApp
        await new Promise(resolve => setTimeout(resolve, 300));

        const data = await telegramSupabase.getBanners();
        
        console.log('✅ Telegram: Banners loaded:', data?.length || 0);
        setBanners(data || []);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch banners';
        console.error('❌ Telegram: Banners error:', err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchBanners();
  }, [isTelegram]);

  return { banners, loading, error };
}