export type Mood = {
  key: string
  label: string
  emoji: string
}

export const AUTO_MOOD_KEY = 'auto'

export const MOODS: Mood[] = [
  { key: 'auto',       label: 'おまかせ',     emoji: '🎲' },
  { key: 'tech',       label: '最新テック',   emoji: '🚀' },
  { key: 'fringe',     label: '辺境文化',     emoji: '🌍' },
  { key: 'science',    label: '自然科学',     emoji: '🔬' },
  { key: 'art',        label: 'アート',       emoji: '🎨' },
  { key: 'history',    label: '古代史',       emoji: '📜' },
  { key: 'subculture', label: 'サブカル',     emoji: '👾' },
  { key: 'sports',     label: 'スポーツ',     emoji: '⚽' },
  { key: 'industry',   label: 'ニッチ産業',   emoji: '🏭' },
  { key: 'philosophy', label: '哲学・思想',   emoji: '🧠' },
  { key: 'biomed',     label: '生物・医療',   emoji: '🧬' },
  { key: 'cosmos',     label: '宇宙',         emoji: '🌌' },
  { key: 'language',   label: '言語・文字',   emoji: '🔤' },
  { key: 'craft',      label: '工芸',         emoji: '🛠' },
]

export function getMoodLabel(key: string): string | undefined {
  if (key === AUTO_MOOD_KEY) return undefined
  return MOODS.find(m => m.key === key)?.label
}
