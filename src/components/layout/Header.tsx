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
            {/* Pill Toggle для Главная/Каталог */}
            <div className="relative flex items-center bg-muted/50 rounded-full p-1 border border-border/50">
              <Link
                to="/"
                className={`relative text-sm font-medium transition-all duration-300 rounded-full px-5 py-2 min-h-9 flex items-center z-10 ${
                  isActive('/')
                    ? 'text-black font-semibold'
                    : 'text-foreground/70 hover:text-foreground'
                }`}
              >
                Главная
              </Link>
              <Link
                to="/catalog"
                className={`relative text-sm font-medium transition-all duration-300 rounded-full px-5 py-2 min-h-9 flex items-center z-10 ${
                  isActive('/catalog')
                    ? 'text-black font-semibold'
                    : 'text-foreground/70 hover:text-foreground'
                }`}
              >
                Каталог
              </Link>
              {/* Sliding background (мыльница) */}
              <div
                className={`absolute top-1 bottom-1 bg-gradient-to-r from-primary via-primary to-primary/90 rounded-full shadow-lg shadow-primary/30 transition-all duration-300 ease-out ${
                  isActive('/')
                    ? 'left-1 right-[calc(50%+2px)]'
                    : 'left-[calc(50%-2px)] right-1'
                }`}
              />
            </div>
          </nav>

          {/* Desktop Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-4 lg:mx-8">
            <form onSubmit={handleSearch} className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Поиск подарков..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-modern pl-10 h-9 sm:h-10 text-sm"
              />
            </form>
          </div>

          {/* Actions - Desktop only */}
          <div className="hidden sm:flex items-center space-x-1.5 sm:space-x-2 lg:space-x-3">
            <ThemeToggle />

            {/* Admin Panel Button */}
            <Link to="/admin">
              <Button variant="modern" size="icon" title="Админ панель" className="w-9 h-9 sm:w-10 sm:h-10">
                <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </Link>

            {/* Cart Button - Always visible */}
            <Link to="/cart">
              <Button variant="modern" size="icon" className="relative w-9 h-9 sm:w-10 sm:h-10" title="Корзина">
                <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-black text-[8px] sm:text-[9px] rounded-full h-3.5 w-3.5 sm:h-4 sm:w-4 flex items-center justify-center font-bold border border-background shadow-lg">
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </span>
                )}
              </Button>
            </Link>

            {/* Profile Button */}
            <Link to="/profile">
              <Button variant="modern" size="icon" title="Профиль" className="w-9 h-9 sm:w-10 sm:h-10">
                <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
