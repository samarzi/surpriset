import { useEffect, useState } from 'react';
import { Logo } from '@/components/ui/logo';

interface LoadingScreenProps {
  onLoadingComplete: () => void;
  isTelegram?: boolean;
}

export function LoadingScreen({ onLoadingComplete, isTelegram = false }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [loadingStage, setLoadingStage] = useState('init');

  useEffect(() => {
    // Если это Telegram, пропускаем загрузочный экран
    if (isTelegram) {
      onLoadingComplete();
      return;
    }

    let progressInterval: NodeJS.Timeout;
    let stageTimeout: NodeJS.Timeout;

    const stages = [
      { name: 'init', text: 'Инициализация...', duration: 300 },
      { name: 'resources', text: 'Загрузка ресурсов...', duration: 800 },
      { name: 'banners', text: 'Подготовка баннеров...', duration: 600 },
      { name: 'interface', text: 'Подготовка интерфейса...', duration: 500 },
      { name: 'final', text: 'Почти готово...', duration: 300 }
    ];

    let currentStageIndex = 0;

    const updateStage = () => {
      if (currentStageIndex < stages.length) {
        const stage = stages[currentStageIndex];
        setLoadingStage(stage.name);
        
        stageTimeout = setTimeout(() => {
          currentStageIndex++;
          updateStage();
        }, stage.duration);
      }
    };

    // Симулируем реалистичную загрузку
    progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setIsComplete(true);
          setTimeout(() => {
            onLoadingComplete();
          }, 300);
          return 100;
        }
        
        // Более плавное увеличение прогресса
        const increment = Math.random() * 8 + 2; // От 2 до 10
        return Math.min(prev + increment, 100);
      });
    }, 80);

    // Проверяем реальную загрузку ресурсов
    const checkResourcesLoaded = async () => {
      // Ждем готовности DOM
      if (document.readyState !== 'complete') {
        await new Promise(resolve => {
          if (document.readyState === 'complete') {
            resolve(void 0);
          } else {
            document.addEventListener('DOMContentLoaded', () => resolve(void 0));
          }
        });
      }

      // Проверяем загрузку изображений
      const images = document.querySelectorAll('img');
      const imagePromises = Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = () => resolve(void 0);
          img.onerror = () => resolve(void 0); // Продолжаем даже если изображение не загрузилось
        });
      });

      // Ждем загрузки всех изображений или таймаут
      await Promise.race([
        Promise.all(imagePromises),
        new Promise(resolve => setTimeout(resolve, 2000)) // Максимум 2 секунды ожидания
      ]);

      // Минимальное время показа загрузочного экрана
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setProgress(100);
    };

    updateStage();
    checkResourcesLoaded();

    return () => {
      clearInterval(progressInterval);
      clearTimeout(stageTimeout);
    };
  }, [onLoadingComplete, isTelegram]);

  // Не показываем загрузочный экран в Telegram
  if (isTelegram) {
    return null;
  }

  const getLoadingText = () => {
    switch (loadingStage) {
      case 'init': return 'Инициализация...';
      case 'resources': return 'Загрузка ресурсов...';
      case 'banners': return 'Подготовка баннеров...';
      case 'interface': return 'Подготовка интерфейса...';
      case 'final': return 'Почти готово...';
      default: return 'Загрузка...';
    }
  };

  return (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center bg-background transition-opacity duration-500 ${
      isComplete ? 'opacity-0 pointer-events-none' : 'opacity-100'
    }`}>
      <div className="flex flex-col items-center space-y-8 max-w-sm mx-auto px-4">
        {/* Logo with enhanced animation */}
        <div className="animate-loading-pulse">
          <Logo size="xl" showText={true} />
        </div>

        {/* Enhanced loading bar */}
        <div className="w-full max-w-xs">
          <div className="h-3 bg-muted rounded-full overflow-hidden shadow-inner">
            <div 
              className="h-full bg-brand-gradient transition-all duration-300 ease-out rounded-full relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
            </div>
          </div>
          <div className="mt-2 text-center">
            <span className="text-xs text-muted-foreground font-medium">
              {Math.round(progress)}%
            </span>
          </div>
        </div>

        {/* Enhanced loading text */}
        <div className="text-center space-y-3">
          <p className="text-xl font-bold text-foreground">
            Загружаем SurpriSet
          </p>
          <p className="text-sm text-muted-foreground font-medium transition-all duration-300">
            {getLoadingText()}
          </p>
        </div>

        {/* Enhanced animated dots */}
        <div className="flex space-x-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-3 h-3 bg-primary rounded-full animate-bounce shadow-lg"
              style={{ 
                animationDelay: `${i * 0.2}s`,
                animationDuration: '1s'
              }}
            />
          ))}
        </div>

        {/* Progress indicator */}
        <div className="text-xs text-muted-foreground/70 text-center">
          Подготавливаем лучший опыт для вас
        </div>
      </div>
    </div>
  );
}