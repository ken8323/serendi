# ジャンル「気分」セレクタ 設計書

GitHub Issue: #11
Branch: `feat/11-mood-selector`

## 目的

DRAW前にユーザーがその時の気分でジャンルを指定できるようにする。
興味のあるジャンルに辿り着くまでDRAWを繰り返す手間を省く。

## スコープ

含むもの:
- GachaScreen にジャンルチップUI（14個、単選択、デフォルト「おまかせ」）
- mood 値を API に送信し、プロンプトに反映
- Sheet にどの mood で引いたか保持

含まないもの:
- 気分ごとの統計表示、複数選択、フリーワード入力（YAGNI）

## ジャンル定義

`lib/moods.ts` に定数として定義:

```ts
export type Mood = {
  key: string           // 内部key（英語）
  label: string         // 表示ラベル（日本語）
  emoji: string
  prompt?: string       // AIに渡す説明（labelで十分なら省略）
}

export const MOODS: Mood[] = [
  { key: 'auto',       label: 'おまかせ',     emoji: '🎲' },
  { key: 'tech',       label: '最新テック',   emoji: '🚀' },
  { key: 'fringe',     label: '辺境文化',     emoji: '🌍' },
  { key: 'science',    label: '自然科学',     emoji: '🔬' },
  { key: 'art',        label: 'アート',       emoji: '🎨' },
  { key: 'history',    label: '古代史',       emoji: '📜' },
  { key: 'subculture', label: 'サブカル',     emoji: '👾' },
  { key: 'sports',     label: 'スポーツ',     emoji: '⚽' },
  { key: 'industry',   label: 'ニッチ産業',   emoji: '🏭' },
  { key: 'philosophy', label: '哲学・思想',   emoji: '🧠' },
  { key: 'biomed',     label: '生物・医療',   emoji: '🧬' },
  { key: 'cosmos',     label: '宇宙',         emoji: '🌌' },
  { key: 'language',   label: '言語・文字',   emoji: '🔤' },
  { key: 'craft',      label: '工芸',         emoji: '🛠' },
]
```

`auto` は内部的に mood なし扱い（APIに送らない）。

## データモデル拡張

`Sheet` 型に `mood?: string` 追加（日本語ラベルを格納、後方互換のためoptional）:
```ts
export type Sheet = {
  ...既存
  mood?: string    // NEW: DRAW時のジャンル指定（"自然科学"など）
}
```

## UI（GachaScreen）

DRAWボタンの直前にチップ群を配置。横スクロール対応 (`overflow-x-auto`)、2行折り返し可。

```
[ 🎲 おまかせ ] [ 🚀 最新テック ] [ 🌍 辺境文化 ] [ 🔬 自然科学 ] ...
```

スタイル:
- 通常: `border border-gray-200 text-gray-500`
- 選択中: `bg-black text-white border-black`

State:
- 親（app/page.tsx）が `selectedMood: string` を保持
- 起動時の初期値は `'auto'`
- DRAW実行時にAPIへ送信、結果のSheetに mood ラベルを格納

## API 拡張

リクエスト型:
```ts
{
  occupation: string
  domain: string
  preferences?: Preferences
  mood?: string     // NEW: 日本語ラベル ('自然科学' など)。auto時は省略
}
```

プロンプト戦略:
- `mood` 指定あり: ユーザーメッセージに以下を追加
  ```
  【指定ジャンル】
  今回は「{mood}」というジャンルのテーマを選んでください。
  ただし、ユーザーの職業/分野からの距離ルールは引き続き守ること。
  ```
- preferences の dislike とジャンルがバッティングする可能性: AIに判断委ねる（指定優先と注釈）

レスポンスシート: 既存通り。`mood` フィールドはサーバ側では付与せず、クライアントが保存時に注入する（API応答変更なし）。

## クライアント統合

`app/page.tsx`:
- `selectedMood` state を追加（初期 `'auto'`）
- `handleDraw` で `auto` 以外なら mood ラベルをPOSTに含める
- 受信後、Sheetに `mood: <selectedMoodのlabel>` を追加してから setCurrentSheet

`GachaScreen` Props:
```ts
selectedMood: string
onMoodChange: (key: string) => void
```

## 後方互換

- mood なしリクエスト・旧 Sheet（mood undefined）はすべて従来通り動作

## テスト

- API テスト: mood 付き呼び出しでユーザーメッセージに mood が含まれること
- API テスト: mood なし時はジャンル指示が含まれないこと
