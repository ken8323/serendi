'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { UserProfile } from '@/lib/types'

type Props = {
  onComplete: (profile: UserProfile) => void
  initialProfile?: UserProfile
  onBack?: () => void
}

export default function SetupScreen({ onComplete, initialProfile, onBack }: Props) {
  const [occupation, setOccupation] = useState(initialProfile?.occupation ?? '')
  const [domain, setDomain] = useState(initialProfile?.domain ?? '')

  const isEditing = !!initialProfile
  const canSubmit = occupation.trim().length > 0 && domain.trim().length > 0

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    onComplete({ occupation: occupation.trim(), domain: domain.trim() })
  }

  return (
    <div className="min-h-screen flex flex-col justify-center px-8 py-16 max-w-lg mx-auto">
      <div className="mb-14">
        {isEditing && onBack && (
          <button
            onClick={onBack}
            className="text-xs tracking-[2px] font-bold text-gray-300 mb-10 block"
          >
            ← BACK
          </button>
        )}
        <p className="text-xs tracking-[4px] text-gray-300 font-bold mb-4">SERENDI</p>
        <h1 className="text-4xl font-black tracking-tight leading-tight text-black">
          {isEditing ? 'プロフィールを\n編集する' : 'あなたについて\n教えてください'}
        </h1>
        <p className="mt-5 text-sm text-gray-400 leading-relaxed">
          AIがあなたの日常から遠い未知の領域を選ぶために使います。
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-10">
        <div className="flex flex-col gap-3">
          <label className="text-xs tracking-[4px] font-bold text-gray-400">OCCUPATION</label>
          <input
            type="text"
            placeholder="例: Webデザイナー、営業、学生..."
            value={occupation}
            onChange={e => setOccupation(e.target.value)}
            className="border-b border-gray-200 pb-3 text-base text-black placeholder-gray-300 outline-none focus:border-black transition-colors bg-transparent"
          />
        </div>

        <div className="flex flex-col gap-3">
          <label className="text-xs tracking-[4px] font-bold text-gray-400">DOMAIN</label>
          <input
            type="text"
            placeholder="例: マーケティング、医療、音楽..."
            value={domain}
            onChange={e => setDomain(e.target.value)}
            className="border-b border-gray-200 pb-3 text-base text-black placeholder-gray-300 outline-none focus:border-black transition-colors bg-transparent"
          />
        </div>

        <Button
          type="submit"
          disabled={!canSubmit}
          className="mt-4 bg-black text-white rounded-none text-xs tracking-[3px] font-bold h-14 hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          {isEditing ? 'SAVE →' : 'START →'}
        </Button>
      </form>
    </div>
  )
}
