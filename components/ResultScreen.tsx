'use client'

import { Button } from '@/components/ui/button'
import type { Sheet } from '@/lib/types'

type Props = {
  sheet: Sheet
  isSaved: boolean
  onSave: () => void
  onRedraw: () => void
  onBack: () => void
}

export default function ResultScreen({ sheet, isSaved, onSave, onRedraw, onBack }: Props) {
  return (
    <div className="min-h-screen flex flex-col px-8 py-10 max-w-lg mx-auto">
      <div className="flex justify-between items-center mb-9">
        <button
          onClick={onBack}
          className="text-xs tracking-[2px] font-bold text-gray-300"
        >
          ← BACK
        </button>
        <button
          onClick={onSave}
          disabled={isSaved}
          className={`text-xs tracking-[2px] font-bold border px-3 py-2 transition-colors ${
            isSaved
              ? 'border-gray-200 text-gray-300 cursor-default'
              : 'border-black text-black hover:bg-black hover:text-white'
          }`}
        >
          {isSaved ? '★ SAVED' : '★ SAVE'}
        </button>
      </div>

      <p className="text-xs tracking-[4px] font-bold text-gray-300 mb-2">
        UNKNOWN FIELD
      </p>
      <h1 className="text-3xl font-black tracking-tight leading-tight text-black mb-7">
        {sheet.theme}
      </h1>

      <div className="h-px bg-gray-100 mb-5" />

      <p className="text-xs tracking-[3px] font-bold text-gray-400 mb-3">ESSENCE</p>
      <p className="text-sm text-gray-600 leading-[1.9] mb-7">{sheet.summary}</p>

      <p className="text-xs tracking-[3px] font-bold text-gray-400 mb-4">3 POINTS</p>
      <div className="flex flex-col gap-4 mb-7">
        {sheet.points.map((point, i) => (
          <div key={i} className="flex gap-4">
            <span className="text-xs font-black text-black mt-0.5 min-w-[16px] border-r border-black pr-3">
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className="text-sm text-gray-600 leading-[1.8]">{point}</span>
          </div>
        ))}
      </div>

      <p className="text-xs tracking-[3px] font-bold text-gray-400 mb-3">NEXT</p>
      <div className="flex flex-wrap gap-2 mb-auto">
        {sheet.next_keywords.map((kw, i) => (
          <a
            key={i}
            href={`https://www.google.com/search?q=${encodeURIComponent(kw)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 border border-gray-200 px-3 py-1.5 tracking-wide hover:border-black hover:text-black transition-colors"
          >
            {kw}
          </a>
        ))}
      </div>

      <div className="mt-10 pt-4 border-t border-gray-100">
        <Button
          onClick={onRedraw}
          variant="outline"
          className="w-full rounded-none border-black text-xs tracking-[3px] font-bold h-12 hover:bg-black hover:text-white transition-colors"
        >
          ↻ DRAW AGAIN
        </Button>
      </div>
    </div>
  )
}
