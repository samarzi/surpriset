import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Filter, Copy, Archive, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { productService } from '@/lib/database';
import { eventBus, EVENTS } from '@/lib/eventBus';
import { Product } from '@/types';
import { ProductForm } from './ProductForm';
import { priceUpdateService } from '@/lib/priceUpdateService';

const ARCHIVE_TAG = '__archive__';

const isArchived = (product: Product) => product.tags?.includes(ARCHIVE_TAG);

function generateNewSku(baseSku: string, existingSkus: string[]): string {
  const skuSet = new Set(existingSkus);
  const match = baseSku.match(/^(.*?)(\d+)$/);

  let prefix = baseSku;
  let num: number | null = null;

  if (match) {
    prefix = match[1];
    num = parseInt(match[2], 10);
  }

  let candidate: string;

  if (num !== null) {
    do {
      num += 1;
      candidate = `${prefix}${num}`;
    } while (skuSet.has(candidate));
  } else {
    let suffix = 2;
    do {
      candidate = `${baseSku}-${suffix}`;
      suffix += 1;
    } while (skuSet.has(candidate));
  }

  return candidate;
}

export function ProductsManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [archiveFilter, setArchiveFilter] = useState<'all' | 'active' | 'archived'>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [updatingPrices, setUpdatingPrices] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getAll();
      setProducts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки товаров');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот товар?')) return;
    
    try {
      await productService.delete(id);
      await loadProducts();
      // Emit events using eventBus
      eventBus.emit(EVENTS.PRODUCTS_REFRESH);
      eventBus.emit(EVENTS.ADMIN_DATA_CHANGED);
      console.log('🗑️ Product deleted, events emitted');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка удаления товара');
    }
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setShowForm(true);
  };

  const handleAdd = () => {
    setSelectedProduct(null);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setSelectedProduct(null);
    // Force refresh products
    loadProducts();
    // Emit events using eventBus
    eventBus.emit(EVENTS.PRODUCTS_REFRESH);
    eventBus.emit(EVENTS.PRODUCT_UPDATED);
    eventBus.emit(EVENTS.ADMIN_DATA_CHANGED);
    console.log('💾 Product form closed, events emitted');
  };

  const handleDuplicate = async (product: Product) => {
    try {
      const existingSkus = products.map(p => p.sku);
      const newSku = generateNewSku(product.sku, existingSkus);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, created_at, updated_at, likes_count, ...rest } = product as any;
      const cleanTags = (rest.tags || []).filter((tag: string) => tag !== ARCHIVE_TAG);

      await productService.create({
        ...rest,
        sku: newSku,
        tags: cleanTags,
        likes_count: 0,
      } as any);

      await loadProducts();
      eventBus.emit(EVENTS.PRODUCTS_REFRESH);
      eventBus.emit(EVENTS.ADMIN_DATA_CHANGED);
      console.log('📄 Product duplicated');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка дублирования товара');
    }
  };

  const handleArchiveToggle = async (product: Product) => {
    const archived = isArchived(product);
    const currentTags = product.tags || [];
    const newTags = archived
      ? currentTags.filter(tag => tag !== ARCHIVE_TAG)
      : [...currentTags.filter(tag => tag !== ARCHIVE_TAG), ARCHIVE_TAG];

    try {
      await productService.update(product.id, { tags: newTags } as any);
      await loadProducts();
      eventBus.emit(EVENTS.PRODUCTS_REFRESH);
      eventBus.emit(EVENTS.ADMIN_DATA_CHANGED);
      console.log(`📦 Product ${archived ? 'restored from' : 'moved to'} archive`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка обновления архива товара');
    }
  };

  const handleUpdateAllPrices = async () => {
    if (!confirm('Обновить цены для всех импортированных товаров? Это может занять некоторое время.')) {
      return;
    }

    setUpdatingPrices(true);
    setError(null);

    try {
      const results = await priceUpdateService.updateAllImportedPrices();
      
      await loadProducts();
      eventBus.emit(EVENTS.PRODUCTS_REFRESH);
      eventBus.emit(EVENTS.ADMIN_DATA_CHANGED);
      
      alert(`✅ Обновление завершено!\n\nОбновлено: ${results.updated}\nОшибок: ${results.failed}`);
      
      if (results.errors.length > 0) {
        console.error('Errors during price update:', results.errors);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка обновления цен');
    } finally {
      setUpdatingPrices(false);
    }
  };

  const searchFiltered = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredProducts = searchFiltered.filter(product => {
    const archived = isArchived(product);
    if (archiveFilter === 'archived') return archived;
    if (archiveFilter === 'active') return !archived;
    return true;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      in_stock: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      coming_soon: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      out_of_stock: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    };
    
    const labels = {
      in_stock: 'В наличии',
      coming_soon: 'Скоро',
      out_of_stock: 'Закончилось'
    };

    return (
      <Badge className={variants[status as keyof typeof variants]}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Управление товарами</h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Управление товарами</h1>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p>Ошибка: {error}</p>
              <Button onClick={loadProducts} className="mt-4">
                Попробовать снова
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2.5xl sm:text-3xl font-bold">Управление товарами</h1>
        <div className="flex gap-2">
          <Button 
            onClick={handleUpdateAllPrices} 
            variant="outline" 
            size="responsive" 
            className="gap-2"
            disabled={updatingPrices}
          >
            <RefreshCw className={`h-4 w-4 ${updatingPrices ? 'animate-spin' : ''}`} />
            {updatingPrices ? 'Обновление...' : 'Обновить цены'}
          </Button>
          <Button onClick={handleAdd} size="responsive" className="gap-2">
            <Plus className="h-4 w-4" />
            Добавить товар
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="border border-border/60 bg-card/80 backdrop-blur">
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по названию, SKU или тегам..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 sm:h-11 rounded-lg"
              />
            </div>
            <Button variant="outline" size="responsive" className="gap-2">
              <Filter className="h-4 w-4" />
              Фильтры
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-muted-foreground">Архив:</span>
            <Button
              type="button"
              variant={archiveFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setArchiveFilter('all')}
            >
              Все
            </Button>
            <Button
              type="button"
              variant={archiveFilter === 'active' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setArchiveFilter('active')}
            >
              Активные
            </Button>
            <Button
              type="button"
              variant={archiveFilter === 'archived' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setArchiveFilter('archived')}
            >
              Архив
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Products List - Компактный дизайн */}
      <div className="space-y-2">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="hover:shadow-sm transition-shadow">
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                {/* Фотка товара */}
                <div className="w-16 h-16 flex-shrink-0 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                  {product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/300x200?text=No+Image';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                      Нет фото
                    </div>
                  )}
                </div>

                {/* Информация о товаре */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm truncate">{product.name}</h3>
                    <Badge variant="outline" className="text-xs flex-shrink-0">
                      {product.type === 'bundle' ? 'Набор' : 'Товар'}
                    </Badge>
                    {getStatusBadge(product.status)}
                    {product.is_imported && (
                      <Badge variant="secondary" className="text-xs flex-shrink-0 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                        Импорт
                      </Badge>
                    )}
                    {isArchived(product) && (
                      <Badge variant="secondary" className="text-xs flex-shrink-0">
                        Архив
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>SKU: {product.sku}</span>
                    <span className="font-bold text-foreground">{product.price}₽</span>
                    {product.original_price && (
                      <span className="line-through">{product.original_price}₽</span>
                    )}
                  </div>
                </div>

                {/* Кнопки управления */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(product)}
                    className="h-8 w-8 p-0"
                    title="Изменить"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDuplicate(product)}
                    className="h-8 w-8 p-0"
                    title="Дублировать"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleArchiveToggle(product)}
                    className="h-8 w-8 p-0"
                    title={isArchived(product) ? 'Из архива' : 'В архив'}
                  >
                    <Archive className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(product.id)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    title="Удалить"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">
              {searchQuery ? 'Товары не найдены' : 'Нет товаров для отображения'}
            </p>
            {!searchQuery && (
              <Button onClick={handleAdd} className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                Добавить первый товар
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Product Form Modal */}
      {showForm && (
        <ProductForm
          product={selectedProduct}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}