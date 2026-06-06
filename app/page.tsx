'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import SetupScreen from '@/components/SetupScreen'
import GachaScreen from '@/components/GachaScreen'
import ResultScreen from '@/components/ResultScreen'
import { getProfile, saveProfile, saveSheet } from '@/lib/storage'
import type { Screen, Sheet, UserProfile } from '@/lib/types'

export default function Home() {
  const [screen, setScreen] = useState<Screen>('gacha')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [currentSheet, setCurrentSheet] = useState<Sheet | null>(null)
  const [isSaved, setIsSaved] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

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
      const res = await fetch('/api/gacha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })
      const data = await res.json()
      if (!res.ok || !data.sheet) throw new Error(data.error ?? 'Unknown error')
      setCurrentSheet(data.sheet)
      setIsSaved(false)
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
        onSave={handleSave}
        onRedraw={handleRedraw}
        onBack={() => setScreen('gacha')}
      />
    )
  }

  return <GachaScreen isLoading={isLoading} onDraw={handleDraw} onEditProfile={() => setScreen('setup')} />
}
