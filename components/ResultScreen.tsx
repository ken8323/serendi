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
    <div className="min-h-screen flex flex-col px-6 py-8 max-w-sm mx-auto">
      <div className="flex justify-between items-center mb-7">
        <button
          onClick={onBack}
          className="text-[8px] tracking-[2px] font-bold text-gray-300"
        >
          ← BACK
        </button>
        <button
          onClick={onSave}
          disabled={isSaved}
          className={`text-[8px] tracking-[2px] font-bold border px-2.5 py-1.5 transition-colors ${
            isSaved
              ? 'border-gray-200 text-gray-300 cursor-default'
              : 'border-black text-black hover:bg-black hover:text-white'
          }`}
        >
          {isSaved ? '★ SAVED' : '★ SAVE'}
        </button>
      </div>

      <p className="text-[8px] tracking-[4px] font-bold text-gray-300 mb-1.5">
        UNKNOWN FIELD
      </p>
      <h1 className="text-2xl font-black tracking-tight leading-tight text-black mb-6">
        {sheet.theme}
      </h1>

      <div className="h-px bg-gray-100 mb-4" />

      <p className="text-[7px] tracking-[3px] font-bold text-gray-400 mb-2">ESSENCE</p>
      <p className="text-[11px] text-gray-600 leading-[1.8] mb-5">{sheet.summary}</p>

      <p className="text-[7px] tracking-[3px] font-bold text-gray-400 mb-3">3 POINTS</p>
      <div className="flex flex-col gap-2.5 mb-5">
        {sheet.points.map((point, i) => (
          <div key={i} className="flex gap-3">
            <span className="text-[8px] font-black text-black mt-0.5 min-w-[14px] border-r border-black pr-2.5">
              {String(i + 1).padStart(2, '0')}
            </span>
            <span className="text-[10px] text-gray-600 leading-[1.7]">{point}</span>
          </div>
        ))}
      </div>

      <p className="text-[7px] tracking-[3px] font-bold text-gray-400 mb-2">NEXT</p>
      <div className="flex flex-wrap gap-1.5 mb-auto">
        {sheet.next_keywords.map((kw, i) => (
          <span
            key={i}
            className="text-[8px] text-gray-400 border border-gray-200 px-2 py-1 tracking-wide"
          >
            {kw}
          </span>
        ))}
      </div>

      <div className="mt-8 pt-4 border-t border-gray-100">
        <Button
          onClick={onRedraw}
          variant="outline"
          className="w-full rounded-none border-black text-[9px] tracking-[3px] font-bold h-11 hover:bg-black hover:text-white transition-colors"
        >
          ↻ DRAW AGAIN
        </Button>
      </div>
    </div>
  )
}
