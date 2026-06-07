import {
  getProfile,
  saveProfile,
  getSheets,
  saveSheet,
  deleteSheet,
} from '@/lib/storage'
import type { Sheet, UserProfile } from '@/lib/types'

const mockProfile: UserProfile = { occupation: 'エンジニア', domain: 'Web開発' }

const makeSheet = (id: string): Sheet => ({
  id,
  theme: `テーマ${id}`,
  category: '自然科学',
  summary: 'サマリー',
  points: ['p1', 'p2', 'p3'],
  next_keywords: ['kw1', 'kw2'],
  createdAt: Date.now(),
})

describe('storage - profile', () => {
  it('returns null when no profile saved', () => {
    expect(getProfile()).toBeNull()
  })

  it('saves and retrieves a profile', () => {
    saveProfile(mockProfile)
    expect(getProfile()).toEqual(mockProfile)
  })
})

describe('storage - sheets', () => {
  it('returns empty array when no sheets saved', () => {
    expect(getSheets()).toEqual([])
  })

  it('saves and retrieves a sheet', () => {
    const sheet = makeSheet('1')
    saveSheet(sheet)
    expect(getSheets()).toContainEqual(sheet)
  })

  it('deletes a sheet by id', () => {
    const sheet = makeSheet('2')
    saveSheet(sheet)
    deleteSheet('2')
    expect(getSheets().find(s => s.id === '2')).toBeUndefined()
  })

  it('keeps at most 100 sheets, removing the oldest', () => {
    for (let i = 0; i < 101; i++) {
      saveSheet({ ...makeSheet(String(i)), createdAt: i })
    }
    const sheets = getSheets()
    expect(sheets.length).toBe(100)
    expect(sheets.find(s => s.id === '0')).toBeUndefined()
  })
})
