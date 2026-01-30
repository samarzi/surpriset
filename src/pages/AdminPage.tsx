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
  FolderOpen,
  Menu,
  X,
  Gift,
  Box
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProductsManager } from '@/components/admin/ProductsManager';
import { BannersManager } from '@/components/admin/BannersManager';
import { SettingsManager } from '@/components/admin/SettingsManager';
import { PackagingManager } from '@/components/admin/PackagingManager';
import { ServicesManager } from '@/components/admin/ServicesManager';
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

// Admin Dashboard - Улучшенный дизайн
function AdminDashboard() {
  const { products } = useProducts();
  const { orders } = useOrders();

  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const totalLikes = products.reduce((sum, product) => sum + (product.likes_count || 0), 0);

  const stats = [
    {
      title: 'Всего товаров',
      value: products.length,
      subtitle: `${products.filter(p => p.is_featured).length} рекомендуемых`,
      icon: Package,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      textColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      title: 'Заказы',
      value: orders.length,
      subtitle: `${orders.filter(o => o.status === 'pending').length} новых`,
      icon: ShoppingCart,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      textColor: 'text-green-600 dark:text-green-400'
    },
    {
      title: 'Выручка',
      value: `${totalRevenue.toLocaleString()} ₽`,
      subtitle: 'Общая сумма заказов',
      icon: BarChart3,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      textColor: 'text-orange-600 dark:text-orange-400'
    },
    {
      title: 'Лайки',
      value: totalLikes,
      subtitle: 'Всего лайков товаров',
      icon: Heart,
      color: 'from-pink-500 to-pink-600',
      bgColor: 'bg-pink-50 dark:bg-pink-900/20',
      textColor: 'text-pink-600 dark:text-pink-400'
    }
  ];

  const quickActions = [
    { title: 'Товары', href: '/admin/products', icon: Package, color: 'from-blue-500 to-blue-600' },
    { title: 'Категории', href: '/admin/categories', icon: FolderOpen, color: 'from-purple-500 to-purple-600' },
    { title: 'Заказы', href: '/admin/orders', icon: ShoppingCart, color: 'from-green-500 to-green-600' },
    { title: 'Баннеры', href: '/admin/banners', icon: Image, color: 'from-orange-500 to-orange-600' },
    { title: 'Аналитика', href: '/admin/analytics', icon: BarChart3, color: 'from-indigo-500 to-indigo-600' },
    { title: 'Отзывы', href: '/admin/reviews', icon: MessageSquare, color: 'from-teal-500 to-teal-600' }
  ];

  return (
    <div className="w-full">
      <div className="space-y-4 w-full md:pt-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Панель управления</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Добро пожаловать в админ-панель</p>
        </div>
      </div>
      
      {/* Stats Grid - Компактный */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardContent className="!p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-4 w-4 ${stat.textColor}`} />
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-medium text-gray-600 dark:text-gray-400 mb-0.5">{stat.title}</p>
                  <p className={`text-xl md:text-2xl font-bold ${stat.textColor}`}>{stat.value}</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-500 mt-0.5 line-clamp-1">{stat.subtitle}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {/* Quick Actions - Компактный grid */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-3 px-4 pt-3">
          <CardTitle className="text-base font-semibold">Быстрые действия</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid gap-2 grid-cols-3 md:grid-cols-3 lg:grid-cols-6">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.title}
                  to={action.href}
                  className="group flex flex-col items-center gap-1.5 p-3 rounded-lg border border-gray-200 dark:border-gray-800 hover:border-primary/50 dark:hover:border-primary/50 transition-all hover:shadow-sm bg-white dark:bg-gray-900"
                >
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${action.color} shadow-md group-hover:scale-110 transition-transform`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-[10px] font-medium text-gray-700 dark:text-gray-300 text-center leading-tight">{action.title}</span>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
      </div>
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
      <div className="space-y-6 max-w-7xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold">Управление заказами</h1>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-bold">Управление заказами</h1>
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <p className="text-red-600">Ошибка загрузки заказов: {error}</p>
            <p className="text-sm text-muted-foreground mt-2">
              Проверьте настройки Supabase или попробуйте перезагрузить страницу.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredOrders = orders.filter((order) => {
    if (statusFilter !== 'all' && order.status !== statusFilter) return false;
    if (dateFrom && new Date(order.created_at) < new Date(dateFrom)) return false;
    if (dateTo && new Date(order.created_at) > new Date(dateTo)) return false;
    return true;
  });

  const hasFilters = statusFilter !== 'all' || dateFrom || dateTo;

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-800';
    }
  };

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

  const getStatusGradient = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'from-yellow-500 to-yellow-600';
      case 'processing': return 'from-blue-500 to-blue-600';
      case 'shipped': return 'from-purple-500 to-purple-600';
      case 'delivered': return 'from-green-500 to-green-600';
      case 'cancelled': return 'from-red-500 to-red-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className="w-full">
      <div className="space-y-3 w-full md:pt-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Управление заказами</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Всего заказов: {filteredOrders.length}</p>
        </div>
      </div>

      {/* Компактные фильтры */}
      <Card className="border-0 shadow-md">
        <CardContent className="!p-4">
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | Order['status'])}
              className="text-xs border border-gray-300 dark:border-gray-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">Все статусы</option>
              <option value="pending">Ожидает</option>
              <option value="processing">В обработке</option>
              <option value="shipped">Отправлен</option>
              <option value="delivered">Доставлен</option>
              <option value="cancelled">Отменён</option>
            </select>
            <div className="flex items-center gap-1.5 text-xs">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="border border-gray-300 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary text-[10px]"
              />
              <span className="text-gray-500">—</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="border border-gray-300 dark:border-gray-700 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary text-[10px]"
              />
            </div>
            {hasFilters && (
              <Button variant="outline" size="sm" onClick={() => {
                setStatusFilter('all');
                setDateFrom('');
                setDateTo('');
              }} className="h-8 text-xs px-3">
                Сбросить
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      
      {filteredOrders.length === 0 ? (
        <Card className="border-0 shadow-md mt-2">
          <CardContent className="p-8 text-center">
            <ShoppingCart className="h-10 w-10 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {hasFilters ? 'Заказы не найдены' : 'Заказов пока нет'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2 mt-2">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="border-0 shadow-sm hover:shadow-md transition-all overflow-hidden">
              <div className={`h-0.5 bg-gradient-to-r ${getStatusGradient(order.status)}`} />
              <CardContent className="!p-5">
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  {/* Основная информация */}
                  <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-semibold text-xs text-gray-900 dark:text-white">#{order.id.slice(0, 8)}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${getStatusColor(order.status)}`}>
                        {getStatusLabel(order.status)}
                      </span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">
                        {new Date(order.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-gray-600 dark:text-gray-400">
                      <span className="truncate max-w-[120px]">{order.customer_name}</span>
                      <span>•</span>
                      <span>{order.items.length} товар(ов)</span>
                    </div>
                  </div>
                  
                  {/* Сумма и управление */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="flex-1 sm:flex-none text-left sm:text-right">
                      <p className="font-bold text-base text-gray-900 dark:text-white">{order.total.toLocaleString()} ₽</p>
                    </div>
                    
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value as Order['status'])}
                      disabled={updatingId === order.id}
                      className="text-[10px] border border-gray-300 dark:border-gray-700 rounded-lg px-2 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary min-w-[90px]"
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
                      className="text-[10px] px-2 py-1 h-7"
                    >
                      Детали
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <OrderDetailsModal
        order={selectedOrder}
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
      />
      </div>
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
    <div className="w-full">
      <div className="space-y-6 md:pt-24">
      <h1 className="text-3xl font-bold">Аналитика</h1>
      
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-red-400 bg-red-50/50 dark:bg-red-900/10">
          <CardContent className="!p-5">
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
          <CardContent className="!p-5">
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
          <CardContent className="!p-5">
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
          <CardContent className="!p-5">
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
          <CardContent className="!p-5">
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
          <CardContent className="!p-5">
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
          <CardContent className="!p-5">
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
          <CardContent className="!p-5">
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
    <div className="w-full">
      <div className="space-y-6 md:pt-24">
      <h1 className="text-3xl font-bold">Управление категориями</h1>
      <CategoryManager />
      </div>
    </div>
  );
}

function SettingsAdmin() {
  return (
    <div className="w-full">
      <div className="space-y-6 md:pt-24">
      <h1 className="text-3xl font-bold">Настройки</h1>
      <DebugPanel />
      <DataRefreshTest />
      <SettingsManager />
      <AdminsManager />
      </div>
    </div>
  );
}

export default function AdminPage() {
  const location = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
    { name: 'Упаковки', href: '/admin/packaging', icon: Box },
    { name: 'Доп. услуги', href: '/admin/services', icon: Gift },
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900" data-admin>
      <div className="md:flex md:min-h-screen">
        {/* Sidebar (desktop / tablet) - Улучшенный дизайн */}
        <div className="hidden md:flex md:flex-col md:w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 shadow-xl flex-shrink-0">
          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center shadow-lg">
                <Settings className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Админ-панель</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">Управление магазином</p>
              </div>
            </div>
          </div>
          
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href, item.exact);
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                    active
                      ? 'bg-gradient-to-r from-primary to-primary/90 text-black shadow-lg shadow-primary/30'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className={`h-5 w-5 ${active ? 'text-black' : 'text-gray-500 dark:text-gray-400 group-hover:text-primary'}`} />
                  <span className="font-medium text-sm">{item.name}</span>
                </Link>
              );
            })}
          </nav>
          
          {/* Logout and Back to Site - Улучшенный дизайн */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              className="w-full justify-start gap-2 border-gray-300 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 hover:border-red-300"
            >
              <Lock className="h-4 w-4" />
              Выйти
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full justify-start gap-2 border-gray-300 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 hover:border-blue-300" 
              asChild
            >
              <Link to="/">
                <Home className="h-4 w-4" />
                На сайт
              </Link>
            </Button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <>
            <div 
              className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] animate-in fade-in duration-200"
              onClick={() => setMobileMenuOpen(false)}
            />
            
            {/* Mobile Sidebar */}
            <div className="md:hidden fixed top-[60px] bottom-0 left-0 w-72 bg-white dark:bg-gray-900 shadow-2xl z-[70] transform transition-transform duration-300 ease-out translate-x-0">
              <div className="flex flex-col h-full">
                <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                  {navigation.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href, item.exact);
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                          active
                            ? 'bg-gradient-to-r from-primary to-primary/90 text-black shadow-md'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50'
                        }`}
                      >
                        <Icon className={`h-4 w-4 ${active ? 'text-black' : 'text-gray-500 dark:text-gray-400'}`} />
                        <span className="font-medium text-sm">{item.name}</span>
                      </Link>
                    );
                  })}
                </nav>
                
                <div className="p-3 border-t border-gray-200 dark:border-gray-800 space-y-1.5 bg-white dark:bg-gray-900">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleLogout}
                    className="w-full justify-start gap-2 h-9 text-xs hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600"
                  >
                    <Lock className="h-3.5 w-3.5" />
                    Выйти
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start gap-2 h-9 text-xs hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600" 
                    asChild
                  >
                    <Link to="/">
                      <Home className="h-3.5 w-3.5" />
                      На сайт
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Main Content - Улучшенный дизайн */}
        <div className="flex-1 flex flex-col h-screen pb-16 md:pb-0">
          {/* Mobile header - Компактный и элегантный */}
          <div className="md:hidden sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="px-4 py-3 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMobileMenuOpen(true)}
                  className="h-8 w-8 p-0 -ml-2"
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/70 rounded-lg flex items-center justify-center">
                  <Settings className="h-4 w-4 text-white" />
                </div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">Админ</h1>
              </div>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="h-8 px-3 text-xs"
              >
                <Link to="/">На сайт</Link>
              </Button>
            </div>
          </div>

          {/* Content area - С отступами в самих компонентах */}
          <div className="flex-1 p-3 md:p-4 lg:p-6 overflow-x-hidden overflow-y-auto">
            <div className="w-full max-w-7xl mx-auto">
              <Routes>
                <Route path="/" element={<AdminDashboard />} />
                <Route path="/products" element={<ProductsManager />} />
                <Route path="/categories" element={<CategoriesAdmin />} />
                <Route path="/orders" element={<OrdersAdmin />} />
                <Route path="/banners" element={<BannersAdmin />} />
                <Route path="/packaging" element={<PackagingManager />} />
                <Route path="/services" element={<ServicesManager />} />
                <Route path="/analytics" element={<AnalyticsAdmin />} />
                <Route path="/product-analytics" element={<ProductAnalyticsPage />} />
                <Route path="/reviews" element={<ReviewModerationPage />} />
                <Route path="/settings" element={<SettingsAdmin />} />
              </Routes>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
