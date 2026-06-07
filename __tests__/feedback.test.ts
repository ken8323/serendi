import { computePreferences, loadFeedbackLog, recordFeedback } from '@/lib/feedback'
import type { FeedbackEntry } from '@/lib/types'

beforeEach(() => {
  localStorage.clear()
})

describe('feedback - storage', () => {
  it('returns empty array when nothing stored', () => {
    expect(loadFeedbackLog()).toEqual([])
  })

  it('records a feedback entry', () => {
    recordFeedback({ sheetId: 's1', category: 'A', rating: 'like' })
    const log = loadFeedbackLog()
    expect(log).toHaveLength(1)
    expect(log[0]).toMatchObject({ sheetId: 's1', category: 'A', rating: 'like' })
  })

  it('replaces existing entry for the same sheetId', () => {
    recordFeedback({ sheetId: 's1', category: 'A', rating: 'like' })
    recordFeedback({ sheetId: 's1', category: 'A', rating: 'dislike' })
    const log = loadFeedbackLog()
    expect(log).toHaveLength(1)
    expect(log[0].rating).toBe('dislike')
  })

  it('caps the log at 100 entries, dropping oldest', () => {
    let now = 1000
    jest.spyOn(Date, 'now').mockImplementation(() => now)
    for (let i = 0; i < 105; i++) {
      now = 1000 + i
      recordFeedback({ sheetId: `s${i}`, category: 'A', rating: 'like' })
    }
    const log = loadFeedbackLog()
    expect(log).toHaveLength(100)
    expect(log.find(e => e.sheetId === 's0')).toBeUndefined()
    expect(log.find(e => e.sheetId === 's104')).toBeDefined()
    ;(Date.now as jest.Mock).mockRestore()
  })
})

describe('feedback - computePreferences', () => {
  function entry(overrides: Partial<FeedbackEntry>): FeedbackEntry {
    return {
      sheetId: 's',
      category: 'A',
      rating: 'like',
      createdAt: Date.now(),
      ...overrides,
    }
  }

  it('returns empty arrays when log is empty', () => {
    expect(computePreferences([])).toEqual({ liked_categories: [], disliked_categories: [] })
  })

  it('returns top 3 liked categories by count', () => {
    const log: FeedbackEntry[] = [
      entry({ sheetId: '1', category: 'A', rating: 'like' }),
      entry({ sheetId: '2', category: 'A', rating: 'like' }),
      entry({ sheetId: '3', category: 'B', rating: 'like' }),
      entry({ sheetId: '4', category: 'C', rating: 'like' }),
      entry({ sheetId: '5', category: 'D', rating: 'like' }),
    ]
    const prefs = computePreferences(log)
    expect(prefs.liked_categories).toEqual(['A', 'B', 'C'])
  })

  it('flags dislike only when 2+ within recent 20 entries', () => {
    const log: FeedbackEntry[] = [
      entry({ sheetId: '1', category: 'X', rating: 'dislike', createdAt: 100 }),
      entry({ sheetId: '2', category: 'X', rating: 'dislike', createdAt: 200 }),
      entry({ sheetId: '3', category: 'Y', rating: 'dislike', createdAt: 300 }),
    ]
    const prefs = computePreferences(log)
    expect(prefs.disliked_categories).toContain('X')
    expect(prefs.disliked_categories).not.toContain('Y')
  })

  it('ignores dislikes outside the recent 20-entry window', () => {
    const log: FeedbackEntry[] = []
    // 2 old dislikes for "OLD"
    log.push(entry({ sheetId: 'o1', category: 'OLD', rating: 'dislike', createdAt: 1 }))
    log.push(entry({ sheetId: 'o2', category: 'OLD', rating: 'dislike', createdAt: 2 }))
    // 20 newer likes pushing old dislikes out of the recent window
    for (let i = 0; i < 20; i++) {
      log.push(entry({ sheetId: `n${i}`, category: 'NEW', rating: 'like', createdAt: 100 + i }))
    }
    const prefs = computePreferences(log)
    expect(prefs.disliked_categories).not.toContain('OLD')
  })

  it('ignores "unknown" category in both directions', () => {
    const log: FeedbackEntry[] = [
      entry({ sheetId: '1', category: 'unknown', rating: 'like' }),
      entry({ sheetId: '2', category: 'unknown', rating: 'dislike', createdAt: 10 }),
      entry({ sheetId: '3', category: 'unknown', rating: 'dislike', createdAt: 20 }),
    ]
    const prefs = computePreferences(log)
    expect(prefs.liked_categories).not.toContain('unknown')
    expect(prefs.disliked_categories).not.toContain('unknown')
  })
})
