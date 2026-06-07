export type Sheet = {
  id: string
  theme: string
  category: string
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

export type FeedbackRating = 'like' | 'dislike'

export type FeedbackEntry = {
  sheetId: string
  category: string
  rating: FeedbackRating
  createdAt: number
}

export type Preferences = {
  liked_categories: string[]
  disliked_categories: string[]
}
