import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Order } from '@/types';
import { formatPrice } from '@/lib/utils';
import { Package, User, Mail, Phone, MapPin, Calendar, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

interface OrderDetailsModalProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OrderDetailsModal({ order, open, onOpenChange }: OrderDetailsModalProps) {
  if (!order) return null;

  const statusLabels = {
    pending: 'Ожидает',
    processing: 'В обработке',
    shipped: 'Отправлен',
    delivered: 'Доставлен',
    cancelled: 'Отменён'
  };

  const statusColors = {
    pending: 'text-yellow-800 bg-yellow-100 border-yellow-200',
    processing: 'text-blue-800 bg-blue-100 border-blue-200',
    shipped: 'text-purple-800 bg-purple-100 border-purple-200',
    delivered: 'text-green-800 bg-green-100 border-green-200',
    cancelled: 'text-red-800 bg-red-100 border-red-200'
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] w-[95vw] sm:w-full overflow-hidden flex flex-col p-0">
        <DialogHeader className="flex-shrink-0 p-4 sm:p-6 pb-3 border-b">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Package className="h-4 w-4 sm:h-5 sm:w-5" />
            Заказ #{order.id.slice(0, 8)}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Статус и дата */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium border ${statusColors[order.status]} w-fit`}>
              {statusLabels[order.status]}
            </span>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4" />
              {new Date(order.created_at).toLocaleString('ru-RU', {
                day: '2-digit',
                month: '2-digit', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>

          {/* Информация о клиенте - компактная */}
          <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3">
            <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <User className="h-3 w-3" />
              Клиент
            </h3>
            <div className="grid grid-cols-1 gap-2 text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <User className="h-3 w-3 text-muted-foreground" />
                <span>{order.customer_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-3 w-3 text-muted-foreground" />
                <span className="truncate">{order.customer_email}</span>
              </div>
              {order.customer_phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3 text-muted-foreground" />
                  <span>{order.customer_phone}</span>
                </div>
              )}
              {order.customer_address && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs">{order.customer_address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Товары в заказе - компактные */}
          <div>
            <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <Package className="h-3 w-3" />
              Товары ({order.items.length})
            </h3>
            <div className="space-y-2">
              {order.items.map((item, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-2 sm:p-3 border">
                  <div className="flex items-center gap-2 sm:gap-3">
                    {/* Изображение товара - компактное */}
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 dark:bg-gray-700 rounded flex-shrink-0 overflow-hidden">
                      {item.image ? (
                        <img 
                          src={item.image} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-4 w-4 sm:h-6 sm:w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    
                    {/* Информация о товаре - компактная */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-xs sm:text-sm truncate">{item.name}</h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{item.quantity} шт.</span>
                        <span>×</span>
                        <span>{formatPrice(item.price)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <p className="font-semibold text-xs sm:text-sm">{formatPrice(item.price * item.quantity)}</p>
                      {item.product_id && (
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                          onClick={() => onOpenChange(false)}
                          className="h-7 w-7 p-0"
                        >
                          <Link to={`/product/${item.product_id}`}>
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Итого - компактное */}
          <div className="bg-primary/5 rounded-lg p-3 border-l-4 border-primary">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-sm sm:text-base">Итого:</span>
              <span className="font-bold text-lg sm:text-xl text-primary">{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}