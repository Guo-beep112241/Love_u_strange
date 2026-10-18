import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { Drumstick, Hand, Zap } from 'lucide-react';
import { useHomeStore } from '../prototype/src/stores/home.store';
import { MOOD_CONFIG, MOOD_ORDER, type MoodId } from '../prototype/src/utils/theme';

const LONG_PRESS_MS = 800;

export function HUD() {
  const mood = useHomeStore((state) => state.mood);
  const setMood = useHomeStore((state) => state.setMood);
  const moodValue = useHomeStore((state) => state.moodValue);
  const squish = useHomeStore((state) => state.squish);
  const feed = useHomeStore((state) => state.feed);
  const triggerCrazyMode = useHomeStore((state) => state.triggerCrazyMode);

  const [holding, setHolding] = useState(false);
  const [hint, setHint] = useState('');

  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFired = useRef(false);

  const safeMoodValue = Number.isFinite(moodValue)
    ? Math.max(0, Math.min(100, moodValue))
    : 0;

  useEffect(() => {
    return () => {
      if (pressTimer.current) clearTimeout(pressTimer.current);
      if (hintTimer.current) clearTimeout(hintTimer.current);
    };
  }, []);

  const showHint = (message: string) => {
    setHint(message);
    if (hintTimer.current) clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setHint(''), 1800);
  };

  const clearPressTimer = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const handleCrazyDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Pointer capture is best-effort.
    }
    longPressFired.current = false;
    setHolding(true);
    clearPressTimer();
    pressTimer.current = setTimeout(() => {
      longPressFired.current = true;
      setHolding(false);
      triggerCrazyMode();
      showHint('发疯模式 · 2 秒');
      try {
        navigator.vibrate?.(30);
      } catch {
        // Vibration is optional.
      }
    }, LONG_PRESS_MS);
  };

  const handleCrazyEnd = () => {
    clearPressTimer();
    setHolding(false);
  };

  const handleCrazyClick = () => {
    if (longPressFired.current) {
      longPressFired.current = false;
      return;
    }
    squish();
    showHint('长按 0.8 秒进入发疯模式');
  };

  return (
    <div
      data-no-swipe
      className="fx-hud relative z-10 h-[22dvh] min-h-[164px] max-h-[220px] w-full shrink-0 overflow-hidden pb-safe before:pointer-events-none before:absolute before:inset-0 before:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuODUiIG51bU9jdGF2ZXM9IjMiIHN0aXRjaFRpbGVzPSJzdGl0Y2giLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWx0ZXI9InVybCgjbm9pc2UpIi8+PC9zdmc+')] before:opacity-[0.05]"
    >
      <div className="relative flex h-full flex-col justify-evenly px-4">
        <div className="no-scrollbar flex justify-between gap-2 overflow-x-auto py-1">
          {MOOD_ORDER.map((key: MoodId) => {
            const config = MOOD_CONFIG[key];
            const active = mood === key;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={active}
                onClick={() => setMood(key)}
                className={`fx-pill flex-none whitespace-nowrap border px-3 py-1.5 font-zh text-caption uppercase tracking-wider duration-150 ${
                  active
                    ? 'fx-pill-active border-brand-accent bg-brand-accent text-surface-base shadow-[0_0_8px_#a8ff3e]'
                    : 'border-border-subtle bg-transparent text-text-muted'
                }`}
              >
                {config.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <span className="shrink-0 font-zh text-[11px] text-text-muted">情绪值</span>
          <div className="h-2 flex-1 border border-border-subtle bg-surface-panel">
            <div
              className="fx-progress h-full bg-brand-accent transition-all duration-300"
              style={{ width: `${safeMoodValue}%` }}
            />
          </div>
          <span className="w-7 text-right font-mono text-[10px] text-text-muted">
            {Math.round(safeMoodValue)}
          </span>
        </div>

        <div className="flex justify-around items-center pt-1">
          <button
            type="button"
            onClick={squish}
            aria-label="戳一戳宠物"
            className="fx-action group flex flex-col items-center gap-1"
          >
            <div className="fx-action-icon flex h-12 w-12 items-center justify-center rounded-none border border-border-subtle text-text-primary transition-colors group-active:border-brand-accent group-active:bg-brand-accent group-active:text-surface-base">
              <Hand className="h-6 w-6" />
            </div>
            <span className="font-zh text-[11px] text-text-muted">戳一戳</span>
          </button>

          <button
            type="button"
            onClick={feed}
            aria-label="喂食宠物"
            className="fx-action group flex flex-col items-center gap-1"
          >
            <div className="fx-action-icon flex h-12 w-12 items-center justify-center rounded-none border border-border-subtle text-text-primary transition-colors group-active:border-brand-accent group-active:bg-brand-accent group-active:text-surface-base">
              <Drumstick className="h-6 w-6" />
            </div>
            <span className="font-zh text-[11px] text-text-muted">喂食</span>
          </button>

          <button
            type="button"
            onPointerDown={handleCrazyDown}
            onPointerUp={handleCrazyEnd}
            onPointerCancel={handleCrazyEnd}
            onPointerLeave={handleCrazyEnd}
            onClick={handleCrazyClick}
            onContextMenu={(event) => event.preventDefault()}
            aria-label="长按 0.8 秒进入发疯模式"
            className="fx-action group flex select-none flex-col items-center gap-1 [-webkit-touch-callout:none]"
            style={{ touchAction: 'manipulation' }}
          >
            <div className="fx-action-icon relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-none border border-brand-toxic text-brand-toxic shadow-[2px_2px_0px_#ff4dc4] transition-colors group-active:translate-x-[2px] group-active:translate-y-[2px] group-active:border-brand-toxic group-active:bg-brand-toxic group-active:text-surface-base group-active:shadow-[0px_0px_0px_#ff4dc4]">
              <Zap className="h-6 w-6" />
              <span
                aria-hidden
                className={`fx-hold absolute bottom-0 left-0 h-[3px] transition-[width] ${
                  holding ? 'w-full duration-[800ms]' : 'w-0 duration-150'
                }`}
              />
            </div>
            <span className="max-w-[92px] truncate font-zh text-[11px] font-bold text-brand-toxic">
              {hint || '发疯'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
