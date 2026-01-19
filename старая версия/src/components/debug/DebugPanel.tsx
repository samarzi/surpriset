import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProducts } from '@/hooks/useDatabase';
import { useLikes } from '@/contexts/LikesContext';
import { productService } from '@/lib/database';

export function DebugPanel() {
  const { products, loading, refetch } = useProducts();
  const { state: likesState, toggleLike, isLiked } = useLikes();
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebugInfo = (message: string) => {
    setDebugInfo(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testProductUpdate = async () => {
    try {
      addDebugInfo('🧪 Начинаем тест обновления товара...');
      
      if (products.length === 0) {
        addDebugInfo('❌ Нет товаров для тестирования');
        return;
      }

      const product = products[0];
      addDebugInfo(`📦 Тестируем товар: ${product.name}`);
      
      // Update product
      const updatedData = {
        name: product.name + ' (обновлено ' + Date.now() + ')',
        price: product.price + 0.01
      };

      await productService.update(product.id, updatedData);
      addDebugInfo('✅ Товар обновлен в базе данных');

      // Force refresh
      await refetch();
      addDebugInfo('🔄 Данные перезагружены');

      // Trigger global refresh
      window.dispatchEvent(new CustomEvent('products-refresh'));
      addDebugInfo('📡 Отправлено событие обновления');

    } catch (error) {
      addDebugInfo(`❌ Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  };

  const testLikeSystem = async () => {
    try {
      addDebugInfo('❤️ Начинаем тест системы лайков...');
      
      if (products.length === 0) {
        addDebugInfo('❌ Нет товаров для тестирования');
        return;
      }

      const product = products[0];
      const wasLiked = isLiked(product.id);
      
      addDebugInfo(`📦 Тестируем лайки для: ${product.name}`);
      addDebugInfo(`💖 Текущий статус лайка: ${wasLiked ? 'лайкнуто' : 'не лайкнуто'}`);
      addDebugInfo(`🔢 Текущее количество лайков: ${product.likes_count || 0}`);

      // Toggle like
      await toggleLike(product.id);
      addDebugInfo('✅ Лайк переключен');

      // Wait and refresh
      setTimeout(async () => {
        await refetch();
        addDebugInfo('🔄 Данные обновлены после лайка');
      }, 1000);

    } catch (error) {
      addDebugInfo(`❌ Ошибка лайков: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  };

  const checkDataConsistency = async () => {
    try {
      addDebugInfo('🔍 Проверяем консистентность данных...');

      // Check products from database directly
      const dbProducts = await productService.getAll();
      addDebugInfo(`📊 В базе данных: ${dbProducts.length} товаров`);
      addDebugInfo(`📊 В компоненте: ${products.length} товаров`);

      if (dbProducts.length !== products.length) {
        addDebugInfo('⚠️ Несоответствие количества товаров!');
      }

      // Check likes
      const likedProductsArray = Array.from(likesState.likedProducts);
      addDebugInfo(`💖 Лайкнутых товаров в контексте: ${likedProductsArray.length}`);

      if (dbProducts.length > 0) {
        const firstProduct = dbProducts[0];
        addDebugInfo(`📦 Первый товар: ${firstProduct.name}`);
        addDebugInfo(`💖 Лайков у первого товара: ${firstProduct.likes_count || 0}`);
        addDebugInfo(`💖 Лайкнут ли в контексте: ${isLiked(firstProduct.id) ? 'да' : 'нет'}`);
      }

    } catch (error) {
      addDebugInfo(`❌ Ошибка проверки: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  };

  const clearDebugInfo = () => {
    setDebugInfo([]);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>🐛 Панель отладки</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={testProductUpdate} size="sm" disabled={loading}>
            Тест обновления товара
          </Button>
          <Button onClick={testLikeSystem} size="sm" disabled={loading}>
            Тест системы лайков
          </Button>
          <Button onClick={checkDataConsistency} size="sm" disabled={loading}>
            Проверить данные
          </Button>
          <Button onClick={clearDebugInfo} size="sm" variant="outline">
            Очистить лог
          </Button>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">Состояние данных:</h4>
          <div className="text-sm space-y-1">
            <div>Товаров загружено: {products.length}</div>
            <div>Загрузка: {loading ? 'да' : 'нет'}</div>
            <div>Лайкнутых товаров: {Array.from(likesState.likedProducts).length}</div>
            <div>Загрузка лайков: {likesState.isLoading ? 'да' : 'нет'}</div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">Лог отладки:</h4>
          <div className="max-h-60 overflow-y-auto bg-muted p-3 rounded text-sm font-mono">
            {debugInfo.length === 0 ? (
              <p className="text-muted-foreground">Нет записей</p>
            ) : (
              debugInfo.map((info, index) => (
                <div key={index} className="mb-1">{info}</div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">Товары (первые 3):</h4>
          <div className="space-y-2">
            {products.slice(0, 3).map(product => (
              <div key={product.id} className="text-sm p-2 bg-muted rounded">
                <div className="font-medium">{product.name}</div>
                <div className="text-muted-foreground">
                  Цена: {product.price}₽ | Лайков: {product.likes_count || 0} | 
                  Лайкнут: {isLiked(product.id) ? '❤️' : '🤍'}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}