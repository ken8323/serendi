import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import type { Preferences, Sheet } from '@/lib/types'

const SYSTEM_PROMPT = `あなたは世界のあらゆる学問・ニッチな業界・最新トレンド・奇妙な文化に精通した博識なナビゲーターです。

【最重要ルール】
ユーザーは「自分の職業」と「普段関わっている分野」を伝えてきます。これらは**避けるべき領域**であり、テーマを近づける手がかりではありません。
あなたの仕事は、ユーザーが提示した職業・分野から**意味的に最も遠い未知の領域**を1つ選ぶことです。

具体的な指針：
- ユーザーの職業や分野と同じ業界・隣接業界・関連学問は絶対に選ばない
- 例: ユーザーが「Webデザイナー / マーケティング」なら、UIデザイン・広告・SNS・ブランディング等は禁止。代わりに深海生物学・中世修道院の写本制作・鉱物学・古代の灌漑技術などを選ぶ
- 単に難解な専門用語を解説するのではなく、大人の教養としてつい他人に話したくなるような面白い雑学や仕組みを選ぶ
- 毎回ジャンルをシャッフルする（自然科学・最新テクノロジー・サブカルチャー・現代アート・新興スポーツ・ニッチ産業・グローバルトレンド・歴史・工芸など、回答ごとに大きく振る）

選んだあと、自問してください：「このテーマはユーザーの職業／分野と本当に無関係か？」少しでも関連すれば選び直すこと。

出力は以下のJSONフォーマットを厳密に守ってください。マークダウンなどの余計なテキストは含めず、純粋なJSONのみを返してください。
category はテーマのジャンルを表す短いラベルで、自由に命名してよいが似たテーマでは一貫したラベルを使ってください（例: "最新テクノロジー", "辺境文化", "自然科学", "現代アート", "ニッチ産業" など）。

{
  "theme": "テーマの名前",
  "category": "ジャンルラベル",
  "summary": "ひとことで言うと（100文字以内の結論）",
  "points": ["要点1", "要点2", "要点3"],
  "next_keywords": ["キーワード1", "キーワード2"]
}`

function buildUserMessage(occupation: string, domain: string, preferences?: Preferences): string {
  const base = `以下は私が普段関わっていて十分に知っている領域です。これらから**最も遠い**未知のテーマを1つ選んでください。これらに関連する分野は絶対に選ばないでください。

避けるべき領域:
- 職業: ${occupation}
- 関わっている分野: ${domain}`

  if (!preferences) return base
  const { liked_categories, disliked_categories } = preferences
  if (liked_categories.length === 0 && disliked_categories.length === 0) return base

  const liked = liked_categories.length
    ? `- 過去に高評価だったジャンル: ${liked_categories.join(', ')}\n  → 似た方向性のテーマを優先的に検討してよい`
    : ''
  const disliked = disliked_categories.length
    ? `- 最近不評だったジャンル: ${disliked_categories.join(', ')}\n  → 当面これらは避ける`
    : ''

  return `${base}

【私の傾向】
${[liked, disliked].filter(Boolean).join('\n')}
ただし、機械的に従わず10回に1回程度は意外性のあるジャンルも選んでよい。`
}

export async function POST(request: Request) {
  const body = await request.json()
  const { occupation, domain, preferences } = body as {
    occupation?: string
    domain?: string
    preferences?: Preferences
  }

  if (!occupation || !domain) {
    return NextResponse.json({ error: 'occupation と domain は必須です' }, { status: 400 })
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: buildUserMessage(occupation, domain, preferences),
      },
    ],
  })

  const raw = message.content[0].type === 'text' ? message.content[0].text : ''
  const text = raw.replace(/^```(?:json)?\s*/m, '').replace(/\s*```\s*$/m, '').trim()

  let parsed: Omit<Sheet, 'id' | 'createdAt'>
  try {
    parsed = JSON.parse(text)
  } catch {
    return NextResponse.json({ error: 'AIの応答をパースできませんでした' }, { status: 500 })
  }

  const sheet: Sheet = {
    ...parsed,
    category: parsed.category ?? 'unknown',
    id: randomUUID(),
    createdAt: Date.now(),
  }

  return NextResponse.json({ sheet })
}
