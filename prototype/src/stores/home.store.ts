import { create } from 'zustand';
import { DEFAULT_MOOD, isMoodId, type MoodId } from '../utils/theme';

export type Mood = MoodId;
export type ViewMode = 'interaction' | 'stickers';
export type StickerKind = 'png' | 'gif';

export interface Sticker {
  id: string;
  dataUrl: string;
  mood: Mood;
  createdAt: number;
  kind?: StickerKind;
  mime?: string;
  caption?: string;
}

interface HomeState {
  mood: Mood;
  viewMode: ViewMode;
  stickers: Sticker[];
  crazyMode: boolean;
  modelReady: boolean;
  moodValue: number;
  squishImpulse: number;
  feedTrigger: number;
  setMood: (mood: Mood) => void;
  setViewMode: (mode: ViewMode) => void;
  addSticker: (sticker: Omit<Sticker, 'id' | 'createdAt'>) => void;
  removeSticker: (id: string) => void;
  clearStickers: () => void;
  triggerCrazyMode: () => void;
  setModelReady: (ready: boolean) => void;
  squish: () => void;
  feed: () => void;
}

const STORAGE_KEY = 'weird-pet:stickers:v1';
const MAX_STICKERS = 8;
const CRAZY_DURATION_MS = 2000;

let crazyTimer: ReturnType<typeof setTimeout> | null = null;

function clearCrazyTimer() {
  if (crazyTimer !== null) {
    clearTimeout(crazyTimer);
    crazyTimer = null;
  }
}

function isSticker(value: unknown): value is Sticker {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === 'string' &&
    typeof record.dataUrl === 'string' &&
    record.dataUrl.startsWith('data:image/') &&
    isMoodId(record.mood) &&
    typeof record.createdAt === 'number'
  );
}

function loadStickers(): Sticker[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isSticker).slice(0, MAX_STICKERS);
  } catch {
    return [];
  }
}

function persistStickers(stickers: Sticker[]): void {
  if (typeof window === 'undefined') return;
  const limits = [Math.min(stickers.length, MAX_STICKERS), 4, 2, 1];
  for (const limit of limits) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stickers.slice(0, limit)));
      return;
    } catch {
      // Quota exceeded or private mode; try a smaller payload.
    }
  }
}

function createId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch {
    // Fall through to the timestamp id.
  }
  return `s_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

export const useHomeStore = create<HomeState>((set, get) => ({
  mood: DEFAULT_MOOD,
  viewMode: 'interaction',
  stickers: loadStickers(),
  crazyMode: false,
  modelReady: false,
  moodValue: 50,
  squishImpulse: 0,
  feedTrigger: 0,

  setMood: (mood) => {
    if (!isMoodId(mood)) return;
    clearCrazyTimer();
    set({ mood, crazyMode: false });
  },

  setViewMode: (mode) => set({ viewMode: mode }),

  addSticker: (sticker) => {
    if (!isMoodId(sticker.mood)) return;
    const kind: StickerKind = sticker.kind === 'gif' ? 'gif' : 'png';
    const next: Sticker = {
      ...sticker,
      id: createId(),
      createdAt: Date.now(),
      kind,
      mime: sticker.mime || (kind === 'gif' ? 'image/gif' : 'image/png'),
    };
    const stickers = [next, ...get().stickers].slice(0, MAX_STICKERS);
    persistStickers(stickers);
    set({ stickers });
  },

  removeSticker: (id) => {
    const stickers = get().stickers.filter((sticker) => sticker.id !== id);
    persistStickers(stickers);
    set({ stickers });
  },

  clearStickers: () => {
    persistStickers([]);
    set({ stickers: [] });
  },

  setModelReady: (ready) => set({ modelReady: ready }),

  triggerCrazyMode: () => {
    clearCrazyTimer();
    set({ crazyMode: true });
    crazyTimer = setTimeout(() => {
      crazyTimer = null;
      set({ crazyMode: false });
    }, CRAZY_DURATION_MS);
  },

  squish: () =>
    set((state) => ({
      squishImpulse: state.squishImpulse + 1,
      moodValue: Math.min(100, state.moodValue + 2),
    })),

  feed: () =>
    set((state) => ({
      feedTrigger: state.feedTrigger + 1,
      moodValue: Math.min(100, state.moodValue + 10),
    })),
}));
