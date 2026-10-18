export const MOOD_CONFIG = {
  lie: {
    id: 'lie',
    label: '躺平',
    message: '当前状态：躺平中 😑',
    color: '#c8c5b0', // dirty cream
    emissive: '#a8a080',
  },
  crazy: {
    id: 'crazy',
    label: '发疯',
    message: '当前状态：发疯中 ⚡',
    color: '#1a1a1a', // dark
    emissive: '#a8ff3e', // acid green
  },
  slump: {
    id: 'slump',
    label: '摆烂',
    message: '当前状态：摆烂中 💀',
    color: '#4a4a4a', // dirty gray
    emissive: '#7b2fff', // dirty purple
  },
  breakdown: {
    id: 'breakdown',
    label: '破防',
    message: '当前状态：破防了 🥀',
    color: '#3a1a2a',
    emissive: '#ff4dc4', // toxic pink
  },
  speechless: {
    id: 'speechless',
    label: '无语',
    message: '当前状态：无语…… 🫠',
    color: '#2a2a2a',
    emissive: '#4a9eff', // cold blue
  }
} as const;

export type MoodId = keyof typeof MOOD_CONFIG;