import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-6 max-w-md mx-auto px-4">
        {/* 404 Illustration */}
        <div className="text-8xl font-bold text-primary/20 mb-4">404</div>
        
        {/* Error Message */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold font-heading">Страница не найдена</h1>
          <p className="text-muted-foreground">
            К сожалению, запрашиваемая страница не существует или была перемещена.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" asChild>
            <Link to="/" className="gap-2">
              <Home className="h-5 w-5" />
              На главную
            </Link>
          </Button>
          
          <Button variant="outline" size="lg" className="button-with-icon" onClick={() => window.history.back()}>
            <ArrowLeft className="h-5 w-5" />
            Назад
          </Button>
        </div>

        {/* Additional Links */}
        <div className="pt-8 border-t">
          <p className="text-sm text-muted-foreground mb-4">
            Возможно, вас заинтересует:
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/catalog">Каталог</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/bundle-builder">Собрать набор</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/cart">Корзина</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}