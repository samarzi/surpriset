import { useMemo } from 'react';
import { Heart, ShoppingBag } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/products/ProductCard';
import { useLikes } from '@/contexts/LikesContext';
import { useProducts } from '@/hooks/useDatabase';
import { Link } from 'react-router-dom';

export default function LikesPage() {
  const { getLikedProducts } = useLikes();
  const { products, loading, error } = useProducts();
  
  const likedProductIds = getLikedProducts();
  
  const likedProducts = useMemo(() => {
    if (!products.length || !likedProductIds.length) return [];
    
    return products.filter(product => likedProductIds.includes(product.id));
  }, [products, likedProductIds]);

  if (loading) {
    return (
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-8">
          <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />
          <h1 className="text-xl sm:text-3xl font-bold">Нравится</h1>
        </div>
        
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-8">
          <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />
          <h1 className="text-xl sm:text-3xl font-bold">Нравится</h1>
        </div>
        
        <Card>
          <CardContent className="p-4 sm:p-6">
            <p className="text-red-600">Ошибка загрузки: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-8">
        <Heart className="h-6 w-6 sm:h-8 sm:w-8 text-red-500 fill-current" />
        <h1 className="text-xl sm:text-3xl font-bold">Нравится</h1>
        <span className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2.5 py-0.5 rounded-full text-xs sm:text-sm font-medium">
          {likedProducts.length}
        </span>
      </div>

      {/* Empty State */}
      {likedProducts.length === 0 ? (
        <Card>
          <CardContent className="p-6 sm:p-12 text-center">
            <Heart className="h-12 w-12 sm:h-16 sm:w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h2 className="text-lg sm:text-xl font-semibold mb-2">Пока нет понравившихся товаров</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Нажимайте на сердечко у товаров, которые вам нравятся, и они появятся здесь
            </p>
            <Button asChild size="sm">
              <Link to="/catalog" className="gap-2">
                <ShoppingBag className="h-4 w-4" />
                Перейти к каталогу
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats */}
          <div className="grid gap-2 sm:gap-4 md:grid-cols-3 mb-4 sm:mb-8">
            <Card>
              <CardContent className="!p-4 sm:!p-5">
                <div className="flex items-center gap-3">
                  <Heart className="h-5 w-5 text-red-500" />
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Всего понравилось</p>
                    <p className="text-xl sm:text-2xl font-bold">{likedProducts.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="!p-4 sm:!p-5">
                <div className="flex items-center gap-3">
                  <ShoppingBag className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Готовых наборов</p>
                    <p className="text-xl sm:text-2xl font-bold">
                      {likedProducts.filter(p => p.type === 'bundle').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="!p-4 sm:!p-5">
                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 bg-primary rounded-full"></div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Отдельных товаров</p>
                    <p className="text-xl sm:text-2xl font-bold">
                      {likedProducts.filter(p => p.type === 'product').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Products Grid */}
          <div className="grid gap-2 sm:gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {likedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                showAddToCart={true}
                showAddToBundle={false}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="mt-8 text-center">
            <Button asChild variant="outline">
              <Link to="/catalog">
                Продолжить покупки
              </Link>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}