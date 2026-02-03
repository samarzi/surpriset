import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/products/ProductCard';
import { BannerCarousel } from '@/components/ui/banner-carousel';
import HowItWorksSection from '@/components/home/HowItWorksSection';
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
      {/* Banner Carousel - загружается первым */}
      {bannersLoading ? (
        <section className="py-0 sm:py-3">
          <div className="container px-3 sm:px-4 max-w-[1400px]">
            <div className="hidden lg:grid grid-cols-4 gap-4 mb-6">
              <div className="h-[320px] rounded-xl bg-muted animate-pulse" />
              <div className="col-span-2 h-[320px] rounded-xl bg-muted animate-pulse" />
              <div className="h-[320px] rounded-xl bg-muted animate-pulse" />
            </div>
            <div className="lg:hidden h-[200px] sm:h-[280px] rounded-xl bg-muted animate-pulse" />
          </div>
        </section>
      ) : banners.length > 0 ? (
        <div className="border-b border-border/50">
          <BannerCarousel banners={banners} loading={bannersLoading} />
        </div>
      ) : null}

      {/* Featured Products - показываем ТОЛЬКО после загрузки баннеров */}
      {!bannersLoading && (
        <>
          <section className="pt-0 pb-1 sm:py-1.5 lg:py-2">
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

              <div className="mt-8 sm:mt-10 lg:mt-12 text-center px-4">
                <Button 
                  size="lg" 
                  className="btn-catalog-premium group w-full sm:w-full md:w-full lg:w-full max-w-2xl mx-auto h-14 sm:h-16 text-base sm:text-lg font-extrabold shadow-2xl hover:shadow-primary/50 transition-all duration-500" 
                  asChild
                >
                  <Link to="/catalog" className="flex items-center justify-center gap-3">
                    <span className="text-black">Весь каталог</span>
                    <ArrowRight className="h-6 w-6 text-black transition-transform duration-300 group-hover:translate-x-2" />
                  </Link>
                </Button>
              </div>
            </div>
          </section>

          {/* How It Works Section */}
          <HowItWorksSection />
        </>
      )}
    </div>
  );
}