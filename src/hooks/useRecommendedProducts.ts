import { useState, useEffect } from 'react';
import { Product } from '@/types';
import { productService } from '@/lib/database';
import { mockProducts } from '@/data/mockData';

interface UseRecommendedProductsProps {
  currentProductId: string;
  categoryIds?: string[];
  limit?: number;
}

export function useRecommendedProducts({ 
  currentProductId, 
  categoryIds = [], 
  limit = 6 
}: UseRecommendedProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecommendedProducts = async () => {
      if (!currentProductId) return;
      
      setLoading(true);
      setError(null);

      try {
        let recommendedProducts: Product[] = [];

        // Пробуем получить из базы данных
        try {
          if (categoryIds.length > 0) {
            // Получаем товары из тех же категорий
            const { data, error: dbError } = await productService.getByCategories(categoryIds);
            if (!dbError && data) {
              recommendedProducts = data.filter((p: Product) => p.id !== currentProductId);
            }
          }
          
          // Если товаров мало, получаем все товары
          if (recommendedProducts.length < limit) {
            const allProducts = await productService.getAll({ status: 'in_stock' });
            if (allProducts) {
              const additionalProducts = allProducts
                .filter((p: Product) => p.id !== currentProductId && !recommendedProducts.find((rp: Product) => rp.id === p.id))
                .slice(0, limit - recommendedProducts.length);
              recommendedProducts = [...recommendedProducts, ...additionalProducts];
            }
          }
        } catch {
          console.warn('Database not available, using mock data');
        }

        // Fallback к mock данным если база недоступна
        if (recommendedProducts.length === 0) {
          recommendedProducts = mockProducts.filter(p => p.id !== currentProductId);
        }

        // Перемешиваем товары для рандомности
        const shuffled = [...recommendedProducts].sort(() => Math.random() - 0.5);
        
        // Берем только нужное количество
        setProducts(shuffled.slice(0, limit));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки рекомендуемых товаров');
        console.error('Error fetching recommended products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendedProducts();
  }, [currentProductId, categoryIds, limit]);

  return { products, loading, error };
}
