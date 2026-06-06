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
        className="bg-white w-full max-w-sm max-h-[85vh] overflow-y-auto p-6 pb-8"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <button onClick={onClose} className="text-[8px] tracking-[2px] text-gray-300 font-bold">
            ✕ CLOSE
          </button>
          <button
            onClick={() => { onDelete(sheet.id); onClose() }}
            className="text-[8px] tracking-[2px] text-gray-400 font-bold border border-gray-200 px-2.5 py-1.5"
          >
            DELETE
          </button>
        </div>

        <p className="text-[8px] tracking-[4px] font-bold text-gray-300 mb-1.5">UNKNOWN FIELD</p>
        <h2 className="text-xl font-black tracking-tight text-black mb-5">{sheet.theme}</h2>

        <div className="h-px bg-gray-100 mb-4" />

        <p className="text-[7px] tracking-[3px] font-bold text-gray-400 mb-2">ESSENCE</p>
        <p className="text-[11px] text-gray-600 leading-[1.8] mb-4">{sheet.summary}</p>

        <p className="text-[7px] tracking-[3px] font-bold text-gray-400 mb-2.5">3 POINTS</p>
        <div className="flex flex-col gap-2 mb-4">
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
        <div className="flex flex-wrap gap-1.5">
          {sheet.next_keywords.map((kw, i) => (
            <span key={i} className="text-[8px] text-gray-400 border border-gray-200 px-2 py-1 tracking-wide">
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
    <div className="min-h-screen px-5 py-8 max-w-sm mx-auto">
      <div className="flex justify-between items-baseline mb-10">
        <Link href="/" className="text-[8px] tracking-[2px] font-bold text-gray-300">← HOME</Link>
        <span className="text-base font-black tracking-tight text-black">Collection</span>
        <span className="text-[8px] tracking-[2px] font-bold text-gray-300">{sheets.length} saved</span>
      </div>

      {sheets.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <p className="text-[10px] tracking-[2px] text-gray-300 font-bold">NO ITEMS YET</p>
          <Link
            href="/"
            className="text-[9px] tracking-[2px] font-bold text-black border-b border-black pb-0.5"
          >
            最初のガチャを引く →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {sheets.map(sheet => (
            <button
              key={sheet.id}
              onClick={() => setSelected(sheet)}
              className="text-left border border-gray-100 p-3 hover:border-black transition-colors"
            >
              <p className="text-[7px] tracking-[2px] text-gray-300 font-bold mb-1.5">
                {formatDate(sheet.createdAt)}
              </p>
              <p className="text-[11px] font-bold text-black leading-tight mb-2">{sheet.theme}</p>
              <p className="text-[9px] text-gray-400 leading-relaxed line-clamp-2">{sheet.summary}</p>
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
