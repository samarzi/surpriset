import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Product } from '@/types';
import { formatPrice } from '@/lib/utils';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
  showAddToCart?: boolean;
}

export function ProductCard({ 
  product, 
  showAddToCart = true
}: ProductCardProps) {
  const { addItem } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (product.status !== 'in_stock') {
      toast.error('Товар недоступен для заказа');
      return;
    }

    addItem(product);
    toast.success('Товар добавлен в корзину');
  };

  const isAvailable = product.status === 'in_stock';

  return (
    <article className="mobile-product-card group animate-fade-scale">
      <Link to={`/product/${product.id}`} className="mobile-product-image-link">
        <div className="relative overflow-hidden rounded-t-lg">
          <img
            src={product.images[0] || '/placeholder-product.jpg'}
            alt={product.name}
            className="mobile-product-image"
            loading="lazy"
            decoding="async"
            fetchPriority="low"
            sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        </div>
      </Link>
      
      <div className="mobile-product-content">
        <Link to={`/product/${product.id}`}>
          <h3 className="mobile-product-title">
            {product.name}
          </h3>
        </Link>

        <footer className="mobile-product-footer">
          <span className="mobile-product-price">
            {formatPrice(product.price)}
          </span>
          
          {showAddToCart && (
            <Button
              size="sm"
              variant="natural"
              onClick={handleAddToCart}
              disabled={!isAvailable}
              className="mobile-product-cart-btn"
              aria-label={`Добавить ${product.name} в корзину`}
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          )}
        </footer>
      </div>
    </article>
  );
}