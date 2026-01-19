import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Database } from '@/lib/supabase'
import { orderService } from '@/lib/database'
import { formatPrice } from '@/lib/utils'
import { getTelegramWebApp } from '@/utils/telegram'
import { Package, Clock, Truck, CheckCircle, XCircle } from 'lucide-react'

type Order = Database['public']['Tables']['orders']['Row']

export default function MyOrdersPage() {
  const [emailInput, setEmailInput] = useState(() => {
    if (typeof window === 'undefined') return ''
    return window.localStorage.getItem('surpriset-customer-email') || ''
  })
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [telegramUser, setTelegramUser] = useState<any>(null)

  // Получаем пользователя Telegram
  useEffect(() => {
    const tg = getTelegramWebApp()
    if (tg) {
      const user = tg.initDataUnsafe?.user ?? null
      setTelegramUser(user)
      
      // Если есть Telegram пользователь, автоматически загружаем заказы
      if (user?.id) {
        loadOrdersByTelegramId(user.id)
      }
    }
  }, [])

  const loadOrdersByTelegramId = async (_telegramId: number) => {
    try {
      setLoading(true)
      setError(null)
      // Здесь нужно будет добавить метод в orderService для поиска по telegram_id
      // Пока используем существующий метод
      const data = await orderService.getAll()
      // Фильтруем заказы по telegram_id (когда добавим это поле в БД)
      // В будущем: const filteredData = data.filter(order => order.telegram_id === telegramId)
      setOrders(data)
      setHasSearched(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить заказы')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const email = emailInput.trim()
    if (!email) return

    try {
      setLoading(true)
      setError(null)
      const data = await orderService.getByCustomerEmail(email)
      setOrders(data)
      setHasSearched(true)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('surpriset-customer-email', email)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось загрузить заказы')
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: Order['status']) => {
    const variants: Record<Order['status'], { className: string; icon: React.ReactNode }> = {
      pending: { 
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
        icon: <Clock className="w-3 h-3" />
      },
      processing: { 
        className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        icon: <Package className="w-3 h-3" />
      },
      shipped: { 
        className: 'bg-primary/10 text-primary dark:bg-primary/20',
        icon: <Truck className="w-3 h-3" />
      },
      delivered: { 
        className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        icon: <CheckCircle className="w-3 h-3" />
      },
      cancelled: { 
        className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
        icon: <XCircle className="w-3 h-3" />
      },
    }

    const labels: Record<Order['status'], string> = {
      pending: 'Новый заказ',
      processing: 'В обработке',
      shipped: 'Отправлен',
      delivered: 'Доставлен',
      cancelled: 'Отменён',
    }

    const variant = variants[status]
    
    return (
      <Badge className={`${variant.className} flex items-center gap-1`}>
        {variant.icon}
        {labels[status]}
      </Badge>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-3 sm:px-4 py-6 sm:py-10 max-w-2xl">
        <div className="mb-5 sm:mb-6">
          <h1 className="text-2.5xl sm:text-3xl font-bold font-heading">Мои заказы</h1>
          <p className="text-muted-foreground mt-2 text-xs sm:text-sm leading-relaxed">
            Укажите email, который вы вводили при оформлении заказа, чтобы увидеть историю заказов.
          </p>
        </div>

        <Card className="mb-6 border border-border/60 bg-card/80 backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              {telegramUser ? 'Ваши заказы' : 'Поиск по email'}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2 space-y-4">
            {!telegramUser && (
              <>
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="flex-1"
                    required
                  />
                  <Button type="submit" size="responsive" disabled={loading}>
                    {loading ? 'Загрузка...' : 'Показать заказы'}
                  </Button>
                </form>
                {error && <p className="text-sm text-red-600">{error}</p>}
              </>
            )}
            
            {telegramUser && (
              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-sm font-bold">
                    {telegramUser.first_name?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div>
                  <p className="font-medium">{telegramUser.first_name} {telegramUser.last_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {telegramUser.username ? `@${telegramUser.username}` : `ID: ${telegramUser.id}`}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {loading && (
          <Card className="border border-border/60 bg-card/80 backdrop-blur">
            <CardContent className="py-6 text-center text-sm text-muted-foreground">
              Загрузка заказов...
            </CardContent>
          </Card>
        )}

        {!loading && hasSearched && orders.length === 0 && !error && (
          <Card className="border border-dashed border-border/60 bg-muted/30">
            <CardContent className="py-6 text-center text-sm text-muted-foreground">
              Заказы для этого email не найдены.
            </CardContent>
          </Card>
        )}

        {!loading && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="border border-border/60 bg-card/80 backdrop-blur">
                <CardContent className="p-4 space-y-4 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">
                        Заказ #{order.id.slice(-6)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.created_at).toLocaleString('ru-RU', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    {getStatusBadge(order.status)}
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {order.items.length} позиций
                    </span>
                    <span className="font-semibold">{formatPrice(order.total)}</span>
                  </div>

                  {/* Детали заказа */}
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground">
                      <strong>Получатель:</strong> {order.customer_name}
                    </div>
                    {order.customer_phone && (
                      <div className="text-xs text-muted-foreground">
                        <strong>Телефон:</strong> {order.customer_phone}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">
                      <strong>Способ получения:</strong>{' '}
                      {order.customer_address ? 'Курьерская доставка' : 'Самовывоз'}
                    </div>
                    {order.customer_address && (
                      <div className="text-xs text-muted-foreground">
                        <strong>Адрес:</strong> {order.customer_address}
                      </div>
                    )}
                  </div>

                  {/* Состав заказа */}
                  <div className="border-t pt-3">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Состав заказа:</p>
                    <div className="space-y-1">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center text-xs">
                          <span className="flex-1 min-w-0">
                            <span className="font-medium">{item.name}</span>
                            <span className="text-muted-foreground"> × {item.quantity}</span>
                          </span>
                          <span className="font-medium ml-2">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
