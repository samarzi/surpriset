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
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      handleNext();
    }
    if (isRightSwipe) {
      handlePrevious();
    }
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
  }, [banners.length, currentIndex]); // Добавляем currentIndex для сброса таймера

  if (loading && banners.length === 0) {
    return (
      <section className="py-2 sm:py-3">
        <div className="container px-3 sm:px-4 max-w-[1400px]">
          <div className="h-48 sm:h-[320px] rounded-xl bg-muted animate-pulse" />
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
      <div className={`relative w-full h-full overflow-hidden rounded-xl ${className}`}>
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
            className={`w-full h-full transition-opacity duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            } object-cover`}
            style={{
              objectFit: 'cover',
              objectPosition: 'center',
              width: '100%',
              height: '100%'
            }}
            loading={isMain ? "eager" : "lazy"}
            onLoad={() => setLoadedImages(prev => new Set([...prev, banner.image]))}
            onError={() => setImageErrors(prev => new Set([...prev, banner.image]))}
          />
        )}
        {!isMain && (
          <div className="absolute inset-0 bg-black/40 hover:bg-black/30 transition-colors duration-300" />
        )}
        {/* Убираем названия баннеров - они нужны только для админов */}
      </div>
    );
  };

  return (
    <section 
      className="py-2 sm:py-3"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <div className="container px-3 sm:px-4 max-w-[1400px]">
        {/* Баннеры как на Яндекс Маркете: большой широкий в центре + маленькие по бокам на ПК */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
          {/* Левый маленький баннер - только на ПК */}
          <div 
            className="hidden lg:block cursor-pointer"
            onClick={() => handleSideBannerClick('prev')}
          >
            <div className="h-[320px] rounded-xl overflow-hidden">
              {renderBannerImage(banners[prevIndex])}
            </div>
          </div>

          {/* Центральный большой ШИРОКИЙ баннер - занимает 2 колонки */}
          <div className="lg:col-span-2">
            <Link
              to={banners[currentIndex]?.link || '/catalog'}
              className="block h-[200px] sm:h-[280px] lg:h-[320px] rounded-xl overflow-hidden"
            >
              <div className={`relative w-full h-full transition-all duration-300 ${isTransitioning ? 'scale-95 opacity-80' : 'scale-100 opacity-100'}`}>
                {renderBannerImage(banners[currentIndex], "", true)}
              </div>
            </Link>
          </div>

          {/* Правый маленький баннер - только на ПК */}
          <div 
            className="hidden lg:block cursor-pointer"
            onClick={() => handleSideBannerClick('next')}
          >
            <div className="h-[320px] rounded-xl overflow-hidden">
              {renderBannerImage(banners[nextIndex])}
            </div>
          </div>
        </div>

        {/* Индикаторы для мобильных */}
        <div className="flex justify-center lg:hidden">
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
    </section>
  );
}