import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import type { Sheet } from '@/lib/types'

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

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: `職業: ${occupation}\n専門分野: ${domain}` }],
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
    id: randomUUID(),
    createdAt: Date.now(),
  }

  return NextResponse.json({ sheet })
}
