import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, Gift, Clock, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCart } from '@/contexts/CartContext';
import { formatPrice } from '@/lib/utils';
import { toast } from 'sonner';

export default function CartPage() {
  const { state, removeItem, updateQuantity } = useCart();
  const navigate = useNavigate();

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(productId);
      toast.success('Товар удален из корзины');
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  const handleRemoveItem = (productId: string) => {
    removeItem(productId);
    toast.success('Товар удален из корзины');
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  const estimatedDelivery = useMemo(() => {
    if (state.total >= 5000) {
      return 'Бесплатная доставка за 1-2 дня по Москве и 3-5 дней по России';
    }
    if (state.total >= 3000) {
      return 'Доставка за 1-3 дня по Москве и области';
    }
    return 'Стандартная доставка 2-5 дней по РФ';
  }, [state.total]);

  const summaryLines = useMemo(
    () => state.items.map((item) => ({
      id: item.id,
      name: item.name.length > 26 ? `${item.name.slice(0, 24)}…` : item.name,
      quantity: item.quantity,
      total: item.price * item.quantity,
    })),
    [state.items],
  );

  if (state.items.length === 0) {
    return (
      <div className="relative min-h-screen bg-background">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/10 via-white to-white dark:from-gray-950/40 dark:via-gray-950" />
        <div className="container px-3 sm:px-4 py-12 sm:py-16">
          <div className="mx-auto max-w-2xl rounded-3xl border border-dashed border-border/60 bg-white/85 p-8 sm:p-10 text-center shadow-lg backdrop-blur dark:border-white/10 dark:bg-gray-900/70">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <ShoppingBag className="h-8 w-8" />
            </div>
            <h1 className="mt-6 text-2xl sm:text-3xl font-bold font-heading">В вашей корзине ещё пусто</h1>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
              Добавьте любимые товары или готовые наборы, чтобы увидеть персональные рекомендации и варианты упаковки
            </p>
            <div className="mt-6 sm:mt-8 flex flex-col items-center gap-2.5 sm:flex-row sm:justify-center">
              <Button size="responsive" className="interactive-transition" asChild>
                <Link to="/catalog">Перейти в каталог</Link>
              </Button>
              <Button size="responsive" variant="outline" className="interactive-transition" asChild>
                <Link to="/bundle-builder">Собрать набор</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary/10 via-white to-white dark:from-gray-950/40 dark:via-gray-950" />
      <div className="container px-3 sm:px-4 py-8 sm:py-12 lg:py-16">
        <div className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2.5xl sm:text-4xl font-bold font-heading">Ваша корзина</h1>
              <p className="mt-2 text-sm sm:text-base text-muted-foreground">
                {state.itemCount} {state.itemCount === 1 ? 'товар' : state.itemCount < 5 ? 'товара' : 'товаров'} · Сумма заказа {formatPrice(state.total)}
              </p>
            </div>
            <div className="flex items-center gap-2.5 rounded-2xl border border-border/70 bg-white/85 px-3.5 py-2.5 text-xs sm:text-sm shadow-sm backdrop-blur dark:bg-gray-900/70">
              <Gift className="h-4 w-4 text-primary" />
              <span>Бесплатная упаковка и открытка для заказов от 4500 ₽</span>
            </div>
          </div>
        </div>

        <div className="mt-8 sm:mt-10 grid gap-6 sm:gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] xl:gap-10">
          <div className="space-y-3 sm:space-y-4">
            {state.items.map((item) => (
              <Card key={item.id} className="border border-white/60 bg-white/80 shadow-lg backdrop-blur dark:border-white/10 dark:bg-gray-900/70">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="flex-shrink-0">
                      <div className="relative h-16 w-16 sm:h-20 sm:w-20 overflow-hidden rounded-xl bg-muted">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="h-full w-full object-cover" loading="lazy" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                            <ShoppingBag className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1 cursor-pointer" onClick={() => navigate(`/product/${item.id}`)}>
                          <h3 className="text-sm sm:text-base font-semibold leading-tight line-clamp-2 hover:text-primary transition-colors">{item.name}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {item.type === 'product' ? 'Товар' : 'Готовый набор'}
                          </p>
                        </div>
                        <p className="text-sm sm:text-base font-semibold text-primary whitespace-nowrap">{formatPrice(item.price)}</p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center rounded-full border border-border bg-white/90 shadow-sm dark:bg-gray-900/70">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 sm:h-8 sm:w-8 rounded-full"
                            onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="px-2 sm:px-3 text-xs sm:text-sm font-semibold">{item.quantity}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 sm:h-8 sm:w-8 rounded-full"
                            onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-full text-red-500 hover:bg-red-500/10 hover:text-red-600"
                          onClick={() => handleRemoveItem(item.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-4 sm:space-y-5">
            <Card className="sticky top-6 sm:top-8 border border-white/60 bg-white/90 shadow-xl backdrop-blur dark:border-white/10 dark:bg-gray-900/70">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-lg sm:text-xl font-semibold">Итоги заказа</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-5">
                <div className="space-y-2 text-xs sm:text-sm">
                  {summaryLines.map((line) => (
                    <div key={line.id} className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground">{line.name} × {line.quantity}</span>
                      <span className="font-medium">{formatPrice(line.total)}</span>
                    </div>
                  ))}
                </div>

                <hr className="border-dashed border-border/70" />

                <div className="flex items-center justify-between text-sm sm:text-base font-semibold">
                  <span>Общая сумма</span>
                  <span className="text-primary text-lg">{formatPrice(state.total)}</span>
                </div>

                <div className="rounded-2xl border border-dashed border-border/70 bg-muted/40 px-4 py-4 text-sm text-muted-foreground space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>{estimatedDelivery}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <span>14 дней на возврат и обмен без лишних вопросов</span>
                  </div>
                </div>

                <Button size="responsive" className="w-full interactive-transition" onClick={handleCheckout}>
                  Оформить заказ
                </Button>
              </CardContent>
            </Card>

            <Card className="border border-dashed border-primary/40 bg-primary/5 text-primary">
              <CardContent className="flex flex-col gap-3 p-5">
                <div className="flex items-center gap-3">
                  <Gift className="h-5 w-5" />
                  <span className="font-semibold">Персональная открытка бесплатно</span>
                </div>
                <p className="text-sm text-primary/90">
                  В каждом заказе мы можем добавить индивидуальное послание. Напишите его на шаге оформления — и мы красиво оформим его к подарку.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}