import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, User, ShoppingCart, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Logo } from '@/components/ui/logo';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useCart } from '@/contexts/CartContext';

export default function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();
  const { state: cartState } = useCart();

  const cartItemCount = cartState.itemCount;

  const navigation = [
    { name: 'Каталог', href: '/catalog' },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to catalog with search query
      window.location.href = `/catalog?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <header
      className="sticky top-0 z-50 nav-modern mobile-safe-top"
      style={{ touchAction: 'manipulation' }}
      onTouchStart={(e) => {
        // Блокируем горизонтальные свайпы на header
        const touch = e.touches[0];
        (e.currentTarget as any)._startX = touch.clientX;
        (e.currentTarget as any)._startY = touch.clientY;
      }}
      onTouchMove={(e) => {
        const touch = e.touches[0];
        const startX = (e.currentTarget as any)._startX || 0;
        const startY = (e.currentTarget as any)._startY || 0;
        const deltaX = Math.abs(touch.clientX - startX);
        const deltaY = Math.abs(touch.clientY - startY);

        // Если горизонтальный свайп больше вертикального - блокируем
        if (deltaX > deltaY && deltaX > 10) {
          e.preventDefault();
          e.stopPropagation();
        }
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between h-12 sm:h-14 lg:h-16">
          {/* Mobile: Centered Logo */}
          <div className="flex-1 flex justify-center md:hidden">
            <Link to="/" className="group">
              <Logo
                size="sm"
                className="group-hover:scale-105 transition-transform"
                showText={true}
              />
            </Link>
          </div>

          {/* Desktop: Logo on left */}
          <Link to="/" className="hidden md:flex flex-shrink-0 group">
            <Logo
              size="sm"
              className="group-hover:scale-105 transition-transform"
              showText={true}
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {/* Навигационные кнопки */}
            <div className="flex items-center gap-2">
              <Link
                to="/"
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${isActive('/')
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-transparent text-muted-foreground border-transparent hover:bg-muted hover:text-foreground'
                  }`}
              >
                Главная
              </Link>
              <Link
                to="/catalog"
                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 border ${isActive('/catalog')
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : 'bg-transparent text-muted-foreground border-transparent hover:bg-muted hover:text-foreground'
                  }`}
              >
                Каталог
              </Link>
            </div>
          </nav>

          {/* Desktop Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-4 lg:mx-8">
            <form onSubmit={handleSearch} className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Поиск подарков..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-modern pl-10 h-10 sm:h-11 text-sm font-medium dark:text-white"
              />
            </form>
          </div>

          {/* Actions - Desktop only */}
          <div className="hidden sm:flex items-center space-x-1.5 sm:space-x-2 lg:space-x-3">
            <ThemeToggle />

            {/* Admin Panel Button */}
            <Link to="/admin">
              <Button variant="modern" size="icon" title="Админ панель" className="w-10 h-10 sm:w-11 sm:h-11">
                <Settings className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
              </Button>
            </Link>

            {/* Cart Button - Always visible */}
            <Link to="/cart">
              <Button variant="modern" size="icon" className="relative w-10 h-10 sm:w-11 sm:h-11" title="Корзина">
                <ShoppingCart className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-black text-[9px] sm:text-[10px] rounded-full h-4.5 w-4.5 sm:h-5 sm:w-5 flex items-center justify-center font-extrabold border border-background shadow-lg">
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </span>
                )}
              </Button>
            </Link>

            {/* Profile Button */}
            <Link to="/profile">
              <Button variant="modern" size="icon" title="Профиль" className="w-10 h-10 sm:w-11 sm:h-11">
                <User className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
