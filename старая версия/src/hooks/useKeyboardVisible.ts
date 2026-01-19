import { useEffect, useState } from 'react';

/**
 * Hook для определения видимости клавиатуры
 * Работает в Telegram WebApp и обычных браузерах
 */
export function useKeyboardVisible() {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    // Для Telegram WebApp
    const tg = (window as any).Telegram?.WebApp;
    
    if (tg) {
      // Слушаем события viewport от Telegram
      const handleViewportChanged = () => {
        const viewportHeight = tg.viewportHeight;
        const viewportStableHeight = tg.viewportStableHeight;
        
        // Если высота viewport уменьшилась значительно - клавиатура открыта
        if (viewportStableHeight && viewportHeight) {
          const diff = viewportStableHeight - viewportHeight;
          setIsKeyboardVisible(diff > 100); // Порог 100px
        }
      };

      tg.onEvent('viewportChanged', handleViewportChanged);

      return () => {
        tg.offEvent('viewportChanged', handleViewportChanged);
      };
    }

    // Для обычных браузеров - отслеживаем фокус на input/textarea
    let initialHeight = window.visualViewport?.height || window.innerHeight;

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true'
      ) {
        // Небольшая задержка для корректной работы
        setTimeout(() => {
          setIsKeyboardVisible(true);
        }, 100);
      }
    };

    const handleFocusOut = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.contentEditable === 'true'
      ) {
        // Проверяем что фокус не перешел на другой input
        setTimeout(() => {
          const activeElement = document.activeElement;
          if (
            activeElement?.tagName !== 'INPUT' &&
            activeElement?.tagName !== 'TEXTAREA' &&
            (activeElement as HTMLElement)?.contentEditable !== 'true'
          ) {
            setIsKeyboardVisible(false);
          }
        }, 100);
      }
    };

    // Дополнительно отслеживаем изменение размера viewport
    const handleResize = () => {
      if (window.visualViewport) {
        const currentHeight = window.visualViewport.height;
        const diff = initialHeight - currentHeight;
        
        // Если высота уменьшилась больше чем на 150px - клавиатура открыта
        if (diff > 150) {
          setIsKeyboardVisible(true);
        } else if (diff < 50) {
          setIsKeyboardVisible(false);
          initialHeight = currentHeight;
        }
      }
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);
    
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    }

    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
      
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      }
    };
  }, []);

  return isKeyboardVisible;
}
