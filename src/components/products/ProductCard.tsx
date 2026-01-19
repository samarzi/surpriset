import { Link } from 'react-router-dom';
import { ShoppingCart, Heart, Sparkles, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Product } from '@/types';
import { formatPrice } from '@/lib/utils';
import { useCart } from '@/contexts/CartContext';
import { useLikes } from '@/contexts/LikesContext';
import { useCustomBundle } from '@/contexts/CustomBundleContext';
import { toast } from 'sonner';
import { mediumHaptic, successHaptic } from '@/utils/haptics';

interface ProductCardProps {
  product: Product;
  showAddToCart?: boolean;
  showAddToBundle?: boolean;
  onAddToBundle?: (product: Product) => void;
}

export function ProductCard({ 
  product, 
  showAddToCart = true, 
  showAddToBundle = true,
  onAddToBundle 
}: ProductCardProps) {
  const { addItem } = useCart();
  const { toggleLike, isLiked } = useLikes();
  const { addProduct } = useCustomBundle();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Вибрация при клике
    mediumHaptic();
    
    if (product.status !== 'in_stock') {
      toast.error('Товар недоступен для заказа');
      return;
    }

    addItem(product);
    successHaptic(); // Вибрация успеха
    toast.success('Товар добавлен в корзину');
  };

  const handleToggleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const wasLiked = isLiked(product.id);
    
    try {
      await toggleLike(product.id);
      toast.success(
        wasLiked 
          ? 'Товар удален из избранного' 
          : 'Товар добавлен в избранное'
      );
    } catch {
      toast.error('Ошибка при добавлении в избранное');
    }
  };

  const handleAddToBundle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Вибрация при клике
    mediumHaptic();
    
    if (product.type !== 'product') {
      toast.error('В набор можно добавлять только отдельные товары');
      return;
    }

    if (product.status !== 'in_stock') {
      toast.error('Товар недоступен для добавления в набор');
      return;
    }

    if (onAddToBundle) {
      onAddToBundle(product);
    } else {
      // Используем контекст CustomBundle для добавления товара
      addProduct(product);
      successHaptic(); // Вибрация успеха
      toast.success('Товар добавлен в набор');
    }
  };

  const getStatusBadge = () => {
    switch (product.status) {
      case 'out_of_stock':
        return (
          <div className="absolute top-3 right-3 bg-red-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-semibold">
            Закончилось
          </div>
        );
      case 'coming_soon':
        return (
          <div className="absolute top-3 right-3 bg-blue-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-semibold">
            Скоро
          </div>
        );
      default:
        return null;
    }
  };

  const isAvailable = product.status === 'in_stock';
  const liked = isLiked(product.id);

  return (
    <Card 
      data-testid="product-card" 
      className="product-card modern-card group relative overflow-hidden"
    >
      {/* Image Container */}
      <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
        <Link to={`/product/${product.id}`} className="block h-full w-full">
          <img
            src={product.images[0] || '/placeholder-product.jpg'}
            alt={product.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </Link>
        
        {/* Status Badge */}
        {getStatusBadge()}
        
        {/* Like Button - Outside Link */}
        <Button
          size="icon"
          variant="glass"
          onClick={handleToggleLike}
          className={`absolute top-2 left-2 w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10 z-10 transition-colors duration-300 ${
            liked 
              ? 'bg-red-500/90 text-white hover:bg-red-600/90' 
              : 'hover:bg-white/20'
          }`}
        >
          <Heart className={`h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4 ${liked ? 'fill-current' : ''}`} />
        </Button>
        
        {/* Product Type Badge - Moved to top */}
        {product.type === 'bundle' && (
          <div className="absolute top-2 left-12 sm:left-14 lg:left-16 flex items-center gap-1 bg-primary/90 backdrop-blur-sm text-black px-2 py-1 rounded-full z-10">
            <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
            <span className="text-[9px] sm:text-xs font-semibold">
              Готовый набор
            </span>
          </div>
        )}
        
        {/* Tags */}
        {product.tags.length > 0 && (
          <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
            {product.tags.slice(0, 2).map((tag, index) => (
              <span
                key={index}
                className="bg-brand-gradient text-black px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-[9px] sm:text-xs font-semibold shadow-lg"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <Link to={`/product/${product.id}`} className="block">
        <CardContent className="p-2 sm:p-3">
          <div className="space-y-1 sm:space-y-1.5">
            {/* Product Name */}
            <h3 className="font-semibold text-[11px] sm:text-xs lg:text-sm line-clamp-2 group-hover:text-primary transition-colors leading-tight min-h-[2.2em]">
              {product.name}
            </h3>

            {/* Price */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1">
                <span className="text-xs sm:text-sm font-bold text-foreground">
                  {formatPrice(product.price)}
                </span>
                {product.original_price && product.original_price > product.price && (
                  <span className="text-[10px] sm:text-xs text-muted-foreground line-through">
                    {formatPrice(product.original_price)}
                  </span>
                )}
              </div>
              
              {/* Discount Badge */}
              {product.original_price && product.original_price > product.price && (
                <span className="bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-1 sm:px-1.5 py-0.5 rounded-full text-[9px] sm:text-xs font-semibold">
                  -{Math.round((1 - product.price / product.original_price) * 100)}%
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Link>

      {/* Action Buttons */}
      <div className="hidden sm:flex absolute bottom-4 right-4 gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
        {/* Для товаров - только кнопка "В набор" если товар в наличии */}
        {showAddToBundle && product.type === 'product' && product.status === 'in_stock' && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleAddToBundle}
            className="backdrop-blur-xl w-8 h-8 p-0 no-lift important-button bg-orange-500/20 border-orange-300 hover:bg-orange-500 hover:text-white"
            title="Добавить в набор"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
        
        {/* Для наборов - кнопка "В корзину" */}
        {showAddToCart && product.type === 'bundle' && (
          <Button
            size="sm"
            onClick={handleAddToCart}
            disabled={!isAvailable}
            className="backdrop-blur-xl w-8 h-8 p-0 no-lift important-button"
            title={isAvailable ? 'В корзину' : 'Недоступно'}
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Mobile Action Buttons */}
      <div className="sm:hidden px-2 pb-1.5 flex gap-1">
        {/* Для товаров - только кнопка "В набор" если товар в наличии */}
        {showAddToBundle && product.type === 'product' && product.status === 'in_stock' && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleAddToBundle}
            className="flex-1 text-[10px] py-1 h-6 rounded-lg bg-gradient-to-r from-purple-500/10 to-purple-500/20 hover:from-purple-500/20 hover:to-purple-500/30 border-purple-500/30 no-lift important-button text-purple-700"
            title="Добавить в набор"
          >
            <Plus className="h-2.5 w-2.5 mr-1" />
            <span>В набор</span>
          </Button>
        )}

        {/* Показываем сообщение о недоступности для товаров не в наличии */}
        {showAddToBundle && product.type === 'product' && product.status !== 'in_stock' && (
          <div className="flex-1 text-[10px] py-1 h-6 rounded-lg bg-red-100 border border-red-200 flex items-center justify-center">
            <span className="text-red-600 font-medium">Недоступно</span>
          </div>
        )}

        {/* Для наборов - кнопка "В корзину" */}
        {showAddToCart && product.type === 'bundle' && (
          <Button
            size="sm"
            onClick={handleAddToCart}
            disabled={!isAvailable}
            className="flex-1 text-[10px] py-1 h-6 rounded-lg bg-brand-gradient hover:bg-brand-gradient-dark text-black font-semibold no-lift important-button"
            title={isAvailable ? 'В корзину' : 'Недоступно'}
          >
            <ShoppingCart className="h-2.5 w-2.5 mr-1" />
            <span>{isAvailable ? 'В корзину' : 'Недоступно'}</span>
          </Button>
        )}
      </div>
    </Card>
  );
}