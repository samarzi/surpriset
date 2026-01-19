import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Order } from '@/types';
import { formatPrice } from '@/lib/utils';
import { Package, User, Mail, Phone, MapPin, Calendar } from 'lucide-react';

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
    pending: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30',
    processing: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30',
    shipped: 'text-primary bg-primary/10 dark:bg-primary/20',
    delivered: 'text-green-600 bg-green-100 dark:bg-green-900/30',
    cancelled: 'text-red-600 bg-red-100 dark:bg-red-900/30'
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] max-w-4xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-xl">
            <Package className="h-5 w-5" />
            <span className="truncate">Заказ #{order.id.slice(0, 8)}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* Статус и дата */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${statusColors[order.status]}`}>
              {statusLabels[order.status]}
            </span>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              {new Date(order.created_at).toLocaleString('ru-RU')}
            </div>
          </div>

          {/* Информация о клиенте */}
          <div className="bg-muted/50 rounded-lg p-3 sm:p-4 space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <User className="h-4 w-4" />
              Информация о клиенте
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Имя:</span>
                <span className="font-medium">{order.customer_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{order.customer_email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Телефон:</span>
                <span className="font-medium">{order.customer_phone}</span>
              </div>
              {order.customer_address && (
                <div className="flex items-start gap-2 md:col-span-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span className="text-muted-foreground">Адрес:</span>
                  <span className="font-medium">{order.customer_address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Список товаров */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
              <Package className="h-4 w-4" />
              Состав заказа
            </h3>

            {/* Mobile: cards */}
            <div className="space-y-2 sm:hidden">
              {order.items.map((item, index) => (
                <div key={`${item.product_id}-${index}`} className="rounded-lg border p-3">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 rounded bg-muted overflow-hidden flex items-center justify-center flex-shrink-0">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      {item.sku ? (
                        <p className="text-[11px] text-muted-foreground truncate">SKU: {item.sku}</p>
                      ) : null}
                      <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
                        <div>
                          <p className="text-muted-foreground">Цена</p>
                          <p className="font-medium">{formatPrice(item.price)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Кол-во</p>
                          <p className="font-medium">{item.quantity}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Сумма</p>
                          <p className="font-semibold">{formatPrice(item.price * item.quantity)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop/tablet: table */}
            <div className="hidden sm:block border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">Фото</TableHead>
                    <TableHead>Название</TableHead>
                    <TableHead className="hidden sm:table-cell">Артикул</TableHead>
                    <TableHead className="text-right">Цена</TableHead>
                    <TableHead className="text-center">Кол-во</TableHead>
                    <TableHead className="text-right">Сумма</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.items.map((item, index) => (
                    <TableRow key={`${item.product_id}-${index}`}>
                      <TableCell>
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                            <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">{item.name}</p>
                          {item.description && (
                            <p className="text-xs text-muted-foreground line-clamp-1">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {item.sku || '—'}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {formatPrice(item.price)}
                      </TableCell>
                      <TableCell className="text-center text-sm font-medium">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right text-sm font-semibold">
                        {formatPrice(item.price * item.quantity)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Итого */}
          <div className="border-t pt-3 sm:pt-4">
            <div className="flex justify-between items-center">
              <span className="text-base sm:text-lg font-semibold">Итого:</span>
              <span className="text-xl sm:text-2xl font-bold text-primary">
                {formatPrice(order.total)}
              </span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
