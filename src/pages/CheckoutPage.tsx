import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Truck, Shield, Package, Gift, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCart } from '@/contexts/CartContext';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';
import { useCreateOrder } from '@/hooks/useDatabase';
import { useCustomerProfile } from '@/hooks/useCustomerProfile';
import AdditionalServicesSelection from '@/components/checkout/AdditionalServicesSelection';
import { Packaging, AdditionalService } from '@/types';
import { orderServiceService, packagingService } from '@/lib/database';

const ASSEMBLY_SERVICE_PRICE = 0; // Бесплатная сборка по умолчанию
const MINIMUM_ORDER_AMOUNT = 2000;

export default function CheckoutPage() {
  const { state, clearCart } = useCart();
  const navigate = useNavigate();
  const { createOrder } = useCreateOrder();
  const { profile } = useCustomerProfile();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    notes: '',
    paymentMethod: 'card',
    deliveryMethod: 'courier'
  });
  
  const [loading, setLoading] = useState(false);
  const [selectedPackaging, setSelectedPackaging] = useState<Packaging | null>(null);
  const [packagingOptions, setPackagingOptions] = useState<Packaging[]>([]);
  const [packagingLoading, setPackagingLoading] = useState(true);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<AdditionalService[]>([]);
  const [checkoutStep, setCheckoutStep] = useState<'packaging' | 'services' | 'final'>('packaging');
  const [hasPrefilled, setHasPrefilled] = useState(false);

  // Блокируем скролл когда корзина пуста
  useEffect(() => {
    if (state.items.length === 0) {
      // Сохраняем текущую позицию скролла
      const scrollY = window.scrollY
      
      // Блокируем скролл
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.left = '0'
      document.body.style.width = '100%'
      document.body.style.overflow = 'hidden'
      
      return () => {
        // Восстанавливаем скролл
        const scrollY = document.body.style.top
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.left = ''
        document.body.style.width = ''
        document.body.style.overflow = ''
        
        if (scrollY) {
          window.scrollTo(0, parseInt(scrollY || '0') * -1)
        }
      }
    }
  }, [state.items.length])

  // Redirect if cart is empty or below minimum
  useEffect(() => {
    if (state.items.length === 0) {
      navigate('/cart');
    } else if (state.total < MINIMUM_ORDER_AMOUNT) {
      toast.error(`Минимальная сумма заказа ${formatPrice(MINIMUM_ORDER_AMOUNT)}`);
      navigate('/cart');
    }
  }, [state.items.length, state.total, navigate]);

  const deliveryPrice = state.total >= 3000 ? 0 : 300;
  const packagingPrice = selectedPackaging?.price || 0;
  const servicesPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const totalWithExtras = state.total + deliveryPrice + packagingPrice + servicesPrice + ASSEMBLY_SERVICE_PRICE;
  const stepProgress = {
    packaging: 33,
    services: 66,
    final: 100,
  }[checkoutStep];

  useEffect(() => {
    const loadPackaging = async () => {
      try {
        setPackagingLoading(true);
        const options = await packagingService.getAll(true);
        setPackagingOptions(options);
      } catch (error) {
        console.error('Failed to load packaging:', error);
        toast.error('Ошибка загрузки вариантов упаковки');
      } finally {
        setPackagingLoading(false);
      }
    };

    loadPackaging();
  }, []);

  useEffect(() => {
    if (!profile || hasPrefilled) return;

    setFormData((prev) => ({
      ...prev,
      firstName: prev.firstName || profile.first_name || '',
      lastName: prev.lastName || profile.last_name || '',
      email: prev.email || profile.email || '',
      phone: prev.phone || profile.phone || '',
    }));
    setHasPrefilled(true);
  }, [profile, hasPrefilled]);

  const handleServicesChange = (serviceIds: string[], services: AdditionalService[]) => {
    setSelectedServiceIds(serviceIds);
    setSelectedServices(services);
  };

  const handleFinalSubmit = async () => {
    if (!selectedPackaging) {
      toast.error('Выберите упаковку');
      return;
    }

    setLoading(true);

    try {
      // Формируем данные заказа для Supabase
      const orderPayload = {
        customer_name: `${formData.firstName} ${formData.lastName}`.trim(),
        customer_email: formData.email,
        customer_phone: formData.phone,
        customer_address: formData.deliveryMethod === 'courier'
          ? `${formData.address}, ${formData.city}, ${formData.postalCode}`.trim()
          : null,
        items: state.items.map(item => ({
          product_id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
        })),
        total: totalWithExtras,
        status: 'pending' as const,
        type: 'regular' as const,
        packaging_id: selectedPackaging.id,
        assembly_service_price: ASSEMBLY_SERVICE_PRICE,
      };

      const createdOrder = await createOrder(orderPayload);

      // Сохраняем выбранные услуги
      if (selectedServiceIds.length > 0) {
        await Promise.all(
          selectedServices.map(service =>
            orderServiceService.create({
              order_id: createdOrder.id,
              service_id: service.id,
              price: service.price,
            })
          )
        );
      }

      if (typeof window !== 'undefined') {
        window.localStorage.setItem('surpriset-customer-email', formData.email);
      }

      clearCart();
      toast.success('Заказ успешно оформлен!');
      navigate('/order-success', { state: { orderId: createdOrder.id } });
    } catch (error) {
      console.error('Order creation failed:', error);
      toast.error('Ошибка при оформлении заказа');
    } finally {
      setLoading(false);
    }
  };

  if (state.items.length === 0) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center p-4">
        <div className="fixed inset-0 overflow-hidden">
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="w-full max-w-md relative z-10">
              <div className="text-center py-12">
                <h1 className="text-2xl font-bold mb-4">Корзина пуста</h1>
                <p className="text-muted-foreground mb-6">
                  Добавьте товары в корзину для оформления заказа
                </p>
                <Button asChild>
                  <Link to="/catalog">Перейти в каталог</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background checkout-compact">
      <div className="mx-auto w-full max-w-[1400px] px-2 sm:px-4 py-4 sm:py-10">
        {/* Header */}
        <div className="mb-4 sm:mb-10 checkout-header">
          <Button variant="ghost" size="responsive" className="button-with-icon mb-4" asChild>
            <Link to="/cart">
              <ArrowLeft className="h-4 w-4" />
              Вернуться в корзину
            </Link>
          </Button>
          <h1 className="text-xl sm:text-3xl font-bold font-heading checkout-title">Оформление заказа</h1>
        </div>

        <div className="grid gap-4 sm:gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-5 sm:space-y-6">
            <div className="rounded-2xl border border-border/50 bg-card/70 px-3 py-3 sm:px-5 sm:py-4 checkout-step-card">
              <div className="flex items-center justify-between min-w-0 gap-2">
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-muted-foreground checkout-step-label shrink-0">
                  Шаг {checkoutStep === 'packaging' ? '1' : checkoutStep === 'services' ? '2' : '3'} из 3
                </span>
                <span className="text-xs sm:text-sm font-semibold text-foreground truncate min-w-0">
                  {checkoutStep === 'packaging' && 'Упаковка'}
                  {checkoutStep === 'services' && 'Доп. услуги'}
                  {checkoutStep === 'final' && 'Оплата и доставка'}
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full rounded-full bg-muted">
                <div
                  className="h-1.5 rounded-full bg-primary transition-all"
                  style={{ width: `${stepProgress}%` }}
                />
              </div>
            </div>

            {checkoutStep === 'packaging' && (
              <div className="space-y-4">
                <Card className="border border-border/60 bg-card/80 backdrop-blur checkout-section">
                  <CardHeader className="pb-2 sm:pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Выберите упаковку
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    <p className="text-[11px] sm:text-sm text-muted-foreground">
                      Шаг обязателен. На мобильных карточки компактные, но с полной информацией.
                    </p>

                    {packagingLoading ? (
                      <div className="space-y-3">
                        {Array.from({ length: 4 }).map((_, index) => (
                          <div key={index} className="h-20 rounded-2xl bg-muted animate-pulse" />
                        ))}
                      </div>
                    ) : packagingOptions.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                        Нет доступных вариантов упаковки
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {packagingOptions.map((packaging) => {
                          const isSelected = selectedPackaging?.id === packaging.id;
                          return (
                            <button
                              key={packaging.id}
                              type="button"
                              onClick={() => setSelectedPackaging(packaging)}
                              className={`group flex w-full items-center gap-3 rounded-2xl border p-2.5 text-left transition-all checkout-card ${
                                isSelected
                                  ? 'border-primary/60 bg-primary/5 shadow-md'
                                  : 'border-border/50 bg-background hover:border-primary/40 hover:bg-muted/30'
                              }`}
                            >
                              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-muted checkout-card-image">
                                {packaging.image_url ? (
                                  <img
                                    src={packaging.image_url}
                                    alt={packaging.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                                    <Package className="h-6 w-6" />
                                  </div>
                                )}
                                {isSelected && (
                                  <span className="absolute right-1 top-1 rounded-full bg-primary p-1 text-white shadow">
                                    <Check className="h-3 w-3" />
                                  </span>
                                )}
                              </div>
                              <div className="flex min-w-0 flex-1 flex-col gap-1">
                                <p className="text-xs sm:text-sm font-semibold leading-tight line-clamp-2 checkout-card-title">
                                  {packaging.name}
                                </p>
                                {(packaging.width || packaging.height || packaging.depth) && (
                                  <p className="text-[10px] sm:text-[11px] text-muted-foreground checkout-card-meta">
                                    {packaging.width || '?'} × {packaging.height || '?'} × {packaging.depth || '?'} см
                                  </p>
                                )}
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <span className="text-xs text-muted-foreground">Цена</span>
                                <span className="text-sm font-bold text-primary checkout-price">
                                  {formatPrice(packaging.price)}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <div className="w-full rounded-2xl border border-border/50 bg-background/80 p-2.5 sm:p-3 checkout-action">
                  <div className="flex flex-col gap-2 w-full">
                    <Button variant="outline" className="h-9 text-xs w-full" asChild>
                      <Link to="/cart">Назад в корзину</Link>
                    </Button>
                    <Button
                      className="h-9 text-xs w-full"
                      onClick={() => {
                        if (!selectedPackaging) {
                          toast.error('Выберите упаковку');
                          return;
                        }
                        setCheckoutStep('services');
                      }}
                    >
                      Далее к услугам
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {checkoutStep === 'services' && (
              <div className="space-y-4">
                <Card className="border border-border/60 bg-card/80 backdrop-blur checkout-section">
                  <CardHeader className="pb-2 sm:pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <Gift className="h-5 w-5" />
                      Дополнительные услуги
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AdditionalServicesSelection
                      selectedServiceIds={selectedServiceIds}
                      onSelectionChange={handleServicesChange}
                    />
                  </CardContent>
                </Card>

                <div className="w-full rounded-2xl border border-border/50 bg-background/80 p-2.5 sm:p-3 checkout-action">
                  <div className="flex flex-col gap-2 w-full">
                    <Button
                      variant="outline"
                      onClick={() => setCheckoutStep('packaging')}
                      className="h-9 text-xs w-full"
                    >
                      Назад
                    </Button>
                    <Button
                      onClick={() => setCheckoutStep('final')}
                      className="h-9 text-xs w-full"
                    >
                      Далее к оплате
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {checkoutStep === 'final' && (
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  handleFinalSubmit();
                }}
                className="space-y-4 sm:space-y-6"
              >
                <Card className="border border-border/60 bg-card/80 backdrop-blur">
                  <CardHeader className="pb-2 sm:pb-3">
                    <CardTitle>Контактные данные</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    <div className="grid gap-3 md:grid-cols-2">
                      <div>
                        <Label htmlFor="firstName">Имя *</Label>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Фамилия *</Label>
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Телефон *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+7 (999) 123-45-67"
                        required
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-border/60 bg-card/80 backdrop-blur">
                  <CardHeader className="pb-2 sm:pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5" />
                      Доставка
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 sm:space-y-4">
                    <div>
                      <Label>Способ доставки</Label>
                      <div className="grid gap-2.5 mt-2">
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="radio"
                            name="deliveryMethod"
                            value="courier"
                            checked={formData.deliveryMethod === 'courier'}
                            onChange={(e) => setFormData(prev => ({ ...prev, deliveryMethod: e.target.value }))}
                          />
                          <div>
                            <div className="font-medium">Курьерская доставка</div>
                            <div className="text-sm text-muted-foreground">
                              {deliveryPrice === 0 ? 'Бесплатно' : `${deliveryPrice} ₽`} • 1-2 дня
                            </div>
                          </div>
                        </label>
                        <label className="flex items-center space-x-3 cursor-pointer">
                          <input
                            type="radio"
                            name="deliveryMethod"
                            value="pickup"
                            checked={formData.deliveryMethod === 'pickup'}
                            onChange={(e) => setFormData(prev => ({ ...prev, deliveryMethod: e.target.value }))}
                          />
                          <div>
                            <div className="font-medium">Самовывоз</div>
                            <div className="text-sm text-muted-foreground">
                              Бесплатно • Готов сегодня
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>

                    {formData.deliveryMethod === 'courier' && (
                      <>
                        <div>
                          <Label htmlFor="address">Адрес доставки *</Label>
                          <Input
                            id="address"
                            value={formData.address}
                            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                            placeholder="Улица, дом, квартира"
                            required
                          />
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <Label htmlFor="city">Город *</Label>
                            <Input
                              id="city"
                              value={formData.city}
                              onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                              placeholder="Москва"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="postalCode">Индекс</Label>
                            <Input
                              id="postalCode"
                              value={formData.postalCode}
                              onChange={(e) => setFormData(prev => ({ ...prev, postalCode: e.target.value }))}
                              placeholder="123456"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    <div>
                      <Label htmlFor="notes">Комментарий к заказу</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="Дополнительная информация для курьера"
                        rows={3}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-border/60 bg-card/80 backdrop-blur">
                  <CardHeader className="pb-2 sm:pb-3">
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5" />
                      Способ оплаты
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-2.5">
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="card"
                          checked={formData.paymentMethod === 'card'}
                          onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                        />
                        <div>
                          <div className="font-medium">Банковская карта</div>
                          <div className="text-sm text-muted-foreground">
                            Visa, MasterCard, МИР
                          </div>
                        </div>
                      </label>
                      <label className="flex items-center space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="cash"
                          checked={formData.paymentMethod === 'cash'}
                          onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                        />
                        <div>
                          <div className="font-medium">Наличными при получении</div>
                          <div className="text-sm text-muted-foreground">
                            Только для курьерской доставки
                          </div>
                        </div>
                      </label>
                    </div>
                  </CardContent>
                </Card>

                <div className="w-full flex flex-col gap-2.5 sm:flex-row checkout-action">
                  <Button
                    variant="outline"
                    onClick={() => setCheckoutStep('services')}
                    className="flex-1 h-10 text-sm w-full sm:w-auto"
                    type="button"
                  >
                    Назад
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || !selectedPackaging}
                    className="flex-1 h-10 text-sm w-full sm:w-auto"
                  >
                    {loading ? 'Оформление...' : `Оформить заказ на ${formatPrice(totalWithExtras)}`}
                  </Button>
                </div>
              </form>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sm:sticky sm:top-8 border border-border/60 bg-card/80 backdrop-blur checkout-summary">
              <CardHeader className="pb-3">
                <CardTitle>Ваш заказ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                {/* Items */}
                <div className="space-y-2">
                  {state.items.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium truncate">{item.name}</p>
                        <p className="text-[10px] sm:text-xs text-muted-foreground">
                          {item.quantity} × {formatPrice(item.price)}
                        </p>
                      </div>
                      <p className="text-xs sm:text-sm font-medium">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                <hr />

                {/* Totals */}
                <div className="space-y-1.5 text-xs sm:text-sm">
                  <div className="flex justify-between">
                    <span>Товары:</span>
                    <span>{formatPrice(state.total)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Доставка:</span>
                    <span>
                      {formData.deliveryMethod === 'pickup' 
                        ? 'Бесплатно' 
                        : deliveryPrice === 0 
                          ? 'Бесплатно' 
                          : formatPrice(deliveryPrice)
                      }
                    </span>
                  </div>
                  {selectedPackaging && (
                    <div className="flex justify-between">
                      <span>Упаковка:</span>
                      <span>{formatPrice(packagingPrice)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Сборка:</span>
                    <span>{ASSEMBLY_SERVICE_PRICE === 0 ? 'Бесплатно' : formatPrice(ASSEMBLY_SERVICE_PRICE)}</span>
                  </div>
                  {servicesPrice > 0 && (
                    <div className="flex justify-between">
                      <span>Доп. услуги:</span>
                      <span>{formatPrice(servicesPrice)}</span>
                    </div>
                  )}
                  <hr />
                  <div className="flex justify-between font-bold">
                    <span>Итого:</span>
                    <span className="text-primary">
                      {formatPrice(totalWithExtras)}
                    </span>
                  </div>
                </div>

                {/* Security Info */}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  <span>Безопасная оплата</span>
                </div>

                {/* Delivery Info */}
                {state.total < 3000 && formData.deliveryMethod === 'courier' && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <p className="text-xs text-blue-600 dark:text-blue-400">
                      💡 Добавьте товаров на {formatPrice(3000 - state.total)} для бесплатной доставки
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}