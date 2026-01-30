import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Filter, Copy, Archive, RefreshCw, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { productService } from '@/lib/database';
import { eventBus, EVENTS } from '@/lib/eventBus';
import { Product } from '@/types';
import { ProductForm } from './ProductForm';
import { priceUpdateService } from '@/lib/priceUpdateService';
import { marketplaceParser } from '@/lib/marketplaceParsers';

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
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [showMarginDialog, setShowMarginDialog] = useState(false);
  const [marginValue, setMarginValue] = useState(20);

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

  const handleToggleProductSelection = (productId: string) => {
    setSelectedProductIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    const importedProducts = filteredProducts.filter(p => p.is_imported);
    if (selectedProductIds.size === importedProducts.length) {
      setSelectedProductIds(new Set());
    } else {
      setSelectedProductIds(new Set(importedProducts.map(p => p.id)));
    }
  };

  const handleSetMargin = async () => {
    if (selectedProductIds.size === 0) {
      alert('Выберите товары для установки наценки');
      return;
    }

    if (marginValue < 0 || marginValue > 100) {
      alert('Наценка должна быть от 0% до 100%');
      return;
    }

    if (!confirm(`Установить наценку ${marginValue}% для ${selectedProductIds.size} выбранных товаров?`)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let updated = 0;
      let failed = 0;

      for (const productId of selectedProductIds) {
        try {
          const product = products.find(p => p.id === productId);
          if (!product || !product.is_imported) continue;

          // Пересчитываем цену с новой наценкой
          if (product.source_url) {
            const marketplaceData = await marketplaceParser.parseProduct(product.source_url);
            const marginMultiplier = 1 + (marginValue / 100);
            const newPrice = Math.round(marketplaceData.price * marginMultiplier);
            const newOriginalPrice = marketplaceData.old_price 
              ? Math.round(marketplaceData.old_price * marginMultiplier) 
              : null;

            await productService.update(productId, {
              margin_percent: marginValue,
              price: newPrice,
              original_price: newOriginalPrice,
              status: marketplaceData.in_stock ? 'in_stock' : 'out_of_stock'
            } as any);

            updated++;
          } else {
            // Если нет source_url, просто обновляем наценку
            await productService.update(productId, {
              margin_percent: marginValue
            } as any);
            updated++;
          }
        } catch (err) {
          console.error(`Failed to update product ${productId}:`, err);
          failed++;
        }
      }

      await loadProducts();
      eventBus.emit(EVENTS.PRODUCTS_REFRESH);
      eventBus.emit(EVENTS.ADMIN_DATA_CHANGED);

      setSelectedProductIds(new Set());
      setShowMarginDialog(false);
      setMarginValue(20);

      alert(`✅ Наценка установлена!\n\nОбновлено: ${updated}\nОшибок: ${failed}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка установки наценки');
    } finally {
      setLoading(false);
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
    <div className="w-full">
      <div className="space-y-3 w-full md:pt-24">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Управление товарами</h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Всего товаров: {filteredProducts.length}</p>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {selectedProductIds.size > 0 && (
            <Button 
              onClick={() => setShowMarginDialog(true)} 
              variant="default" 
              size="sm"
              className="gap-1.5 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-black shadow-md h-8 text-xs px-3"
            >
              <Percent className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Наценка</span> ({selectedProductIds.size})
            </Button>
          )}
          <Button 
            onClick={handleUpdateAllPrices} 
            variant="outline" 
            size="sm"
            className="gap-1.5 h-8 text-xs px-3"
            disabled={updatingPrices}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${updatingPrices ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{updatingPrices ? 'Обновление...' : 'Обновить'}</span>
          </Button>
          <Button 
            onClick={handleAdd} 
            size="sm"
            className="gap-1.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-black shadow-md h-8 text-xs px-3"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Добавить</span>
          </Button>
        </div>
      </div>

      {/* Search and Filters - Компактный */}
      <Card className="border-0 shadow-md">
        <CardContent className="!p-4 space-y-2">
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <Input
                placeholder="Поиск..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 text-sm border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-primary"
              />
            </div>
            <Button variant="outline" size="sm" className="gap-1.5 h-9 text-xs px-3">
              <Filter className="h-3.5 w-3.5" />
              Фильтры
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] text-gray-600 dark:text-gray-400 font-medium">Архив:</span>
            <div className="flex gap-1">
              <Button
                type="button"
                variant={archiveFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setArchiveFilter('all')}
                className="h-6 px-2.5 text-[10px]"
              >
                Все
              </Button>
              <Button
                type="button"
                variant={archiveFilter === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setArchiveFilter('active')}
                className="h-6 px-2.5 text-[10px]"
              >
                Активные
              </Button>
              <Button
                type="button"
                variant={archiveFilter === 'archived' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setArchiveFilter('archived')}
                className="h-6 px-2.5 text-[10px]"
              >
                Архив
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products List - Компактный */}
      <div className="space-y-2 mt-2">
        {filteredProducts.some(p => p.is_imported) && (
          <Card className="border-0 shadow-sm bg-blue-50 dark:bg-blue-900/20">
            <CardContent className="!p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={filteredProducts.filter(p => p.is_imported).every(p => selectedProductIds.has(p.id))}
                    onChange={handleSelectAll}
                    className="w-3.5 h-3.5 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                    Выбрать все импортированные
                  </span>
                </div>
                {selectedProductIds.size > 0 && (
                  <Button 
                    onClick={() => setShowMarginDialog(true)} 
                    size="sm"
                    variant="default"
                    className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-black h-7 text-[10px] px-2"
                  >
                    <Percent className="h-3 w-3 mr-1" />
                    ({selectedProductIds.size})
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        
        {filteredProducts.map((product) => (
          <Card key={product.id} className="border-0 shadow-sm hover:shadow-md transition-all group">
            <CardContent className="!p-4 flex items-center">
              <div className="flex items-center gap-2 w-full">
                {product.is_imported && (
                  <input
                    type="checkbox"
                    checked={selectedProductIds.has(product.id)}
                    onChange={() => handleToggleProductSelection(product.id)}
                    className="w-3.5 h-3.5 rounded border-gray-300 text-primary focus:ring-primary flex-shrink-0"
                  />
                )}
                
                {/* Фотка товара - Компактная */}
                <div className="w-12 h-12 flex-shrink-0 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm">
                  {product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/300x200?text=No+Image';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Package className="h-5 w-5" />
                    </div>
                  )}
                </div>

                {/* Информация о товаре - Компактная */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                    <h3 className="font-semibold text-xs text-gray-900 dark:text-white truncate">{product.name}</h3>
                    <Badge variant="outline" className="text-[9px] flex-shrink-0 h-4 px-1.5">
                      {product.type === 'bundle' ? 'Набор' : 'Товар'}
                    </Badge>
                    {getStatusBadge(product.status)}
                    {product.is_imported && (
                      <Badge className="text-[9px] flex-shrink-0 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 border-0 h-4 px-1.5">
                        Импорт
                      </Badge>
                    )}
                    {isArchived(product) && (
                      <Badge variant="secondary" className="text-[9px] flex-shrink-0 h-4 px-1.5">
                        Архив
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-gray-600 dark:text-gray-400">
                    <span className="font-mono">{product.sku}</span>
                    <span className="font-bold text-gray-900 dark:text-white">{product.price}₽</span>
                    {product.original_price && (
                      <span className="line-through text-gray-500">{product.original_price}₽</span>
                    )}
                    {product.is_imported && product.margin_percent !== null && (
                      <Badge variant="outline" className="text-[9px] bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 h-4 px-1.5">
                        +{product.margin_percent}%
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Кнопки управления - Компактные */}
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(product)}
                    className="h-7 w-7 p-0 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600"
                    title="Изменить"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDuplicate(product)}
                    className="h-7 w-7 p-0 hover:bg-green-50 dark:hover:bg-green-900/20 hover:text-green-600"
                    title="Дублировать"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleArchiveToggle(product)}
                    className="h-7 w-7 p-0 hover:bg-orange-50 dark:hover:bg-orange-900/20 hover:text-orange-600"
                    title={isArchived(product) ? 'Из архива' : 'В архив'}
                  >
                    <Archive className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(product.id)}
                    className="h-7 w-7 p-0 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600"
                    title="Удалить"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <Card className="border-0 shadow-md">
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
              {searchQuery ? 'Товары не найдены' : 'Нет товаров для отображения'}
            </p>
            {!searchQuery && (
              <Button onClick={handleAdd} className="gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-black shadow-md text-sm">
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

      {/* Margin Dialog */}
      <Dialog open={showMarginDialog} onOpenChange={setShowMarginDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Percent className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              Установить наценку
            </DialogTitle>
            <DialogDescription>
              Установить наценку для {selectedProductIds.size} выбранных товаров. 
              Наценка будет применена к ценам с маркетплейсов.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="margin" className="text-sm font-medium">Наценка (%)</Label>
              <Input
                id="margin"
                type="number"
                min="0"
                max="100"
                step="1"
                value={marginValue}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0;
                  const clampedValue = Math.max(0, Math.min(100, value));
                  setMarginValue(clampedValue);
                }}
                placeholder="20"
                className="mt-2"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Введите значение от 0% до 100%. Цены будут пересчитаны с учетом новой наценки.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMarginDialog(false)}>
              Отмена
            </Button>
            <Button 
              onClick={handleSetMargin} 
              disabled={loading}
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-black"
            >
              {loading ? 'Применение...' : 'Применить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}