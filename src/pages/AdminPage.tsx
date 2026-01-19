import { useState, useEffect } from 'react';
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
  FolderOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProductsManager } from '@/components/admin/ProductsManager';
import { BannersManager } from '@/components/admin/BannersManager';
import { SettingsManager } from '@/components/admin/SettingsManager';
import { useProducts, useOrders } from '@/hooks/useDatabase';
import { orderService } from '@/lib/database';
import type { Order } from '@/types';
import { startBackgroundPriceSync } from '@/lib/adminPriceSync';

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
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Панель администратора</h1>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-primary bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего товаров</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{products.length}</div>
            <p className="text-xs text-muted-foreground">
              {products.filter(p => p.is_featured).length} рекомендуемых
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-blue-400 bg-blue-50/50 dark:bg-blue-900/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Заказы</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{orders.length}</div>
            <p className="text-xs text-muted-foreground">
              {orders.filter(o => o.status === 'pending').length} новых
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-orange-400 bg-orange-50/50 dark:bg-orange-900/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Выручка</CardTitle>
            <BarChart3 className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{totalRevenue.toLocaleString()} ₽</div>
            <p className="text-xs text-muted-foreground">Общая сумма заказов</p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-400 bg-purple-50/50 dark:bg-purple-900/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Лайки</CardTitle>
            <Heart className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{totalLikes}</div>
            <p className="text-xs text-muted-foreground">Всего лайков товаров</p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Быстрые действия</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Button asChild>
            <Link to="/admin/products">Управление товарами</Link>
          </Button>
          <Button asChild className="bg-blue-500 hover:bg-blue-600 text-white">
            <Link to="/admin/categories">Управление категориями</Link>
          </Button>
          <Button asChild>
            <Link to="/admin/orders">Просмотр заказов</Link>
          </Button>
          <Button asChild className="bg-purple-500 hover:bg-purple-600 text-white">
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
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  const handleStatusChange = async (orderId: string, status: Order['status']) => {
    try {
      setUpdatingId(orderId);
      await orderService.updateStatus(orderId, status);
      await refetch();
    } catch (err) {
      // В реальном проекте можно добавить toast с ошибкой
      console.error('Failed to update order status', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setDetailsModalOpen(true);
  };

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

  // Клиентские фильтры по статусу и дате
  const filteredOrders = orders.filter((order) => {
    if (statusFilter !== 'all' && order.status !== statusFilter) return false;
    if (dateFrom && new Date(order.created_at) < new Date(dateFrom)) return false;
    if (dateTo && new Date(order.created_at) > new Date(dateTo)) return false;
    return true;
  });

  const hasFilters = statusFilter !== 'all' || dateFrom || dateTo;

  // Функция для получения цвета статуса
  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shipped':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Функция для получения названия статуса
  const getStatusLabel = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'Ожидает';
      case 'processing': return 'В обработке';
      case 'shipped': return 'Отправлен';
      case 'delivered': return 'Доставлен';
      case 'cancelled': return 'Отменён';
      default: return status;
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl font-bold">Управление заказами</h1>
      </div>

      {/* Компактные фильтры */}
      <div className="flex flex-wrap items-center justify-center gap-2 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-sm">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | Order['status'])}
          className="text-sm border rounded px-2 py-1 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="all">Все статусы</option>
          <option value="pending">Ожидает</option>
          <option value="processing">В обработке</option>
          <option value="shipped">Отправлен</option>
          <option value="delivered">Доставлен</option>
          <option value="cancelled">Отменён</option>
        </select>
        <div className="flex items-center gap-2 text-sm">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="border rounded px-2 py-1 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary text-xs"
          />
          <span>—</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="border rounded px-2 py-1 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary text-xs"
          />
        </div>
        {hasFilters && (
          <Button variant="outline" size="sm" onClick={() => {
            setStatusFilter('all');
            setDateFrom('');
            setDateTo('');
          }}>
            Сбросить
          </Button>
        )}
      </div>
      
      {filteredOrders.length === 0 ? (
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8 text-center">
            <ShoppingCart className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">
              {hasFilters ? 'Заказы не найдены' : 'Заказов пока нет'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="hover:shadow-md transition-all border-l-4" style={{
              borderLeftColor: 
                order.status === 'pending' ? '#eab308' :
                order.status === 'processing' ? '#3b82f6' :
                order.status === 'shipped' ? '#a855f7' :
                order.status === 'delivered' ? '#22c55e' :
                '#ef4444'
            }}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between gap-3">
                  {/* Основная информация - компактно */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-sm">#{order.id.slice(0, 8)}</h3>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getStatusColor(order.status)}`}>
                            {getStatusLabel(order.status)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {order.customer_name} • {order.customer_email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString('ru-RU')} • {order.items.length} товар(ов)
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Сумма и управление */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="font-bold text-sm">{order.total} ₽</p>
                    </div>
                    
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value as Order['status'])}
                      disabled={updatingId === order.id}
                      className="text-xs border rounded px-2 py-1 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary min-w-[100px]"
                    >
                      <option value="pending">Ожидает</option>
                      <option value="processing">В обработке</option>
                      <option value="shipped">Отправлен</option>
                      <option value="delivered">Доставлен</option>
                      <option value="cancelled">Отменён</option>
                    </select>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(order)}
                      className="text-xs px-2 py-1 h-7"
                    >
                      Подробнее
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
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
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Аналитика</h1>
      
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-red-400 bg-red-50/50 dark:bg-red-900/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Heart className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Всего лайков</p>
                <p className="text-2xl font-bold text-red-600">{totalLikes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-blue-400 bg-blue-50/50 dark:bg-blue-900/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Всего заказов</p>
                <p className="text-2xl font-bold text-blue-600">{orders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-green-400 bg-green-50/50 dark:bg-green-900/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Выручка</p>
                <p className="text-2xl font-bold text-green-600">{totalRevenue.toLocaleString()} ₽</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-purple-400 bg-purple-50/50 dark:bg-purple-900/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Товаров</p>
                <p className="text-2xl font-bold text-purple-600">{products.length}</p>
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
import { CategoryManager } from '@/components/admin/CategoryManager';
import ReviewModerationPage from './admin/ReviewModerationPage';
import ProductAnalyticsPage from './admin/ProductAnalyticsPage';

function CategoriesAdmin() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Управление категориями</h1>
      <CategoryManager />
    </div>
  );
}

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

  useEffect(() => {
    // Check if admin is already authenticated
    const authenticated = localStorage.getItem('admin-authenticated') === 'true';
    setIsAuthenticated(authenticated);
    
    // Запускаем фоновую синхронизацию цен при входе в админку
    if (authenticated) {
      startBackgroundPriceSync();
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('admin-authenticated');
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return <AdminAuth onAuthenticated={() => setIsAuthenticated(true)} />;
  }
  
  const navigation = [
    { name: 'Главная', href: '/admin', icon: Home, exact: true },
    { name: 'Товары', href: '/admin/products', icon: Package },
    { name: 'Категории', href: '/admin/categories', icon: FolderOpen },
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
        <div className="flex-1 p-4 md:p-8 bg-background dark:bg-gray-950/50">
          {/* Top mobile nav */}
          <div className="md:hidden mb-4 flex gap-2 overflow-x-auto pb-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href, item.exact);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs whitespace-nowrap border transition-colors ${
                    active
                      ? 'bg-primary text-black border-primary'
                      : 'border-border text-muted-foreground bg-background'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Mobile header actions */}
          <div className="md:hidden mb-4 flex justify-between items-center">
            <h1 className="text-xl font-bold">Админ-панель</h1>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="text-xs px-3 py-1"
              >
                Выйти
              </Button>
              <Button
                variant="outline"
                size="sm"
                asChild
                className="text-xs px-3 py-1"
              >
                <Link to="/">На сайт</Link>
              </Button>
            </div>
          </div>

          <Routes>
            <Route path="/" element={<AdminDashboard />} />
            <Route path="/products" element={<ProductsManager />} />
            <Route path="/categories" element={<CategoriesAdmin />} />
            <Route path="/orders" element={<OrdersAdmin />} />
            <Route path="/banners" element={<BannersAdmin />} />
            <Route path="/analytics" element={<AnalyticsAdmin />} />
            <Route path="/product-analytics" element={<ProductAnalyticsPage />} />
            <Route path="/reviews" element={<ReviewModerationPage />} />
            <Route path="/settings" element={<SettingsAdmin />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
