import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProductCard } from '@/components/products/ProductCard';
import { useProducts } from '@/hooks/useDatabase';
import { Product, ProductFilters } from '@/types';

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [filters, setFilters] = useState<ProductFilters>({
    search: '',
    sortBy: 'random',
    type: undefined,
    categories: [],
    minPrice: undefined,
    maxPrice: undefined,
    status: undefined,
  });

  // Загружаем все товары из Supabase
  const {
    products: dbProducts,
    loading,
    error,
  } = useProducts({
    search: filters.search || undefined,
  });

  const sourceProducts = useMemo<Product[]>(
    () => (dbProducts && dbProducts.length > 0 ? dbProducts : []),
    [dbProducts],
  );

  // Simple filter loading from localStorage - run once on mount
  useEffect(() => {
    console.log('=== CATALOG PAGE LOADING ===');
    console.log('Current URL params:', Object.fromEntries(searchParams.entries()));

    const savedFilters = localStorage.getItem('catalog-filters');
    if (savedFilters) {
      try {
        const parsed = JSON.parse(savedFilters);
        console.log('Loading filters from localStorage:', parsed);
        setFilters(parsed);
      } catch (e) {
        console.error('Failed to parse filters:', e);
      }
    }

    // Also load from URL params if they exist
    const urlFilters = {
      search: searchParams.get('search') || '',
      sortBy: (searchParams.get('sortBy') as ProductFilters['sortBy']) || 'newest',
      type: searchParams.get('type') === 'product' ? ['product' as const] :
        searchParams.get('type') === 'bundle' ? ['bundle' as const] :
          undefined,
      categories: searchParams.get('categories') ? searchParams.get('categories')?.split(',') : [],
      minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
      maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
      status: searchParams.get('status') ? searchParams.get('status')?.split(',') as ProductFilters['status'] : undefined,
    };

    console.log('Filters from URL:', urlFilters);

    // Use URL filters if they exist, otherwise use localStorage
    if (searchParams.toString()) {
      console.log('Using URL filters (priority)');
      setFilters(urlFilters);
    }
  }, []); // Empty dependency array - run only once

  // Save filters to localStorage - but not on initial load
  useEffect(() => {
    // Don't save on initial render when filters are default
    if (filters.search !== '' || filters.sortBy !== 'newest' ||
      (filters.categories && filters.categories.length > 0)) {
      console.log('Saving filters to localStorage:', filters);
      localStorage.setItem('catalog-filters', JSON.stringify(filters));
    }
  }, [filters]);

  // Применяем все фильтры
  const filteredProducts = useMemo(() => {
    console.log('=== FILTERING START ===');
    console.log('Source products count:', sourceProducts.length);
    console.log('Current filters:', filters);

    let nextProducts = [...sourceProducts];
    console.log('Starting with products:', nextProducts.length);

    if (filters.search) {
      const query = filters.search.trim().toLowerCase();
      const beforeSearch = nextProducts.length;
      nextProducts = nextProducts.filter((product) =>
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query)
      );
      console.log(`Search filter "${query}": ${beforeSearch} -> ${nextProducts.length}`);
    }

    if (filters.minPrice !== undefined) {
      const beforePrice = nextProducts.length;
      nextProducts = nextProducts.filter((product) => product.price >= filters.minPrice!);
      console.log(`Min price ${filters.minPrice}: ${beforePrice} -> ${nextProducts.length}`);
    }

    if (filters.maxPrice !== undefined) {
      const beforePrice = nextProducts.length;
      nextProducts = nextProducts.filter((product) => product.price <= filters.maxPrice!);
      console.log(`Max price ${filters.maxPrice}: ${beforePrice} -> ${nextProducts.length}`);
    }

    if (filters.status && filters.status.length > 0) {
      const beforeStatus = nextProducts.length;
      nextProducts = nextProducts.filter((product) => filters.status!.includes(product.status));
      console.log(`Status filter ${filters.status}: ${beforeStatus} -> ${nextProducts.length}`);
    }

    if (filters.type && filters.type.length > 0) {
      const beforeType = nextProducts.length;
      nextProducts = nextProducts.filter((product) => filters.type!.includes(product.type));
      console.log(`Type filter ${filters.type}: ${beforeType} -> ${nextProducts.length}`);
    }

    if (filters.categories && filters.categories.length > 0) {
      const beforeCategories = nextProducts.length;
      nextProducts = nextProducts.filter((product) =>
        product.category_ids?.some(catId => filters.categories!.includes(catId))
      );
      console.log(`Categories filter ${filters.categories}: ${beforeCategories} -> ${nextProducts.length}`);
    }



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
      case 'random':
        // Simple Fisher-Yates shuffle
        for (let i = nextProducts.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [nextProducts[i], nextProducts[j]] = [nextProducts[j], nextProducts[i]];
        }
        break;
      case 'newest':
      default:
        nextProducts.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        break;
    }

    // If 'random' is default but we want it sticky? 
    // Actually, sorting happens on every filter change. 
    // Stable random seed would be better but simple shuffle is okay for "random on start".

    return nextProducts;
  }, [filters, sourceProducts]);

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

  return (
    <div className="min-h-screen bg-background page-safe-top">
      <div className="container px-2 sm:px-3 lg:px-4 py-4 sm:py-6 lg:py-10">
        {/* Header - Optimized for Mobile */}
        <div className="mb-3 sm:mb-4 lg:mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-heading tracking-tight leading-tight uppercase text-foreground dark:text-white">
              КАТАЛОГ
            </h1>
            <span className="inline-flex items-center rounded-full bg-primary/10 border border-primary/20 px-2.5 py-1 text-xs sm:text-sm font-extrabold text-primary shadow-sm">
              {filteredProducts.length}
            </span>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/catalog/filters')}
            className="h-9 sm:h-10 text-sm font-bold px-4 rounded-xl border-2 hover:border-primary/50 hover:bg-primary/10 flex items-center gap-2 text-foreground dark:text-white"
            type="button"
          >
            <SlidersHorizontal className="h-4 w-4 flex-shrink-0 text-foreground dark:text-white" strokeWidth={2.5} />
            <span>Фильтры</span>
          </Button>
        </div>

        {/* Search Bar Only */}
        <div className="mb-3 sm:mb-4 lg:mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-4.5 sm:w-4.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Поиск товаров..."
              value={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 sm:pl-11 h-10 sm:h-11 lg:h-12 rounded-lg text-sm sm:text-base font-medium border-2 focus:border-primary/50 dark:text-white"
            />
          </div>
        </div>

        <div className="mb-3 sm:mb-4">
          <div className="flex gap-2 p-1.5 bg-muted/50 rounded-2xl border border-border/40 shadow-sm">
            <Button
              variant={!filters.type || filters.type.length === 0 ? "default" : "ghost"}
              size="sm"
              className={`flex-1 h-10 sm:h-11 text-sm sm:text-base font-bold rounded-xl transition-all duration-300 ${!filters.type || filters.type.length === 0
                ? 'shadow-md scale-105 z-10'
                : 'hover:bg-white/10 text-muted-foreground hover:text-foreground'
                }`}
              onClick={() => setFilters(prev => ({ ...prev, type: undefined }))}
            >
              Все товары
            </Button>
            <Button
              variant={filters.type?.includes('product') && filters.type.length === 1 ? "default" : "ghost"}
              size="sm"
              className={`flex-1 h-10 sm:h-11 text-sm sm:text-base font-bold rounded-xl transition-all duration-300 ${filters.type?.includes('product') && filters.type.length === 1
                ? 'shadow-md scale-105 z-10'
                : 'hover:bg-white/10 text-muted-foreground hover:text-foreground'
                }`}
              onClick={() => setFilters(prev => ({ ...prev, type: ['product'] }))}
            >
              🎁 Товары
            </Button>
            <Button
              variant={filters.type?.includes('bundle') && filters.type.length === 1 ? "default" : "ghost"}
              size="sm"
              className={`flex-1 h-10 sm:h-11 text-sm sm:text-base font-bold rounded-xl transition-all duration-300 ${filters.type?.includes('bundle') && filters.type.length === 1
                ? 'shadow-md scale-105 z-10'
                : 'hover:bg-white/10 text-muted-foreground hover:text-foreground'
                }`}
              onClick={() => setFilters(prev => ({ ...prev, type: ['bundle'] }))}
            >
              📦 Наборы
            </Button>
          </div>
        </div>

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
            <div className="text-4xl sm:text-5xl lg:text-7xl mb-3 sm:mb-4">🔍</div>
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold mb-2 sm:mb-3 dark:text-white">Товары не найдены</h3>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground mb-4 sm:mb-5">
              Попробуйте изменить параметры поиска или фильтры
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFilters({ search: '', sortBy: 'newest' });
                setSearchParams(new URLSearchParams());
              }}
              className="h-9 sm:h-10 text-sm sm:text-base font-bold px-4 sm:px-5"
            >
              Сбросить фильтры
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}