import { useEffect, useState } from 'react';
import { useProducts } from '@/hooks/useDatabase';
import { productService } from '@/lib/database';

export function ProductsLoadingDebug() {
  const [directApiResult, setDirectApiResult] = useState<any>(null);
  const [directApiError, setDirectApiError] = useState<string | null>(null);
  const [directApiLoading, setDirectApiLoading] = useState(false);

  // Используем хук как в реальном приложении
  const { products: hookProducts, loading: hookLoading, error: hookError } = useProducts();

  // Прямой вызов API
  const testDirectAPI = async () => {
    setDirectApiLoading(true);
    setDirectApiError(null);
    try {
      const result = await productService.getAll();
      setDirectApiResult(result);
      console.log('🔍 Direct API result:', result);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setDirectApiError(errorMessage);
      console.error('❌ Direct API error:', error);
    } finally {
      setDirectApiLoading(false);
    }
  };

  useEffect(() => {
    console.log('🚀 ProductsLoadingDebug mounted');
    console.log('📊 Hook state:', { 
      products: hookProducts, 
      loading: hookLoading, 
      error: hookError 
    });
    
    // Автоматически тестируем прямой API при монтировании
    testDirectAPI();
  }, [hookProducts, hookLoading, hookError]);

  return (
    <div className="fixed top-4 right-4 w-80 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50 max-h-96 overflow-y-auto">
      <h3 className="font-bold text-lg mb-3">🔍 Отладка загрузки товаров</h3>
      
      {/* Hook результаты */}
      <div className="mb-4">
        <h4 className="font-semibold text-sm mb-2">useProducts Hook:</h4>
        <div className="text-xs space-y-1">
          <div>Loading: <span className={hookLoading ? 'text-yellow-600' : 'text-green-600'}>{hookLoading ? 'true' : 'false'}</span></div>
          <div>Error: <span className={hookError ? 'text-red-600' : 'text-green-600'}>{hookError || 'none'}</span></div>
          <div>Products count: <span className="text-blue-600">{hookProducts?.length || 0}</span></div>
          {hookProducts && hookProducts.length > 0 && (
            <div className="text-xs text-gray-600">
              First product: {hookProducts[0].name} ({hookProducts[0].price}₽)
            </div>
          )}
        </div>
      </div>

      {/* Direct API результаты */}
      <div className="mb-4">
        <h4 className="font-semibold text-sm mb-2">Direct API:</h4>
        <button 
          onClick={testDirectAPI}
          className="text-xs bg-blue-500 text-white px-2 py-1 rounded mb-2"
          disabled={directApiLoading}
        >
          {directApiLoading ? 'Loading...' : 'Test API'}
        </button>
        <div className="text-xs space-y-1">
          <div>Loading: <span className={directApiLoading ? 'text-yellow-600' : 'text-green-600'}>{directApiLoading ? 'true' : 'false'}</span></div>
          <div>Error: <span className={directApiError ? 'text-red-600' : 'text-green-600'}>{directApiError || 'none'}</span></div>
          <div>Products count: <span className="text-blue-600">{directApiResult?.length || 0}</span></div>
          {directApiResult && directApiResult.length > 0 && (
            <div className="text-xs text-gray-600">
              First product: {directApiResult[0].name} ({directApiResult[0].price}₽)
            </div>
          )}
        </div>
      </div>

      {/* Environment info */}
      <div className="text-xs text-gray-500 border-t pt-2">
        <div>Supabase URL: {import.meta.env.VITE_SUPABASE_URL ? '✅' : '❌'}</div>
        <div>Supabase Key: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅' : '❌'}</div>
      </div>
    </div>
  );
}