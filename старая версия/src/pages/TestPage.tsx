import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductCard } from '@/components/products/ProductCard';
import { useProducts } from '@/hooks/useDatabase';
import { useLikes } from '@/contexts/LikesContext';

export default function TestPage() {
  const { products, loading, refetch } = useProducts();
  const { state: likesState } = useLikes();
  const [testLog, setTestLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    setTestLog(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleRefresh = async () => {
    addLog('🔄 Обновляем данные...');
    await refetch();
    addLog('✅ Данные обновлены');
  };

  const handleClearLog = () => {
    setTestLog([]);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-4">🧪 Тестовая страница</h1>
        <p className="text-muted-foreground">
          Эта страница для тестирования функциональности лайков и обновления данных
        </p>
      </div>

      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Панель управления</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={handleRefresh} disabled={loading}>
              Обновить данные
            </Button>
            <Button onClick={handleClearLog} variant="outline">
              Очистить лог
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <strong>Товаров загружено:</strong> {products.length}
            </div>
            <div>
              <strong>Лайкнутых товаров:</strong> {Array.from(likesState.likedProducts).length}
            </div>
          </div>

          {testLog.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Лог действий:</h4>
              <div className="max-h-32 overflow-y-auto bg-muted p-3 rounded text-sm">
                {testLog.map((log, index) => (
                  <div key={index}>{log}</div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Products Grid */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Товары для тестирования</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.slice(0, 6).map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              showAddToCart={true}
            />
          ))}
        </div>
      </div>

      {products.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Нет товаров для отображения</p>
          </CardContent>
        </Card>
      )}

      {/* Debug Info */}
      <Card>
        <CardHeader>
          <CardTitle>Отладочная информация</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div><strong>URL:</strong> {window.location.href}</div>
            <div><strong>User Agent:</strong> {navigator.userAgent}</div>
            <div><strong>Время загрузки:</strong> {new Date().toLocaleString()}</div>
            <div><strong>Состояние загрузки:</strong> {loading ? 'Загружается' : 'Загружено'}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}