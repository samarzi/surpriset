import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { productService, bannerService } from '@/lib/database';

export function DatabaseTest() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testDatabase = async () => {
    setLoading(true);
    setTestResults([]);
    
    try {
      addResult('🔍 Начинаем тестирование базы данных...');
      
      // Test products
      addResult('📦 Тестируем загрузку товаров...');
      const products = await productService.getAll();
      addResult(`✅ Товары загружены: ${products.length} шт.`);
      
      if (products.length > 0) {
        addResult(`   Первый товар: ${products[0].name}`);
      }
      
      // Test banners
      addResult('🖼️ Тестируем загрузку баннеров...');
      const banners = await bannerService.getAll();
      addResult(`✅ Баннеры загружены: ${banners.length} шт.`);
      
      if (banners.length > 0) {
        addResult(`   Первый баннер: ${banners[0].title}`);
      }
      
      // Test create product
      addResult('➕ Тестируем создание товара...');
      const newProduct = await productService.create({
        sku: `TEST-${Date.now()}`,
        name: 'Тестовый товар',
        description: 'Это тестовый товар для проверки API',
        price: 100,
        images: [],
        tags: ['тест'],
        status: 'in_stock',
        type: 'product',
        is_featured: false,
        likes_count: 0
      });
      addResult(`✅ Товар создан: ${newProduct.name} (ID: ${newProduct.id})`);
      
      // Test update product
      addResult('✏️ Тестируем обновление товара...');
      const updatedProduct = await productService.update(newProduct.id, {
        name: 'Обновленный тестовый товар',
        price: 150
      });
      addResult(`✅ Товар обновлен: ${updatedProduct.name}, цена: ${updatedProduct.price}₽`);
      
      // Test delete product
      addResult('🗑️ Тестируем удаление товара...');
      await productService.delete(newProduct.id);
      addResult(`✅ Товар удален: ${newProduct.id}`);
      
      addResult('🎉 Все тесты прошли успешно!');
      
    } catch (error) {
      addResult(`❌ Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
      console.error('Database test error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Тест базы данных</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testDatabase} 
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Тестирование...' : 'Запустить тест базы данных'}
        </Button>
        
        {testResults.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Результаты тестирования:</h3>
            <div className="space-y-1 text-sm font-mono">
              {testResults.map((result, index) => (
                <div key={index} className="text-xs">
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}