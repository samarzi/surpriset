import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Truck, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCart } from '@/contexts/CartContext';
import { formatPrice } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';
import { useCreateOrder } from '@/hooks/useDatabase';

export default function CheckoutPage() {
  const { state, clearCart } = useCart();
  const navigate = useNavigate();
  const { createOrder } = useCreateOrder();
  
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

  const deliveryPrice = state.total >= 3000 ? 0 : 300;
  const totalWithDelivery = state.total + deliveryPrice;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        total: formData.deliveryMethod === 'pickup' ? state.total : totalWithDelivery,
        status: 'pending' as const,
        type: 'regular' as const,
      };

      const createdOrder = await createOrder(orderPayload);

      if (typeof window !== 'undefined') {
        window.localStorage.setItem('surpriset-customer-email', formData.email);
      }

      clearCart();
      toast({
        title: 'Успешно',
        description: 'Заказ успешно оформлен!',
      });
      navigate('/order-success', { state: { orderId: createdOrder.id } });
    } catch {
      toast({
        title: 'Ошибка',
        description: 'Ошибка при оформлении заказа',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (state.items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8">
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
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-3 sm:px-4 py-6 sm:py-10">
        {/* Header */}
        <div className="mb-6 sm:mb-10">
          <Button variant="ghost" size="responsive" className="button-with-icon mb-4" asChild>
            <Link to="/cart">
              <ArrowLeft className="h-4 w-4" />
              Вернуться в корзину
            </Link>
          </Button>
          <h1 className="text-2.5xl sm:text-3xl font-bold font-heading">Оформление заказа</h1>
        </div>

        <div className="grid gap-6 sm:gap-8 lg:grid-cols-3">
          {/* Order Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
              {/* Personal Information */}
              <Card className="border border-border/60 bg-card/80 backdrop-blur">
                <CardHeader className="pb-3">
                  <CardTitle>Личные данные</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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
                  <div className="grid gap-3 sm:grid-cols-2">
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

              {/* Delivery Information */}
              <Card className="border border-border/60 bg-card/80 backdrop-blur">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Доставка
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
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

              {/* Payment Method */}
              <Card className="border border-border/60 bg-card/80 backdrop-blur">
                <CardHeader className="pb-3">
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

              {/* Submit Button */}
              <Button 
                type="submit" 
                size="responsive" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? 'Оформление заказа...' : `Оформить заказ на ${formatPrice(totalWithDelivery)}`}
              </Button>
            </form>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6 sm:top-8 border border-border/60 bg-card/80 backdrop-blur">
              <CardHeader className="pb-3">
                <CardTitle>Ваш заказ</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items */}
                <div className="space-y-2.5">
                  {state.items.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity} × {formatPrice(item.price)}
                        </p>
                      </div>
                      <p className="text-sm font-medium">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                <hr />

                {/* Totals */}
                <div className="space-y-2 text-sm">
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
                  <hr />
                  <div className="flex justify-between font-bold">
                    <span>Итого:</span>
                    <span className="text-primary">
                      {formatPrice(formData.deliveryMethod === 'pickup' ? state.total : totalWithDelivery)}
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