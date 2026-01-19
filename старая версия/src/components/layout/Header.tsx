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
    { name: 'Собрать набор', href: '/bundle-builder' },
  ];

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/catalog?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md border-b border-border-light shadow-sm bg-background-glass">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Mobile: Centered Logo */}
          <Link to="/" className="flex-1 flex justify-center md:hidden">
            <Logo size="sm" showText={true} />
          </Link>

          {/* Desktop: Logo on left */}
          <Link to="/" className="hidden md:flex flex-shrink-0">
            <Logo size="sm" showText={true} />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-6" role="navigation" aria-label="Основная навигация">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-300 ${
                  isActive(item.href)
                    ? 'text-white bg-gradient-primary shadow-primary transform -translate-y-0.5'
                    : 'text-foreground hover:text-primary hover:bg-primary-light/10 hover:shadow-sm hover:-translate-y-0.5'
                }`}
                aria-current={isActive(item.href) ? 'page' : undefined}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Desktop Search Bar */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-6 relative group">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted group-focus-within:text-primary transition-colors duration-300" aria-hidden="true" />
            <Input
              type="text"
              placeholder="Поиск подарков..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 border-border focus:border-primary focus:ring-2 focus:ring-primary-light rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
              aria-label="Поиск товаров"
            />
          </form>

          {/* Actions - Desktop only */}
          <div className="hidden sm:flex items-center space-x-2">
            <ThemeToggle />

            <Link to="/admin">
              <Button variant="ghost" size="icon" title="Админ панель" className="w-10 h-10 hover:bg-secondary-light/20 hover:text-secondary hover:shadow-sm transition-all duration-300 hover:-translate-y-0.5">
                <Settings className="h-4 w-4" aria-hidden="true" />
              </Button>
            </Link>

            <Link to="/cart" className="relative group">
              <Button variant="ghost" size="icon" className="relative w-10 h-10 hover:bg-primary-light/20 hover:text-primary hover:shadow-sm transition-all duration-300 hover:-translate-y-0.5" title="Корзина">
                <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                {cartItemCount > 0 && (
                  <span 
                    className="absolute -top-1 -right-1 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold bg-gradient-primary shadow-primary animate-pulse"
                    aria-label={`${cartItemCount} товаров в корзине`}
                  >
                    {cartItemCount > 99 ? '99+' : cartItemCount}
                  </span>
                )}
              </Button>
            </Link>

            <Link to="/profile">
              <Button variant="ghost" size="icon" title="Профиль" className="w-10 h-10 hover:bg-accent-warm-light/20 hover:text-accent-warm hover:shadow-sm transition-all duration-300 hover:-translate-y-0.5">
                <User className="h-4 w-4" aria-hidden="true" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
