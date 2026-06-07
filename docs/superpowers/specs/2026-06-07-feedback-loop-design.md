# フィードバックループ機能 設計書

GitHub Issue: #10
Branch: `feat/10-feedback-loop`

## 目的

DRAW結果が特定ジャンルに偏ったときにユーザーが好みを反映できるようにし、
「自分用に育つガチャ」体験を提供する。完全フィルタではなく "ソフトな傾向" として
プロンプトに作用させ、セレンディピティ（偶然性）を残す。

## スコープ

含むもの:
- 結果カードに3つのフィードバックアクション（LIKE / SKIP / OTHER GENRE）
- カテゴリ単位での評価ログ蓄積（localStorage）
- 次回API呼び出しへの傾向注入

含まないもの:
- フィードバック履歴の可視化画面（将来Issue化）
- フィードバックのクラウド同期
- カテゴリ体系の固定化（AI判断に委ねる）

## データモデル

### Sheet 型拡張（lib/types.ts）

```ts
export type Sheet = {
  id: string
  theme: string
  category: string   // NEW: AIが分類するジャンルラベル（自由文字列）
  summary: string
  points: [string, string, string]
  next_keywords: string[]
  createdAt: number
}
```

既存保存済みデータの後方互換: 読み込み時に `category` 欠落なら `'unknown'` を補完する。

### フィードバックログ（localStorage）

キー: `serendi.feedback.v1`

```ts
type FeedbackEntry = {
  sheetId: string
  category: string
  rating: 'like' | 'dislike'
  createdAt: number
}
type FeedbackLog = FeedbackEntry[]
```

書き込みポリシー:
- LIKE クリック → `rating: 'like'` で追加（同シートに既存エントリがあれば置換）
- SKIP クリック → `rating: 'dislike'` で追加（同上）
- OTHER GENRE クリック → 現シートを `'dislike'` 記録 後に再DRAWトリガ

上限: 直近100件のみ保持（古いものから捨てる）。

### 集計（lib/feedback.ts）

```ts
type Preferences = {
  liked_categories: string[]      // LIKEが多い上位3カテゴリ
  disliked_categories: string[]   // 直近dislikeが連続2回以上のカテゴリ
}

export function computePreferences(log: FeedbackLog): Preferences
```

`disliked` 判定は **直近20件以内で同カテゴリのdislikeが2回以上** のもの。
古いdislikeを永久に避けると体験が固定化するため、直近窓を設ける。

## API 拡張

### `POST /api/gacha`

リクエスト:
```ts
{
  occupation: string
  domain: string
  preferences?: Preferences  // NEW（optional / 後方互換）
}
```

レスポンス（生成シート）:
```ts
{
  sheet: {
    theme: string
    category: string    // NEW
    summary: string
    points: [string, string, string]
    next_keywords: string[]
    // id / createdAt はサーバで付与済み
  }
}
```

### プロンプト変更

システムプロンプト末尾に以下を追加:

> 出力JSONには `category` フィールドも含めてください。
> category はジャンルを短く表すラベル（例: "最新テクノロジー", "辺境文化", "自然科学", "現代アート" など）。
> 自由に命名してよいが、似たテーマでは一貫したラベルを使うこと。

preferences がリクエストに含まれる場合のみ、ユーザーメッセージに以下を追記:

```
【あなたの傾向】
- 過去に高評価だったジャンル: {liked_categories}
  → 似た方向性のテーマを優先的に検討してよい
- 最近不評だったジャンル: {disliked_categories}
  → 当面これらは避ける
ただし、機械的に従わず10回に1回程度は意外性のあるジャンルも選んでよい。
```

## UI（components/ResultScreen.tsx）

DRAW AGAIN の上に水平3ボタン（border角ゼロ・モノクロでカード世界観を維持）:

```
[ ⭐ LIKE ]   [ 👎 SKIP ]   [ 🔄 OTHER GENRE ]
[          ↻ DRAW AGAIN          ]
```

挙動:
- LIKE / SKIP: トグル選択。クリック後はアクティブ状態（黒背景＋白文字）。同シート内で排他。
- OTHER GENRE: クリック即時に dislike 記録 + `onRedraw()` 呼び出し（既存の再生成ハンドラ）。

Props 追加:
```ts
type Props = {
  ...
  feedback: 'like' | 'dislike' | null
  onFeedback: (rating: 'like' | 'dislike') => void
  onRejectGenre: () => void   // dislike記録 + redraw を組合せたハンドラ
}
```

## 統合（app/page.tsx）

- API 呼び出し前に `loadFeedbackLog()` → `computePreferences()` を実行し、preferences をPOSTに含める
- フィードバックアクションは `lib/feedback.ts` の `recordFeedback()` を呼んで永続化
- カード単位の現在の評価状態を state で保持し、ResultScreen に渡す

## 後方互換

- 旧形式の保存済みシート（category なし）も Collection 画面で表示可能とする
- 旧クライアントが新APIを叩いても動くよう、preferences は optional

## テスト

- `lib/feedback.ts` の単体テスト
  - 100件超で古いものが捨てられる
  - computePreferences のソフトdislike窓
  - 同シート再評価で置換される
- API ルートテスト
  - category が返ること（モック）
  - preferences 付き呼び出しで system+user メッセージに反映されること
