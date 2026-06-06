'use client'

import Link from 'next/link'

type Props = {
  isLoading: boolean
  onDraw: () => void
}

export default function GachaScreen({ isLoading, onDraw }: Props) {
  return (
    <div className="min-h-screen flex flex-col px-6 py-10 max-w-sm mx-auto">
      <div className="flex justify-between items-baseline mb-16">
        <span className="text-base font-black tracking-tight text-black">Serendi</span>
        <Link
          href="/collection"
          className="text-[8px] tracking-[3px] font-bold text-gray-300 border-b border-gray-200 pb-0.5"
        >
          COLLECTION
        </Link>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-6">
        <p className="text-[8px] tracking-[4px] font-bold text-gray-300">UNKNOWN FIELD</p>
        <h2 className="text-4xl font-black tracking-tighter leading-[1.05] text-black">
          知らない<br />世界を、<br />引く。
        </h2>
        <p className="text-[10px] text-gray-400 leading-[1.8] max-w-[200px] border-l-2 border-black pl-3">
          あなたが一生検索しないような未知の領域を、AIが1枚のカードに凝縮します。
        </p>

        <button
          onClick={onDraw}
          disabled={isLoading}
          className="mt-2 flex items-center justify-between bg-black text-white px-5 py-4 text-[10px] tracking-[3px] font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors"
        >
          {isLoading ? (
            <>
              <span>DRAWING</span>
              <span className="inline-block animate-spin text-base">◌</span>
            </>
          ) : (
            <>
              <span>DRAW</span>
              <span className="text-base font-light">→</span>
            </>
          )}
        </button>
      </div>

      <p className="text-center text-[8px] tracking-[2px] text-gray-200 mt-8">
        SWIPE UP TO VIEW COLLECTION
      </p>
    </div>
  )
}
