import { create } from 'zustand';

export type Mood = 'lie' | 'crazy' | 'slump' | 'breakdown' | 'speechless';
export type ViewMode = 'interaction' | 'stickers';

export interface Sticker {
  id: string;
  dataUrl: string;
  mood: Mood;
  createdAt: number;
}

interface HomeState {
  mood: Mood;
  viewMode: ViewMode;
  stickers: Sticker[];
  crazyMode: boolean;
  moodValue: number;
  squishImpulse: number;
  feedTrigger: number;
  setMood: (mood: Mood) => void;
  setViewMode: (mode: ViewMode) => void;
  addSticker: (sticker: Omit<Sticker, 'id' | 'createdAt'>) => void;
  triggerCrazyMode: () => void;
  squish: () => void;
  feed: () => void;
}

export const useHomeStore = create<HomeState>((set) => ({
  mood: 'slump',
  viewMode: 'interaction',
  stickers: [],
  crazyMode: false,
  moodValue: 50,
  squishImpulse: 0,
  feedTrigger: 0,
  setMood: (mood) => set({ mood }),
  setViewMode: (mode) => set({ viewMode: mode }),
  addSticker: (sticker) => set((state) => ({
    stickers: [
      { ...sticker, id: `s_${Date.now()}_${Math.random()}`, createdAt: Date.now() },
      ...state.stickers
    ]
  })),
  triggerCrazyMode: () => {
    set({ crazyMode: true });
    setTimeout(() => {
      set({ crazyMode: false });
    }, 3000);
  },
  squish: () => set((state) => ({ squishImpulse: state.squishImpulse + 1 })),
  feed: () => set((state) => ({ 
    feedTrigger: state.feedTrigger + 1,
    moodValue: Math.min(100, state.moodValue + 10)
  })),
}));