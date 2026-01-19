import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface SwipeBackOptions {
  enabled?: boolean;
  threshold?: number; // Минимальное расстояние для срабатывания (px)
  velocity?: number; // Минимальная скорость свайпа (px/ms)
}

export function useSwipeBack(options: SwipeBackOptions = {}) {
  const {
    enabled = true,
    threshold = 50, // Уменьшаем порог для более легкого срабатывания
    velocity = 0.15, // Уменьшаем минимальную скорость
  } = options;

  const navigate = useNavigate();
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeProgress, setSwipeProgress] = useState(0);
  
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);
  const currentX = useRef(0);
  const isSwipingRef = useRef(false);
  const hasDetectedDirection = useRef(false);
  const swipeDirection = useRef<'horizontal' | 'vertical' | null>(null);
  const hasNavigatedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Начинаем отслеживать только если свайп начался с левого края экрана
      const touch = e.touches[0];
      console.log('👆 Touch start at x:', touch.clientX);
      if (touch.clientX < 100) { // Увеличена зона до 100px от левого края
        touchStartX.current = touch.clientX;
        touchStartY.current = touch.clientY;
        currentX.current = touch.clientX;
        touchStartTime.current = Date.now();
        isSwipingRef.current = false;
        hasDetectedDirection.current = false;
        swipeDirection.current = null;
        hasNavigatedRef.current = false;
        
        console.log('🟢 Swipe start detected at x:', touch.clientX);
      } else {
        console.log('❌ Touch outside swipe zone (>100px)');
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartX.current === 0) return;

      const touch = e.touches[0];
      currentX.current = touch.clientX;
      const deltaX = touch.clientX - touchStartX.current;
      const deltaY = touch.clientY - touchStartY.current;
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      // Определяем направление свайпа только один раз при первом движении
      if (!hasDetectedDirection.current && (absDeltaX > 3 || absDeltaY > 3)) {
        hasDetectedDirection.current = true;
        
        // Определяем направление: горизонтальное или вертикальное
        if (absDeltaX > absDeltaY * 1.5) {
          // Горизонтальный свайп
          if (deltaX > 0) {
            // Свайп вправо - активируем
            swipeDirection.current = 'horizontal';
            isSwipingRef.current = true;
            setIsSwiping(true);
            console.log('➡️ Horizontal swipe RIGHT detected');
          } else {
            // Свайп влево - игнорируем
            console.log('⬅️ Horizontal swipe LEFT - ignoring');
            touchStartX.current = 0;
            touchStartY.current = 0;
            return;
          }
        } else {
          // Вертикальный свайп - игнорируем
          swipeDirection.current = 'vertical';
          console.log('⬆️⬇️ Vertical swipe - ignoring');
          touchStartX.current = 0;
          touchStartY.current = 0;
          return;
        }
      }

      // Обновляем прогресс только если это горизонтальный свайп вправо
      if (isSwipingRef.current && swipeDirection.current === 'horizontal' && deltaX > 0) {
        // Обновляем прогресс свайпа (0-1)
        const progress = Math.min(deltaX / threshold, 1);
        setSwipeProgress(progress);

        // Предотвращаем скролл во время свайпа
        if (e.cancelable) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isSwipingRef.current || swipeDirection.current !== 'horizontal') {
        touchStartX.current = 0;
        touchStartY.current = 0;
        currentX.current = 0;
        hasDetectedDirection.current = false;
        swipeDirection.current = null;
        return;
      }

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartX.current;
      const deltaTime = Date.now() - touchStartTime.current;
      const swipeVelocity = deltaX / deltaTime;

      console.log('🏁 Swipe end - deltaX:', deltaX, 'velocity:', swipeVelocity, 'threshold:', threshold, 'velocity threshold:', velocity);

      // Проверяем условия для навигации назад (более мягкие условия)
      const shouldNavigateBack = deltaX > threshold || swipeVelocity > velocity;

      console.log('🔍 Should navigate?', shouldNavigateBack, '| deltaX > threshold:', deltaX > threshold, '| velocity > min:', swipeVelocity > velocity);

      if (shouldNavigateBack) {
        console.log('✅ Navigating back!');
        if (!hasNavigatedRef.current) {
          hasNavigatedRef.current = true;
          console.log('🚀 Calling navigate(-1)');
          navigate(-1);
        } else {
          console.log('⚠️ Already navigated, skipping');
        }
      } else {
        console.log('❌ Swipe not strong enough - deltaX:', deltaX, 'threshold:', threshold);
      }

      // Сбрасываем состояние
      setIsSwiping(false);
      setSwipeProgress(0);
      touchStartX.current = 0;
      touchStartY.current = 0;
      currentX.current = 0;
      isSwipingRef.current = false;
      hasDetectedDirection.current = false;
      swipeDirection.current = null;
      hasNavigatedRef.current = false;
    };

    const handleTouchCancel = () => {
      console.log('🚫 Touch cancelled');
      setIsSwiping(false);
      setSwipeProgress(0);
      touchStartX.current = 0;
      touchStartY.current = 0;
      currentX.current = 0;
      isSwipingRef.current = false;
      hasDetectedDirection.current = false;
      swipeDirection.current = null;
      hasNavigatedRef.current = false;
    };

    // Добавляем слушатели с passive: false для preventDefault
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    document.addEventListener('touchcancel', handleTouchCancel, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [enabled, threshold, velocity, navigate]);

  return {
    isSwiping,
    swipeProgress,
  };
}
