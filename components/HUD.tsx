import { useState, useRef } from 'react';
import { Zap, Hand, Drumstick } from 'lucide-react';
import { useHomeStore } from '../prototype/src/stores/home.store';
import { MOOD_CONFIG, MoodId } from '../prototype/src/utils/theme';

export function HUD() {
  const mood = useHomeStore(s => s.mood);
  const setMood = useHomeStore(s => s.setMood);
  const moodValue = useHomeStore(s => s.moodValue);
  const squish = useHomeStore(s => s.squish);
  const feed = useHomeStore(s => s.feed);
  const triggerCrazyMode = useHomeStore(s => s.triggerCrazyMode);
  const viewMode = useHomeStore(s => s.viewMode);
  
  const crazyPressTimer = useRef<NodeJS.Timeout | null>(null);

  const handleCrazyDown = () => {
    crazyPressTimer.current = setTimeout(() => {
      triggerCrazyMode();
    }, 800);
  };

  const handleCrazyUp = () => {
    if (crazyPressTimer.current) {
      clearTimeout(crazyPressTimer.current);
    }
  };

  return (
    <div className="absolute bottom-0 left-0 w-full h-[22vh] bg-[rgba(10,10,15,0.95)] border-t border-brand-accent pb-safe z-10 before:absolute before:inset-0 before:opacity-[0.05] before:pointer-events-none before:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuODUiIG51bU9jdGF2ZXM9IjMiIHN0aXRjaFRpbGVzPSJzdGl0Y2giLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWx0ZXI9InVybCgjbm9pc2UpIi8+PC9zdmc+')]">
      <div className="relative h-full flex flex-col justify-evenly px-4">
        
        {/* Row 1: Mood Pills */}
        <div className="flex justify-between gap-2 overflow-x-auto no-scrollbar py-1">
          {(Object.entries(MOOD_CONFIG) as [MoodId, typeof MOOD_CONFIG[MoodId]][]).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setMood(key)}
              className={`flex-none px-3 py-1.5 font-zh text-caption uppercase tracking-wider transition-all duration-150 border whitespace-nowrap
                ${mood === key 
                  ? 'bg-brand-accent text-surface-base border-brand-accent shadow-[0_0_8px_#a8ff3e]' 
                  : 'bg-transparent text-text-muted border-border-subtle'}`}
            >
              {config.label}
            </button>
          ))}
        </div>

        {/* Row 2: Progress */}
        <div className="flex items-center gap-3">
          <span className="font-zh text-caption text-text-muted">情绪值</span>
          <div className="flex-1 h-2 bg-surface-panel border border-border-subtle">
            <div 
              className="h-full bg-brand-accent transition-all duration-300 shadow-[0_0_4px_#a8ff3e]"
              style={{ width: `${moodValue}%` }}
            />
          </div>
        </div>

        {/* Row 3: Interactions */}
        <div className="flex justify-around items-center pt-2">
          <button 
            onClick={squish}
            className="flex flex-col items-center gap-1 group"
          >
            <div className="w-12 h-12 rounded-none border border-border-subtle flex items-center justify-center text-text-primary group-active:bg-brand-accent group-active:text-surface-base group-active:border-brand-accent transition-colors">
              <Hand className="w-6 h-6" />
            </div>
            <span className="font-zh text-[10px] text-text-muted">戳一戳</span>
          </button>
          
          <button 
            onClick={feed}
            className="flex flex-col items-center gap-1 group"
          >
            <div className="w-12 h-12 rounded-none border border-border-subtle flex items-center justify-center text-text-primary group-active:bg-brand-accent group-active:text-surface-base group-active:border-brand-accent transition-colors">
              <Drumstick className="w-6 h-6" />
            </div>
            <span className="font-zh text-[10px] text-text-muted">喂食</span>
          </button>

          <button 
            onPointerDown={handleCrazyDown}
            onPointerUp={handleCrazyUp}
            onPointerLeave={handleCrazyUp}
            className="flex flex-col items-center gap-1 group"
          >
            <div className="w-12 h-12 rounded-none border border-brand-toxic flex items-center justify-center text-brand-toxic group-active:bg-brand-toxic group-active:text-surface-base transition-colors shadow-[2px_2px_0px_#ff4dc4] group-active:shadow-[0px_0px_0px_#ff4dc4] group-active:translate-y-[2px] group-active:translate-x-[2px]">
              <Zap className="w-6 h-6" />
            </div>
            <span className="font-zh text-[10px] text-brand-toxic font-bold">发疯</span>
          </button>
        </div>

      </div>
    </div>
  );
}