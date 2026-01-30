import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { adminService } from '@/lib/database'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { User, Heart, ShoppingBag, Settings, Shield, Gift } from 'lucide-react'
import { getTelegramWebApp } from '@/utils/telegram'
import { mediumHaptic } from '@/utils/haptics'
import { useProfileStats } from '@/hooks/useProfileStats'
import { formatPrice } from '@/lib/utils'
import { useBrowserAuth } from '@/hooks/useBrowserAuth'
import AuthGuard from '@/components/AuthGuard'

export default function ProfilePage() {
  const [telegramUser, setTelegramUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const { stats, loading: statsLoading } = useProfileStats()
  const { user: browserUser, isAuthenticated: isBrowserAuth } = useBrowserAuth()

  // Получаем пользователя Telegram напрямую, без хука
  useEffect(() => {
    const tg = getTelegramWebApp()
    if (tg) {
      const user = tg.initDataUnsafe?.user ?? null
      setTelegramUser(user)
    }
  }, [])

  useEffect(() => {
    const checkAdmin = async () => {
      setLoading(true)
      try {
        // Жёстко даём права главному админу по умолчанию
        if (telegramUser?.username === 't0g0r0t' || telegramUser?.id === 1346574159) {
          setIsAdmin(true)
          return
        }

        if (telegramUser?.username) {
          const byUsername = await adminService.isAdminByUsername(telegramUser.username)
          if (byUsername) {
            setIsAdmin(true)
            return
          }
        }
        if (telegramUser?.id) {
          const byId = await adminService.isAdminByTelegram(telegramUser.id)
          setIsAdmin(byId)
        }
      } catch (error) {
        console.error('Error checking admin status', error)
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    }

    if (telegramUser) {
      void checkAdmin()
    } else {
      setLoading(false)
    }
  }, [telegramUser])

  // Если Telegram-пользователь не найден — проверяем браузерную аутентификацию
  if (!telegramUser) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-modern mobile-safe-area">
          <div className="container mx-auto px-2 py-3">
            {/* Mobile Version - Browser User Profile */}
            <div className="max-w-xs mx-auto md:hidden">
              <Card className="mobile-compact-card">
                <CardContent className="!p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-10 h-10 rounded-full bg-brand-gradient flex items-center justify-center text-sm font-bold text-black">
                      {browserUser?.first_name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 mb-0.5">
                        <h1 className="text-sm font-bold truncate">
                          {browserUser?.first_name} {browserUser?.last_name}
                        </h1>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {browserUser?.email}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1 text-center">
                    <div>
                      <div className="text-sm font-bold text-primary">
                        {statsLoading ? '...' : stats.ordersCount}
                      </div>
                      <div className="text-[9px] text-muted-foreground">Заказов</div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-primary">
                        {statsLoading ? '...' : formatPrice(stats.totalSpent)}
                      </div>
                      <div className="text-[9px] text-muted-foreground">Потрачено</div>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-primary">
                        {statsLoading ? '...' : stats.likesCount}
                      </div>
                      <div className="text-[9px] text-muted-foreground">Избранное</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-2 mt-1">
                <Card className="mobile-compact-card group cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardContent className="!p-4 flex items-center">
                    <div className="flex items-center gap-2 w-full">
                      <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                        <Heart className="w-4 h-4 text-red-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[11px] font-semibold mb-1">Избранное</h3>
                        <Button variant="ghost" size="sm" asChild className="h-5 px-2 text-[9px] w-full">
                          <Link to="/likes">Открыть</Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="mobile-compact-card group cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardContent className="!p-4 flex items-center">
                    <div className="flex items-center gap-2 w-full">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                        <ShoppingBag className="w-4 h-4 text-blue-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[11px] font-semibold mb-1">Заказы</h3>
                        <Button variant="ghost" size="sm" asChild className="h-5 px-2 text-[9px] w-full">
                          <Link to="/my-orders">Открыть</Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="mobile-compact-card group cursor-pointer hover:bg-muted/50 transition-colors">
                  <CardContent className="!p-4 flex items-center">
                    <div className="flex items-center gap-2 w-full">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0">
                        <Settings className="w-4 h-4 text-purple-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[11px] font-semibold mb-1">Настройки</h3>
                        <Button variant="ghost" size="sm" asChild className="h-5 px-2 text-[9px] w-full">
                          <Link to="/profile/settings">Открыть</Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Desktop Version */}
            <div className="hidden md:flex items-center justify-center min-h-[80vh]">
              <Card className="max-w-2xl w-full mx-auto shadow-2xl border-2 border-primary/20">
                <CardContent className="!p-12 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-brand-gradient flex items-center justify-center">
                    <span className="text-2xl font-bold text-black">
                      {browserUser?.first_name?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <h1 className="text-3xl font-bold mb-2">
                    {browserUser?.first_name} {browserUser?.last_name}
                  </h1>
                  <p className="text-xl text-muted-foreground mb-8">{browserUser?.email}</p>
                  
                  <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {statsLoading ? '...' : stats.ordersCount}
                      </div>
                      <div className="text-sm text-muted-foreground">Заказов</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {statsLoading ? '...' : formatPrice(stats.totalSpent)}
                      </div>
                      <div className="text-sm text-muted-foreground">Потрачено</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {statsLoading ? '...' : stats.likesCount}
                      </div>
                      <div className="text-sm text-muted-foreground">Избранное</div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <Button asChild className="h-12">
                      <Link to="/likes">
                        <Heart className="w-4 h-4 mr-2" />
                        Избранное
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="h-12">
                      <Link to="/my-orders">
                        <ShoppingBag className="w-4 h-4 mr-2" />
                        Заказы
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="h-12">
                      <Link to="/profile/settings">
                        <Settings className="w-4 h-4 mr-2" />
                        Настройки
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </AuthGuard>
    )
  }

  const user = telegramUser!;

  return (
    <div className="min-h-screen bg-gradient-modern mobile-safe-area">
      <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-3 sm:py-6 lg:py-10">
        {/* Mobile Version - Ultra Compact Profile */}
        <div className="max-w-xs mx-auto space-y-3 md:hidden">
          
          {/* Profile Header - Ultra Compact */}
          <Card className="mobile-compact-card">
            <CardContent className="!p-4">
              <div className="flex items-center gap-2 mb-3">
                {/* Mini Avatar */}
                <div className="w-10 h-10 rounded-full bg-brand-gradient flex items-center justify-center text-sm font-bold text-black">
                  {user.first_name?.[0]?.toUpperCase() || 'U'}
                </div>
                
                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-0.5">
                    <h1 className="text-sm font-bold truncate">{user.first_name} {user.last_name}</h1>
                    {isAdmin && (
                      <div className="flex items-center gap-0.5 px-1 py-0.5 bg-primary/20 rounded-full">
                        <Shield className="w-2.5 h-2.5" />
                        <span className="text-[9px] font-medium">A</span>
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {user.username ? `@${user.username}` : `ID: ${user.id}`}
                  </p>
                </div>
              </div>

              {/* Ultra Compact Stats */}
              <div className="grid grid-cols-3 gap-1 text-center">
                <div>
                  <div className="text-sm font-bold text-primary">
                    {statsLoading ? '...' : stats.ordersCount}
                  </div>
                  <div className="text-[9px] text-muted-foreground">Заказов</div>
                </div>
                <div>
                  <div className="text-sm font-bold text-primary">
                    {statsLoading ? '...' : formatPrice(stats.totalSpent)}
                  </div>
                  <div className="text-[9px] text-muted-foreground">Потрачено</div>
                </div>
                <div>
                  <div className="text-sm font-bold text-primary">
                    {statsLoading ? '...' : stats.likesCount}
                  </div>
                  <div className="text-[9px] text-muted-foreground">Избранное</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions - Horizontal Layout */}
          <div className="grid grid-cols-2 gap-2 mt-1">
            <Card className="mobile-compact-card group cursor-pointer hover:bg-muted/50 transition-colors">
              <CardContent className="!p-4 flex items-center">
                <div className="flex items-center gap-2 w-full">
                  <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                    <Heart className="w-4 h-4 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[11px] font-semibold mb-1">Избранное</h3>
                    <Button variant="ghost" size="sm" asChild className="h-5 px-2 text-[9px] w-full">
                      <Link to="/likes">Открыть</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mobile-compact-card group cursor-pointer hover:bg-muted/50 transition-colors">
              <CardContent className="!p-4 flex items-center">
                <div className="flex items-center gap-2 w-full">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                    <ShoppingBag className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[11px] font-semibold mb-1">Заказы</h3>
                    <Button variant="ghost" size="sm" asChild className="h-5 px-2 text-[9px] w-full">
                      <Link to="/my-orders">Открыть</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mobile-compact-card group cursor-pointer hover:bg-muted/50 transition-colors">
              <CardContent className="!p-4 flex items-center">
                <div className="flex items-center gap-2 w-full">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0">
                    <Settings className="w-4 h-4 text-purple-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[11px] font-semibold mb-1">Настройки</h3>
                    <Button variant="ghost" size="sm" asChild className="h-5 px-2 text-[9px] w-full">
                      <Link to="/profile/settings">Открыть</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Admin Panel - Ultra Compact */}
          {isAdmin && !loading && (
            <Card className="mobile-compact-card border-primary/20">
              <CardContent className="!p-4 flex items-center">
                <div className="flex items-center gap-2 w-full">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold">Админ панель</h3>
                    <p className="text-[11px] text-muted-foreground">Управление</p>
                  </div>
                  <Button asChild size="sm" className="h-6 px-2 text-[10px]">
                    <Link to="/admin">Открыть</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Desktop Version - Optimized Layout */}
        <div className="hidden md:block max-w-4xl mx-auto md:pt-24">
          {/* Profile Header - Desktop */}
          <Card className="mb-8">
            <CardContent className="p-8">
              <div className="flex flex-col items-center text-center gap-6">
                {/* Avatar */}
                <div className="w-24 h-24 rounded-full bg-brand-gradient flex items-center justify-center text-3xl font-bold text-black shadow-lg">
                  {user.first_name?.[0]?.toUpperCase() || 'U'}
                </div>
                
                {/* User Info */}
                <div>
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <h1 className="text-3xl font-bold">{user.first_name} {user.last_name}</h1>
                    {isAdmin && (
                      <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/20 rounded-full">
                        <Shield className="w-5 h-5" />
                        <span className="text-sm font-medium">Администратор</span>
                      </div>
                    )}
                  </div>
                  <p className="text-lg text-muted-foreground">
                    {user.username ? `@${user.username}` : `ID: ${user.id}`}
                  </p>
                </div>

                {/* Stats */}
                <div className="flex gap-12">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">
                      {statsLoading ? '...' : stats.ordersCount}
                    </div>
                    <div className="text-sm text-muted-foreground">Заказов</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">
                      {statsLoading ? '...' : formatPrice(stats.totalSpent)}
                    </div>
                    <div className="text-sm text-muted-foreground">Потрачено</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">
                      {statsLoading ? '...' : stats.likesCount}
                    </div>
                    <div className="text-sm text-muted-foreground">Избранное</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions - Desktop Horizontal Layout */}
          <div className="grid grid-cols-3 gap-4 mb-8 mt-2">
            <Card className="group cursor-pointer hover:border-primary/40 transition-all">
              <CardContent className="p-8 flex items-center justify-center">
                <Link to="/likes" className="flex flex-col items-center text-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0 group-hover:bg-red-200 dark:group-hover:bg-red-900/30 transition-colors">
                    <Heart className="w-7 h-7 text-red-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Избранное</h3>
                    <p className="text-sm text-muted-foreground">Сохраненные товары</p>
                  </div>
                </Link>
              </CardContent>
            </Card>

            <Card className="group cursor-pointer hover:border-primary/40 transition-all">
              <CardContent className="p-8 flex items-center justify-center">
                <Link to="/my-orders" className="flex flex-col items-center text-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/30 transition-colors">
                    <ShoppingBag className="w-7 h-7 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Мои заказы</h3>
                    <p className="text-sm text-muted-foreground">История покупок</p>
                  </div>
                </Link>
              </CardContent>
            </Card>

            <Card className="group cursor-pointer hover:border-primary/40 transition-all">
              <CardContent className="p-8 flex items-center justify-center">
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-200 dark:group-hover:bg-purple-900/30 transition-colors">
                    <Settings className="w-7 h-7 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-1">Настройки</h3>
                    <p className="text-sm text-muted-foreground">Управление профилем</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Admin Panel - Desktop */}
          {isAdmin && !loading && (
            <Card className="border-primary/20">
              <CardContent className="p-8 flex items-center">
                <div className="flex items-center justify-center gap-4 w-full">
                  <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Shield className="w-7 h-7 text-primary" />
                  </div>
                  <div className="flex-1 text-center">
                    <h3 className="text-xl font-bold">Панель администратора</h3>
                    <p className="text-sm text-muted-foreground">Управление магазином и контентом</p>
                  </div>
                  <Button asChild size="lg" className="px-8">
                    <Link to="/admin">Открыть панель</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
