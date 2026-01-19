import { useMemo, useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  Package, 
  Image, 
  ShoppingCart, 
  BarChart3, 
  Settings,
  Home,
  Heart,
  Lock,
  MessageSquare,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Menu,
  ArrowLeft,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ProductsManager } from '@/components/admin/ProductsManager';
import { BannersManager } from '@/components/admin/BannersManager';
import { SettingsManager } from '@/components/admin/SettingsManager';
import { useProducts, useOrders } from '@/hooks/useDatabase';
import { orderService } from '@/lib/database';
import type { Order } from '@/types';

// Admin Authentication Component
function AdminAuth({ onAuthenticated }: { onAuthenticated: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Check password
    if (password === '8985') {
      localStorage.setItem('admin-authenticated', 'true');
      onAuthenticated();
    } else {
      setError('Неверный пароль');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Вход в админ панель</CardTitle>
          <p className="text-muted-foreground">Введите пароль для доступа</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введите пароль"
                required
              />
            </div>
            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Проверка...' : 'Войти'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

// Admin Dashboard
function AdminDashboard() {
  const { products } = useProducts();
  const { orders } = useOrders();

  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const totalLikes = products.reduce((sum, product) => sum + (product.likes_count || 0), 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-3xl font-bold">Панель администратора</h1>
      
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Товары</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{products.length}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {products.filter(p => p.is_featured).length} рекомендуемых
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Заказы</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{orders.length}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {orders.filter(o => o.status === 'pending').length} новых
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Выручка</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{totalRevenue.toLocaleString()} ₽</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Сумма заказов</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Лайки</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{totalLikes}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Всего лайков</p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Быстрые действия</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <Button asChild size="sm" className="h-10 sm:h-11">
            <Link to="/admin/products">Управление товарами</Link>
          </Button>
          <Button asChild size="sm" className="h-10 sm:h-11">
            <Link to="/admin/orders">Просмотр заказов</Link>
          </Button>
          <Button asChild size="sm" className="h-10 sm:h-11">
            <Link to="/admin/banners">Управление баннерами</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

import { OrderDetailsModal } from '@/components/admin/OrderDetailsModal';

function OrdersAdmin() {
  const { orders, loading, error, refetch } = useOrders();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | Order['status']>('all');
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [expandedOrderIds, setExpandedOrderIds] = useState<Record<string, boolean>>({});
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  // Сброс фильтра статуса при смене вкладки
  useEffect(() => {
    setStatusFilter('all');
  }, [activeTab]);

  const toggleExpanded = (orderId: string) => {
    setExpandedOrderIds((prev) => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const handleStatusChange = async (orderId: string, status: Order['status']) => {
    try {
      setUpdatingId(orderId);
      await orderService.updateStatus(orderId, status);
      await refetch();
      toast.success('Статус заказа обновлён');
    } catch (err) {
      console.error('Failed to update order status', err);
      toast.error('Не удалось обновить статус заказа');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setDetailsModalOpen(true);
  };

  const filteredOrders = useMemo(() => {
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo) : null;

    // Определяем завершенные статусы
    const completedStatuses: Order['status'][] = ['delivered', 'cancelled'];
    
    let filtered = orders.filter((order) => {
      // Фильтр по вкладкам
      if (activeTab === 'completed') {
        if (!completedStatuses.includes(order.status)) return false;
      } else {
        if (completedStatuses.includes(order.status)) return false;
      }
      
      // Фильтр по статусу
      if (statusFilter !== 'all' && order.status !== statusFilter) return false;
      
      // Фильтр по дате
      if (from && new Date(order.created_at) < from) return false;
      if (to && new Date(order.created_at) > to) return false;
      
      return true;
    });

    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    return filtered;
  }, [orders, statusFilter, activeTab, dateFrom, dateTo]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Управление заказами</h1>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Управление заказами</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-red-600">Ошибка загрузки заказов: {error}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Проверьте настройки Supabase (URL, ключи, миграции) или попробуйте перезагрузить страницу.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasFilters = statusFilter !== 'all' || dateFrom || dateTo;

  // Подсчет заказов для вкладок
  const completedStatuses: Order['status'][] = ['delivered', 'cancelled'];
  const activeOrdersCount = orders.filter(order => !completedStatuses.includes(order.status)).length;
  const completedOrdersCount = orders.filter(order => completedStatuses.includes(order.status)).length;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl sm:text-3xl font-bold">Заказы</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="h-9 px-3 text-xs"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Вкладки для активных и завершенных заказов */}
      <div className="flex items-center gap-1 p-1 bg-muted/30 rounded-lg w-fit">
        <Button
          variant={activeTab === 'active' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('active')}
          className="h-8 px-3 text-xs font-medium"
        >
          Активные ({activeOrdersCount})
        </Button>
        <Button
          variant={activeTab === 'completed' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('completed')}
          className="h-8 px-3 text-xs font-medium"
        >
          Завершенные ({completedOrdersCount})
        </Button>
      </div>

      {/* Фильтры по статусу и дате */}
      <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2 sm:gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | Order['status'])}
          className="h-10 sm:h-auto text-sm border rounded-md px-3 py-2 sm:px-2 sm:py-1 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/60"
        >
          <option value="all">Все статусы</option>
          {activeTab === 'active' ? (
            <>
              <option value="pending">Ожидает</option>
              <option value="processing">В обработке</option>
              <option value="shipped">Отправлен</option>
            </>
          ) : (
            <>
              <option value="delivered">Доставлен</option>
              <option value="cancelled">Отменён</option>
            </>
          )}
        </select>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2 text-xs sm:text-sm">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="h-10 sm:h-auto border rounded-md px-3 py-2 sm:px-2 sm:py-1 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="h-10 sm:h-auto border rounded-md px-3 py-2 sm:px-2 sm:py-1 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        {hasFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setStatusFilter('all');
              setDateFrom('');
              setDateTo('');
            }}
            className="h-10 sm:h-9"
          >
            Сбросить фильтры
          </Button>
        )}
      </div>
      
      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="p-8 sm:p-12 text-center">
            <p className="text-muted-foreground">
              {hasFilters ? 'Заказы по выбранным фильтрам не найдены' : 'Заказов пока нет'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            // Определяем цвет карточки по статусу
            const getStatusColor = (status: Order['status']) => {
              switch (status) {
                case 'pending':
                  return 'border-l-yellow-400 bg-yellow-50/50 dark:bg-yellow-900/10';
                case 'processing':
                  return 'border-l-blue-400 bg-blue-50/50 dark:bg-blue-900/10';
                case 'shipped':
                  return 'border-l-primary bg-primary/5 dark:bg-primary/10';
                case 'delivered':
                  return 'border-l-green-400 bg-green-50/50 dark:bg-green-900/10';
                case 'cancelled':
                  return 'border-l-red-400 bg-red-50/50 dark:bg-red-900/10';
                default:
                  return 'border-l-gray-300 bg-gray-50/50 dark:bg-gray-900/10';
              }
            };

            return (
              <Card key={order.id} className={`border-l-4 ${getStatusColor(order.status)} transition-all duration-200 hover:shadow-md`}>
                <CardContent className="p-4">
                  {/* Заголовок заказа */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div>
                        <h3 className="font-semibold text-base">
                          Заказ #{order.id.slice(0, 8)}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleString('ru-RU', {
                            day: '2-digit',
                            month: '2-digit',
                            year: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{order.total} ₽</p>
                      <p className="text-xs text-muted-foreground">{order.items.length} позиций</p>
                    </div>
                  </div>

                  {/* Информация о клиенте */}
                  <div className="bg-muted/30 rounded-lg p-3 mb-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium text-muted-foreground">Клиент:</span>
                        <p className="font-medium">{order.customer_name}</p>
                      </div>
                      {order.customer_email && (
                        <div>
                          <span className="font-medium text-muted-foreground">Email:</span>
                          <p className="font-medium truncate">{order.customer_email}</p>
                        </div>
                      )}
                      {order.customer_phone && (
                        <div>
                          <span className="font-medium text-muted-foreground">Телефон:</span>
                          <p className="font-medium">{order.customer_phone}</p>
                        </div>
                      )}
                      {order.customer_address && (
                        <div>
                          <span className="font-medium text-muted-foreground">Адрес:</span>
                          <p className="font-medium">{order.customer_address}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Управление статусом и действия */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value as Order['status'])}
                        disabled={updatingId === order.id}
                        className="text-sm border rounded-md px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/60 min-w-[140px]"
                      >
                        <option value="pending">Ожидает</option>
                        <option value="processing">В обработке</option>
                        <option value="shipped">Отправлен</option>
                        <option value="delivered">Доставлен</option>
                        <option value="cancelled">Отменён</option>
                      </select>
                      {updatingId === order.id && (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleExpanded(order.id)}
                        className="h-9 px-3 text-xs gap-1"
                      >
                        {expandedOrderIds[order.id] ? (
                          <>
                            <ChevronUp className="h-4 w-4" />
                            Скрыть состав
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4" />
                            Показать состав
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(order)}
                        className="h-9 px-3 text-xs"
                      >
                        Подробнее
                      </Button>
                    </div>
                  </div>

                  {/* Развернутый состав заказа */}
                  {expandedOrderIds[order.id] && (
                    <div className="mt-4 rounded-lg border bg-background/50">
                      <div className="p-3">
                        <h4 className="font-medium text-sm mb-2 text-muted-foreground">Состав заказа:</h4>
                        <div className="space-y-2">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                              <div className="flex-1">
                                <p className="font-medium text-sm">{item.name}</p>
                                <p className="text-xs text-muted-foreground">Количество: {item.quantity}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-sm">{item.price} ₽</p>
                                <p className="text-xs text-muted-foreground">
                                  Итого: {item.price * item.quantity} ₽
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Order Details Modal */}
      <OrderDetailsModal
        order={selectedOrder}
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
      />
    </div>
  );
}

function BannersAdmin() {
  return <BannersManager />;
}

function AnalyticsAdmin() {
  const { products } = useProducts();
  const { orders } = useOrders();

  // Топ товаров по лайкам
  const topLikedProducts = products
    .filter(p => p.likes_count > 0)
    .sort((a, b) => b.likes_count - a.likes_count)
    .slice(0, 5);

  // Топ товаров по продажам
  const productSales = orders.reduce((acc, order) => {
    order.items.forEach(item => {
      if (!acc[item.product_id]) {
        acc[item.product_id] = { name: item.name, quantity: 0, revenue: 0 };
      }
      acc[item.product_id].quantity += item.quantity;
      acc[item.product_id].revenue += item.price * item.quantity;
    });
    return acc;
  }, {} as Record<string, { name: string; quantity: number; revenue: number }>);

  const topSellingProducts = Object.entries(productSales)
    .sort(([, a], [, b]) => b.quantity - a.quantity)
    .slice(0, 5);

  // Статистика по статусам заказов
  const orderStats = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalLikes = products.reduce((sum, product) => sum + (product.likes_count || 0), 0);
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-3xl font-bold">Аналитика</h1>
      
      {/* Overview Cards */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <Heart className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-[11px] sm:text-sm text-gray-600 dark:text-gray-400">Лайки</p>
                <p className="text-xl sm:text-2xl font-bold">{totalLikes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-[11px] sm:text-sm text-gray-600 dark:text-gray-400">Заказы</p>
                <p className="text-xl sm:text-2xl font-bold">{orders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-[11px] sm:text-sm text-gray-600 dark:text-gray-400">Выручка</p>
                <p className="text-xl sm:text-2xl font-bold">{totalRevenue.toLocaleString()} ₽</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-[11px] sm:text-sm text-gray-600 dark:text-gray-400">Товаров</p>
                <p className="text-xl sm:text-2xl font-bold">{products.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Топ товаров по лайкам */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Топ товаров по лайкам
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topLikedProducts.length === 0 ? (
              <p className="text-muted-foreground">Пока нет лайков</p>
            ) : (
              <div className="space-y-3">
                {topLikedProducts.map((product, index) => (
                  <div key={product.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground">
                        #{index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-sm">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.sku}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="h-4 w-4 text-red-500 fill-current" />
                      <span className="font-bold">{product.likes_count}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Топ товаров по продажам */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-blue-500" />
              Топ товаров по продажам
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topSellingProducts.length === 0 ? (
              <p className="text-muted-foreground">Пока нет продаж</p>
            ) : (
              <div className="space-y-3">
                {topSellingProducts.map(([productId, data], index) => (
                  <div key={productId} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground">
                        #{index + 1}
                      </span>
                      <div>
                        <p className="font-medium text-sm">{data.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {data.revenue.toLocaleString()} ₽
                        </p>
                      </div>
                    </div>
                    <span className="font-bold">{data.quantity} шт</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Статусы заказов */}
        <Card>
          <CardHeader>
            <CardTitle>Статусы заказов</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(orderStats).map(([status, count]) => {
                const statusLabels = {
                  pending: 'Ожидают',
                  processing: 'В обработке',
                  shipped: 'Отправлены',
                  delivered: 'Доставлены',
                  cancelled: 'Отменены'
                };
                
                const statusColors = {
                  pending: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30',
                  processing: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
                  shipped: 'text-primary bg-primary/10 dark:bg-primary/20',
                  delivered: 'text-green-600 bg-green-100 dark:bg-green-900/30',
                  cancelled: 'text-red-600 bg-red-100 dark:bg-red-900/30'
                };

                return (
                  <div key={status} className="flex items-center justify-between">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status as keyof typeof statusColors]}`}>
                      {statusLabels[status as keyof typeof statusLabels]}
                    </span>
                    <span className="font-bold">{count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Типы товаров */}
        <Card>
          <CardHeader>
            <CardTitle>Типы товаров</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Готовые наборы</span>
                <span className="font-bold">
                  {products.filter(p => p.type === 'bundle').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Отдельные товары</span>
                <span className="font-bold">
                  {products.filter(p => p.type === 'product').length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Рекомендуемые</span>
                <span className="font-bold">
                  {products.filter(p => p.is_featured).length}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { DataRefreshTest } from '@/components/admin/DataRefreshTest';
import { DebugPanel } from '@/components/debug/DebugPanel';
import { AdminsManager } from '@/components/admin/AdminsManager';
import ReviewModerationPage from './admin/ReviewModerationPage';
import ProductAnalyticsPage from './admin/ProductAnalyticsPage';

function SettingsAdmin() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Настройки</h1>
      <DebugPanel />
      <DataRefreshTest />
      <SettingsManager />
      <AdminsManager />
    </div>
  );
}

export default function AdminPage() {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!mobileNavOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileNavOpen(false);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileNavOpen]);

  useEffect(() => {
    // Check if admin is already authenticated
    const authenticated = localStorage.getItem('admin-authenticated') === 'true';
    setIsAuthenticated(authenticated);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('admin-authenticated');
    setIsAuthenticated(false);
  };

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  const navigation = [
    { name: 'Главная', href: '/admin', icon: Home, exact: true },
    { name: 'Товары', href: '/admin/products', icon: Package },
    { name: 'Заказы', href: '/admin/orders', icon: ShoppingCart },
    { name: 'Баннеры', href: '/admin/banners', icon: Image },
    { name: 'Аналитика', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Аналитика товаров', href: '/admin/product-analytics', icon: TrendingUp },
    { name: 'Модерация отзывов', href: '/admin/reviews', icon: MessageSquare },
    { name: 'Настройки', href: '/admin/settings', icon: Settings },
  ];

  const isActive = (path: string, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const activeNav = useMemo(() => {
    return navigation.find((item) => isActive(item.href, item.exact)) ?? navigation[0];
  }, [location.pathname]);

  if (!isAuthenticated) {
    return <AdminAuth onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-background" data-admin>
      <div className="md:flex md:min-h-screen">
        {/* Sidebar (desktop / tablet) */}
        <div className="hidden md:block md:w-64 bg-secondary dark:bg-gray-900/95 text-white border-r dark:border-gray-800/50 backdrop-blur-sm flex-shrink-0">
          <div className="p-6">
            <h2 className="text-xl font-bold mb-6 text-white">Админ-панель</h2>
            <nav className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                      isActive(item.href, item.exact)
                        ? 'bg-primary text-black shadow-lg'
                        : 'text-gray-300 hover:text-white hover:bg-white/10 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          
          {/* Logout and Back to Site */}
          <div className="absolute bottom-6 left-6 space-y-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              className="w-full border-gray-600 dark:border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white dark:hover:bg-gray-800/50 transition-all duration-200"
            >
              Выйти
            </Button>
            <Button variant="outline" size="sm" className="w-full border-gray-600 dark:border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-white dark:hover:bg-gray-800/50 transition-all duration-200" asChild>
              <Link to="/">
                ← Вернуться на сайт
              </Link>
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 bg-background dark:bg-gray-950/50">
          {/* Mobile sticky header */}
          <div className="md:hidden sticky top-0 z-30 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
            <div className="px-3 py-2 flex items-center justify-between gap-2">
              <div className="min-w-0 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="h-9 w-9 p-0"
                >
                  <Link to="/">
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                </Button>
                <div className="min-w-0">
                  <p className="text-[11px] text-muted-foreground leading-tight">Админ-панель</p>
                  <p className="text-sm font-semibold truncate leading-tight">{activeNav?.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setMobileNavOpen(true)}
                  className="h-9 w-9 p-0"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="p-3 md:p-8 pb-8">
            <Routes>
            <Route path="/" element={<AdminDashboard />} />
            <Route path="/products" element={<ProductsManager />} />
            <Route path="/orders" element={<OrdersAdmin />} />
            <Route path="/banners" element={<BannersAdmin />} />
            <Route path="/analytics" element={<AnalyticsAdmin />} />
            <Route path="/product-analytics" element={<ProductAnalyticsPage />} />
            <Route path="/reviews" element={<ReviewModerationPage />} />
            <Route path="/settings" element={<SettingsAdmin />} />
            </Routes>
          </div>

          {/* Mobile side drawer */}
          {mobileNavOpen && (
            <div className="md:hidden fixed inset-0 z-50">
              {/* Backdrop with animation */}
              <div 
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
                onClick={() => setMobileNavOpen(false)}
                aria-label="Закрыть меню"
              />
              
              {/* Drawer with slide animation */}
              <div className="absolute right-0 top-0 h-full w-[86%] max-w-[320px] bg-background border-l shadow-2xl transform transition-transform duration-300 ease-out">
                {/* Header with close button */}
                <div className="p-4 border-b flex items-center justify-between gap-3 bg-secondary/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Settings className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Админ-панель</p>
                      <p className="text-base font-semibold">Навигация</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setMobileNavOpen(false)}
                    className="h-10 w-10 p-0 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors"
                    aria-label="Закрыть меню"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                {/* Navigation items */}
                <nav className="p-3 overflow-y-auto h-[calc(100%-80px)]">
                  <div className="space-y-1">
                    {navigation.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.href, item.exact);
                      return (
                        <Link
                          key={item.name}
                          to={item.href}
                          onClick={() => setMobileNavOpen(false)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                            active
                              ? 'bg-primary text-primary-foreground shadow-md scale-[1.02]'
                              : 'text-foreground hover:bg-muted/60 active:scale-[0.98]'
                          }`}
                        >
                          <Icon className="h-5 w-5 flex-shrink-0" />
                          <span className="truncate">{item.name}</span>
                        </Link>
                      );
                    })}
                    
                    {/* Logout and Back to Site in navigation */}
                    <div className="pt-4 mt-4 border-t space-y-1">
                      <button
                        onClick={() => {
                          setMobileNavOpen(false);
                          handleLogout();
                        }}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-foreground hover:bg-muted/60 active:scale-[0.98] transition-all duration-200 w-full text-left"
                      >
                        <ArrowLeft className="h-5 w-5 flex-shrink-0" />
                        <span className="truncate">Выйти</span>
                      </button>
                      <Link
                        to="/"
                        onClick={() => setMobileNavOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-foreground hover:bg-muted/60 active:scale-[0.98] transition-all duration-200"
                      >
                        <Home className="h-5 w-5 flex-shrink-0" />
                        <span className="truncate">Вернуться на сайт</span>
                      </Link>
                    </div>
                  </div>
                </nav>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
