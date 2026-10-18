import { useEffect, useRef } from 'react';

export function useSwipeGesture(onSwipeLeft: () => void, onSwipeRight: () => void) {
  const touchStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStart.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      
      const deltaX = touchStart.current.x - touchEndX;
      const deltaY = Math.abs(touchStart.current.y - touchEndY);

      if (deltaY < 50) {
        if (deltaX > 60) {
          onSwipeLeft(); 
        } else if (deltaX < -60) {
          onSwipeRight(); 
        }
      }
    };

    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onSwipeLeft, onSwipeRight]);
}