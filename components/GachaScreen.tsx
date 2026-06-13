'use client'

import Link from 'next/link'
import { MOODS } from '@/lib/moods'

type Props = {
  isLoading: boolean
  selectedMood: string
  onMoodChange: (key: string) => void
  onDraw: () => void
  onEditProfile: () => void
}

export default function GachaScreen({
  isLoading,
  selectedMood,
  onMoodChange,
  onDraw,
  onEditProfile,
}: Props) {
  return (
    <div className="min-h-screen flex flex-col px-8 py-12 max-w-lg mx-auto">
      <div className="flex justify-between items-baseline mb-20">
        <span className="text-lg font-black tracking-tight text-black">Serendi</span>
        <div className="flex gap-5">
          <button
            onClick={onEditProfile}
            className="text-xs tracking-[3px] font-bold text-gray-300 border-b border-gray-200 pb-0.5"
          >
            PROFILE
          </button>
          <Link
            href="/collection"
            className="text-xs tracking-[3px] font-bold text-gray-300 border-b border-gray-200 pb-0.5"
          >
            COLLECTION
          </Link>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-7">
        <p className="text-xs tracking-[4px] font-bold text-gray-300">UNKNOWN FIELD</p>
        <h2 className="text-5xl font-black tracking-tighter leading-[1.05] text-black">
          知らない<br />世界を、<br />引く。
        </h2>
        <p className="text-sm text-gray-400 leading-[1.9] max-w-[260px] border-l-2 border-black pl-4">
          あなたが一生検索しないような未知の領域を、AIが1枚のカードに凝縮します。
        </p>

        <div>
          <p className="text-xs tracking-[3px] font-bold text-gray-400 mb-3">MOOD</p>
          <div className="flex flex-wrap gap-2">
            {MOODS.map(mood => {
              const active = mood.key === selectedMood
              return (
                <button
                  key={mood.key}
                  onClick={() => onMoodChange(mood.key)}
                  className={`text-xs tracking-wide font-bold border px-3 py-1.5 transition-colors ${
                    active
                      ? 'bg-black text-white border-black'
                      : 'border-gray-200 text-gray-500 hover:border-black hover:text-black'
                  }`}
                >
                  <span className="mr-1">{mood.emoji}</span>
                  {mood.label}
                </button>
              )
            })}
          </div>
        </div>

        <button
          onClick={onDraw}
          disabled={isLoading}
          className="mt-2 flex items-center justify-between bg-black text-white px-6 py-5 text-xs tracking-[3px] font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
        >
          {isLoading ? (
            <>
              <span>DRAWING</span>
              <span className="inline-block animate-spin text-lg">◌</span>
            </>
          ) : (
            <>
              <span>DRAW</span>
              <span className="text-lg font-light">→</span>
            </>
          )}
        </button>
      </div>

      <p className="text-center text-xs tracking-[2px] text-gray-200 mt-8">
        SWIPE UP TO VIEW COLLECTION
      </p>
    </div>
  )
}
