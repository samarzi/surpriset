import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Banner } from '@/types';

interface BannerCarouselProps {
  banners: Banner[];
  loading?: boolean;
}

export function BannerCarousel({ banners, loading }: BannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  // Предзагрузка изображений
  const preloadImages = useCallback(() => {
    banners.forEach((banner) => {
      if (!loadedImages.has(banner.image) && !imageErrors.has(banner.image)) {
        const img = new Image();
        img.onload = () => {
          setLoadedImages(prev => new Set([...prev, banner.image]));
        };
        img.onerror = () => {
          setImageErrors(prev => new Set([...prev, banner.image]));
        };
        img.src = banner.image;
      }
    });
  }, [banners, loadedImages, imageErrors]);

  useEffect(() => {
    if (banners.length > 0) {
      preloadImages();
    }
  }, [banners, preloadImages]);

  const handlePrevious = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex - 1 + banners.length) % banners.length);
      setIsTransitioning(false);
    }, 300);
  };

  const handleNext = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
      setIsTransitioning(false);
    }, 300);
  };

  // Добавляем обработку свайпов для мобильных устройств
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
    console.log('🟢 Banner touch start:', e.targetTouches[0].clientX);
    // КРИТИЧНО: Блокируем долгое нажатие и контекстное меню
    e.preventDefault();
    e.stopPropagation();
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
    // КРИТИЧНО: Всегда блокируем дефолтное поведение на баннере
    e.preventDefault();
    e.stopPropagation();
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart || !touchEnd) {
      // Даже если нет данных, блокируем дефолтное поведение
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    console.log('🔴 Banner touch end:', { distance, isLeftSwipe, isRightSwipe });
    
    if (isLeftSwipe) {
      console.log('⬅️ Swipe left - next banner');
      handleNext();
    }
    if (isRightSwipe) {
      console.log('➡️ Swipe right - previous banner');
      handlePrevious();
    }
    
    // КРИТИЧНО: Всегда блокируем дефолтное поведение
    e.preventDefault();
    e.stopPropagation();
  };

  const handleSideBannerClick = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      handlePrevious();
    } else {
      handleNext();
    }
  };

  // Автопереключение каждые 5 секунд
  useEffect(() => {
    if (banners.length <= 1) return;
    
    const interval = setInterval(() => {
      handleNext();
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length]);

  if (loading && banners.length === 0) {
    return (
      <section className="py-4 sm:py-6">
        <div className="container px-3 sm:px-4" style={{ maxWidth: 'var(--container-max-width-extended)' }}>
          <div className="rounded-xl bg-muted animate-pulse" style={{ height: 'var(--banner-height-mobile)' }} />
        </div>
      </section>
    );
  }

  if (banners.length === 0) return null;

  // Получаем индексы для отображения
  const prevIndex = (currentIndex - 1 + banners.length) % banners.length;
  const nextIndex = (currentIndex + 1) % banners.length;

  const renderBannerImage = (banner: Banner, className: string = "", isMain: boolean = false) => {
    const isLoaded = loadedImages.has(banner.image);
    const hasError = imageErrors.has(banner.image);

    return (
      <div className={`relative h-full overflow-hidden rounded-xl ${className}`}>
        {!isLoaded && !hasError && (
          <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
            <div className="text-muted-foreground text-sm">Загрузка...</div>
          </div>
        )}
        {hasError ? (
          <div className="absolute inset-0 bg-muted flex items-center justify-center">
            <div className="text-muted-foreground text-sm">Ошибка загрузки</div>
          </div>
        ) : (
          <img
            src={banner.image}
            alt={banner.title}
            className={`h-full w-full object-cover transition-opacity duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            loading={isMain ? "eager" : "lazy"}
            onLoad={() => setLoadedImages(prev => new Set([...prev, banner.image]))}
            onError={() => setImageErrors(prev => new Set([...prev, banner.image]))}
          />
        )}
        {!isMain && (
          <div className="absolute inset-0 bg-black/40 hover:bg-black/30 transition-colors duration-300" />
        )}
      </div>
    );
  };

  return (
    <section 
      className="py-4 sm:py-6" 
      data-carousel="true" 
      style={{ touchAction: 'pan-x' }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <div className="container px-3 sm:px-4" style={{ maxWidth: 'var(--container-max-width-extended)' }}>
        <div 
          className="relative" 
          data-swipeable="true"
          style={{ touchAction: 'pan-x' }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          {/* Banner layout: один крупный баннер на мобильных, три колонки на планшете/десктопе */}
          <div 
            className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-4 h-auto" 
            style={{ 
              touchAction: 'pan-x',
              height: 'var(--banner-height-desktop)' 
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            
            {/* Left side banner - увеличенный размер */}
            <div 
              className="hidden sm:block cursor-pointer"
              style={{ width: 'var(--banner-width-side)' }}
              onClick={(e) => {
                e.preventDefault();
                handleSideBannerClick('prev');
              }}
            >
              <div className="block h-48 sm:h-full">
                {renderBannerImage(banners[prevIndex])}
              </div>
            </div>

            {/* Main center banner - увеличенный размер */}
            <div className="w-full" style={{ width: 'var(--banner-width-center)' }}>
              <Link
                to={banners[currentIndex].link || '/catalog'}
                className="block h-48 sm:h-full rounded-xl overflow-hidden"
              >
                <div className={`relative h-full transition-all duration-300 ${isTransitioning ? 'scale-95 opacity-80' : 'scale-100 opacity-100'}`}>
                  {renderBannerImage(banners[currentIndex], "", true)}
                </div>
              </Link>
            </div>

            {/* Right side banner - увеличенный размер */}
            <div 
              className="hidden sm:block cursor-pointer"
              style={{ width: 'var(--banner-width-side)' }}
              onClick={(e) => {
                e.preventDefault();
                handleSideBannerClick('next');
              }}
            >
              <div className="block h-full">
                {renderBannerImage(banners[nextIndex])}
              </div>
            </div>
          </div>

          {/* Индикаторы загрузки для мобильных */}
          <div className="flex justify-center mt-4 sm:hidden">
            <div className="flex space-x-2">
              {banners.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    index === currentIndex 
                      ? 'bg-primary scale-125' 
                      : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                  }`}
                  aria-label={`Перейти к баннеру ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}