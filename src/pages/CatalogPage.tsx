import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProductCard } from '@/components/products/ProductCard';
import { useProducts } from '@/hooks/useDatabase';
import { Product, ProductFilters } from '@/types';

const CATEGORY_MAP: Record<string, string[]> = {
  'for-her': ['Для неё'],
  'for-him': ['Для него'],
  'for-couple': ['Для двоих'],
  'sweets': ['Сладости'],
  'home': ['Для дома'],
};

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Initialize filters from URL params
  const typeParam = searchParams.get('type');
  const initialType = typeParam === 'product' ? ['product' as const] : 
                      typeParam === 'bundle' ? ['bundle' as const] : 
                      undefined;
  
  const [filters, setFilters] = useState<ProductFilters>({
    search: searchParams.get('search') || '',
    sortBy: 'newest',
    type: initialType,
  });
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Загружаем товары из Supabase c учётом базовых фильтров (поиск + теги по категории)
  const categoryFromUrl = searchParams.get('category');

  const baseTags = categoryFromUrl ? CATEGORY_MAP[categoryFromUrl] : undefined;

  const {
    products: dbProducts,
    loading,
    error,
  } = useProducts({
    search: filters.search || undefined,
    tags: baseTags,
  });

  const sourceProducts = useMemo<Product[]>(
    () => (dbProducts && dbProducts.length > 0 ? dbProducts : []),
    [dbProducts],
  );

  // First apply all filters except tag filters to get available tags
  const productsBeforeTagFilter = useMemo(() => {
    let nextProducts = [...sourceProducts];

    if (filters.search) {
      const query = filters.search.trim().toLowerCase();
      nextProducts = nextProducts.filter((product) =>
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.tags.some((tag) => tag.toLowerCase().includes(query)),
      );
    }

    if (filters.minPrice !== undefined) {
      nextProducts = nextProducts.filter((product) => product.price >= filters.minPrice!);
    }

    if (filters.maxPrice !== undefined) {
      nextProducts = nextProducts.filter((product) => product.price <= filters.maxPrice!);
    }

    if (filters.status && filters.status.length > 0) {
      nextProducts = nextProducts.filter((product) => filters.status!.includes(product.status));
    }

    if (filters.type && filters.type.length > 0) {
      nextProducts = nextProducts.filter((product) => filters.type!.includes(product.type));
    }

    return nextProducts;
  }, [filters, sourceProducts]);

  // Extract unique tags from filtered products (excluding category tags)
  const availableTags = useMemo(() => {
    const categoryTags = Object.values(CATEGORY_MAP).flat();
    const tagSet = new Set<string>();
    
    productsBeforeTagFilter.forEach(product => {
      product.tags.forEach(tag => {
        // Exclude category tags from the tag list
        if (!categoryTags.includes(tag)) {
          tagSet.add(tag);
        }
      });
    });
    
    return Array.from(tagSet).sort((a, b) => a.localeCompare(b, 'ru'));
  }, [productsBeforeTagFilter]);

  const filteredProducts = useMemo(() => {
    let nextProducts = [...productsBeforeTagFilter];

    // Filter by selected tags (AND logic - product must have all selected tags)
    if (selectedTags.length > 0) {
      nextProducts = nextProducts.filter((product) =>
        selectedTags.every((tag) => product.tags.includes(tag))
      );
    }

    const sorter = new Intl.Collator('ru');

    switch (filters.sortBy) {
      case 'price_asc':
        nextProducts.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        nextProducts.sort((a, b) => b.price - a.price);
        break;
      case 'popular':
        nextProducts.sort((a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0));
        break;
      case 'newest':
      default:
        nextProducts.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        break;
    }

    return nextProducts.map((product) => ({
      ...product,
      name: sorter.compare(product.name, product.name) === 0 ? product.name : product.name,
    }));
  }, [productsBeforeTagFilter, selectedTags]);

  const handleSearchChange = (value: string) => {
    setFilters(prev => ({ ...prev, search: value }));
    
    // Update URL params
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set('search', value);
    } else {
      newParams.delete('search');
    }
    setSearchParams(newParams);
  };

  const handleSortChange = (sortBy: ProductFilters['sortBy']) => {
    setFilters(prev => ({ ...prev, sortBy }));
  };

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const categories = useMemo(() => {
    const counts: Record<string, number> = Object.keys(CATEGORY_MAP).reduce(
      (acc, key) => ({ ...acc, [key]: 0 }),
      {} as Record<string, number>,
    );

    sourceProducts.forEach((product) => {
      Object.entries(CATEGORY_MAP).forEach(([categoryId, tags]) => {
        if (product.tags.some((tag) => tags.includes(tag))) {
          counts[categoryId] += 1;
        }
      });
    });

    return Object.entries(CATEGORY_MAP).map(([id, tags]) => ({
      id,
      name: tags[0] ?? id,
      count: counts[id] ?? 0,
    }));
  }, [sourceProducts]);

  const currentCategory = searchParams.get('category');

  return (
    <div className="min-h-screen bg-background">
      <div className="container px-2 sm:px-3 lg:px-4 py-4 sm:py-6 lg:py-10">
        {/* Header - Optimized for Mobile */}
        <div className="mb-3 sm:mb-4 lg:mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-heading tracking-tight leading-tight uppercase">
              КАТАЛОГ
            </h1>
            <span className="inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-xs font-bold text-primary shadow-sm">
              {filteredProducts.length}
            </span>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFiltersModal(true)}
            className="button-with-icon h-9 sm:h-10 text-sm px-4 rounded-xl border-2 hover:border-primary/50 hover:bg-primary/10"
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span>Фильтры</span>
          </Button>
        </div>

        {/* Search Bar Only */}
        <div className="mb-3 sm:mb-4 lg:mb-6">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Поиск товаров..."
              value={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-8 sm:pl-10 h-8 sm:h-9 lg:h-10 rounded-lg text-xs sm:text-sm border-2 focus:border-primary/50"
            />
          </div>
        </div>

        {/* Product Type Toggle - Modern Pill Style */}
        <div className="mb-3 sm:mb-4">
          <div className="flex gap-2 p-1.5 bg-muted/50 rounded-2xl border border-border/40 shadow-sm">
            <Button
              variant="ghost"
              size="sm"
              className={`flex-1 h-9 sm:h-10 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-300 ${
                !filters.type || filters.type.length === 0
                  ? 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-md shadow-primary/30 hover:shadow-lg hover:shadow-primary/40 hover:scale-[1.02]'
                  : 'hover:bg-background/60 text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setFilters(prev => ({ ...prev, type: undefined }))}
            >
              Все товары
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`flex-1 h-9 sm:h-10 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-300 ${
                filters.type?.includes('product') && filters.type.length === 1
                  ? 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-md shadow-primary/30 hover:shadow-lg hover:shadow-primary/40 hover:scale-[1.02]'
                  : 'hover:bg-background/60 text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setFilters(prev => ({ ...prev, type: ['product'] }))}
            >
              🎁 Товары
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`flex-1 h-9 sm:h-10 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-300 ${
                filters.type?.includes('bundle') && filters.type.length === 1
                  ? 'bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-md shadow-primary/30 hover:shadow-lg hover:shadow-primary/40 hover:scale-[1.02]'
                  : 'hover:bg-background/60 text-muted-foreground hover:text-foreground'
              }`}
              onClick={() => setFilters(prev => ({ ...prev, type: ['bundle'] }))}
            >
              📦 Наборы
            </Button>
          </div>
        </div>

        {/* Categories - Mobile Optimized */}
        <div className="mb-3 sm:mb-4 lg:mb-6">
          <div className="flex snap-x snap-mandatory gap-1 sm:gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            <Button
              variant={!currentCategory ? 'default' : 'outline'}
              size="sm"
              className="snap-start whitespace-nowrap h-7 sm:h-8 text-[10px] sm:text-xs px-2 sm:px-2.5 rounded-md flex-shrink-0"
              onClick={() => {
                const newParams = new URLSearchParams(searchParams);
                newParams.delete('category');
                setSearchParams(newParams);
              }}
            >
              Все
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={currentCategory === category.id ? 'default' : 'outline'}
                size="sm"
                className="snap-start whitespace-nowrap h-7 sm:h-8 text-[10px] sm:text-xs px-2 sm:px-2.5 rounded-md flex-shrink-0"
                onClick={() => {
                  const newParams = new URLSearchParams(searchParams);
                  newParams.set('category', category.id);
                  setSearchParams(newParams);
                }}
              >
                {category.name} ({category.count})
              </Button>
            ))}
          </div>
        </div>

        {/* Tags - Scrollable Multi-Select */}
        {availableTags.length > 0 && (
          <div className="mb-3 sm:mb-4 lg:mb-6">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs sm:text-sm font-medium text-muted-foreground">Метки:</span>
              {selectedTags.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedTags([])}
                  className="h-6 px-2 text-[10px] sm:text-xs text-primary hover:text-primary/80"
                >
                  Сбросить ({selectedTags.length})
                </Button>
              )}
            </div>
            <div className="flex snap-x snap-mandatory gap-1.5 sm:gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {availableTags.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <Button
                    key={tag}
                    variant={isSelected ? 'default' : 'outline'}
                    size="sm"
                    className={`snap-start whitespace-nowrap h-7 sm:h-8 text-[10px] sm:text-xs px-2.5 sm:px-3 rounded-full flex-shrink-0 transition-all ${
                      isSelected 
                        ? 'bg-primary text-primary-foreground border-primary shadow-sm' 
                        : 'border-border/60 hover:border-primary/50 hover:bg-primary/10'
                    }`}
                    onClick={() => handleTagToggle(tag)}
                  >
                    {isSelected && <span className="mr-1">✓</span>}
                    {tag}
                  </Button>
                );
              })}
            </div>
          </div>
        )}

        {/* Products Grid */}
        {loading && !filteredProducts.length && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 lg:gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="h-36 sm:h-44 lg:h-56 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        )}

        {error && (
          <div className="mb-4 sm:mb-6 text-xs sm:text-sm text-red-600">
            Ошибка загрузки товаров: {error}
          </div>
        )}

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 lg:gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 sm:py-12 lg:py-16 rounded-2xl sm:rounded-3xl border border-dashed border-border/60 bg-muted/30">
            <div className="text-3xl sm:text-4xl lg:text-6xl mb-2 sm:mb-3">🔍</div>
            <h3 className="text-base sm:text-lg lg:text-xl font-semibold mb-1 sm:mb-2">Товары не найдены</h3>
            <p className="text-xs sm:text-sm lg:text-base text-muted-foreground mb-3 sm:mb-4">
              Попробуйте изменить параметры поиска или фильтры
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFilters({ search: '', sortBy: 'newest' });
                setSelectedTags([]);
                setSearchParams(new URLSearchParams());
              }}
              className="h-8 sm:h-9 text-xs sm:text-sm px-3 sm:px-4"
            >
              Сбросить фильтры
            </Button>
          </div>
        )}
      </div>

      {/* Filters Modal - Improved Design */}
      {showFiltersModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in-0 duration-300">
          <div className="bg-background rounded-3xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 sm:p-6 border-b border-border/40 bg-gradient-to-r from-primary/5 to-primary/10">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold">Фильтры</h2>
                <p className="text-sm text-muted-foreground mt-1">Настройте поиск товаров</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowFiltersModal(false)}
                className="h-10 w-10 rounded-full hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Modal Content */}
            <div className="p-5 sm:p-6 space-y-6 overflow-y-auto max-h-[calc(85vh-140px)]">
              {/* Sort By */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  Сортировка
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleSortChange(e.target.value as ProductFilters['sortBy'])}
                  className="w-full h-12 rounded-xl border-2 border-border/50 bg-background px-4 text-sm font-medium text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
                >
                  <option value="newest">🆕 Новые товары</option>
                  <option value="popular">⭐ Популярные</option>
                  <option value="price_asc">💰 Сначала дешевые</option>
                  <option value="price_desc">💎 Сначала дорогие</option>
                </select>
              </div>

              {/* Product Type */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  Тип товара
                </label>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={filters.type?.includes('product') || false}
                        onChange={(e) => {
                          const newType = e.target.checked
                            ? [...(filters.type || []), 'product' as const]
                            : filters.type?.filter(t => t !== 'product') || [];
                          setFilters(prev => ({ ...prev, type: newType.length > 0 ? newType : undefined }));
                        }}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded-lg border-2 transition-all ${
                        filters.type?.includes('product') 
                          ? 'bg-primary border-primary' 
                          : 'border-border/70 group-hover:border-primary/50'
                      }`}>
                        {filters.type?.includes('product') && (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-sm"></div>
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-medium">🎁 Отдельные товары</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={filters.type?.includes('bundle') || false}
                        onChange={(e) => {
                          const newType = e.target.checked
                            ? [...(filters.type || []), 'bundle' as const]
                            : filters.type?.filter(t => t !== 'bundle') || [];
                          setFilters(prev => ({ ...prev, type: newType.length > 0 ? newType : undefined }));
                        }}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded-lg border-2 transition-all ${
                        filters.type?.includes('bundle') 
                          ? 'bg-primary border-primary' 
                          : 'border-border/70 group-hover:border-primary/50'
                      }`}>
                        {filters.type?.includes('bundle') && (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-sm"></div>
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-medium">📦 Готовые наборы</span>
                  </label>
                </div>
              </div>

              {/* Price Range */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  Диапазон цен
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">От (₽)</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={filters.minPrice || ''}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        minPrice: e.target.value ? Number(e.target.value) : undefined 
                      }))}
                      className="h-11 text-sm border-2 border-border/50 focus:border-primary/50 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">До (₽)</label>
                    <Input
                      type="number"
                      placeholder="∞"
                      value={filters.maxPrice || ''}
                      onChange={(e) => setFilters(prev => ({ 
                        ...prev, 
                        maxPrice: e.target.value ? Number(e.target.value) : undefined 
                      }))}
                      className="h-11 text-sm border-2 border-border/50 focus:border-primary/50 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="space-y-3">
                <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary"></div>
                  Наличие товара
                </label>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={filters.status?.includes('in_stock') || false}
                        onChange={(e) => {
                          const newStatus = e.target.checked
                            ? [...(filters.status || []), 'in_stock' as const]
                            : filters.status?.filter(s => s !== 'in_stock') || [];
                          setFilters(prev => ({ ...prev, status: newStatus.length > 0 ? newStatus : undefined }));
                        }}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded-lg border-2 transition-all ${
                        filters.status?.includes('in_stock') 
                          ? 'bg-primary border-primary' 
                          : 'border-border/70 group-hover:border-primary/50'
                      }`}>
                        {filters.status?.includes('in_stock') && (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-sm"></div>
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-medium">✅ В наличии</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={filters.status?.includes('coming_soon') || false}
                        onChange={(e) => {
                          const newStatus = e.target.checked
                            ? [...(filters.status || []), 'coming_soon' as const]
                            : filters.status?.filter(s => s !== 'coming_soon') || [];
                          setFilters(prev => ({ ...prev, status: newStatus.length > 0 ? newStatus : undefined }));
                        }}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded-lg border-2 transition-all ${
                        filters.status?.includes('coming_soon') 
                          ? 'bg-primary border-primary' 
                          : 'border-border/70 group-hover:border-primary/50'
                      }`}>
                        {filters.status?.includes('coming_soon') && (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-sm"></div>
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="text-sm font-medium">⏳ Скоро в продаже</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-5 sm:p-6 border-t border-border/40 bg-muted/20 flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setFilters({ search: filters.search, sortBy: 'newest' });
                  setSelectedTags([]);
                  setSearchParams(new URLSearchParams(filters.search ? { search: filters.search } : {}));
                }}
                className="flex-1 h-12 rounded-xl border-2 font-semibold"
              >
                Сбросить
              </Button>
              <Button
                onClick={() => setShowFiltersModal(false)}
                className="flex-1 h-12 rounded-xl font-semibold bg-primary hover:bg-primary/90"
              >
                Применить
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}