import type { FeedbackEntry, FeedbackRating, Preferences } from '@/lib/types'

const KEY = 'serendi.feedback.v1'
const MAX_ENTRIES = 100
const RECENT_WINDOW = 20
const DISLIKE_THRESHOLD = 2
const LIKED_TOP_N = 3

export function loadFeedbackLog(): FeedbackEntry[] {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveFeedbackLog(log: FeedbackEntry[]): void {
  localStorage.setItem(KEY, JSON.stringify(log))
}

export function recordFeedback(params: {
  sheetId: string
  category: string
  rating: FeedbackRating
}): FeedbackEntry[] {
  const { sheetId, category, rating } = params
  const log = loadFeedbackLog().filter(e => e.sheetId !== sheetId)
  log.push({ sheetId, category, rating, createdAt: Date.now() })
  log.sort((a, b) => b.createdAt - a.createdAt)
  const trimmed = log.slice(0, MAX_ENTRIES)
  saveFeedbackLog(trimmed)
  return trimmed
}

export function computePreferences(log: FeedbackEntry[]): Preferences {
  const sorted = [...log].sort((a, b) => b.createdAt - a.createdAt)

  const likeCounts = new Map<string, number>()
  for (const e of sorted) {
    if (e.rating !== 'like') continue
    if (e.category === 'unknown') continue
    likeCounts.set(e.category, (likeCounts.get(e.category) ?? 0) + 1)
  }
  const liked_categories = [...likeCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, LIKED_TOP_N)
    .map(([cat]) => cat)

  const recent = sorted.slice(0, RECENT_WINDOW)
  const dislikeCounts = new Map<string, number>()
  for (const e of recent) {
    if (e.rating !== 'dislike') continue
    if (e.category === 'unknown') continue
    dislikeCounts.set(e.category, (dislikeCounts.get(e.category) ?? 0) + 1)
  }
  const disliked_categories = [...dislikeCounts.entries()]
    .filter(([, n]) => n >= DISLIKE_THRESHOLD)
    .map(([cat]) => cat)

  return { liked_categories, disliked_categories }
}
