import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/products/ProductCard';
import { BannerCarousel } from '@/components/ui/banner-carousel';
import { useProducts, useBanners } from '@/hooks/useDatabase';

export default function HomePage() {
  // Берём данные только из Supabase. Если данных нет или есть ошибка — просто не показываем товары/баннеры.
  const {
    products: featuredProductsDb,
    loading: productsLoading,
  } = useProducts({ featured: true, status: 'in_stock' });

  const {
    banners: bannersDb,
    loading: bannersLoading,
  } = useBanners(true);

  const featuredProducts = featuredProductsDb ?? [];
  const banners = bannersDb ?? [];

  return (
    <div className="min-h-screen bg-gradient-modern">
      {/* Banner Carousel */}
      {banners.length > 0 && (
        <div className="border-b border-border/50">
          <BannerCarousel banners={banners} loading={bannersLoading} />
        </div>
      )}

      {/* Featured Products */}
      <section className="py-2 sm:py-3 lg:py-4">
        <div className="container px-2 sm:px-3 lg:px-4">
          {productsLoading && featuredProducts.length === 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 lg:gap-6">
              {Array.from({ length: 12 }).map((_, index) => (
                <div key={index} className="h-40 sm:h-48 lg:h-64 rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 lg:gap-6">
              {featuredProducts.slice(0, 12).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          <div className="mt-6 sm:mt-8 lg:mt-12 text-center">
            <Button size="lg" variant="outline" className="button-with-icon group" asChild>
              <Link to="/catalog">
                <span>Весь каталог</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section - Modern Minimal Design */}
      <section className="py-4 sm:py-6 lg:py-8 relative overflow-hidden">
        {/* Subtle Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/3 via-primary/5 to-primary/3" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-32 bg-primary/5 rounded-full blur-3xl opacity-50" />
        
        <div className="container px-3 sm:px-4 lg:px-6 relative z-10">
          <div className="max-w-2xl mx-auto">
            {/* Modern Card Container */}
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/20 to-primary/10 rounded-2xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-500" />
              <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/20 p-6 sm:p-8 shadow-xl">
                
                {/* Header */}
                <div className="text-center mb-6">
                  <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 mb-4 text-xs sm:text-sm font-medium text-primary/80 border border-primary/20">
                    <div className="w-2 h-2 bg-primary rounded-full opacity-60" />
                    Конструктор подарков
                  </div>
                  
                  <h2 className="text-lg sm:text-xl lg:text-2xl font-bold font-heading mb-3 text-foreground">
                    Создайте идеальный подарок
                    <span className="block text-primary/80 text-base sm:text-lg font-medium mt-1">за 5 минут</span>
                  </h2>
                </div>

                {/* Process Steps */}
                <div className="flex items-center justify-between mb-6 relative">
                  <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent -translate-y-1/2" />
                  
                  <div className="flex flex-col items-center text-center bg-white/90 dark:bg-gray-900/90 px-3 py-2 rounded-xl relative z-10">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center mb-2 transition-transform duration-300">
                      <span className="text-sm">🎯</span>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">Выберите</span>
                  </div>
                  
                  <div className="flex flex-col items-center text-center bg-white/90 dark:bg-gray-900/90 px-3 py-2 rounded-xl relative z-10">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center mb-2 transition-transform duration-300 delay-100">
                      <span className="text-sm">✨</span>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">Создайте</span>
                  </div>
                  
                  <div className="flex flex-col items-center text-center bg-white/90 dark:bg-gray-900/90 px-3 py-2 rounded-xl relative z-10">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500/20 to-green-600/20 flex items-center justify-center mb-2 transition-transform duration-300 delay-200">
                      <span className="text-sm">🎁</span>
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">Получите</span>
                  </div>
                </div>

                {/* CTA Button */}
                <div className="text-center">
                  <Button 
                    size="lg" 
                    className="button-with-icon group bg-brand-gradient hover:bg-brand-gradient-dark text-black font-semibold shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-3 text-sm sm:text-base rounded-xl border border-primary/30 hover:border-primary/50" 
                    asChild
                  >
                    <Link to="/bundle-builder">
                      <span>Собрать набор</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 duration-300" />
                    </Link>
                  </Button>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}