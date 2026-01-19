import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProductCard } from '@/components/products/ProductCard';
import { useProducts } from '@/hooks/useDatabase';
import { Product } from '@/types';

const CATEGORY_MAP: Record<string, string[]> = {
  'for-her': ['Для неё'],
  'for-him': ['Для него'],
  'for-couple': ['Для двоих'],
  'sweets': ['Сладости'],
  'home': ['Для дома'],
};

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Simple state management
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');

  // Load products from database
  const categoryFromUrl = searchParams.get('category');
  const baseTags = categoryFromUrl ? CATEGORY_MAP[categoryFromUrl] : undefined;

  const {
    products: dbProducts,
    loading,
    error,
  } = useProducts({
    search: searchQuery.trim() || undefined,
    tags: baseTags,
  });

  const sourceProducts = useMemo<Product[]>(
    () => (dbProducts && dbProducts.length > 0 ? dbProducts : []),
    [dbProducts],
  );

  // Simple filtering and sorting
  const filteredProducts = useMemo(() => {
    let nextProducts = [...sourceProducts];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      nextProducts = nextProducts.filter((product) =>
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.tags.some((tag) => tag.toLowerCase().includes(query)),
      );
    }

    // Apply sorting
    switch (sortBy) {
      case 'price_asc':
        nextProducts.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        nextProducts.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
      default:
        nextProducts.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        break;
    }

    return nextProducts;
  }, [sourceProducts, searchQuery, sortBy]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    
    // Update URL params
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set('search', value);
    } else {
      newParams.delete('search');
    }
    setSearchParams(newParams);
  };

  // Simple categories for navigation
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
      <div className="container px-4 py-6">
        {/* Simple Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">
              КАТАЛОГ
            </h1>
            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              {filteredProducts.length}
            </span>
          </div>
        </div>

        {/* Simple Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Поиск товаров..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
        </div>

        {/* Simple Sort Options */}
        <div className="mb-6">
          <div className="flex gap-2">
            <Button
              variant={sortBy === 'newest' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('newest')}
            >
              Новые
            </Button>
            <Button
              variant={sortBy === 'price_asc' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('price_asc')}
            >
              Дешевле
            </Button>
            <Button
              variant={sortBy === 'price_desc' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSortBy('price_desc')}
            >
              Дороже
            </Button>
          </div>
        </div>

        {/* Simple Categories */}
        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button
              variant={!currentCategory ? 'default' : 'outline'}
              size="sm"
              className="whitespace-nowrap"
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
                className="whitespace-nowrap"
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

        {/* Loading State */}
        {loading && !filteredProducts.length && (
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-square bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200">
            <h3 className="font-semibold text-red-800 mb-2">
              Ошибка загрузки товаров
            </h3>
            <p className="text-sm text-red-700 mb-3">
              {error}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
            >
              Перезагрузить
            </Button>
          </div>
        )}

        {/* Simple Products Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : !loading && (
          <div className="text-center py-12">
            <div className="text-4xl mb-3">🔍</div>
            <h3 className="text-lg font-semibold mb-2">Товары не найдены</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Попробуйте изменить параметры поиска
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setSortBy('newest');
                setSearchParams(new URLSearchParams());
              }}
            >
              Сбросить фильтры
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}