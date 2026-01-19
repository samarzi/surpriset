import { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ShoppingCart,
  Heart,
  Share2,
  Plus,
  Minus,
  Sparkles,
  Gift,
  ShieldCheck,
  Truck,
  Info,
  Package,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getProductById } from '@/data/mockData';
import { formatPrice } from '@/lib/utils';
import { useCart } from '@/contexts/CartContext';
import { useCustomBundle } from '@/contexts/CustomBundleContext';
import { useLikes } from '@/contexts/LikesContext';
import { useProduct } from '@/hooks/useDatabase';
import { useReviews } from '@/hooks/useReviews';
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp';
import { useSwipeBack } from '@/hooks/useSwipeBack';
import { ReviewList } from '@/components/reviews/ReviewList';
import { ReviewForm } from '@/components/reviews/ReviewForm';
import { AverageRating } from '@/components/reviews/StarRating';
import { Review, ReviewFormData } from '@/types/review';
import { toast } from 'sonner';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const fromBundle = searchParams.get('fromBundle') === '1';
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'composition' | 'reviews'>('description');
  const { addItem } = useCart();
  const { addProduct, canAddMore } = useCustomBundle();
  const { toggleLike, isLiked } = useLikes();

  // Swipe back gesture
  const { isSwiping, swipeProgress } = useSwipeBack({ enabled: true });

  const { product: dbProduct, loading, error } = useProduct(id ?? null);
  const { telegramUser } = useTelegramWebApp();
  const {
    reviews,
    stats,
    loading: reviewsLoading,
    fetchReviews,
    createReview,
    updateReview,
    deleteReview,
    getUserReview,
  } = useReviews(id ?? null);

  const [userReview, setUserReview] = useState<Review | null>(null);
  const [editingReview, setEditingReview] = useState(false);

  // Fallback для дев-режима без БД
  const product = dbProduct ?? (id ? getProductById(id) ?? null : null);

  useEffect(() => {
    setSelectedImageIndex(0);
    setActiveTab('description');
    setEditingReview(false);
    
    // Load user's review
    if (telegramUser && id) {
      getUserReview().then(setUserReview);
    }
  }, [product?.id, telegramUser, id]);

  const galleryImages = useMemo(() => {
    if (!product) {
      return ['/placeholder-product.jpg'];
    }

    return product.images.length > 0 ? product.images : ['/placeholder-product.jpg'];
  }, [product]);

  const productHighlights = useMemo(
    () =>
      product
        ? [
            {
              icon: Sparkles,
              title: 'Выверенная подборка',
              description:
                product.tags.length > 0
                  ? `Сочетается с темами: ${product.tags.slice(0, 3).join(', ')}`
                  : 'Подходит для любого повода',
            },
            {
              icon: Gift,
              title: product.type === 'bundle' ? 'Готовый подарок' : 'Готов к персонализации',
              description:
                product.type === 'bundle'
                  ? 'Всё необходимое уже внутри — остаётся только вручить'
                  : 'Добавьте в набор и настройте упаковку под событие',
            },
            {
              icon: ShieldCheck,
              title: 'Гарантия качества',
              description: 'Каждую позицию проверяем вручную перед отправкой',
            },
          ]
        : [],
    [product],
  );

  const specificationEntries = useMemo(
    () => (product?.specifications ? Object.entries(product.specifications) : []),
    [product?.specifications],
  );

  const compositionLines = useMemo(() => {
    if (!product?.composition) return [];
    return product.composition
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  }, [product?.composition]);

  const metaInfo = useMemo(
    () =>
      product
        ? [
            { label: 'Артикул', value: product.sku },
            { label: 'Тип', value: product.type === 'product' ? 'Товар' : 'Готовый набор' },
            {
              label: 'Добавлен',
              value: new Date(product.created_at).toLocaleDateString('ru-RU'),
            },
          ].filter(Boolean)
        : [],
    [product],
  );

  if (loading && !product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-full max-w-6xl px-2 sm:px-4">
          <div className="grid gap-4 sm:gap-6 lg:grid-cols-[300px_1fr] xl:grid-cols-[400px_1fr]">
            <div className="space-y-2 sm:space-y-3">
              <div className="w-full h-[250px] sm:h-[300px] lg:h-[400px] rounded-lg bg-muted animate-pulse" />
              <div className="flex gap-1 sm:gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-10 w-10 sm:h-12 sm:w-12 rounded bg-muted animate-pulse" />
                ))}
              </div>
            </div>
            <div className="space-y-3 sm:space-y-4">
              <div className="h-6 sm:h-8 bg-muted rounded w-3/4 animate-pulse" />
              <div className="h-8 sm:h-10 bg-muted rounded w-1/2 animate-pulse" />
              <div className="h-10 sm:h-12 bg-muted rounded animate-pulse" />
              <div className="h-16 sm:h-20 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Товар не найден</h1>
          {error && (
            <p className="text-xs sm:text-sm text-red-600 mb-3 sm:mb-4">Ошибка загрузки: {error}</p>
          )}
          <Button asChild size="sm">
            <Link to="/catalog">Вернуться в каталог</Link>
          </Button>
        </div>
      </div>
    );
  }

  const isAvailable = product.status === 'in_stock';
  const liked = isLiked(product.id);

  const handleAddToCart = () => {
    if (product.status !== 'in_stock') {
      toast.error('Товар недоступен для заказа');
      return;
    }

    // Проверка: только наборы можно добавлять в корзину
    if (product.type !== 'bundle') {
      toast.error('Отдельные товары можно добавлять только в набор');
      return;
    }

    try {
      addItem(product, quantity);
      toast.success(`Набор добавлен в корзину (${quantity} шт.)`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка добавления в корзину');
    }
  };

  const handleAddToBundle = () => {
    if (product.type !== 'product') {
      toast.error('В набор можно добавлять только отдельные товары');
      return;
    }

    if (product.status !== 'in_stock') {
      toast.error('Товар недоступен для добавления в набор');
      return;
    }

    if (!canAddMore) {
      toast.error('Достигнут максимум товаров в наборе (20 шт.)');
      return;
    }

    addProduct(product);
    toast.success('Товар добавлен в набор');
  };

  const handleToggleLike = async () => {
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

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description,
          url: window.location.href,
        });
      } catch {
        // User cancelled sharing
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success('Ссылка скопирована в буфер обмена');
    }
  };

  const getStatusBadge = () => {
    switch (product.status) {
      case 'out_of_stock':
        return (
          <span className="inline-flex items-center gap-2 rounded-full bg-red-100/80 px-3 py-1 text-xs font-semibold text-red-700">
            Закончилось
          </span>
        );
      case 'coming_soon':
        return (
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-100/80 px-3 py-1 text-xs font-semibold text-blue-700">
            Скоро в продаже
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100/80 px-3 py-1 text-xs font-semibold text-emerald-700">
            В наличии
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 sm:pb-4 swipe-back-container">
      {/* Swipe back indicator */}
      {isSwiping && (
        <div className={`swipe-back-indicator ${swipeProgress > 0.4 ? 'active' : ''}`}>
          <ArrowLeft />
        </div>
      )}
      
      <div 
        className={`page-content ${isSwiping ? 'swiping' : ''}`}
        style={{
          transform: isSwiping ? `translate3d(${swipeProgress * 120}px, 0, 0)` : 'translate3d(0, 0, 0)',
          WebkitTransform: isSwiping ? `translate3d(${swipeProgress * 120}px, 0, 0)` : 'translate3d(0, 0, 0)',
        }}
      >
        <div className="container px-2 sm:px-3 lg:px-4 py-2 sm:py-3 lg:py-4">
        <div className="flex items-center justify-between mb-2 sm:mb-3 lg:mb-4">
          <Button 
            variant="outline" 
            size="sm" 
            className="gap-1.5 sm:gap-2 h-8 sm:h-9 lg:h-10 text-[10px] sm:text-xs lg:text-sm px-2 sm:px-3 lg:px-4 rounded-xl border-2 hover:border-primary/50 hover:bg-primary/10 transition-all duration-200 shadow-sm hover:shadow-md" 
            asChild
          >
            <Link to="/catalog">
              <ArrowLeft className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4" />
              <span className="hidden xs:inline">Назад</span>
              <span className="hidden sm:inline">к каталогу</span>
            </Link>
          </Button>

          <div className="flex items-center gap-1 sm:gap-1.5 lg:gap-2">
            <Button
              variant={liked ? 'default' : 'outline'}
              size="sm"
              className={`h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10 p-0 ${
                liked ? 'bg-red-500 text-white hover:bg-red-600' : ''
              }`}
              onClick={handleToggleLike}
            >
              <Heart className={`h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4 ${liked ? 'fill-current' : ''}`} />
            </Button>
            <Button variant="outline" size="sm" className="h-7 w-7 sm:h-8 sm:w-8 lg:h-10 lg:w-10 p-0" onClick={handleShare}>
              <Share2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4" />
            </Button>
          </div>
        </div>

        <div className="grid gap-3 sm:gap-4 lg:gap-6 lg:grid-cols-[300px_1fr] xl:grid-cols-[400px_1fr]">
          {/* Gallery */}
          <div className="space-y-2 sm:space-y-3">
            <div className="relative overflow-hidden rounded-xl border bg-card shadow-sm aspect-[3/4]">
              <img
                src={galleryImages[selectedImageIndex]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              {product.type === 'bundle' && (
                <div className="absolute top-2 sm:top-3 left-2 sm:left-3 bg-primary text-black px-2 py-1 rounded text-[10px] sm:text-xs font-medium">
                  Готовый набор
                </div>
              )}
            </div>

            {galleryImages.length > 1 && (
              <div className="flex gap-1 sm:gap-2 overflow-x-auto">
                {galleryImages.map((image, index) => (
                  <button
                    key={image}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative flex aspect-[3/4] w-10 sm:w-12 flex-shrink-0 overflow-hidden rounded border transition-all ${
                      selectedImageIndex === index
                        ? 'border-primary'
                        : 'border-border hover:border-border/80'
                    }`}
                  >
                    <img src={image} alt={`${product.name} ${index + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="space-y-3 sm:space-y-4">
            {/* Main Info */}
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                {getStatusBadge()}
                {product.tags.length > 0 && (
                  <span className="text-[10px] sm:text-xs text-muted-foreground">
                    {product.tags.slice(0, 2).join(' • ')}
                  </span>
                )}
              </div>
              
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold leading-tight">
                {product.name}
              </h1>
              
              <div className="flex items-baseline gap-2 sm:gap-3 flex-wrap">
                <span className="text-xl sm:text-2xl lg:text-3xl font-bold">
                  {formatPrice(product.price)}
                </span>
                {product.original_price && product.original_price > product.price && (
                  <>
                    <span className="text-sm sm:text-base lg:text-lg text-muted-foreground line-through">
                      {formatPrice(product.original_price)}
                    </span>
                    <span className="bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-medium">
                      -{Math.round((1 - product.price / product.original_price) * 100)}%
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="border-t pt-3 sm:pt-4">
              {isAvailable && (
                <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                  <span className="text-xs sm:text-sm font-medium">Количество:</span>
                  <div className="flex items-center border rounded-lg">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                    <span className="px-2 sm:px-3 py-1 min-w-[2rem] sm:min-w-[3rem] text-center text-xs sm:text-sm">{quantity}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                      onClick={() => setQuantity(quantity + 1)}
                    >
                      <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                    </Button>
                  </div>
                </div>
              )}

              <div className="flex gap-2 sm:gap-3">
                {/* Кнопка "В корзину" только для наборов */}
                {product.type === 'bundle' && (
                  <Button
                    className="flex-1 h-10 sm:h-12 text-xs sm:text-sm"
                    onClick={handleAddToCart}
                    disabled={!isAvailable}
                  >
                    <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    {isAvailable ? 'В корзину' : 'Недоступно'}
                  </Button>
                )}

                {/* Кнопка "В набор" только для отдельных товаров в наличии */}
                {product.type === 'product' && product.status === 'in_stock' && (
                  <Button
                    className="flex-1 h-10 sm:h-12 text-xs sm:text-sm bg-purple-500 hover:bg-purple-600 text-white"
                    onClick={handleAddToBundle}
                    disabled={!canAddMore}
                  >
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    {canAddMore ? 'Добавить в набор' : 'Набор заполнен'}
                  </Button>
                )}

                {/* Сообщение о недоступности для товаров не в наличии */}
                {product.type === 'product' && product.status !== 'in_stock' && (
                  <div className="flex-1 h-10 sm:h-12 text-xs sm:text-sm bg-red-100 border border-red-200 rounded-md flex items-center justify-center">
                    <span className="text-red-600 font-medium">Товар недоступен для добавления в набор</span>
                  </div>
                )}

                {/* Дополнительная кнопка "В набор" для наборов (если не из конструктора) */}
                {product.type === 'bundle' && !fromBundle && product.status === 'in_stock' && (
                  <Button
                    variant="outline"
                    className="h-10 sm:h-12 text-xs sm:text-sm px-3 sm:px-4 border-orange-300 text-orange-600 hover:bg-orange-50"
                    onClick={handleAddToBundle}
                    disabled={!canAddMore}
                  >
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    В набор
                  </Button>
                )}
              </div>

              <div className="mt-2 sm:mt-3 p-2.5 sm:p-3 bg-muted/50 rounded-lg text-xs sm:text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Truck className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>Бесплатная доставка от 3000 ₽</span>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-t pt-3 sm:pt-4">
              <div className="flex overflow-x-auto scrollbar-hide border-b border-border/50 mb-3 sm:mb-4 -mx-2 px-2 sm:mx-0 sm:px-0">
                {[
                  { key: 'description', label: 'Описание', icon: Info },
                  { key: 'specs', label: 'Характеристики', icon: Package },
                  { key: 'composition', label: 'Состав', icon: Gift },
                  { key: 'reviews', label: 'Отзывы', icon: MessageSquare, badge: stats?.reviews_count },
                ].map(({ key, label, icon: Icon, badge }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key as any)}
                    className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-4 py-2 text-[10px] sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
                      activeTab === key
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="text-[10px] sm:text-sm">{label}</span>
                    {badge !== undefined && badge > 0 && (
                      <span className="ml-0.5 sm:ml-1 px-1 sm:px-1.5 py-0.5 bg-primary/10 text-primary rounded text-[8px] sm:text-xs font-bold">
                        {badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="min-h-[120px]">
                {activeTab === 'description' && (
                  <div className="space-y-3 sm:space-y-4">
                    {product.description && (
                      <div>
                        <h3 className="font-semibold mb-2 text-sm sm:text-base">Описание</h3>
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                          {product.description}
                        </p>
                      </div>
                    )}

                    {/* Features */}
                    {productHighlights.length > 0 && (
                      <div>
                        <h3 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base">Особенности</h3>
                        <div className="space-y-2 sm:space-y-3">
                          {productHighlights.map(({ icon: Icon, title, description }) => (
                            <div key={title} className="flex gap-2 sm:gap-3">
                              <div className="flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded bg-primary/10 text-primary flex-shrink-0">
                                <Icon className="h-3 w-3 sm:h-4 sm:w-4" />
                              </div>
                              <div>
                                <p className="font-medium text-xs sm:text-sm">{title}</p>
                                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">{description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'specs' && (
                  <div className="space-y-3 sm:space-y-4">
                    {specificationEntries.length > 0 ? (
                      <div>
                        <h3 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base">Характеристики</h3>
                        <dl className="space-y-1.5 sm:space-y-2">
                          {specificationEntries.map(([key, value]) => (
                            <div key={key} className="flex justify-between text-xs sm:text-sm">
                              <dt className="text-muted-foreground">{key}</dt>
                              <dd className="font-medium">{value}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    ) : (
                      <div className="text-center py-6 sm:py-8">
                        <Package className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground/50 mx-auto mb-2 sm:mb-3" />
                        <p className="text-xs sm:text-sm text-muted-foreground">Характеристики не указаны</p>
                      </div>
                    )}

                    {/* Meta Info */}
                    {metaInfo.length > 0 && (
                      <div className="border-t pt-3 sm:pt-4">
                        <h3 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base">Дополнительная информация</h3>
                        <dl className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                          {metaInfo.map((item) => (
                            <div key={item!.label} className="flex justify-between">
                              <dt className="text-muted-foreground">{item!.label}</dt>
                              <dd className="font-medium">{item!.value}</dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'composition' && (
                  <div>
                    {compositionLines.length > 0 ? (
                      <div>
                        <h3 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base">Состав</h3>
                        <ul className="space-y-1 sm:space-y-1.5 text-xs sm:text-sm text-muted-foreground">
                          {compositionLines.map((line, index) => (
                            <li key={`${line}-${index}`} className="flex items-start gap-2">
                              <span className="w-1 h-1 bg-muted-foreground rounded-full mt-1.5 sm:mt-2 flex-shrink-0" />
                              <span>{line}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="text-center py-6 sm:py-8">
                        <Gift className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground/50 mx-auto mb-2 sm:mb-3" />
                        <p className="text-xs sm:text-sm text-muted-foreground">Состав не указан</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div className="space-y-6">
                    {/* Reviews Stats */}
                    {stats && stats.reviews_count > 0 && (
                      <div className="flex items-center justify-between pb-4 border-b">
                        <AverageRating
                          rating={stats.average_rating}
                          reviewsCount={stats.reviews_count}
                          size="md"
                        />
                      </div>
                    )}

                    {/* User Review Form */}
                    {telegramUser && (
                      <div>
                        {!userReview || editingReview ? (
                          <div>
                            <h3 className="font-semibold mb-3 text-sm sm:text-base">
                              {editingReview ? 'Редактировать отзыв' : 'Оставить отзыв'}
                            </h3>
                            <ReviewForm
                              onSubmit={async (data: ReviewFormData) => {
                                if (editingReview && userReview) {
                                  await updateReview(userReview.id, data);
                                  toast.success('Отзыв обновлен');
                                  setEditingReview(false);
                                  const updated = await getUserReview();
                                  setUserReview(updated);
                                } else {
                                  await createReview(data);
                                  toast.success('Отзыв отправлен на модерацию');
                                  const newReview = await getUserReview();
                                  setUserReview(newReview);
                                }
                              }}
                              initialData={
                                editingReview && userReview
                                  ? {
                                      rating: userReview.rating,
                                      comment: userReview.comment || '',
                                      photos: [],
                                    }
                                  : undefined
                              }
                              isEditing={editingReview}
                              onCancel={
                                editingReview
                                  ? () => setEditingReview(false)
                                  : undefined
                              }
                            />
                          </div>
                        ) : (
                          <div className="p-3 sm:p-4 bg-muted/30 rounded-lg space-y-2">
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              Вы уже оставили отзыв на этот товар
                            </p>
                            {userReview.status === 'pending' && (
                              <p className="text-[10px] sm:text-xs text-yellow-600 dark:text-yellow-400">
                                Отзыв на модерации
                              </p>
                            )}
                            {new Date() < new Date(userReview.can_edit_until) && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingReview(true)}
                                className="h-8 text-xs"
                              >
                                Редактировать
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {!telegramUser && (
                      <div className="p-4 bg-muted/30 rounded-lg text-center">
                        <p className="text-sm text-muted-foreground">
                          Войдите через Telegram, чтобы оставить отзыв
                        </p>
                      </div>
                    )}

                    {/* Reviews List */}
                    <div>
                      <h3 className="font-semibold mb-3 text-sm sm:text-base">
                        Отзывы покупателей
                      </h3>
                      {reviewsLoading ? (
                        <div className="text-center py-8">
                          <p className="text-sm text-muted-foreground">Загрузка отзывов...</p>
                        </div>
                      ) : (
                        <ReviewList
                          reviews={reviews}
                          currentUserId={telegramUser?.id.toString()}
                          onEdit={(review) => {
                            setUserReview(review);
                            setEditingReview(true);
                          }}
                          onDelete={async (reviewId) => {
                            if (confirm('Удалить отзыв?')) {
                              await deleteReview(reviewId);
                              toast.success('Отзыв удален');
                              setUserReview(null);
                            }
                          }}
                          onSortChange={fetchReviews}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}