'use client'

import { useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import type { Sheet } from '@/lib/types'

type Props = {
  sheet: Sheet
}

export default function ShareCard({ sheet }: Props) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isSharing, setIsSharing] = useState(false)

  async function handleShare() {
    if (!cardRef.current || isSharing) return
    setIsSharing(true)
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 2 })
      const blob = await (await fetch(dataUrl)).blob()
      const file = new File([blob], `serendi-${sheet.id}.png`, { type: 'image/png' })

      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: sheet.theme })
        } catch (e) {
          if (e instanceof Error && e.name !== 'AbortError') throw e
        }
      } else {
        const a = document.createElement('a')
        a.href = dataUrl
        a.download = `serendi-${sheet.id}.png`
        a.click()
      }
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 画像化対象のカード */}
      <div
        ref={cardRef}
        className="bg-white p-8 border border-gray-100"
        style={{ width: 360, fontFamily: 'sans-serif' }}
      >
        <p style={{ fontSize: 9, letterSpacing: 4, fontWeight: 700, color: '#d1d5db', marginBottom: 8 }}>
          UNKNOWN FIELD — SERENDI
        </p>
        <h2 style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.5, color: '#000', marginBottom: 16, lineHeight: 1.2 }}>
          {sheet.theme}
        </h2>
        <div style={{ height: 1, background: '#f3f4f6', marginBottom: 14 }} />
        <p style={{ fontSize: 9, letterSpacing: 3, fontWeight: 700, color: '#9ca3af', marginBottom: 8 }}>ESSENCE</p>
        <p style={{ fontSize: 11, color: '#4b5563', lineHeight: 1.8, marginBottom: 16 }}>{sheet.summary}</p>
        <p style={{ fontSize: 9, letterSpacing: 3, fontWeight: 700, color: '#9ca3af', marginBottom: 10 }}>3 POINTS</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {sheet.points.map((point, i) => (
            <div key={i} style={{ display: 'flex', gap: 12 }}>
              <span style={{ fontSize: 9, fontWeight: 900, color: '#000', borderRight: '1px solid #000', paddingRight: 10, minWidth: 14 }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span style={{ fontSize: 10, color: '#4b5563', lineHeight: 1.7 }}>{point}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {sheet.next_keywords.map((kw, i) => (
            <span key={i} style={{ fontSize: 9, color: '#9ca3af', border: '1px solid #e5e7eb', padding: '4px 10px' }}>
              {kw}
            </span>
          ))}
        </div>
      </div>

      <button
        onClick={handleShare}
        disabled={isSharing}
        className="flex items-center justify-between bg-black text-white px-6 py-4 text-xs tracking-[3px] font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
      >
        <span>{isSharing ? 'SHARING...' : 'SHARE'}</span>
        <span className="text-base font-light">↑</span>
      </button>
    </div>
  )
}
