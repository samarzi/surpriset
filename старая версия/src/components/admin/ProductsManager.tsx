import { useMemo, useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Filter, Copy, Archive, Package, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { productService } from '@/lib/database';
import { eventBus, EVENTS } from '@/lib/eventBus';
import { Product } from '@/types';
import { ProductForm } from './ProductForm';
import { CategoryManager } from './CategoryManager';

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
  const [deleteCandidate, setDeleteCandidate] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'categories'>('products');

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

  const handleDeleteRequest = (product: Product) => {
    setDeleteCandidate(product);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteCandidate) return;

    try {
      setDeleting(true);
      await productService.delete(deleteCandidate.id);
      await loadProducts();
      // Emit events using eventBus
      eventBus.emit(EVENTS.PRODUCTS_REFRESH);
      eventBus.emit(EVENTS.ADMIN_DATA_CHANGED);
      console.log('🗑️ Product deleted, events emitted');
      toast.success('Товар удалён');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка удаления товара');
      toast.error('Не удалось удалить товар');
    } finally {
      setDeleting(false);
      setDeleteCandidate(null);
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
      toast.success('Товар продублирован');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка дублирования товара');
      toast.error('Не удалось продублировать товар');
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
      toast.success(archived ? 'Товар восстановлен из архива' : 'Товар отправлен в архив');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка обновления архива товара');
      toast.error('Не удалось обновить архив');
    }
  };

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const searchFiltered = !query
      ? products
      : products.filter((product) =>
          product.name.toLowerCase().includes(query) ||
          product.sku.toLowerCase().includes(query) ||
          product.tags.some((tag) => tag.toLowerCase().includes(query)),
        );

    return searchFiltered.filter((product) => {
      const archived = isArchived(product);
      if (archiveFilter === 'archived') return archived;
      if (archiveFilter === 'active') return !archived;
      return true;
    });
  }, [products, searchQuery, archiveFilter]);

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
        {activeTab === 'products' && (
          <Button onClick={handleAdd} size="responsive" className="gap-2">
            <Plus className="h-4 w-4" />
            Добавить товар
          </Button>
        )}
      </div>

      {/* Вкладки */}
      <div className="flex items-center gap-1 p-1 bg-muted/30 rounded-lg w-fit">
        <Button
          variant={activeTab === 'products' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('products')}
          className="h-8 px-3 text-xs font-medium gap-2"
        >
          <Package className="h-4 w-4" />
          Товары ({products.length})
        </Button>
        <Button
          variant={activeTab === 'categories' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('categories')}
          className="h-8 px-3 text-xs font-medium gap-2"
        >
          <FolderOpen className="h-4 w-4" />
          Категории
        </Button>
      </div>

      {/* Контент вкладок */}
      {activeTab === 'categories' ? (
        <CategoryManager />
      ) : (
        <>
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
        </>
      )}
      <div className="sm:hidden space-y-3">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="overflow-hidden border border-border/60 bg-card/80 backdrop-blur">
            <CardContent className="p-3">
              <div className="flex items-start gap-3">
                {/* Product thumbnail - larger and more prominent */}
                <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden flex items-center justify-center flex-shrink-0 border border-border/40">
                  {product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/128?text=No+Image';
                      }}
                    />
                  ) : (
                    <div className="text-center p-1">
                      <Package className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
                      <div className="text-[9px] text-muted-foreground leading-tight">Нет фото</div>
                    </div>
                  )}
                </div>

                {/* Product info */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm leading-tight line-clamp-2">{product.name}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">SKU: {product.sku}</p>
                    </div>
                    {isArchived(product) && (
                      <Badge variant="secondary" className="text-[10px] flex-shrink-0">Архив</Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-bold text-base">{product.price}₽</span>
                    <Badge variant="outline" className="text-[10px]">
                      {product.type === 'bundle' ? 'Набор' : 'Товар'}
                    </Badge>
                    {getStatusBadge(product.status)}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-3 pt-3 border-t flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(product)}
                  className="flex-1 h-9 gap-1.5"
                >
                  <Edit className="h-3.5 w-3.5" />
                  <span className="text-xs">Изменить</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDuplicate(product)}
                  className="h-9 w-9 p-0"
                  title="Дублировать"
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleArchiveToggle(product)}
                  className="h-9 w-9 p-0"
                  title={isArchived(product) ? 'Восстановить' : 'В архив'}
                >
                  <Archive className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteRequest(product)}
                  className="h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  title="Удалить"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop/tablet: grid cards with improved layout */}
      <div className="hidden sm:grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="overflow-hidden border border-border/60 bg-card/80 backdrop-blur hover:shadow-lg transition-shadow duration-200">
            {/* Product image with better aspect ratio */}
            <div className="aspect-[3/4] relative bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
              {product.images.length > 0 ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/400x300?text=No+Image';
                  }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                  <Package className="h-12 w-12 mb-2 opacity-40" />
                  <span className="text-sm">Нет изображения</span>
                </div>
              )}
              
              {/* Status badge overlay */}
              <div className="absolute top-3 right-3">
                {getStatusBadge(product.status)}
              </div>
              
              {/* Archive badge */}
              {isArchived(product) && (
                <div className="absolute top-3 left-3">
                  <Badge variant="secondary" className="text-xs backdrop-blur-sm bg-background/80">
                    В архиве
                  </Badge>
                </div>
              )}
            </div>

            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Product header */}
                <div className="space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-base line-clamp-2 leading-tight flex-1">{product.name}</h3>
                    <Badge variant="outline" className="text-xs flex-shrink-0">
                      {product.type === 'bundle' ? 'Набор' : 'Товар'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                </div>

                {/* Price */}
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xl">{product.price}₽</span>
                  {product.original_price && (
                    <span className="text-sm text-muted-foreground line-through">
                      {product.original_price}₽
                    </span>
                  )}
                </div>

                {/* Tags */}
                {product.tags.filter(tag => tag !== ARCHIVE_TAG).length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {product.tags.filter(tag => tag !== ARCHIVE_TAG).slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {product.tags.filter(tag => tag !== ARCHIVE_TAG).length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{product.tags.filter(tag => tag !== ARCHIVE_TAG).length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Action buttons - improved layout */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(product)}
                    className="gap-1.5 h-9"
                  >
                    <Edit className="h-3.5 w-3.5" />
                    <span className="text-xs">Изменить</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDuplicate(product)}
                    className="gap-1.5 h-9"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span className="text-xs">Дубль</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleArchiveToggle(product)}
                    className="gap-1.5 h-9"
                  >
                    <Archive className="h-3.5 w-3.5" />
                    <span className="text-xs">{isArchived(product) ? 'Восстановить' : 'В архив'}</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteRequest(product)}
                    className="h-9 gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="text-xs">Удалить</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ConfirmDialog
        open={!!deleteCandidate}
        onOpenChange={(open) => {
          if (!open) setDeleteCandidate(null)
        }}
        title="Удалить товар?"
        description={deleteCandidate ? `Товар: ${deleteCandidate.name}` : undefined}
        confirmText="Удалить"
        cancelText="Отмена"
        confirmVariant="destructive"
        loading={deleting}
        onConfirm={handleDeleteConfirm}
      />

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