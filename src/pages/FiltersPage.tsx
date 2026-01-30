import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SlidersHorizontal, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ProductFilters, ProductCategory } from '@/types';
import { supabase } from '@/lib/supabase';

export default function FiltersPage() {
  const navigate = useNavigate();
  
  // Add class to hide mobile nav when filters page is open
  useEffect(() => {
    document.body.classList.add('filters-page-open');
    
    return () => {
      document.body.classList.remove('filters-page-open');
    };
  }, []);
  
  const [filters, setFilters] = useState<ProductFilters>(() => {
    // Load from localStorage
    const saved = localStorage.getItem('catalog-filters');
    console.log('FiltersPage - Raw localStorage data:', saved);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        console.log('FiltersPage - Parsed filters:', parsed);
        return parsed;
      } catch (e) {
        console.error('Failed to parse saved filters:', e);
      }
    }
    
    // Default filters
    const defaultFilters = {
      search: '',
      sortBy: 'newest',
      type: undefined,
      categories: [],
      minPrice: undefined,
      maxPrice: undefined,
      status: undefined,
    };
    console.log('FiltersPage - Using default filters:', defaultFilters);
    return defaultFilters;
  });
  
  const [categories, setCategories] = useState<ProductCategory[]>([]);

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

  const handleSortChange = (sortBy: ProductFilters['sortBy']) => {
    console.log('=== SORT CHANGE ===');
    console.log('Old filters:', filters);
    console.log('New sortBy:', sortBy);
    const newFilters = { ...filters, sortBy };
    console.log('New filters:', newFilters);
    setFilters(newFilters);
    localStorage.setItem('catalog-filters', JSON.stringify(newFilters));
    console.log('Saved to localStorage');
  };

  const handleReset = () => {
    console.log('=== RESET START ===');
    
    // Clear localStorage first
    localStorage.removeItem('catalog-filters');
    console.log('localStorage cleared');
    
    // Reset state
    const resetFilters = {
      search: '',
      sortBy: 'newest' as const,
      type: undefined,
      categories: [],
      minPrice: undefined,
      maxPrice: undefined,
      status: undefined,
    };
    
    setFilters(resetFilters);
    console.log('Filters reset:', resetFilters);
    
    // Navigate using React Router instead of window.location
    navigate('/catalog');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-border/50">
        <div className="container px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/catalog')}
              className="h-10 w-10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                <SlidersHorizontal className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Фильтры</h1>
                <p className="text-sm text-muted-foreground">Настройте поиск товаров</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="h-9 px-3 text-sm"
            >
              Сбросить
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container px-4 py-6 max-w-2xl mx-auto">
        <div className="space-y-8">
          {/* Sort By */}
          <div className="space-y-3">
            <Label className="text-base font-semibold text-foreground flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              Сортировка
            </Label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleSortChange(e.target.value as ProductFilters['sortBy'])}
              className="w-full h-12 rounded-xl border-2 border-border/50 bg-background px-4 text-base font-medium text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
            >
              <option value="newest">🆕 Новые товары</option>
              <option value="popular">⭐ Популярные</option>
              <option value="price_asc">💰 Сначала дешевые</option>
              <option value="price_desc">💎 Сначала дорогие</option>
            </select>
          </div>

          {/* Categories */}
          {categories.length > 0 && (
            <div className="space-y-3">
              <Label className="text-base font-semibold text-foreground flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                Категории
              </Label>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => {
                  const isSelected = filters.categories?.includes(category.id) || false;
                  return (
                    <button
                      key={category.id}
                      onClick={() => {
                        console.log('Category clicked:', category.name, 'Selected:', isSelected);
                        const currentCategories = filters.categories || [];
                        let newCategories;
                        
                        if (isSelected) {
                          // Remove category
                          newCategories = currentCategories.filter(id => id !== category.id);
                        } else {
                          // Add category
                          newCategories = [...currentCategories, category.id];
                        }
                        
                        console.log('New categories:', newCategories);
                        const newFilters = { ...filters, categories: newCategories.length > 0 ? newCategories : undefined };
                        setFilters(newFilters);
                        localStorage.setItem('catalog-filters', JSON.stringify(newFilters));
                      }}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        isSelected
                          ? 'bg-primary text-black shadow-md shadow-primary/30'
                          : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground'
                      }`}
                      type="button"
                    >
                      {category.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Product Type */}
          <div className="space-y-3">
            <Label className="text-base font-semibold text-foreground flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              Тип товара
            </Label>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={filters.type?.includes('product') || false}
                    onChange={(e) => {
                      console.log('Product type checked:', e.target.checked);
                      const currentType = filters.type || [];
                      let newType;
                      
                      if (e.target.checked) {
                        newType = [...currentType, 'product' as const];
                      } else {
                        newType = currentType.filter(t => t !== 'product');
                      }
                      
                      console.log('New type:', newType);
                      const newFilters = { ...filters, type: newType.length > 0 ? newType : undefined };
                      setFilters(newFilters);
                      localStorage.setItem('catalog-filters', JSON.stringify(newFilters));
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
                <span className="text-base font-medium">🎁 Отдельные товары</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={filters.type?.includes('bundle') || false}
                    onChange={(e) => {
                      console.log('Bundle type checked:', e.target.checked);
                      const currentType = filters.type || [];
                      let newType;
                      
                      if (e.target.checked) {
                        newType = [...currentType, 'bundle' as const];
                      } else {
                        newType = currentType.filter(t => t !== 'bundle');
                      }
                      
                      console.log('New type:', newType);
                      const newFilters = { ...filters, type: newType.length > 0 ? newType : undefined };
                      setFilters(newFilters);
                      localStorage.setItem('catalog-filters', JSON.stringify(newFilters));
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
                <span className="text-base font-medium">📦 Готовые наборы</span>
              </label>
            </div>
          </div>

          {/* Price Range */}
          <div className="space-y-3">
            <Label className="text-base font-semibold text-foreground flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              Диапазон цен
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">От (₽)</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.minPrice || ''}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    minPrice: e.target.value ? Number(e.target.value) : undefined 
                  }))}
                  className="h-12 text-base border-2 border-border/50 focus:border-primary/50 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">До (₽)</label>
                <Input
                  type="number"
                  placeholder="∞"
                  value={filters.maxPrice || ''}
                  onChange={(e) => setFilters(prev => ({ 
                    ...prev, 
                    maxPrice: e.target.value ? Number(e.target.value) : undefined 
                  }))}
                  className="h-12 text-base border-2 border-border/50 focus:border-primary/50 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-3">
            <Label className="text-base font-semibold text-foreground flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary"></div>
              Наличие товара
            </Label>
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
                <span className="text-base font-medium">✅ В наличии</span>
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
                <span className="text-base font-medium">⏳ Скоро в продаже</span>
              </label>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="fixed bottom-0 left-0 right-0 bg-background/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-border/50 p-4 z-50">
          <div className="container max-w-2xl mx-auto">
            <Button
              onClick={() => {
                console.log('Catalog button clicked!');
                navigate('/catalog');
              }}
              className="w-full h-12 rounded-xl font-semibold bg-primary hover:bg-primary/90 text-base relative z-50"
            >
              В каталог
            </Button>
          </div>
        </div>

        {/* Bottom padding for fixed buttons */}
        <div className="h-24"></div>
      </div>
    </div>
  );
}
