import { useRecommendedProducts } from '@/hooks/useRecommendedProducts';
import { ProductCard } from '@/components/products/ProductCard';

interface RecommendedProductsProps {
  currentProductId: string;
  categoryIds?: string[];
  limit?: number;
}

export function RecommendedProducts({ 
  currentProductId, 
  categoryIds = [], 
  limit = 6 
}: RecommendedProductsProps) {
  const { products, loading, error } = useRecommendedProducts({
    currentProductId,
    categoryIds,
    limit
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg sm:text-xl font-semibold">Рекомендуемые товары</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 lg:gap-6">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="h-36 sm:h-44 lg:h-56 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || products.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <h3 className="text-xl sm:text-2xl font-bold">Рекомендуемые товары</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 lg:gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
