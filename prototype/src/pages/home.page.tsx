import { useRef } from 'react';
import { useHomeStore } from '../stores/home.store';
import { MOOD_CONFIG, MoodId } from '../utils/theme';
import { HUD } from '@components/HUD';
import { StickerPanel } from '@components/StickerPanel';
import { PetCanvas } from '@components/PetCanvas';
import { useSwipeGesture } from '../utils/useSwipeGesture';

export default function HomePage() {
  const { mood, viewMode, setViewMode } = useHomeStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useSwipeGesture(
    () => {
      // Swiped left (finger moved left) -> slide panel in from right
      if (viewMode === 'interaction') setViewMode('stickers');
    },
    () => {
      // Swiped right (finger moved right) -> close panel
      if (viewMode === 'stickers') setViewMode('interaction');
    }
  );

  return (
    <div className="min-h-dvh bg-surface-base overflow-hidden flex flex-col relative text-text-primary select-none antialiased">
      {/* Top Status Bar */}
      <div className="absolute top-0 left-0 w-full pt-safe z-10 pointer-events-none">
        <div className="h-12 flex items-center justify-center border-b border-border-subtle bg-surface-base/50 backdrop-blur-sm">
          <span className="font-display text-caption text-brand-accent uppercase tracking-widest drop-shadow-[0_0_4px_rgba(168,255,62,0.5)]">
            {MOOD_CONFIG[mood as MoodId].message}
          </span>
        </div>
      </div>

      {/* Main 3D Canvas Area */}
      <div className="w-full h-full">
        <PetCanvas ref={canvasRef} />
      </div>

      {/* Bottom HUD */}
      <HUD />

      {/* Sliding Sticker Panel */}
      <StickerPanel canvasRef={canvasRef} />
    </div>
  );
}