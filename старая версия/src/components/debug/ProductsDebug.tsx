import { useProducts } from '@/hooks/useDatabase';
import { useState } from 'react';

export function ProductsDebug() {
  const [filters, setFilters] = useState<any>({});
  const { products, loading, error } = useProducts(filters);

  return (
    <div className="p-4 bg-white rounded-lg shadow-lg max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">🔍 Диагностика загрузки товаров</h2>
      
      <div className="space-y-4">
        <div className="p-3 bg-gray-100 rounded">
          <h3 className="font-semibold">Статус загрузки:</h3>
          <p>Loading: {loading ? '✅ Да' : '❌ Нет'}</p>
          <p>Error: {error ? `❌ ${error}` : '✅ Нет ошибок'}</p>
          <p>Products count: {products?.length || 0}</p>
        </div>

        <div className="p-3 bg-blue-100 rounded">
          <h3 className="font-semibold">Фильтры:</h3>
          <pre className="text-sm">{JSON.stringify(filters, null, 2)}</pre>
          <button 
            onClick={() => setFilters({})}
            className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm"
          >
            Сбросить фильтры
          </button>
        </div>

        {products && products.length > 0 && (
          <div className="p-3 bg-green-100 rounded">
            <h3 className="font-semibold">Первые 3 товара:</h3>
            {products.slice(0, 3).map(product => (
              <div key={product.id} className="mt-2 p-2 bg-white rounded text-sm">
                <p><strong>ID:</strong> {product.id}</p>
                <p><strong>Name:</strong> {product.name}</p>
                <p><strong>Price:</strong> {product.price}₽</p>
                <p><strong>Status:</strong> {product.status}</p>
                <p><strong>Type:</strong> {product.type}</p>
                <p><strong>Images:</strong> {product.images?.length || 0}</p>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && (!products || products.length === 0) && (
          <div className="p-3 bg-yellow-100 rounded">
            <h3 className="font-semibold">⚠️ Товары не найдены</h3>
            <p>База данных подключена, но товары не загружаются</p>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-100 rounded">
            <h3 className="font-semibold">❌ Ошибка загрузки</h3>
            <p>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}