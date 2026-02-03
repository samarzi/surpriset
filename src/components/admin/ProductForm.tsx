import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Package, Download, RefreshCw, AlertCircle, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ImageUploadCompact } from '@/components/ui/image-upload-compact';
import { ImageFullscreenModal } from '@/components/ui/image-fullscreen-modal';
import { productService } from '@/lib/database';
import { Product, ProductStatus, ProductType, ProductCategory } from '@/types';
import { marketplaceParser, detectMarketplace } from '@/lib/marketplaceParsers';
import { isTelegramWebApp } from '@/utils/telegram';
import { supabase } from '@/lib/supabase';

interface ProductFormProps {
  product?: Product | null;
  onClose: () => void;
}

export function ProductForm({ product, onClose }: ProductFormProps) {
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    composition: '',
    price: '',
    original_price: '',
    images: [] as string[],
    category_ids: [] as string[], // Изменено с tags на category_ids
    status: 'in_stock' as ProductStatus,
    type: 'product' as ProductType,
    is_featured: false,
    specifications: {} as Record<string, string>,
    is_imported: false,
    source_url: '',
    margin_percent: 20 // Наценка по умолчанию 20%
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [categorySearch, setCategorySearch] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [specKey, setSpecKey] = useState('');
  const [specValue, setSpecValue] = useState('');
  const [marketplaceUrl, setMarketplaceUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [longPressedImage, setLongPressedImage] = useState<number | null>(null);
  const [fullscreenModalOpen, setFullscreenModalOpen] = useState(false);
  const [fullscreenImageIndex, setFullscreenImageIndex] = useState(0);
  const [isPriceRaw, setIsPriceRaw] = useState(false); // Flag to track if price is raw from import

  // Фильтрованные категории для поиска
  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return categories;
    const query = categorySearch.toLowerCase();
    return categories.filter(cat => cat.name.toLowerCase().includes(query));
  }, [categories, categorySearch]);

  // Загрузка категорий
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  useEffect(() => {
    if (product) {
      setFormData({
        sku: product.sku,
        name: product.name,
        description: product.description,
        composition: product.composition || '',
        price: product.price.toString(),
        original_price: product.original_price?.toString() || '',
        images: product.images,
        category_ids: product.category_ids || [], // Изменено с tags
        status: product.status,
        type: product.type,
        is_featured: product.is_featured,
        specifications: product.specifications || {},
        is_imported: product.is_imported || false,
        source_url: product.source_url || '',
        margin_percent: product.margin_percent ?? 20
      });

      if (product.source_url) {
        setMarketplaceUrl(product.source_url);
      }
    }
  }, [product]);

  // Автоматическое заполнение старой цены при завершении ввода (onBlur)
  // Автоматическое заполнение старой цены при завершении ввода (onBlur)
  const handlePriceBlur = () => {
    // Logic removed to prevent confusion with fake prices
  };

  // Функция импорта товара с маркетплейса
  const handleImportFromMarketplace = async () => {
    const trimmedUrl = marketplaceUrl.trim();

    if (!trimmedUrl) {
      setError('Введите ссылку на товар');
      return;
    }

    // Проверяем, запущено ли приложение в Telegram
    const isInTelegram = isTelegramWebApp();

    if (!isInTelegram) {
      setError('⚠️ Импорт товаров работает только в Telegram Mini App из-за ограничений CORS в браузерах. Откройте приложение в Telegram для использования этой функции.');
      return;
    }

    const marketplace = detectMarketplace(trimmedUrl);
    if (!marketplace) {
      setError('Неподдерживаемый маркетплейс. Поддерживаются: Wildberries, Ozon, Яндекс Маркет');
      return;
    }

    setImporting(true);
    setError(null);

    try {
      if (import.meta.env.DEV) {
        console.log('🔄 Starting import from marketplace:', trimmedUrl);
      }
      const productData = await marketplaceParser.parseProduct(trimmedUrl);

      // Логируем полученные данные для отладки
      if (import.meta.env.DEV) {
        console.log('📥 Получены данные от парсера:', {
          title: productData.title,
          price: productData.price,
          old_price: productData.old_price,
          description: productData.description?.substring(0, 100) + '...',
          images_count: productData.images?.length || 0,
          characteristics_count: Object.keys(productData.characteristics || {}).length,
          in_stock: productData.in_stock
        });
      }

      // Валидация данных
      if (!productData.title || productData.title.length < 3) {
        throw new Error('Не удалось извлечь название товара. Попробуйте другую ссылку.');
      }

      if (!productData.price || productData.price <= 0) {
        console.warn('⚠️ Цена не извлечена или равна 0, будет установлена 0');
      }

      // Импортируем цены БЕЗ наценки - как есть с маркетплейса
      const basePrice = productData.price || 0;
      const baseOriginalPrice = productData.old_price && productData.old_price > 0
        ? productData.old_price
        : null;

      // Генерируем SKU как 6-значное число
      const sku = formData.sku || Math.floor(100000 + Math.random() * 900000).toString();

      // Функция улучшения качества изображений
      const upgradeImageQuality = (url: string): string => {
        if (!url) return url;

        // Убираем query параметры
        let upgraded = url.split('?')[0];

        // Для Ozon CDN заменяем размеры на максимальные
        if (upgraded.includes('cdn') || upgraded.includes('ozon')) {
          upgraded = upgraded.replace(/\/w\d+\//g, '/wc1000/');
          upgraded = upgraded.replace(/\/h\d+\//g, '/hc1000/');
          upgraded = upgraded.replace(/\/wc\d+\//g, '/wc1000/');
          upgraded = upgraded.replace(/\/hc\d+\//g, '/hc1000/');
        }

        // Для Yandex Market заменяем размеры на максимальные
        if (upgraded.includes('market.yandex') || upgraded.includes('mdata.yandex') || upgraded.includes('avatars.mds.yandex')) {
          upgraded = upgraded.replace(/\/\d+x\d+\//g, '/orig/');
          upgraded = upgraded.replace(/\/w\d+\//g, '/w2000/');
          upgraded = upgraded.replace(/\/h\d+\//g, '/h2000/');
        }

        return upgraded;
      };

      // Очищаем и валидируем изображения, улучшая их качество
      const validImages = (productData.images || [])
        .filter(img => img && typeof img === 'string' && img.startsWith('http'))
        .map(img => upgradeImageQuality(img));

      if (import.meta.env.DEV) {
        console.log('✅ Подготовка данных для формы:', {
          title: productData.title,
          basePrice,
          baseOriginalPrice,
          images_count: validImages.length,
          description_length: productData.description?.length || 0
        });
      }

      // Заполняем форму данными БЕЗ наценки
      setFormData(prev => ({
        ...prev,
        sku,
        name: productData.title.trim(),
        description: (productData.description || '').trim(),
        composition: (productData.composition || '').trim(),
        price: basePrice.toString(),
        original_price: baseOriginalPrice ? baseOriginalPrice.toString() : '',
        images: validImages,
        status: productData.in_stock ? 'in_stock' : 'out_of_stock',
        specifications: productData.characteristics || {},
        is_imported: true,
        source_url: marketplaceUrl,
        margin_percent: 20 // Наценка по умолчанию 20%
      }));
      setIsPriceRaw(true); // Mark price as raw (needs margin application)

      // Прокручиваем к секции изображений для предпросмотра
      setTimeout(() => {
        const imagesSection = document.querySelector('[data-section="images"]');
        if (imagesSection) {
          imagesSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка импорта товара');
    } finally {
      setImporting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Если товар импортирован, применяем наценку к ценам
      let finalPrice = parseFloat(formData.price);
      let finalOriginalPrice = formData.original_price ? parseFloat(formData.original_price) : null;

      if (formData.is_imported && formData.margin_percent && isPriceRaw) {
        const marginMultiplier = 1 + (formData.margin_percent / 100);
        finalPrice = Math.round(finalPrice * marginMultiplier);
        if (finalOriginalPrice) {
          finalOriginalPrice = Math.round(finalOriginalPrice * marginMultiplier);
        }
      }

      const productData = {
        sku: formData.sku,
        name: formData.name,
        description: formData.description,
        composition: formData.composition || null,
        price: finalPrice,
        original_price: finalOriginalPrice,
        images: formData.images,
        category_ids: formData.category_ids, // Изменено с tags на category_ids
        status: formData.status,
        type: formData.type,
        is_featured: formData.is_featured,
        specifications: Object.keys(formData.specifications).length > 0 ? formData.specifications : null,
        is_imported: formData.is_imported,
        source_url: formData.source_url || null,
        margin_percent: formData.is_imported ? Math.round(formData.margin_percent) : null, // Округляем до целого числа
        last_price_check_at: formData.is_imported ? new Date().toISOString() : null
      };

      if (import.meta.env.DEV) {
        console.log('📤 Отправка данных товара:', productData);
      }

      if (product) {
        await productService.update(product.id, productData);
      } else {
        await productService.create(productData);
      }

      onClose();
    } catch (err) {
      console.error('❌ Ошибка сохранения товара:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ошибка сохранения товара');
      }
    } finally {
      setLoading(false);
    }
  };

  // Функции для работы с категориями
  const toggleCategory = (categoryId: string) => {
    setFormData(prev => {
      const isSelected = prev.category_ids.includes(categoryId);

      if (isSelected) {
        // Убираем категорию
        return {
          ...prev,
          category_ids: prev.category_ids.filter(id => id !== categoryId)
        };
      } else {
        // Добавляем категорию (максимум 3)
        if (prev.category_ids.length >= 3) {
          return prev;
        }
        return {
          ...prev,
          category_ids: [...prev.category_ids, categoryId]
        };
      }
    });
  };

  const removeCategory = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      category_ids: prev.category_ids.filter(id => id !== categoryId)
    }));
  };

  const removeImage = (imageToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter(img => img !== imageToRemove)
    }));
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    setFormData(prev => {
      const images = [...prev.images];
      if (toIndex < 0 || toIndex >= images.length) {
        return prev;
      }
      const [moved] = images.splice(fromIndex, 1);
      images.splice(toIndex, 0, moved);
      return {
        ...prev,
        images,
      };
    });
  };

  const addSpecification = () => {
    if (specKey.trim() && specValue.trim()) {
      setFormData(prev => ({
        ...prev,
        specifications: {
          ...prev.specifications,
          [specKey.trim()]: specValue.trim()
        }
      }));
      setSpecKey('');
      setSpecValue('');
    }
  };

  const removeSpecification = (keyToRemove: string) => {
    setFormData(prev => {
      const newSpecs = { ...prev.specifications };
      delete newSpecs[keyToRemove];
      return {
        ...prev,
        specifications: newSpecs
      };
    });
  };

  useEffect(() => {
    // Block body scroll when modal is open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      // Restore body scroll
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showCategoryDropdown && !target.closest('.category-dropdown-container')) {
        setShowCategoryDropdown(false);
        setCategorySearch('');
      }
    };

    if (showCategoryDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCategoryDropdown]);

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 admin-modal">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm transition-opacity modal-backdrop"
        onClick={onClose}
      />

      {/* Modal */}
      <Card className="relative w-full max-w-5xl max-h-[95vh] overflow-hidden bg-background/95 dark:bg-gray-900/95 backdrop-blur-md border-border/50 shadow-2xl modal-content">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-gradient-to-r from-background/80 to-muted/20 dark:from-gray-900/80 dark:to-gray-800/20 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
              <Package className="h-4 w-4 text-primary" />
            </div>
            <CardTitle className="text-xl font-semibold text-foreground">
              {product ? 'Редактировать товар' : 'Добавить товар'}
            </CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <div className="overflow-y-auto max-h-[calc(95vh-80px)]">
          <CardContent className="p-6 bg-background/50 dark:bg-gray-900/50">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-destructive/10 dark:bg-destructive/20 border border-destructive/20 dark:border-destructive/30 rounded-xl p-4 backdrop-blur-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded-full bg-destructive/20 flex items-center justify-center">
                      <X className="h-2 w-2 text-destructive" />
                    </div>
                    <p className="text-destructive font-medium text-sm">{error}</p>
                  </div>
                </div>
              )}

              {/* Импорт с маркетплейсов */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-xl p-5 border border-blue-200 dark:border-blue-800/50">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center">
                    <Download className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-base font-semibold text-blue-900 dark:text-blue-100">
                    Импорт с маркетплейса
                  </h3>
                </div>

                {!isTelegramWebApp() && (
                  <div className="mb-3 flex items-start gap-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                    <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-yellow-800 dark:text-yellow-200">
                      <strong>Внимание:</strong> Импорт товаров работает только в Telegram Mini App из-за ограничений CORS в браузерах. Откройте приложение в Telegram для использования этой функции.
                    </p>
                  </div>
                )}

                <p className="text-xs text-blue-700 dark:text-blue-300 mb-3">
                  Вставьте ссылку на товар с Wildberries, Ozon или Яндекс Маркет для автоматического заполнения формы
                </p>
                <div className="flex gap-2">
                  <Input
                    value={marketplaceUrl}
                    onChange={(e) => setMarketplaceUrl(e.target.value)}
                    placeholder="https://www.wildberries.ru/catalog/..."
                    className="flex-1 bg-white dark:bg-gray-900 border-blue-200 dark:border-blue-800"
                    disabled={importing}
                  />
                  <Button
                    type="button"
                    onClick={handleImportFromMarketplace}
                    disabled={importing || !marketplaceUrl.trim()}
                    className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {importing ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Загрузка...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        Загрузить
                      </>
                    )}
                  </Button>
                </div>
                {formData.is_imported && formData.source_url && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-blue-700 dark:text-blue-300">
                    <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                      Импортирован
                    </Badge>
                    <span>Наценка {formData.margin_percent || 20}% будет применена при сохранении</span>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="ml-auto h-7 gap-1.5 text-xs bg-white dark:bg-gray-800 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                      onClick={() => window.open(formData.source_url, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3" />
                      Открыть в маркетплейсе
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid gap-8 lg:grid-cols-2">
                {/* Basic Info */}
                <div className="space-y-6">
                  <div className="bg-muted/30 dark:bg-gray-800/30 rounded-xl p-4 border border-border/50">
                    <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center">
                        <Package className="h-3 w-3 text-primary" />
                      </div>
                      Основная информация
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="sku">SKU *</Label>
                        <Input
                          id="sku"
                          value={formData.sku}
                          onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                          placeholder="PROD-001"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="name">Название *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Название товара"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="price">Цена *</Label>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          value={formData.price}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, price: e.target.value }));
                            setIsPriceRaw(false); // Manual input implies final price
                          }}
                          onBlur={handlePriceBlur}
                          placeholder="1000.00"
                          required
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Старая цена автоматически заполнится на 15-30% больше после ввода
                        </p>
                      </div>

                      <div>
                        <Label htmlFor="original_price">Первоначальная цена</Label>
                        <Input
                          id="original_price"
                          type="number"
                          step="0.01"
                          value={formData.original_price}
                          onChange={(e) => setFormData(prev => ({ ...prev, original_price: e.target.value }))}
                          placeholder="1200.00"
                        />
                      </div>

                      {formData.is_imported && (
                        <div>
                          <Label htmlFor="margin_percent">Наценка (%) *</Label>
                          <Input
                            id="margin_percent"
                            type="number"
                            min="0"
                            max="100"
                            step="1"
                            value={formData.margin_percent}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 0;
                              const clampedValue = Math.max(0, Math.min(100, value));
                              setFormData(prev => ({ ...prev, margin_percent: clampedValue }));
                            }}
                            placeholder="20"
                            required
                            className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Наценка от 0% до 100%. Влияет на цену товара при обновлении с маркетплейса.
                          </p>
                          {isPriceRaw && formData.price && (
                            <div className="mt-2 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-xs">
                              <span className="text-purple-700 dark:text-purple-300 font-medium">
                                Итоговая цена при сохранении: {Math.round(parseFloat(formData.price) * (1 + (formData.margin_percent || 0) / 100))} ₽
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      <div>
                        <Label htmlFor="status">Статус</Label>
                        <Select value={formData.status} onValueChange={(value: 'in_stock' | 'coming_soon' | 'out_of_stock') => setFormData(prev => ({ ...prev, status: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="in_stock">В наличии</SelectItem>
                            <SelectItem value="coming_soon">Скоро</SelectItem>
                            <SelectItem value="out_of_stock">Закончилось</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="type">Тип</Label>
                        <Select value={formData.type} onValueChange={(value: 'product' | 'bundle') => setFormData(prev => ({ ...prev, type: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="product">Товар</SelectItem>
                            <SelectItem value="bundle">Набор</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex items-center space-x-3 p-3 bg-muted/20 dark:bg-gray-800/20 rounded-lg border border-border/30">
                        <input
                          type="checkbox"
                          id="is_featured"
                          checked={formData.is_featured}
                          onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                          className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2"
                        />
                        <Label htmlFor="is_featured" className="text-sm font-medium cursor-pointer">
                          Рекомендуемый товар
                        </Label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description and Details */}
                <div className="space-y-6">
                  <div className="bg-muted/30 dark:bg-gray-800/30 rounded-xl p-4 border border-border/50">
                    <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-blue-500/20 flex items-center justify-center">
                        <span className="text-xs text-blue-600 dark:text-blue-400">📝</span>
                      </div>
                      Описание и детали
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="description">Описание *</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Описание товара"
                          rows={3}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="composition">Состав/Комплектация</Label>
                        <Textarea
                          id="composition"
                          value={formData.composition}
                          onChange={(e) => setFormData(prev => ({ ...prev, composition: e.target.value }))}
                          placeholder="Что входит в комплект"
                          rows={3}
                        />
                      </div>

                      {/* Categories */}
                      <div>
                        <Label>Категории (максимум 3)</Label>
                        <div className="space-y-2">
                          {/* Dropdown with search */}
                          <div className="relative category-dropdown-container">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                              className="w-full justify-between h-10 text-sm"
                            >
                              <span className="text-muted-foreground">
                                {formData.category_ids.length === 0
                                  ? 'Выберите категории...'
                                  : `Выбрано: ${formData.category_ids.length}/3`}
                              </span>
                              <span className={`transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`}>▼</span>
                            </Button>

                            {showCategoryDropdown && (
                              <div className="absolute z-50 w-full mt-1 bg-background border-2 border-border rounded-lg shadow-lg max-h-64 overflow-hidden">
                                {/* Search input */}
                                <div className="p-2 border-b border-border">
                                  <Input
                                    type="text"
                                    placeholder="Поиск категорий..."
                                    value={categorySearch}
                                    onChange={(e) => setCategorySearch(e.target.value)}
                                    className="h-9 text-sm"
                                    autoFocus
                                  />
                                </div>

                                {/* Category list */}
                                <div className="overflow-y-auto max-h-48">
                                  {filteredCategories.length === 0 ? (
                                    <div className="p-4 text-center text-sm text-muted-foreground">
                                      Категории не найдены
                                    </div>
                                  ) : (
                                    filteredCategories.map((category) => {
                                      const isSelected = formData.category_ids.includes(category.id);
                                      const isDisabled = !isSelected && formData.category_ids.length >= 3;

                                      return (
                                        <button
                                          key={category.id}
                                          type="button"
                                          onClick={() => {
                                            if (!isDisabled) {
                                              toggleCategory(category.id);
                                            }
                                          }}
                                          disabled={isDisabled}
                                          className={`
                                            w-full px-3 py-2 text-left text-sm transition-colors
                                            ${isSelected
                                              ? 'bg-primary/10 text-primary font-medium'
                                              : isDisabled
                                                ? 'text-gray-400 cursor-not-allowed'
                                                : 'hover:bg-muted'
                                            }
                                          `}
                                        >
                                          <div className="flex items-center justify-between">
                                            <span>{category.name}</span>
                                            {isSelected && <span className="text-primary">✓</span>}
                                          </div>
                                        </button>
                                      );
                                    })
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Selected categories display */}
                          {formData.category_ids.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
                              <span className="text-xs text-muted-foreground">Выбрано:</span>
                              {formData.category_ids.map((categoryId) => {
                                const category = categories.find(c => c.id === categoryId);
                                if (!category) return null;

                                return (
                                  <Badge key={categoryId} variant="secondary" className="gap-1">
                                    {category.name}
                                    <button
                                      type="button"
                                      onClick={() => removeCategory(categoryId)}
                                      className="ml-1 hover:text-red-600"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </Badge>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Images - Compact Gallery */}
              <div
                data-section="images"
                className="bg-muted/30 dark:bg-gray-800/30 rounded-xl p-4 sm:p-6 border border-border/50"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-green-500/20 flex items-center justify-center">
                      <span className="text-xs text-green-600 dark:text-green-400">🖼️</span>
                    </div>
                    Изображения товара ({formData.images.length}/10)
                  </h3>

                  {formData.images.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFullscreenImageIndex(0);
                        setFullscreenModalOpen(true);
                      }}
                      className="text-xs"
                    >
                      Просмотр
                    </Button>
                  )}
                </div>

                {/* Compact Image Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3 mb-4">
                  {formData.images.map((image, index) => {
                    const isLongPressed = longPressedImage === index;
                    let longPressTimer: NodeJS.Timeout | null = null;

                    const handleTouchStart = () => {
                      // Запускаем таймер для long press (500ms)
                      longPressTimer = setTimeout(() => {
                        setLongPressedImage(index);
                      }, 500);
                    };

                    const handleTouchEnd = () => {
                      // Отменяем таймер
                      if (longPressTimer) {
                        clearTimeout(longPressTimer);
                      }

                      // Если не было long press, открываем полноэкранный просмотр
                      if (!isLongPressed) {
                        setFullscreenImageIndex(index);
                        setFullscreenModalOpen(true);
                      }
                    };

                    const handleTouchMove = () => {
                      // Отменяем long press при движении пальца
                      if (longPressTimer) {
                        clearTimeout(longPressTimer);
                      }
                    };

                    return (
                      <div
                        key={index}
                        className="relative group aspect-square rounded-lg overflow-hidden border-2 border-border/50 hover:border-primary/50 transition-all bg-muted/50"
                        onTouchStart={handleTouchStart}
                        onTouchEnd={handleTouchEnd}
                        onTouchMove={handleTouchMove}
                      >
                        {/* Image Preview */}
                        <img
                          src={image}
                          alt={`Product ${index + 1}`}
                          className="w-full h-full object-cover cursor-pointer select-none"
                          onClick={() => {
                            setFullscreenImageIndex(index);
                            setFullscreenModalOpen(true);
                          }}
                          draggable={false}
                        />

                        {/* Order Badge */}
                        <div className="absolute top-1 left-1 bg-black/70 text-white text-[10px] sm:text-xs px-1.5 py-0.5 rounded font-medium">
                          {index + 1}
                        </div>

                        {/* Controls - Show on hover (desktop) or long press (mobile) */}
                        <div className={`absolute inset-0 bg-black/60 transition-opacity flex items-center justify-center gap-1 ${isLongPressed ? 'opacity-100' : 'opacity-0 md:group-hover:opacity-100'
                          }`}>
                          {/* Move Up */}
                          {index > 0 && (
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                moveImage(index, index - 1);
                                setLongPressedImage(null);
                              }}
                              onTouchEnd={(e) => {
                                e.stopPropagation();
                                moveImage(index, index - 1);
                                setLongPressedImage(null);
                              }}
                              className="h-8 w-8 sm:h-7 sm:w-7 p-0 text-xs"
                            >
                              ↑
                            </Button>
                          )}

                          {/* Move Down */}
                          {index < formData.images.length - 1 && (
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                moveImage(index, index + 1);
                                setLongPressedImage(null);
                              }}
                              onTouchEnd={(e) => {
                                e.stopPropagation();
                                moveImage(index, index + 1);
                                setLongPressedImage(null);
                              }}
                              className="h-8 w-8 sm:h-7 sm:w-7 p-0 text-xs"
                            >
                              ↓
                            </Button>
                          )}

                          {/* Remove */}
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeImage(image);
                              setLongPressedImage(null);
                            }}
                            onTouchEnd={(e) => {
                              e.stopPropagation();
                              removeImage(image);
                              setLongPressedImage(null);
                            }}
                            className="h-8 w-8 sm:h-7 sm:w-7 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>

                          {/* Close button for mobile */}
                          {isLongPressed && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLongPressedImage(null);
                              }}
                              onTouchEnd={(e) => {
                                e.stopPropagation();
                                setLongPressedImage(null);
                              }}
                              className="h-8 w-8 p-0 md:hidden absolute top-1 right-1 bg-black/50"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Add New Image Button */}
                  {formData.images.length < 10 && (
                    <div className="aspect-square">
                      <ImageUploadCompact
                        onChange={(url) => {
                          if (url && !formData.images.includes(url) && formData.images.length < 10) {
                            setFormData(prev => ({
                              ...prev,
                              images: [...prev.images, url]
                            }));
                          }
                        }}
                      />
                    </div>
                  )}
                </div>

                {formData.images.length >= 10 && (
                  <div className="text-xs sm:text-sm text-muted-foreground bg-yellow-50 dark:bg-yellow-900/20 p-2 sm:p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    Достигнуто максимальное количество изображений (10)
                  </div>
                )}

                {formData.images.length === 0 && (
                  <div className="text-xs sm:text-sm text-muted-foreground text-center py-8 border-2 border-dashed border-border/50 rounded-lg">
                    Нажмите на кнопку выше, чтобы добавить изображения
                  </div>
                )}
              </div>

              {/* Specifications */}
              <div className="bg-muted/30 dark:bg-gray-800/30 rounded-xl p-6 border border-border/50">
                <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center">
                    <span className="text-xs text-primary">⚙️</span>
                  </div>
                  Характеристики
                </h3>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={specKey}
                    onChange={(e) => setSpecKey(e.target.value)}
                    placeholder="Название характеристики"
                  />
                  <Input
                    value={specValue}
                    onChange={(e) => setSpecValue(e.target.value)}
                    placeholder="Значение"
                  />
                  <Button type="button" onClick={addSpecification} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {Object.entries(formData.specifications).map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between bg-background/50 dark:bg-gray-900/50 p-3 rounded-lg border border-border/30">
                      <span className="text-sm"><strong className="text-foreground">{key}:</strong> <span className="text-muted-foreground">{value}</span></span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSpecification(key)}
                        className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-6 border-t border-border/50 bg-gradient-to-r from-background/50 to-muted/20 dark:from-gray-900/50 dark:to-gray-800/20 -mx-6 -mb-6 px-6 pb-6 mt-8">
                <Button
                  type="submit"
                  disabled={loading}
                  loading={loading}
                  className="flex-1 h-11 bg-primary hover:bg-primary/90 text-black font-medium transition-all duration-200"
                >
                  {product ? 'Обновить товар' : 'Создать товар'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="px-8 h-11 border-border/50 hover:bg-muted/50 transition-all duration-200"
                >
                  Отмена
                </Button>
              </div>
            </form>
          </CardContent>
        </div>
      </Card>
    </div>
  );

  return (
    <>
      {createPortal(modalContent, document.body)}

      {/* Image Preview Modal */}
      {previewImage && createPortal(
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in-0 duration-200"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 z-10 h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-white"
            >
              <X className="h-6 w-6" />
            </Button>

            {/* Image */}
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>,
        document.body
      )}

      {/* Fullscreen Image Modal */}
      <ImageFullscreenModal
        images={formData.images}
        initialIndex={fullscreenImageIndex}
        isOpen={fullscreenModalOpen}
        onClose={() => setFullscreenModalOpen(false)}
      />

    </>
  );
}