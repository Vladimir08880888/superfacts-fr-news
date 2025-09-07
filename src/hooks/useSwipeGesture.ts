import { useEffect, useRef } from 'react';

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

interface SwipeConfig {
  threshold?: number; // Минимальное расстояние для срабатывания свайпа
  preventDefaultTouchMove?: boolean; // Предотвращать стандартное поведение touch move
  touchStartThreshold?: number; // Максимальное время удержания для старта свайпа
}

export function useSwipeGesture(
  handlers: SwipeHandlers,
  config: SwipeConfig = {}
) {
  const {
    threshold = 100,
    preventDefaultTouchMove = false,
    touchStartThreshold = 1000,
  } = config;

  const touchRef = useRef<HTMLElement>(null);
  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null);

  useEffect(() => {
    const element = touchRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      touchStart.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (preventDefaultTouchMove) {
        e.preventDefault();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStart.current) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStart.current.x;
      const deltaY = touch.clientY - touchStart.current.y;
      const deltaTime = Date.now() - touchStart.current.time;

      // Проверяем, что touch не длился слишком долго (не drag)
      if (deltaTime > touchStartThreshold) {
        touchStart.current = null;
        return;
      }

      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      // Определяем направление свайпа
      if (absDeltaX > threshold && absDeltaX > absDeltaY) {
        // Горизонтальный свайп
        if (deltaX > 0) {
          handlers.onSwipeRight?.();
        } else {
          handlers.onSwipeLeft?.();
        }
      } else if (absDeltaY > threshold && absDeltaY > absDeltaX) {
        // Вертикальный свайп
        if (deltaY > 0) {
          handlers.onSwipeDown?.();
        } else {
          handlers.onSwipeUp?.();
        }
      }

      touchStart.current = null;
    };

    // Добавляем passive: false для возможности preventDefault
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: !preventDefaultTouchMove });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handlers, threshold, preventDefaultTouchMove, touchStartThreshold]);

  return touchRef;
}

// Упрощенный хук для закрытия модальных окон свайпом вправо
export function useSwipeToClose(onClose: () => void, threshold = 100) {
  return useSwipeGesture(
    {
      onSwipeRight: onClose,
    },
    {
      threshold,
      preventDefaultTouchMove: false,
    }
  );
}
