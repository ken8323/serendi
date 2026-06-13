'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import SetupScreen from '@/components/SetupScreen'
import GachaScreen from '@/components/GachaScreen'
import ResultScreen from '@/components/ResultScreen'
import { getProfile, saveProfile, saveSheet } from '@/lib/storage'
import { computePreferences, loadFeedbackLog, recordFeedback } from '@/lib/feedback'
import { AUTO_MOOD_KEY, getMoodLabel } from '@/lib/moods'
import type { FeedbackRating, Screen, Sheet, UserProfile } from '@/lib/types'

export default function Home() {
  const [screen, setScreen] = useState<Screen>('gacha')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [currentSheet, setCurrentSheet] = useState<Sheet | null>(null)
  const [isSaved, setIsSaved] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [feedback, setFeedback] = useState<FeedbackRating | null>(null)
  const [selectedMood, setSelectedMood] = useState<string>(AUTO_MOOD_KEY)

  useEffect(() => {
    const stored = getProfile()
    if (!stored) {
      setScreen('setup')
    } else {
      setProfile(stored)
      setScreen('gacha')
    }
  }, [])

  function handleSetupComplete(p: UserProfile) {
    saveProfile(p)
    setProfile(p)
    setScreen('gacha')
  }

  async function handleDraw() {
    if (!profile) return
    setIsLoading(true)
    try {
      const preferences = computePreferences(loadFeedbackLog())
      const moodLabel = getMoodLabel(selectedMood)
      const res = await fetch('/api/gacha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...profile, preferences, mood: moodLabel }),
      })
      const data = await res.json()
      if (!res.ok || !data.sheet) throw new Error(data.error ?? 'Unknown error')
      const sheet: Sheet = moodLabel ? { ...data.sheet, mood: moodLabel } : data.sheet
      setCurrentSheet(sheet)
      setIsSaved(false)
      setFeedback(null)
      setScreen('result')
    } catch {
      toast.error('もう一度お試しください')
    } finally {
      setIsLoading(false)
    }
  }

  function handleSave() {
    if (!currentSheet || isSaved) return
    saveSheet(currentSheet)
    setIsSaved(true)
    toast.success('コレクションに保存しました')
  }

  function handleRedraw() {
    setScreen('gacha')
    handleDraw()
  }

  function handleFeedback(rating: FeedbackRating) {
    if (!currentSheet) return
    recordFeedback({
      sheetId: currentSheet.id,
      category: currentSheet.category || 'unknown',
      rating,
    })
    setFeedback(rating)
  }

  function handleRejectGenre() {
    if (!currentSheet) return
    recordFeedback({
      sheetId: currentSheet.id,
      category: currentSheet.category || 'unknown',
      rating: 'dislike',
    })
    handleRedraw()
  }

  if (screen === 'setup') {
    return (
      <SetupScreen
        onComplete={handleSetupComplete}
        initialProfile={profile ?? undefined}
        onBack={profile ? () => setScreen('gacha') : undefined}
      />
    )
  }

  if (screen === 'result' && currentSheet) {
    return (
      <ResultScreen
        sheet={currentSheet}
        isSaved={isSaved}
        feedback={feedback}
        onSave={handleSave}
        onRedraw={handleRedraw}
        onBack={() => setScreen('gacha')}
        onFeedback={handleFeedback}
        onRejectGenre={handleRejectGenre}
      />
    )
  }

  return (
    <GachaScreen
      isLoading={isLoading}
      selectedMood={selectedMood}
      onMoodChange={setSelectedMood}
      onDraw={handleDraw}
      onEditProfile={() => setScreen('setup')}
    />
  )
}
