import { useEffect, useState } from 'react';
import { useProducts, useBanners } from '@/hooks/useDatabase';
import { useTelegramProducts } from '@/hooks/useTelegramProducts';
import { useTelegramBanners } from '@/hooks/useTelegramBanners';
import { productService } from '@/lib/database';
import { supabase } from '@/lib/supabase';
import { telegramSupabase } from '@/lib/telegramSupabase';

export function TelegramProductsDebug() {
  const [directApiResult, setDirectApiResult] = useState<any>(null);
  const [directApiError, setDirectApiError] = useState<string | null>(null);
  const [supabaseTest, setSupabaseTest] = useState<any>(null);
  const [telegramTest, setTelegramTest] = useState<any>(null);
  const [bannersTest, setBannersTest] = useState<any>(null);
  const [networkTest, setNetworkTest] = useState<string>('');

  // Используем хуки
  const regularHook = useProducts({ featured: true, status: 'in_stock' });
  const telegramHook = useTelegramProducts();
  const regularBannersHook = useBanners(true);
  const telegramBannersHook = useTelegramBanners();

  useEffect(() => {
    console.log('🔍 TelegramProductsDebug - Hook states:', { 
      regular: regularHook, 
      telegram: telegramHook,
      regularBanners: regularBannersHook,
      telegramBanners: telegramBannersHook
    });

    // Тест прямого API
    const testDirectAPI = async () => {
      try {
        console.log('🔍 Testing direct productService.getAll...');
        const result = await productService.getAll({ featured: true, status: 'in_stock' });
        setDirectApiResult(result);
        console.log('✅ Direct API result:', result);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setDirectApiError(errorMessage);
        console.error('❌ Direct API error:', error);
      }
    };

    // Тест прямого Supabase
    const testSupabase = async () => {
      try {
        console.log('🔍 Testing direct Supabase query...');
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('is_featured', true)
          .eq('status', 'in_stock')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setSupabaseTest(data);
        console.log('✅ Direct Supabase result:', data);
      } catch (error) {
        console.error('❌ Direct Supabase error:', error);
        setSupabaseTest({ error: error instanceof Error ? error.message : 'Unknown error' });
      }
    };

    // Тест Telegram Supabase
    const testTelegramSupabase = async () => {
      try {
        console.log('🔍 Testing Telegram Supabase...');
        const data = await telegramSupabase.getProducts();
        setTelegramTest(data);
        console.log('✅ Telegram Supabase result:', data);
      } catch (error) {
        console.error('❌ Telegram Supabase error:', error);
        setTelegramTest({ error: error instanceof Error ? error.message : 'Unknown error' });
      }
    };

    // Тест банеров Telegram
    const testTelegramBanners = async () => {
      try {
        console.log('🔍 Testing Telegram Banners...');
        const data = await telegramSupabase.getBanners();
        setBannersTest(data);
        console.log('✅ Telegram Banners result:', data);
      } catch (error) {
        console.error('❌ Telegram Banners error:', error);
        setBannersTest({ error: error instanceof Error ? error.message : 'Unknown error' });
      }
    };

    // Тест сети
    const testNetwork = async () => {
      try {
        console.log('🔍 Testing network connectivity...');
        const response = await fetch('https://rmcedkzodiqcxnpenjld.supabase.co/rest/v1/', {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          }
        });
        setNetworkTest(`Network OK: ${response.status}`);
        console.log('✅ Network test result:', response.status);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setNetworkTest(`Network Error: ${errorMessage}`);
        console.error('❌ Network test error:', error);
      }
    };

    testDirectAPI();
    testSupabase();
    testTelegramSupabase();
    testTelegramBanners();
    testNetwork();
  }, [regularHook.products, regularHook.loading, regularHook.error, telegramHook.products, telegramHook.loading, telegramHook.error, regularBannersHook.banners, telegramBannersHook.banners]);

  return (
    <div className="fixed top-4 left-4 bg-red-100 border-2 border-red-500 p-3 rounded-lg z-50 max-w-xs text-xs overflow-y-auto max-h-96">
      <h3 className="font-bold mb-2">🔍 Telegram Debug</h3>
      
      <div className="space-y-2">
        <div>
          <strong>Regular Hook:</strong><br/>
          Loading: {regularHook.loading ? 'YES' : 'NO'}<br/>
          Error: {regularHook.error || 'none'}<br/>
          Products: {regularHook.products?.length || 0}
        </div>
        
        <div>
          <strong>Telegram Hook:</strong><br/>
          Loading: {telegramHook.loading ? 'YES' : 'NO'}<br/>
          Error: {telegramHook.error || 'none'}<br/>
          Products: {telegramHook.products?.length || 0}
        </div>
        
        <div>
          <strong>Regular Banners:</strong><br/>
          Loading: {regularBannersHook.loading ? 'YES' : 'NO'}<br/>
          Error: {regularBannersHook.error || 'none'}<br/>
          Banners: {regularBannersHook.banners?.length || 0}
        </div>
        
        <div>
          <strong>Telegram Banners:</strong><br/>
          Loading: {telegramBannersHook.loading ? 'YES' : 'NO'}<br/>
          Error: {telegramBannersHook.error || 'none'}<br/>
          Banners: {telegramBannersHook.banners?.length || 0}
        </div>
        
        <div>
          <strong>Direct API:</strong><br/>
          {directApiError ? `Error: ${directApiError}` : `Products: ${directApiResult?.length || 0}`}
        </div>
        
        <div>
          <strong>Supabase:</strong><br/>
          {supabaseTest?.error ? `Error: ${supabaseTest.error}` : `Products: ${supabaseTest?.length || 0}`}
        </div>
        
        <div>
          <strong>Telegram Supabase:</strong><br/>
          {telegramTest?.error ? `Error: ${telegramTest.error}` : `Products: ${telegramTest?.length || 0}`}
        </div>
        
        <div>
          <strong>Telegram Banners:</strong><br/>
          {bannersTest?.error ? `Error: ${bannersTest.error}` : `Banners: ${bannersTest?.length || 0}`}
        </div>
        
        <div>
          <strong>Network:</strong><br/>
          {networkTest || 'Testing...'}
        </div>

        <div>
          <strong>Env:</strong><br/>
          URL: {import.meta.env.VITE_SUPABASE_URL ? '✅' : '❌'}<br/>
          Key: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅' : '❌'}
        </div>
      </div>
    </div>
  );
}