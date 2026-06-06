'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getSheets, deleteSheet } from '@/lib/storage'
import type { Sheet } from '@/lib/types'

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })
}

function SheetModal({ sheet, onClose, onDelete }: {
  sheet: Sheet
  onClose: () => void
  onDelete: (id: string) => void
}) {
  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-lg max-h-[85vh] overflow-y-auto p-8 pb-10"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-7">
          <button onClick={onClose} className="text-xs tracking-[2px] text-gray-300 font-bold">
            ✕ CLOSE
          </button>
          <button
            onClick={() => { onDelete(sheet.id); onClose() }}
            className="text-xs tracking-[2px] text-gray-400 font-bold border border-gray-200 px-3 py-2"
          >
            DELETE
          </button>
        </div>

        <p className="text-xs tracking-[4px] font-bold text-gray-300 mb-2">UNKNOWN FIELD</p>
        <h2 className="text-2xl font-black tracking-tight text-black mb-6">{sheet.theme}</h2>

        <div className="h-px bg-gray-100 mb-5" />

        <p className="text-xs tracking-[3px] font-bold text-gray-400 mb-3">ESSENCE</p>
        <p className="text-sm text-gray-600 leading-[1.9] mb-6">{sheet.summary}</p>

        <p className="text-xs tracking-[3px] font-bold text-gray-400 mb-3">3 POINTS</p>
        <div className="flex flex-col gap-3 mb-6">
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
        <div className="flex flex-wrap gap-2">
          {sheet.next_keywords.map((kw, i) => (
            <span key={i} className="text-xs text-gray-400 border border-gray-200 px-3 py-1.5 tracking-wide">
              {kw}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function CollectionPage() {
  const [sheets, setSheets] = useState<Sheet[]>([])
  const [selected, setSelected] = useState<Sheet | null>(null)

  useEffect(() => {
    setSheets(getSheets())
  }, [])

  function handleDelete(id: string) {
    deleteSheet(id)
    setSheets(prev => prev.filter(s => s.id !== id))
  }

  return (
    <div className="min-h-screen px-8 py-10 max-w-lg mx-auto">
      <div className="flex justify-between items-baseline mb-12">
        <Link href="/" className="text-xs tracking-[2px] font-bold text-gray-300">← HOME</Link>
        <span className="text-lg font-black tracking-tight text-black">Collection</span>
        <span className="text-xs tracking-[2px] font-bold text-gray-300">{sheets.length} saved</span>
      </div>

      {sheets.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-5">
          <p className="text-xs tracking-[2px] text-gray-300 font-bold">NO ITEMS YET</p>
          <Link
            href="/"
            className="text-sm tracking-[2px] font-bold text-black border-b border-black pb-0.5"
          >
            最初のガチャを引く →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {sheets.map(sheet => (
            <button
              key={sheet.id}
              onClick={() => setSelected(sheet)}
              className="text-left border border-gray-100 p-4 hover:border-black transition-colors"
            >
              <p className="text-xs tracking-[2px] text-gray-300 font-bold mb-2">
                {formatDate(sheet.createdAt)}
              </p>
              <p className="text-sm font-bold text-black leading-tight mb-2">{sheet.theme}</p>
              <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{sheet.summary}</p>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <SheetModal
          sheet={selected}
          onClose={() => setSelected(null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
