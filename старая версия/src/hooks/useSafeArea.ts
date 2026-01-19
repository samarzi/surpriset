import { useEffect, useState } from 'react';

interface SafeAreaInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

/**
 * Хук для работы с safe area на мобильных устройствах
 * Особенно важно для iPhone с notch и Android с навигационными кнопками
 */
export function useSafeArea() {
  const [safeArea, setSafeArea] = useState<SafeAreaInsets>({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });

  useEffect(() => {
    const updateSafeArea = () => {
      // Получаем значения safe area из CSS env()
      const computedStyle = getComputedStyle(document.documentElement);
      
      const top = parseInt(computedStyle.getPropertyValue('--safe-area-inset-top') || '0');
      const right = parseInt(computedStyle.getPropertyValue('--safe-area-inset-right') || '0');
      const bottom = parseInt(computedStyle.getPropertyValue('--safe-area-inset-bottom') || '0');
      const left = parseInt(computedStyle.getPropertyValue('--safe-area-inset-left') || '0');

      setSafeArea({ top, right, bottom, left });
    };

    // Обновляем при изменении ориентации
    const handleOrientationChange = () => {
      setTimeout(updateSafeArea, 100); // Небольшая задержка для корректного получения значений
    };

    updateSafeArea();
    window.addEventListener('orientationchange', handleOrientationChange);
    window.addEventListener('resize', updateSafeArea);

    return () => {
      window.removeEventListener('orientationchange', handleOrientationChange);
      window.removeEventListener('resize', updateSafeArea);
    };
  }, []);

  return {
    safeArea,
    // Утилиты для применения safe area
    safeAreaStyle: {
      paddingTop: Math.max(16, safeArea.top),
      paddingRight: Math.max(16, safeArea.right),
      paddingBottom: Math.max(16, safeArea.bottom),
      paddingLeft: Math.max(16, safeArea.left),
    },
    // Проверки для различных устройств
    hasNotch: safeArea.top > 20,
    hasHomeIndicator: safeArea.bottom > 0,
    isLandscape: window.innerWidth > window.innerHeight,
  };
}