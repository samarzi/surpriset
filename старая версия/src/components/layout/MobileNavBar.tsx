import { Link, useLocation } from 'react-router-dom'
import { Home, Gift, Grid3X3, User, ShoppingCart } from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { useCustomBundle } from '@/contexts/CustomBundleContext'
import { cn } from '@/lib/utils'
import { useKeyboardVisible } from '@/hooks/useKeyboardVisible'
import { useSafeArea } from '@/hooks/useSafeArea'

const items = [
  { key: 'home', label: 'Главная', icon: Home, to: '/' },
  { key: 'catalog', label: 'Каталог', icon: Grid3X3, to: '/catalog' },
  { key: 'bundle', label: 'Собрать набор', icon: Gift, to: '/bundle-builder' },
  { key: 'cart', label: 'Корзина', icon: ShoppingCart, to: '/cart' },
  { key: 'profile', label: 'Профиль', icon: User, to: '/profile' },
]

function MobileNavBar() {
  const location = useLocation()

  if (location.pathname.startsWith('/admin')) {
    return null
  }

  const { state: cartState } = useCart()
  const { state: bundleState } = useCustomBundle()
  const isKeyboardVisible = useKeyboardVisible()
  const { safeArea } = useSafeArea()

  const isActive = (to: string) => {
    if (to === '/') return location.pathname === '/'
    return location.pathname.startsWith(to)
  }

  const cartItemCount = cartState.itemCount
  const bundleItemCount = bundleState.items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <div 
      className={cn(
        "mobile-nav-container md:hidden transition-all duration-300 fixed bottom-0 left-0 right-0 z-50",
        isKeyboardVisible && "translate-y-full opacity-0 pointer-events-none"
      )}
      style={{
        paddingBottom: Math.max(12, safeArea.bottom),
        paddingLeft: Math.max(16, safeArea.left),
        paddingRight: Math.max(16, safeArea.right),
      }}
    >
      <nav className="mobile-nav-bar mx-4 mb-3">
        <div className="card-elevated rounded-3xl backdrop-blur-2xl px-4 py-3 transition-all duration-300">
          <div className="flex items-center justify-between gap-1">
            {items.map((item) => {
              const Icon = item.icon
              const active = isActive(item.to)
              const isCart = item.key === 'cart'
              const isBundle = item.key === 'bundle'
              
              const showBadge = (isCart && cartItemCount > 0) || (isBundle && bundleItemCount > 0)
              const badgeCount = isCart ? cartItemCount : bundleItemCount

              return (
                <Link
                  key={item.key}
                  to={item.to}
                  className={cn(
                    "relative flex flex-col items-center justify-center rounded-2xl transition-all duration-300 group min-h-[44px] min-w-[44px] px-3 py-2",
                    active 
                      ? "bg-primary/20 text-primary scale-105" 
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                >
                  <div className="relative">
                    <Icon 
                      className={cn(
                        "transition-all duration-300",
                        active ? "h-6 w-6" : "h-5 w-5 group-hover:h-6 group-hover:w-6"
                      )} 
                    />
                    
                    {showBadge && (
                      <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-lg animate-in zoom-in-50 duration-200">
                        {badgeCount > 99 ? '99+' : badgeCount}
                      </div>
                    )}
                  </div>
                  
                  <span className={cn(
                    "text-xs font-medium mt-1 transition-all duration-300 text-center leading-tight",
                    active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                  )}>
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>
    </div>
  )
}

export default MobileNavBar
