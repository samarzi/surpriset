import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface SwipeBackOptions {
  enabled?: boolean;
  threshold?: number; // Минимальное расстояние для срабатывания (px)
}

interface SwipeBackHandlers {
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  onPointerCancel: (e: React.PointerEvent) => void;
}

export function useSwipeBack(options: SwipeBackOptions = {}) {
  const {
    enabled = true,
    threshold = 80, // Стандартный порог для react-swipeable
  } = options;

  const navigate = useNavigate();
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeProgress, setSwipeProgress] = useState(0);
  const effectiveThreshold =
    typeof window !== 'undefined' && window.innerWidth < 480
      ? Math.max(55, threshold - 20)
      : threshold;

  // Pointer-based swipe-back: без внешних зависимостей, стабильно в браузере
  const [gesture, setGesture] = useState<{
    active: boolean;
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
    pointerId: number | null;
  }>({ active: false, startX: 0, startY: 0, lastX: 0, lastY: 0, pointerId: null });

  const resetGesture = () => {
    setGesture({ active: false, startX: 0, startY: 0, lastX: 0, lastY: 0, pointerId: null });
    setIsSwiping(false);
    setSwipeProgress(0);
  };

  const handlers: SwipeBackHandlers = {
    onPointerDown: (e) => {
      if (!enabled) return;

      // Только primary pointer (палец/первая кнопка)
      if (e.isPrimary === false) return;

      // Edge swipe: начинаем только у левого края
      if (e.clientX > 30) return;

      setGesture({
        active: true,
        startX: e.clientX,
        startY: e.clientY,
        lastX: e.clientX,
        lastY: e.clientY,
        pointerId: e.pointerId,
      });

      // На iOS/мобилках может выделяться текст/кнопки — сбрасываем
      setIsSwiping(false);
      setSwipeProgress(0);
    },

    onPointerMove: (e) => {
      if (!enabled) return;
      if (!gesture.active) return;
      if (gesture.pointerId !== e.pointerId) return;

      const deltaX = e.clientX - gesture.startX;
      const deltaY = e.clientY - gesture.startY;

      // Если жест больше вертикальный — это скролл, не трогаем
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        return;
      }

      if (deltaX > 0) {
        // В этот момент это уже осознанный горизонтальный жест — можно предотвращать скролл
        e.preventDefault();
        setIsSwiping(true);
        const progress = Math.min(deltaX / effectiveThreshold, 1);
        setSwipeProgress(Math.max(0, progress));
      }

      setGesture((prev) => ({ ...prev, lastX: e.clientX, lastY: e.clientY }));
    },

    onPointerUp: (e) => {
      if (!enabled) return;
      if (!gesture.active) return;
      if (gesture.pointerId !== e.pointerId) return;

      const deltaX = e.clientX - gesture.startX;
      const deltaY = e.clientY - gesture.startY;

      // игнорируем вертикальные жесты
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        resetGesture();
        return;
      }

      if (deltaX >= effectiveThreshold) {
        try {
          navigate(-1);
        } catch (error) {
          if (import.meta.env.DEV) {
            console.error('❌ Navigation error:', error);
          }
        }
      }

      resetGesture();
    },

    onPointerCancel: (e) => {
      if (!enabled) return;
      if (!gesture.active) return;
      if (gesture.pointerId !== e.pointerId) return;
      resetGesture();
    },
  };

  return {
    handlers,
    isSwiping,
    swipeProgress,
  };
}
