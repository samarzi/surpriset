import { useLocation, Link } from 'react-router-dom';
import { CheckCircle, Package, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function OrderSuccessPage() {
  const location = useLocation();
  const orderId = location.state?.orderId || 'ORDER-UNKNOWN';

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <div className="max-w-2xl mx-auto">
          {/* Success Message */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full mb-4">
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-3xl font-bold font-heading mb-2">
              Заказ успешно оформлен!
            </h1>
            <p className="text-muted-foreground">
              Спасибо за покупку. Мы свяжемся с вами в ближайшее время.
            </p>
          </div>

          {/* Order Details */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Детали заказа
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">Номер заказа</p>
                  <p className="font-mono font-medium">{orderId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Статус</p>
                  <p className="font-medium text-yellow-600">В обработке</p>
                </div>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Что дальше?</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Мы обработаем ваш заказ в течение 1-2 часов</li>
                  <li>• Отправим SMS с подтверждением и трек-номером</li>
                  <li>• Доставим заказ в указанное время</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Остались вопросы?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">+7 (495) 123-45-67</p>
                    <p className="text-sm text-muted-foreground">Ежедневно 9:00-21:00</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">support@surpriset.ru</p>
                    <p className="text-sm text-muted-foreground">Ответим в течение часа</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4 justify-center">
            <Button asChild>
              <Link to="/">На главную</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/catalog">Продолжить покупки</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}