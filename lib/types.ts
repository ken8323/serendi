export type Sheet = {
  id: string
  theme: string
  summary: string
  points: [string, string, string]
  next_keywords: string[]
  createdAt: number
}

export type UserProfile = {
  occupation: string
  domain: string
}

export type Screen = 'setup' | 'gacha' | 'result'
