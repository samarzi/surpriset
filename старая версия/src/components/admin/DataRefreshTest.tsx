import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProducts } from '@/hooks/useDatabase';
import { likesService } from '@/lib/database';

export function DataRefreshTest() {
  const { products, loading, refetch } = useProducts();
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testLikeUpdate = async () => {
    if (products.length === 0) {
      addTestResult('❌ Нет товаров для тестирования');
      return;
    }

    const product = products[0];
    const testSession = 'test_' + Date.now();

    try {
      addTestResult(`🧪 Тестируем лайки для товара: ${product.name}`);
      
      // Add like
      await likesService.addLike(product.id, testSession);
      addTestResult('✅ Лайк добавлен');
      
      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Refresh data
      await refetch();
      addTestResult('🔄 Данные обновлены');
      
      // Remove like
      await likesService.removeLike(product.id, testSession);
      addTestResult('✅ Лайк удален');
      
      // Refresh again
      await refetch();
      addTestResult('🔄 Данные обновлены повторно');
      
    } catch (error) {
      addTestResult(`❌ Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Тест обновления данных</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={testLikeUpdate} disabled={loading}>
            Тест лайков
          </Button>
          <Button onClick={refetch} variant="outline" disabled={loading}>
            Обновить данные
          </Button>
          <Button onClick={clearResults} variant="outline">
            Очистить результаты
          </Button>
        </div>
        
        <div className="space-y-2">
          <h4 className="font-medium">Товары ({products.length}):</h4>
          {products.slice(0, 3).map(product => (
            <div key={product.id} className="text-sm p-2 bg-muted rounded">
              {product.name} - Лайков: {product.likes_count || 0}
            </div>
          ))}
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">Результаты тестов:</h4>
          <div className="max-h-40 overflow-y-auto bg-muted p-2 rounded text-sm">
            {testResults.length === 0 ? (
              <p className="text-muted-foreground">Нет результатов</p>
            ) : (
              testResults.map((result, index) => (
                <div key={index}>{result}</div>
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}