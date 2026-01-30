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
      {/* Banner Carousel */}
      {banners.length > 0 && (
        <div className="border-b border-border/50">
          <BannerCarousel banners={banners} loading={bannersLoading} />
        </div>
      )}

      {/* Featured Products */}
      <section className="py-1 sm:py-1.5 lg:py-2">
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

          <div className="mt-3 sm:mt-4 lg:mt-6 text-center">
            <Button size="lg" variant="outline" className="button-with-icon group" asChild>
              <Link to="/catalog">
                <span>Весь каталог</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <HowItWorksSection />
    </div>
  );
}