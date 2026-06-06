# Serendi MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 「未知の領域ガチャ」アプリSerendiのMVPを構築する — ユーザーの職業・専門分野に基づきAnthropicがテーマを選定し、1画面の「まとめシート」を生成・保存できるNext.jsアプリ。

**Architecture:** `app/page.tsx` が `'setup' | 'gacha' | 'result'` の3ステートを持ち画面を切り替える。ガチャボタン押下で `/api/gacha` のRoute Handlerを経由してAnthropic APIを呼び出し、生成されたシートをlocalStorageに保存できる。コレクション画面は `/collection` の別ルート。

**Tech Stack:** Next.js 15 (App Router + TypeScript), Tailwind CSS, shadcn/ui, Anthropic SDK (`claude-3-5-haiku-20241022`), localStorage, Jest + jsdom

---

## File Map

| ファイル | 役割 |
|----------|------|
| `lib/types.ts` | `Sheet`, `UserProfile`, `Screen` 型定義 |
| `lib/storage.ts` | localStorage の読み書きユーティリティ |
| `app/api/gacha/route.ts` | Anthropic API を叩くRoute Handler |
| `app/layout.tsx` | グローバルレイアウト・フォント・Toaster |
| `app/globals.css` | Tailwindベース、モノクロームテーマ |
| `app/page.tsx` | Screen stateマシン、3画面の切り替え |
| `app/collection/page.tsx` | 保存済みシート一覧 |
| `components/SetupScreen.tsx` | ユーザープロフィール入力フォーム |
| `components/GachaScreen.tsx` | ローディングアニメーション |
| `components/ResultScreen.tsx` | 生成されたシートの表示 |
| `__tests__/storage.test.ts` | storage.ts のユニットテスト |
| `__tests__/api/gacha.test.ts` | Route Handlerのユニットテスト |
| `jest.config.ts` | Jest設定 |
| `jest.setup.ts` | テスト用セットアップ |

---

## Task 1: プロジェクト初期化

**Files:**
- Create: `package.json`（create-next-appが生成）
- Create: `.env.local`
- Create: `jest.config.ts`
- Create: `jest.setup.ts`

- [ ] **Step 1: Next.jsプロジェクトを作成**

```bash
cd /Users/kenichi/Desktop/app/Serendi
npx create-next-app@latest . --typescript --tailwind --eslint --app --no-src-dir --import-alias="@/*"
```

プロンプトが出た場合はすべて `No` または `Enter`（デフォルト）で進める。

- [ ] **Step 2: 依存パッケージをインストール**

```bash
npm install @anthropic-ai/sdk
npm install --save-dev jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @types/jest ts-jest
```

- [ ] **Step 3: shadcn/ui を初期化**

```bash
npx shadcn@latest init -d
npx shadcn@latest add button toast toaster
```

- [ ] **Step 4: jest.config.ts を作成**

```typescript
// jest.config.ts
import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterFramework: ['<rootDir>/jest.setup.ts'],
}

export default createJestConfig(config)
```

- [ ] **Step 5: jest.setup.ts を作成**

```typescript
// jest.setup.ts
import '@testing-library/jest-dom'

beforeEach(() => {
  localStorage.clear()
})
```

- [ ] **Step 6: .env.local を作成**

```bash
# .env.local
ANTHROPIC_API_KEY=your_api_key_here
```

- [ ] **Step 7: .gitignore に .env.local が含まれていることを確認**

```bash
grep ".env.local" .gitignore
```

期待出力: `.env.local` が含まれている行が表示される。

- [ ] **Step 8: テストが実行できることを確認**

```bash
npm test -- --passWithNoTests
```

期待出力: `Test Suites: 0 skipped` のような出力でエラーなし。

- [ ] **Step 9: コミット**

```bash
git add -A
git commit -m "chore: initialize Next.js project with Tailwind, shadcn/ui, and Jest"
```

---

## Task 2: 型定義 (`lib/types.ts`)

**Files:**
- Create: `lib/types.ts`

- [ ] **Step 1: 型定義ファイルを作成**

```typescript
// lib/types.ts

export type Sheet = {
  id: string
  theme: string
  summary: string
  points: [string, string, string]
  next_keywords: string[]
  createdAt: number
}

export type UserProfile = {
  occupation: string
  domain: string
}

export type Screen = 'setup' | 'gacha' | 'result'
```

- [ ] **Step 2: コミット**

```bash
git add lib/types.ts
git commit -m "feat: add core type definitions"
```

---

## Task 3: ストレージユーティリティ (`lib/storage.ts`) — TDD

**Files:**
- Create: `lib/storage.ts`
- Create: `__tests__/storage.test.ts`

- [ ] **Step 1: テストファイルを作成**

```typescript
// __tests__/storage.test.ts
import {
  getProfile,
  saveProfile,
  getSheets,
  saveSheet,
  deleteSheet,
} from '@/lib/storage'
import type { Sheet, UserProfile } from '@/lib/types'

const mockProfile: UserProfile = { occupation: 'エンジニア', domain: 'Web開発' }

const makeSheet = (id: string): Sheet => ({
  id,
  theme: `テーマ${id}`,
  summary: 'サマリー',
  points: ['p1', 'p2', 'p3'],
  next_keywords: ['kw1', 'kw2'],
  createdAt: Date.now(),
})

describe('storage - profile', () => {
  it('returns null when no profile saved', () => {
    expect(getProfile()).toBeNull()
  })

  it('saves and retrieves a profile', () => {
    saveProfile(mockProfile)
    expect(getProfile()).toEqual(mockProfile)
  })
})

describe('storage - sheets', () => {
  it('returns empty array when no sheets saved', () => {
    expect(getSheets()).toEqual([])
  })

  it('saves and retrieves a sheet', () => {
    const sheet = makeSheet('1')
    saveSheet(sheet)
    expect(getSheets()).toContainEqual(sheet)
  })

  it('deletes a sheet by id', () => {
    const sheet = makeSheet('2')
    saveSheet(sheet)
    deleteSheet('2')
    expect(getSheets().find(s => s.id === '2')).toBeUndefined()
  })

  it('keeps at most 100 sheets, removing the oldest', () => {
    for (let i = 0; i < 101; i++) {
      saveSheet({ ...makeSheet(String(i)), createdAt: i })
    }
    const sheets = getSheets()
    expect(sheets.length).toBe(100)
    expect(sheets.find(s => s.id === '0')).toBeUndefined()
  })
})
```

- [ ] **Step 2: テストを実行して失敗することを確認**

```bash
npm test -- __tests__/storage.test.ts
```

期待出力: `Cannot find module '@/lib/storage'` などのエラー。

- [ ] **Step 3: storage.ts を実装**

```typescript
// lib/storage.ts
import type { Sheet, UserProfile } from '@/lib/types'

const KEYS = {
  profile: 'serendi_profile',
  sheets: 'serendi_sheets',
} as const

export function getProfile(): UserProfile | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(KEYS.profile)
  return raw ? JSON.parse(raw) : null
}

export function saveProfile(profile: UserProfile): void {
  localStorage.setItem(KEYS.profile, JSON.stringify(profile))
}

export function getSheets(): Sheet[] {
  if (typeof window === 'undefined') return []
  const raw = localStorage.getItem(KEYS.sheets)
  return raw ? JSON.parse(raw) : []
}

export function saveSheet(sheet: Sheet): void {
  let sheets = getSheets()
  sheets = [sheet, ...sheets]
  if (sheets.length > 100) {
    sheets = sheets.sort((a, b) => b.createdAt - a.createdAt).slice(0, 100)
  }
  localStorage.setItem(KEYS.sheets, JSON.stringify(sheets))
}

export function deleteSheet(id: string): void {
  const sheets = getSheets().filter(s => s.id !== id)
  localStorage.setItem(KEYS.sheets, JSON.stringify(sheets))
}
```

- [ ] **Step 4: テストを実行してパスすることを確認**

```bash
npm test -- __tests__/storage.test.ts
```

期待出力: `Tests: 5 passed, 5 total`

- [ ] **Step 5: コミット**

```bash
git add lib/storage.ts __tests__/storage.test.ts
git commit -m "feat: add localStorage storage utilities with tests"
```

---

## Task 4: Gacha API Route Handler — TDD

**Files:**
- Create: `app/api/gacha/route.ts`
- Create: `__tests__/api/gacha.test.ts`

- [ ] **Step 1: テストファイルを作成**

```typescript
// __tests__/api/gacha.test.ts
import { POST } from '@/app/api/gacha/route'

const mockSheetJson = JSON.stringify({
  theme: '量子コンピュータ',
  summary: '量子の重ね合わせを使って計算する次世代コンピュータ',
  points: ['point1', 'point2', 'point3'],
  next_keywords: ['keyword1', 'keyword2'],
})

jest.mock('@anthropic-ai/sdk', () => ({
  default: jest.fn().mockImplementation(() => ({
    messages: {
      create: jest.fn().mockResolvedValue({
        content: [{ type: 'text', text: mockSheetJson }],
      }),
    },
  })),
}))

function makeRequest(body: object) {
  return new Request('http://localhost/api/gacha', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/gacha', () => {
  it('returns a sheet with correct shape', async () => {
    const res = await POST(makeRequest({ occupation: 'エンジニア', domain: 'Web開発' }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.sheet).toMatchObject({
      theme: '量子コンピュータ',
      summary: expect.any(String),
      points: expect.arrayContaining([expect.any(String)]),
      next_keywords: expect.arrayContaining([expect.any(String)]),
      id: expect.any(String),
      createdAt: expect.any(Number),
    })
  })

  it('returns 400 when occupation or domain is missing', async () => {
    const res = await POST(makeRequest({ occupation: '' }))
    expect(res.status).toBe(400)
  })
})
```

- [ ] **Step 2: テストを実行して失敗することを確認**

```bash
npm test -- __tests__/api/gacha.test.ts
```

期待出力: `Cannot find module '@/app/api/gacha/route'`

- [ ] **Step 3: Route Handler を実装**

```typescript
// app/api/gacha/route.ts
import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import type { Sheet } from '@/lib/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `あなたは世界のあらゆる学問・ニッチな業界・最新トレンド・奇妙な文化に精通した博識なナビゲーターです。

ユーザーが「普段の仕事や生活の中で一生自分からは検索しないであろう未知の領域のテーマ」を1つ厳選してください。
単に難解な専門用語を解説するのではなく、大人の教養としてつい他人に話したくなるような面白い雑学や仕組みを選ぶのがコツです。

出力は以下のJSONフォーマットを厳密に守ってください。マークダウンなどの余計なテキストは含めず、純粋なJSONのみを返してください。

{
  "theme": "テーマの名前",
  "summary": "ひとことで言うと（100文字以内の結論）",
  "points": ["要点1", "要点2", "要点3"],
  "next_keywords": ["キーワード1", "キーワード2"]
}`

export async function POST(request: Request) {
  const body = await request.json()
  const { occupation, domain } = body as { occupation?: string; domain?: string }

  if (!occupation || !domain) {
    return NextResponse.json({ error: 'occupation と domain は必須です' }, { status: 400 })
  }

  const userMessage = `職業: ${occupation}\n専門分野: ${domain}`

  const message = await client.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''

  let parsed: Omit<Sheet, 'id' | 'createdAt'>
  try {
    parsed = JSON.parse(text)
  } catch {
    return NextResponse.json({ error: 'AIの応答をパースできませんでした' }, { status: 500 })
  }

  const sheet: Sheet = {
    ...parsed,
    id: randomUUID(),
    createdAt: Date.now(),
  }

  return NextResponse.json({ sheet })
}
```

- [ ] **Step 4: テストを実行してパスすることを確認**

```bash
npm test -- __tests__/api/gacha.test.ts
```

期待出力: `Tests: 2 passed, 2 total`

- [ ] **Step 5: コミット**

```bash
git add app/api/gacha/route.ts __tests__/api/gacha.test.ts
git commit -m "feat: add Anthropic-powered gacha API route with tests"
```

---

## Task 5: レイアウト & グローバルスタイル

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/globals.css`

- [ ] **Step 1: globals.css をモノクロームテーマに更新**

```css
/* app/globals.css */
@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #111111;
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: -apple-system, 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
}
```

- [ ] **Step 2: layout.tsx を更新**

```typescript
// app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

export const metadata: Metadata = {
  title: 'Serendi',
  description: '未知の領域ガチャ — 知らない世界を、引く。',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
```

- [ ] **Step 3: ビルドが通ることを確認**

```bash
npm run build
```

期待出力: `✓ Compiled successfully`

- [ ] **Step 4: コミット**

```bash
git add app/layout.tsx app/globals.css
git commit -m "feat: configure monochrome theme and global layout"
```

---

## Task 6: SetupScreen コンポーネント

**Files:**
- Create: `components/SetupScreen.tsx`

- [ ] **Step 1: SetupScreen.tsx を作成**

```typescript
// components/SetupScreen.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { UserProfile } from '@/lib/types'

type Props = {
  onComplete: (profile: UserProfile) => void
}

export default function SetupScreen({ onComplete }: Props) {
  const [occupation, setOccupation] = useState('')
  const [domain, setDomain] = useState('')

  const canSubmit = occupation.trim().length > 0 && domain.trim().length > 0

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canSubmit) return
    onComplete({ occupation: occupation.trim(), domain: domain.trim() })
  }

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 py-16 max-w-sm mx-auto">
      <div className="mb-12">
        <p className="text-[9px] tracking-[4px] text-gray-300 font-bold mb-3">SERENDI</p>
        <h1 className="text-3xl font-black tracking-tight leading-tight text-black">
          あなたについて<br />教えてください
        </h1>
        <p className="mt-4 text-[11px] text-gray-400 leading-relaxed">
          AIがあなたの日常から遠い未知の領域を選ぶために使います。
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <label className="text-[8px] tracking-[4px] font-bold text-gray-400">OCCUPATION</label>
          <input
            type="text"
            placeholder="例: Webデザイナー、営業、学生..."
            value={occupation}
            onChange={e => setOccupation(e.target.value)}
            className="border-b border-gray-200 pb-3 text-sm text-black placeholder-gray-300 outline-none focus:border-black transition-colors bg-transparent"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[8px] tracking-[4px] font-bold text-gray-400">DOMAIN</label>
          <input
            type="text"
            placeholder="例: マーケティング、医療、音楽..."
            value={domain}
            onChange={e => setDomain(e.target.value)}
            className="border-b border-gray-200 pb-3 text-sm text-black placeholder-gray-300 outline-none focus:border-black transition-colors bg-transparent"
          />
        </div>

        <Button
          type="submit"
          disabled={!canSubmit}
          className="mt-4 bg-black text-white rounded-none text-[10px] tracking-[3px] font-bold h-12 hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          START →
        </Button>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: コミット**

```bash
git add components/SetupScreen.tsx
git commit -m "feat: add SetupScreen component"
```

---

## Task 7: GachaScreen コンポーネント

**Files:**
- Create: `components/GachaScreen.tsx`

- [ ] **Step 1: GachaScreen.tsx を作成**

```typescript
// components/GachaScreen.tsx
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
```

- [ ] **Step 2: コミット**

```bash
git add components/GachaScreen.tsx
git commit -m "feat: add GachaScreen component with loading state"
```

---

## Task 8: ResultScreen コンポーネント

**Files:**
- Create: `components/ResultScreen.tsx`

- [ ] **Step 1: ResultScreen.tsx を作成**

```typescript
// components/ResultScreen.tsx
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
```

- [ ] **Step 2: コミット**

```bash
git add components/ResultScreen.tsx
git commit -m "feat: add ResultScreen component for sheet display"
```

---

## Task 9: メインページ（Stateマシン）

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: app/page.tsx を実装**

```typescript
// app/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import SetupScreen from '@/components/SetupScreen'
import GachaScreen from '@/components/GachaScreen'
import ResultScreen from '@/components/ResultScreen'
import { getProfile, saveProfile, saveSheet, getSheets } from '@/lib/storage'
import type { Screen, Sheet, UserProfile } from '@/lib/types'

export default function Home() {
  const [screen, setScreen] = useState<Screen>('gacha')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [currentSheet, setCurrentSheet] = useState<Sheet | null>(null)
  const [isSaved, setIsSaved] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

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
      toast({ title: 'もう一度お試しください', variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  function handleSave() {
    if (!currentSheet || isSaved) return
    saveSheet(currentSheet)
    setIsSaved(true)
    toast({ title: 'コレクションに保存しました' })
  }

  function handleRedraw() {
    setScreen('gacha')
    handleDraw()
  }

  if (screen === 'setup') {
    return <SetupScreen onComplete={handleSetupComplete} />
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

  return <GachaScreen isLoading={isLoading} onDraw={handleDraw} />
}
```

- [ ] **Step 2: 開発サーバーを起動して動作確認**

```bash
npm run dev
```

ブラウザで `http://localhost:3000` を開き、以下を確認：
- 初回表示でSetup画面が表示される
- 職業・専門分野を入力してSTARTを押すとGacha画面へ遷移する
- DRAW ボタンでローディングアニメーションが表示される（API KeyはStep 6で設定済みの場合は実際に生成される）

- [ ] **Step 3: コミット**

```bash
git add app/page.tsx
git commit -m "feat: implement main page with setup/gacha/result state machine"
```

---

## Task 10: コレクション画面

**Files:**
- Create: `app/collection/page.tsx`

- [ ] **Step 1: collection/page.tsx を作成**

```typescript
// app/collection/page.tsx
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
```

- [ ] **Step 2: コレクション画面の動作確認**

ブラウザで以下を確認：
- `/collection` で保存済みシートがグリッド表示される
- カードをタップするとモーダルが開く
- DELETE ボタンでシートが削除される
- 空の場合は「NO ITEMS YET」とホームへのリンクが表示される

- [ ] **Step 3: コミット**

```bash
git add app/collection/page.tsx
git commit -m "feat: add collection page with grid view and modal"
```

---

## Task 11: 全テスト実行 & 最終確認

- [ ] **Step 1: 全テストを実行**

```bash
npm test
```

期待出力: `Test Suites: 2 passed, 2 total` / `Tests: 7 passed, 7 total`

- [ ] **Step 2: プロダクションビルドを確認**

```bash
npm run build
```

期待出力: `✓ Compiled successfully` (TypeErrorなし)

- [ ] **Step 3: 実際のAPIキーで動作確認（手動）**

`.env.local` の `ANTHROPIC_API_KEY` を実際のキーに設定して `npm run dev` を起動し、以下のゴールデンパスを確認：

1. 初回アクセス → Setup画面
2. 職業・専門分野を入力 → START
3. DRAW ボタン → ローディング → シート表示
4. SAVE → 「コレクションに保存しました」トースト
5. COLLECTION → グリッドに保存済みシートが表示
6. カードタップ → モーダル展開
7. DELETE → グリッドから削除

- [ ] **Step 4: 最終コミット**

```bash
git add -A
git commit -m "chore: verify all tests pass and production build succeeds"
```
