import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { adminService } from '@/lib/database'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { User, Heart, ShoppingBag, Settings, Shield, Gift } from 'lucide-react'
import { getTelegramWebApp } from '@/utils/telegram'
import { mediumHaptic } from '@/utils/haptics'

export default function ProfilePage() {
  const [telegramUser, setTelegramUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

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

  // Если Telegram-пользователь не найден — показываем гостевой профиль
  if (!telegramUser) {
    return (
      <div className="min-h-screen bg-gradient-modern mobile-safe-area">
        <div className="container mx-auto px-2 py-3">
          {/* Mobile Version - Ultra Compact Guest Profile */}
          <div className="max-w-xs mx-auto md:hidden">
            <Card className="mobile-compact-card">
              <CardContent className="p-3 text-center">
                <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                  <User className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                </div>
                <h2 className="text-sm font-bold mb-1">Гостевой профиль</h2>
                <p className="text-[11px] text-muted-foreground mb-3">Добро пожаловать в SurpriSet</p>
                
                <div className="p-2 bg-muted/30 rounded-lg mb-3">
                  <div className="flex items-center gap-2">
                    <Gift className="w-4 h-4 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-muted-foreground mb-2">
                        Войдите через Telegram для доступа к функциям
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-5 px-2 text-[9px] w-full"
                        onClick={() => {
                          mediumHaptic();
                          window.open('https://t.me/surpriset_bot', '_blank');
                        }}
                      >
                        Открыть в Telegram
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Desktop Version - Large Beautiful Telegram Invitation */}
          <div className="hidden md:flex items-center justify-center min-h-[80vh]">
            <Card className="max-w-2xl w-full mx-auto shadow-2xl border-2 border-primary/20">
              <CardContent className="p-12 text-center">
                {/* Large Telegram Icon */}
                <div className="w-32 h-32 mx-auto mb-8 rounded-3xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-2xl">
                  <svg className="w-16 h-16 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-.38.24-1.07.72-.96.66-1.97 1.35-1.97 1.35s-.22.14-.63.02c-.4-.12-.91-.29-1.46-.53-.68-.3-1.22-.47-1.17-.99.03-.27.35-.54.96-.81 2.12-.94 3.54-1.54 4.24-1.85 1.71-.75 2.06-.88 2.29-.88.05 0 .18.01.26.09.06.05.08.12.09.17-.01.05-.01.21-.02.21z"/>
                  </svg>
                </div>

                {/* Main Message */}
                <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Добро пожаловать в SurpriSet!
                </h1>
                
                <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                  Для полного доступа к функциям нашего сервиса подарков<br />
                  войдите через Telegram бот
                </p>

                {/* Features List */}
                <div className="grid md:grid-cols-2 gap-6 mb-10 text-left">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
                      <Gift className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Персональные наборы</h3>
                      <p className="text-sm text-muted-foreground">Создавайте уникальные подарочные наборы</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                      <ShoppingBag className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">История заказов</h3>
                      <p className="text-sm text-muted-foreground">Отслеживайте все ваши покупки</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                      <Heart className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Список избранного</h3>
                      <p className="text-sm text-muted-foreground">Сохраняйте понравившиеся товары</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0">
                      <User className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Личный профиль</h3>
                      <p className="text-sm text-muted-foreground">Управляйте настройками аккаунта</p>
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <Button 
                  size="lg"
                  className="text-lg px-12 py-6 h-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 transform no-lift important-button"
                  onClick={() => {
                    mediumHaptic();
                    window.open('https://t.me/surpriset_bot', '_blank');
                  }}
                >
                  <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-.38.24-1.07.72-.96.66-1.97 1.35-1.97 1.35s-.22.14-.63.02c-.4-.12-.91-.29-1.46-.53-.68-.3-1.22-.47-1.17-.99.03-.27.35-.54.96-.81 2.12-.94 3.54-1.54 4.24-1.85 1.71-.75 2.06-.88 2.29-.88.05 0 .18.01.26.09.06.05.08.12.09.17-.01.05-.01.21-.02.21z"/>
                  </svg>
                  Перейти в Telegram
                </Button>

                <p className="text-sm text-muted-foreground mt-6">
                  Быстро, безопасно и удобно через Telegram
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
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
            <CardContent className="p-3">
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
                  <div className="text-sm font-bold text-primary">12</div>
                  <div className="text-[9px] text-muted-foreground">Заказов</div>
                </div>
                <div>
                  <div className="text-sm font-bold text-primary">₽24K</div>
                  <div className="text-[9px] text-muted-foreground">Потрачено</div>
                </div>
                <div>
                  <div className="text-sm font-bold text-primary">8</div>
                  <div className="text-[9px] text-muted-foreground">Избранное</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions - Horizontal Layout */}
          <div className="grid grid-cols-2 gap-2">
            <Card className="mobile-compact-card group cursor-pointer hover:bg-muted/50 transition-colors">
              <CardContent className="p-2">
                <div className="flex items-center gap-2">
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
              <CardContent className="p-2">
                <div className="flex items-center gap-2">
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
              <CardContent className="p-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0">
                    <Settings className="w-4 h-4 text-purple-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[11px] font-semibold mb-1">Настройки</h3>
                    <Button variant="ghost" size="sm" className="h-5 px-2 text-[9px] w-full">
                      Открыть
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Admin Panel - Ultra Compact */}
          {isAdmin && !loading && (
            <Card className="mobile-compact-card border-primary/20">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
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
        <div className="hidden md:block max-w-4xl mx-auto">
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
                    <div className="text-3xl font-bold text-primary">12</div>
                    <div className="text-sm text-muted-foreground">Заказов</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">₽24K</div>
                    <div className="text-sm text-muted-foreground">Потрачено</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">8</div>
                    <div className="text-sm text-muted-foreground">Избранное</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions - Desktop Horizontal Layout */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <Card className="group cursor-pointer hover:border-primary/40 transition-all">
              <CardContent className="p-6">
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
              <CardContent className="p-6">
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
              <CardContent className="p-6">
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
              <CardContent className="p-6">
                <div className="flex items-center justify-center gap-4">
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
