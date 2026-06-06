# Serendi — 設計ドキュメント

**日付:** 2026-06-06  
**ステータス:** 承認済み

---

## 1. 概要

「Serendi（セレンディ）」は、フィルターバブルを打ち破るセレンディピティ誘発アプリ。ユーザーが絶対に自分では検索しない未知の領域をAIがランダムに選び、1画面に収まる「まとめシート」として提供する。

---

## 2. 技術スタック

| カテゴリ | 技術 |
|----------|------|
| フレームワーク | Next.js 15 (App Router + TypeScript) |
| スタイリング | Tailwind CSS + shadcn/ui |
| AI | Anthropic `claude-3-5-haiku-20241022` |
| データ保存 | `localStorage`（MVP） |
| デプロイ | Vercel |

---

## 3. 画面構成

`app/page.tsx` が `'setup' | 'gacha' | 'result'` の3ステートを持ち、画面全体を切り替える。コレクション画面のみ別ルート。

| 画面 | ルート | 説明 |
|------|--------|------|
| Setup | `/`（初回） | 職業・専門分野の入力フォーム |
| Gacha | `/`（state: gacha） | ガチャボタン + ローディング |
| Result | `/`（state: result） | 生成されたシートの表示 |
| Collection | `/collection` | 保存済みシートの一覧 |

---

## 4. ディレクトリ構成

```
app/
├── page.tsx                  # Setup / Gacha / Result を state で切替
├── collection/
│   └── page.tsx              # コレクション画面
├── api/
│   └── gacha/
│       └── route.ts          # Anthropic API Route Handler
└── layout.tsx

lib/
├── types.ts                  # 型定義
└── storage.ts                # localStorage ユーティリティ

components/
├── SetupScreen.tsx
├── GachaScreen.tsx
├── ResultScreen.tsx
└── ui/                       # shadcn/ui コンポーネント
```

---

## 5. 型定義

```typescript
// lib/types.ts

type Sheet = {
  id: string
  theme: string
  summary: string
  points: [string, string, string]
  next_keywords: string[]
  createdAt: number
}

type UserProfile = {
  occupation: string
  domain: string
}

type Screen = 'setup' | 'gacha' | 'result'
```

---

## 6. データフロー

1. 起動時に `localStorage` を確認 → `userProfile` がなければ Setup 画面を表示
2. Setup 完了 → `userProfile` を保存して Gacha 画面へ
3. ガチャボタン押下 → `screen = 'gacha'`（ローディング表示）、`/api/gacha` へ POST
4. APIレスポンス受信 → `Sheet` を state にセット、`screen = 'result'`
5. 保存ボタン → `Sheet` を `localStorage` の配列に追加（上限100件、超過時は最古を削除）
6. 「もう一度」ボタン → `screen = 'gacha'` に戻して再リクエスト

---

## 7. AI連携（`/api/gacha/route.ts`）

**リクエスト:** `POST { occupation: string; domain: string }`  
**レスポンス:** `{ sheet: Sheet }` または `{ error: string }`  
**タイムアウト:** 30秒

### システムプロンプト

```
あなたは世界のあらゆる学問・ニッチな業界・最新トレンド・奇妙な文化に精通した博識なナビゲーターです。

ユーザーの職業: {occupation}
専門分野: {domain}

このユーザーが普段の仕事や生活の中で一生自分からは検索しないであろう未知の領域のテーマを1つ厳選してください。
単に難解な専門用語を解説するのではなく、大人の教養としてつい他人に話したくなるような面白い雑学や仕組みを選ぶのがコツです。

出力は以下のJSONフォーマットを厳密に守ってください。マークダウンなどの余計なテキストは含めず、純粋なJSONのみを返してください。
```

### 出力スキーマ

```json
{
  "theme": "テーマの名前",
  "summary": "ひとことで言うと（100文字以内）",
  "points": [
    "要点1",
    "要点2",
    "要点3"
  ],
  "next_keywords": [
    "キーワード1",
    "キーワード2"
  ]
}
```

JSONパース失敗時は HTTP 500 を返す。

---

## 8. ストレージ（`lib/storage.ts`）

```typescript
const KEYS = {
  profile: 'serendi_profile',
  sheets:  'serendi_sheets',
} as const

getSheets(): Sheet[]
saveSheet(sheet: Sheet): void      // 上限100件、超過時は最古を削除
deleteSheet(id: string): void
getProfile(): UserProfile | null
saveProfile(profile: UserProfile): void
```

---

## 9. コレクション画面（`/collection`）

- グリッド2列でカードを一覧表示
- 各カード: テーマ名・保存日・サマリー冒頭のみ表示
- タップでモーダル展開（全内容表示）
- 削除ボタン付き
- 空の場合: 「まだ保存がありません」＋ガチャへのリンク

---

## 10. デザイン方針

- **カラー:** モノクローム（白×黒のみ、カラーアクセントなし）
- **タイポグラフィ:** 太字・字間・余白で情報階層を表現
- **レイアウト:** スマートフォン幅を基準とするレスポンシブ
- **コンポーネント:** shadcn/ui をベースに最小限のカスタマイズ

---

## 11. エラーハンドリング

| ケース | 対応 |
|--------|------|
| API タイムアウト（30秒超） | トースト表示「もう一度お試しください」 |
| JSONパース失敗 | 同上 |
| ネットワークエラー | 同上 |
| localStorage 容量超過 | 最古のシートを自動削除して再試行 |
