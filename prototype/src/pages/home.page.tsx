import { useCallback, useRef, type CSSProperties } from 'react';
import { Sparkles } from 'lucide-react';
import { useHomeStore } from '../stores/home.store';
import { getMoodConfig } from '../utils/theme';
import { HUD } from '@components/HUD';
import { StickerPanel } from '@components/StickerPanel';
import { PetCanvas } from '@components/PetCanvas';
import { StageFX } from '@components/StageFX';
import { useSwipeGesture } from '../utils/useSwipeGesture';

export default function HomePage() {
  const mood = useHomeStore((state) => state.mood);
  const viewMode = useHomeStore((state) => state.viewMode);
  const crazyMode = useHomeStore((state) => state.crazyMode);
  const setViewMode = useHomeStore((state) => state.setViewMode);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const openStickers = useCallback(() => {
    const state = useHomeStore.getState();
    if (state.viewMode === 'interaction') state.setViewMode('stickers');
  }, []);

  const closeStickers = useCallback(() => {
    const state = useHomeStore.getState();
    if (state.viewMode === 'stickers') state.setViewMode('interaction');
  }, []);

  useSwipeGesture(openStickers, closeStickers);

  const config = getMoodConfig(mood);
  const moodStyle = {
    '--mood-color': config.color,
    '--mood-emissive': config.emissive,
  } as CSSProperties;

  return (
    <div
      style={moodStyle}
      className={`fx-stage relative flex h-screen h-dvh min-h-dvh select-none flex-col overflow-hidden bg-surface-base text-text-primary antialiased ${
        crazyMode ? 'fx-screen-shake' : ''
      }`}
    >
      <header className="fx-header relative z-20 shrink-0 border-b border-border-subtle pt-safe">
        <div className="flex h-12 items-center justify-between px-2">
          <div className="flex w-11 flex-col items-center justify-center leading-none">
            <span className="font-display text-[10px] font-bold tracking-[0.22em] text-brand-accent">
              WP
            </span>
            <span className="mt-1 font-mono text-[7px] uppercase tracking-[0.18em] text-text-muted/60">
              v0.2
            </span>
          </div>

          <div className="flex min-w-0 flex-1 items-center justify-center gap-2 px-2">
            <span className="fx-status-dot shrink-0" />
            <span
              aria-live="polite"
              className="fx-status-text truncate text-center font-display text-[12px] uppercase tracking-widest"
            >
              {config.message}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'stickers' ? 'interaction' : 'stickers')}
            aria-label={viewMode === 'stickers' ? '关闭贴纸面板' : '打开贴纸面板'}
            aria-pressed={viewMode === 'stickers'}
            className="fx-icon-btn flex h-10 w-10 shrink-0 items-center justify-center text-brand-accent"
          >
            <Sparkles className="h-5 w-5" />
          </button>
        </div>
        <span className="fx-header-line" />
      </header>

      <main className="relative min-h-0 flex-1 overflow-hidden">
        <PetCanvas ref={canvasRef} />
        <StageFX />

        <div className="pointer-events-none absolute left-4 top-3 z-[6] font-display text-[8px] uppercase tracking-[0.28em] text-text-muted/60">
          MOOD // {config.label}
        </div>
        <div className="pointer-events-none absolute right-4 top-3 z-[6] font-display text-[8px] uppercase tracking-[0.28em] text-brand-accent/60">
          SIGNAL 98%
        </div>
      </main>

      <HUD />

      <StickerPanel canvasRef={canvasRef} />
    </div>
  );
}
