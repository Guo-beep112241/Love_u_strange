import { useEffect, useRef } from 'react';

const INTERACTIVE_SELECTOR =
  'button, a, input, textarea, select, label, [role="button"], [data-no-swipe]';

export function useSwipeGesture(onSwipeLeft: () => void, onSwipeRight: () => void) {
  const touchStart = useRef({ x: 0, y: 0, active: false });

  useEffect(() => {
    const handleTouchStart = (event: TouchEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest?.(INTERACTIVE_SELECTOR)) {
        touchStart.current.active = false;
        return;
      }
      const touch = event.touches[0];
      if (!touch) return;
      touchStart.current = {
        x: touch.clientX,
        y: touch.clientY,
        active: true,
      };
    };

    const handleTouchEnd = (event: TouchEvent) => {
      if (!touchStart.current.active) return;
      touchStart.current.active = false;

      const touch = event.changedTouches[0];
      if (!touch) return;

      const deltaX = touchStart.current.x - touch.clientX;
      const deltaY = Math.abs(touchStart.current.y - touch.clientY);

      if (deltaY < 50) {
        if (deltaX > 60) {
          onSwipeLeft();
        } else if (deltaX < -60) {
          onSwipeRight();
        }
      }
    };

    const handleTouchCancel = () => {
      touchStart.current.active = false;
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchCancel, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [onSwipeLeft, onSwipeRight]);
}
