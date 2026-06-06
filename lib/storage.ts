import type { Sheet, UserProfile } from '@/lib/types'

const KEYS = {
  profile: 'serendi_profile',
  sheets: 'serendi_sheets',
} as const

export function getProfile(): UserProfile | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(KEYS.profile)
  return raw ? JSON.parse(raw) : null
}

export function saveProfile(profile: UserProfile): void {
  localStorage.setItem(KEYS.profile, JSON.stringify(profile))
}

export function getSheets(): Sheet[] {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(KEYS.sheets)
  return raw ? JSON.parse(raw) : []
}

export function saveSheet(sheet: Sheet): void {
  let sheets = getSheets()
  sheets = [sheet, ...sheets]
  if (sheets.length > 100) {
    sheets = sheets.sort((a, b) => b.createdAt - a.createdAt).slice(0, 100)
  }
  localStorage.setItem(KEYS.sheets, JSON.stringify(sheets))
}

export function deleteSheet(id: string): void {
  const sheets = getSheets().filter(s => s.id !== id)
  localStorage.setItem(KEYS.sheets, JSON.stringify(sheets))
}
