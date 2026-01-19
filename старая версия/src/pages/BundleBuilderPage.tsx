import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, ShoppingCart, Trash2, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCustomBundle } from '@/contexts/CustomBundleContext';
import { useCart } from '@/contexts/CartContext';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';
import type { Product } from '@/types';

export default function BundleBuilderPage() {
  const { 
    state, 
    removeProduct,
    updateQuantity,
    clearBundle, 
    isValidBundle 
  } = useCustomBundle();
  const { addItem } = useCart();
  
  const [currentStep, setCurrentStep] = useState<'selection' | 'review' | 'checkout'>('selection');
  const navigate = useNavigate();

  const totalQuantity = state.items.reduce((sum, item) => sum + item.quantity, 0);

  const handleRemoveProduct = (productId: string) => {
    removeProduct(productId);
    toast.success('Товар удален из набора');
  };

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeProduct(productId);
      toast.success('Товар удален из набора');
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  const handleOpenProduct = (productId: string) => {
    navigate(`/product/${productId}?fromBundle=1`);
  };

  const handleAddToCart = () => {
    if (!isValidBundle) {
      toast.error('Добавьте от 5 до 20 товаров в набор');
      return;
    }

    // Create a bundle item for the cart
    const bundleItem: Product = {
      id: `bundle-${Date.now()}`,
      sku: `bundle-${Date.now()}`,
      name: `Индивидуальный набор (${totalQuantity} товаров)`,
      description: `Индивидуальный набор из ${totalQuantity} товаров`,
      composition: state.items
        .map(item =>
          item.quantity > 1
            ? `${item.product.name} × ${item.quantity}`
            : item.product.name
        )
        .join(', '),
      price: state.total,
      original_price: null,
      images: state.items[0]?.product.images || [],
      tags: ['набор', 'индивидуальный'],
      status: 'in_stock' as const,
      type: 'bundle' as const,
      is_featured: false,
      specifications: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      likes_count: 0
    };

    addItem(bundleItem);
    clearBundle();
    toast.success('Набор добавлен в корзину');
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'selection':
        return 'Выберите товары для набора';
      case 'review':
        return 'Проверьте ваш набор';
      case 'checkout':
        return 'Оформление набора';
      default:
        return 'Конструктор наборов';
    }
  };

  const getProgressPercentage = () => {
    const minItems = 5;
    const maxItems = 20;
    const currentItems = totalQuantity;
    
    if (currentItems < minItems) {
      return (currentItems / minItems) * 50; // 0-50% for reaching minimum
    } else {
      return 50 + ((currentItems - minItems) / (maxItems - minItems)) * 50; // 50-100% for reaching maximum
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-2 sm:px-3 lg:px-4 py-4 sm:py-6 lg:py-10">
        {/* Header */}
        <div className="mb-4 sm:mb-6 lg:mb-8">
          <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold font-heading mb-1 sm:mb-2">{getStepTitle()}</h1>
          <p className="text-muted-foreground text-xs sm:text-sm lg:text-base">
            Создайте уникальный подарочный набор из 5-20 товаров
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 lg:gap-8 lg:grid-cols-3">
          {/* Bundle Summary - Mobile First */}
          <div className="lg:col-span-1 lg:order-2">
            <Card className="sticky top-4 sm:top-6 lg:top-8">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Package className="h-4 w-4 sm:h-5 sm:w-5" />
                  Ваш набор
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                {/* Progress */}
                <div className="space-y-1.5 sm:space-y-2">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span>Товаров в наборе:</span>
                    <span className="font-medium">
                      {totalQuantity} / 20
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                    <div
                      className="bg-primary h-1.5 sm:h-2 rounded-full transition-all duration-300"
                      style={{ width: `${getProgressPercentage()}%` }}
                    />
                  </div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground">
                    {totalQuantity < 5 
                      ? `Добавьте еще ${5 - totalQuantity} товаров для создания набора`
                      : isValidBundle 
                        ? 'Набор готов к оформлению!'
                        : 'Достигнут максимум товаров'
                    }
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between text-lg font-bold">
                  <span>Общая сумма:</span>
                  <span className="text-primary">{formatPrice(state.total)}</span>
                </div>

                {/* Actions */}
                <div className="space-y-2">
                  {currentStep === 'selection' && (
                    <>
                      <Button
                        className="w-full"
                        onClick={() => setCurrentStep('review')}
                        disabled={!isValidBundle}
                      >
                        {isValidBundle ? 'Далее' : `Добавьте ${5 - totalQuantity} товаров`}
                      </Button>
                      {state.items.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={clearBundle}
                        >
                          Очистить набор
                        </Button>
                      )}
                    </>
                  )}

                  {currentStep === 'review' && (
                    <>
                      <Button
                        className="button-with-icon w-full"
                        onClick={handleAddToCart}
                        disabled={!isValidBundle}
                      >
                        <ShoppingCart className="h-4 w-4" />
                        <span>Добавить в корзину</span>
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => setCurrentStep('selection')}
                      >
                        Изменить набор
                      </Button>
                    </>
                  )}
                </div>

                {/* Info */}
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• Минимум 5 товаров в наборе</p>
                  <p>• Максимум 20 товаров в наборе</p>
                  <p>• Скидка 5% при заказе набора</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Product Selection */}
          <div className="lg:col-span-2 lg:order-1">
            {currentStep === 'selection' && (
              <div className="space-y-4 sm:space-y-6">
                {/* Ваш набор - показываем первым */}
                <div>
                  <h2 className="text-base sm:text-lg lg:text-xl font-semibold mb-3 sm:mb-4">Ваш набор</h2>
                  
                  {state.items.length > 0 ? (
                    <div className="space-y-2 mb-4 sm:mb-6">
                      {state.items.map((item) => (
                        <div
                          key={item.product.id}
                          className="flex items-center gap-3 rounded-lg border bg-card px-3 py-3 text-sm cursor-pointer hover:bg-muted/50 transition-colors"
                          onClick={() => handleOpenProduct(item.product.id)}
                        >
                          {/* Product Image */}
                          <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-lg overflow-hidden bg-muted">
                            {item.product.images[0] ? (
                              <img 
                                src={item.product.images[0]} 
                                alt={item.product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          
                          {/* Product Info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate text-sm sm:text-base">
                              {item.product.name}
                            </p>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              {formatPrice(item.product.price)} × {item.quantity} = {formatPrice(item.product.price * item.quantity)}
                            </p>
                            {item.product.tags.length > 0 && (
                              <div className="flex gap-1 mt-1">
                                {item.product.tags.slice(0, 2).map((tag, index) => (
                                  <span
                                    key={index}
                                    className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[10px] font-medium"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-1 sm:gap-2">
                            <div className="flex items-center border rounded-lg">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuantityChange(item.product.id, item.quantity - 1);
                                }}
                                className="h-8 w-8 p-0"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="px-2 sm:px-3 py-1 font-medium min-w-[2rem] text-center text-sm">
                                {item.quantity}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleQuantityChange(item.product.id, item.quantity + 1);
                                }}
                                className="h-8 w-8 p-0"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveProduct(item.product.id);
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 sm:py-6 mb-4 sm:mb-6">
                      <Package className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 text-gray-400 mx-auto mb-2 sm:mb-4" />
                      <p className="text-muted-foreground text-xs sm:text-sm">Нет товаров в наборе</p>
                    </div>
                  )}
                  
                  {/* Кнопка выбора товаров */}
                  <div className="flex justify-center">
                    <Button 
                      asChild
                      className="button-with-icon px-6 py-3 text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      <Link to="/catalog?type=product">
                        <Plus className="h-4 w-4" />
                        <span>Выбрать товары</span>
                      </Link>
                    </Button>
                  </div>
                </div>


              </div>
            )}

            {currentStep === 'review' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold">Товары в вашем наборе</h2>
                
                {state.items.length > 0 ? (
                  <div className="space-y-2">
                    {state.items.map((item) => (
                      <div
                        key={item.product.id}
                        className="flex items-center justify-between rounded-lg border bg-card px-3 py-2 text-sm"
                      >
                        <div
                          className="flex-1 min-w-0 cursor-pointer"
                          onClick={() => handleOpenProduct(item.product.id)}
                        >
                          <p className="font-medium truncate">
                            {item.product.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatPrice(item.product.price)} × {item.quantity}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <div className="flex items-center border rounded-lg">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleQuantityChange(item.product.id, item.quantity - 1)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="px-3 py-1 font-medium min-w-[2rem] text-center">
                              {item.quantity}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveProduct(item.product.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-muted-foreground">Набор пуст</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}