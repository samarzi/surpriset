import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Database } from '@/lib/supabase'
import { orderService } from '@/lib/database'
import { formatPrice } from '@/lib/utils'

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
    const variants: Record<Order['status'], string> = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      shipped: 'bg-primary/10 text-primary dark:bg-primary/20',
      delivered: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    }

    const labels: Record<Order['status'], string> = {
      pending: 'Новый',
      processing: 'В обработке',
      shipped: 'Отправлен',
      delivered: 'Доставлен',
      cancelled: 'Отменён',
    }

    return (
      <Badge className={variants[status]}>
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
            <CardTitle className="text-base">Поиск по email</CardTitle>
          </CardHeader>
          <CardContent className="pt-2 space-y-4">
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
                <CardContent className="p-4 space-y-3 text-sm">
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

                  <div className="text-xs text-muted-foreground">
                    Способ получения:{' '}
                    {order.customer_address ? 'Курьерская доставка' : 'Самовывоз или не указан'}
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
