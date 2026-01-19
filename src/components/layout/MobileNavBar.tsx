import { Link, useLocation } from 'react-router-dom'
import { Home, Gift, Grid3X3, User, ShoppingCart } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { useCustomBundle } from '@/contexts/CustomBundleContext'
import { cn } from '@/lib/utils'
import { useKeyboardVisible } from '@/hooks/useKeyboardVisible'

const items = [
  { key: 'home', label: 'Главная', icon: Home, to: '/' },
  { key: 'catalog', label: 'Каталог', icon: Grid3X3, to: '/catalog' },
  { key: 'bundle', label: 'Собрать набор', icon: Gift, to: '/bundle-builder' },
  { key: 'cart', label: 'Корзина', icon: ShoppingCart, to: '/cart' },
  { key: 'profile', label: 'Профиль', icon: User, to: '/profile' },
]

export function MobileNavBar() {
  const location = useLocation()
  const { state: cartState } = useCart()
  const { state: bundleState } = useCustomBundle()
  const isKeyboardVisible = useKeyboardVisible()

  const isActive = (to: string) => {
    if (to === '/') return location.pathname === '/'
    return location.pathname.startsWith(to)
  }

  const cartItemCount = cartState.itemCount
  const bundleItemCount = bundleState.items.reduce((sum, item) => sum + item.quantity, 0)

  // Скрываем навигацию на странице админ панели
  if (location.pathname.startsWith('/admin')) {
    return null
  }

  return (
    <div className={cn(
      "mobile-nav-container md:hidden transition-all duration-300",
      isKeyboardVisible && "translate-y-full opacity-0 pointer-events-none"
    )}>
      <nav className="mobile-nav-bar">
        <div className="w-full rounded-3xl border border-border/40 bg-card/98 backdrop-blur-2xl shadow-2xl px-4 py-4 transition-all duration-300">
          <div className="flex items-center justify-between gap-1">
            {items.map((item) => {
              const Icon = item.icon
              const active = isActive(item.to)
              const isCart = item.key === 'cart'
              const isBundle = item.key === 'bundle'
              
              return (
                <Link
                  key={item.key}
                  to={item.to}
                  className={cn(
                    'relative flex items-center justify-center gap-1 px-3 py-2 rounded-2xl transition-all duration-300 min-w-0 group',
                    active
                      ? 'bg-brand-gradient text-black font-bold shadow-lg scale-105 transform'
                      : 'text-primary hover:text-primary/80 transform'
                  )}
                >
                  <div className="relative">
                    <Icon className={cn(
                      "flex-shrink-0 transition-all duration-200",
                      active ? "h-7 w-7" : "h-6 w-6 group-hover:h-6.5 group-hover:w-6.5"
                    )} />
                    {isCart && cartItemCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] rounded-full h-4 w-4 flex items-center justify-center font-bold border-2 border-background shadow-lg">
                        {cartItemCount > 99 ? '99+' : cartItemCount}
                      </span>
                    )}
                    {isBundle && bundleItemCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-green-500 text-white text-[8px] rounded-full h-4 w-4 flex items-center justify-center font-bold border-2 border-background shadow-lg">
                        {bundleItemCount > 99 ? '99+' : bundleItemCount}
                      </span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>
    </div>
  )
}
