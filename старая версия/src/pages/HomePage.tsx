import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/products/ProductCard';
import { BannerCarousel } from '@/components/ui/banner-carousel';
import { useProducts, useBanners } from '@/hooks/useDatabase';
import { useTelegramWebApp } from '@/hooks/useTelegramWebApp';
import { useTelegramProducts } from '@/hooks/useTelegramProducts';
import { useTelegramBanners } from '@/hooks/useTelegramBanners';

export default function HomePage() {
  const { isTelegram } = useTelegramWebApp();
  
  // Use different hooks for Telegram and regular browser
  const regularProducts = useProducts({ featured: true, status: 'in_stock' });
  const telegramProducts = useTelegramProducts();
  
  const regularBanners = useBanners(true);
  const telegramBanners = useTelegramBanners();
  
  // Choose the right data source
  const {
    products: featuredProductsDb,
    loading: productsLoading,
  } = isTelegram ? telegramProducts : regularProducts;

  const {
    banners: bannersDb,
    loading: bannersLoading,
  } = isTelegram ? telegramBanners : regularBanners;

  const featuredProducts = featuredProductsDb ?? [];
  const banners = bannersDb ?? [];

  return (
    <div className="min-h-screen bg-gradient-hero relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-primary rounded-full opacity-10 animate-float" />
        <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-secondary rounded-full opacity-10 animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-40 left-20 w-20 h-20 bg-gradient-warm rounded-full opacity-10 animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-20 right-10 w-28 h-28 bg-gradient-cool rounded-full opacity-10 animate-float" style={{ animationDelay: '0.5s' }} />
      </div>

      {/* Vibrant Banner Section */}
      {banners.length > 0 && (
        <div className="border-b-4 border-gradient-rainbow shadow-xl relative">
          <BannerCarousel banners={banners} loading={bannersLoading} />
        </div>
      )}

      {/* Featured Products Section with Vibrant Styling */}
      <section className="py-12 relative z-10">
        <div className="container px-4 relative">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4 text-foreground animate-bounce-in">
              ✨ Рекомендуемые товары ✨
            </h2>
            <div className="w-24 h-2 bg-gradient-rainbow mx-auto rounded-full animate-rainbow" />
            <p className="text-muted mt-4 text-lg animate-fade-up" style={{ animationDelay: '0.3s' }}>
              Самые популярные и качественные товары специально для вас
            </p>
          </div>
          
          {productsLoading && featuredProducts.length === 0 ? (
            <div className="mobile-product-grid">
              {Array.from({ length: 8 }).map((_, index) => (
                <div 
                  key={index} 
                  className="aspect-square rounded-xl bg-gradient-to-br from-background-muted to-background-soft animate-pulse relative overflow-hidden border-2 border-border-light"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-shimmer" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <div className="h-4 bg-gradient-primary rounded opacity-20 mb-2" />
                    <div className="h-3 bg-gradient-secondary rounded opacity-20 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mobile-product-grid">
              {featuredProducts.slice(0, 8).map((product, index) => (
                <div 
                  key={product.id}
                  className="animate-bounce-in"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          )}

          <div className="mt-16 text-center">
            <Button size="lg" variant="natural" asChild className="group animate-glow">
              <Link to="/catalog">
                <span className="text-lg font-semibold">🛍️ Весь каталог</span>
                <ArrowRight className="h-6 w-6 ml-3 group-hover:translate-x-2 transition-transform duration-300" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Vibrant CTA Section */}
      <section className="py-16 relative z-10">
        <div className="container px-4 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="bg-background-glass backdrop-blur-lg rounded-3xl border-2 border-primary/20 p-10 shadow-2xl relative group hover:shadow-primary/20 transition-all duration-700 hover:-translate-y-2 overflow-hidden">
              {/* Animated background gradient */}
              <div className="absolute inset-0 bg-gradient-rainbow opacity-5 animate-rainbow" />
              
              <div className="relative z-10">
                <div className="mb-8">
                  <h2 className="text-3xl font-bold mb-6 text-foreground animate-slide-right">
                    🎨 Создайте идеальный подарок
                  </h2>
                  <p className="text-muted group-hover:text-foreground transition-colors duration-500 text-lg animate-fade-up" style={{ animationDelay: '0.2s' }}>
                    Соберите персональный набор из наших товаров за несколько минут и удивите близких
                  </p>
                </div>
                
                {/* Vibrant Steps */}
                <div className="flex justify-center gap-12 mb-10">
                  {[
                    { icon: '🎯', text: 'Выберите', color: 'primary' },
                    { icon: '✨', text: 'Создайте', color: 'secondary' },
                    { icon: '🎁', text: 'Получите', color: 'warm' }
                  ].map((step, index) => (
                    <div 
                      key={index}
                      className="text-center group-hover:animate-float"
                      style={{ animationDelay: `${index * 300}ms` }}
                    >
                      <div className={`w-20 h-20 rounded-3xl bg-gradient-${step.color} flex items-center justify-center mb-4 mx-auto shadow-${step.color} group-hover:shadow-xl group-hover:scale-110 transition-all duration-500 animate-bounce-in`} style={{ animationDelay: `${index * 200}ms` }}>
                        <span className="text-3xl">{step.icon}</span>
                      </div>
                      <span className="text-base font-semibold text-muted group-hover:text-primary transition-colors duration-500">
                        {step.text}
                      </span>
                    </div>
                  ))}
                </div>

                <Button size="lg" variant="natural" asChild className="group animate-glow text-lg px-8 py-4">
                  <Link to="/bundle-builder">
                    <span className="font-bold">🚀 Собрать набор</span>
                    <ArrowRight className="h-6 w-6 ml-3 group-hover:translate-x-2 group-hover:scale-110 transition-all duration-300" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}