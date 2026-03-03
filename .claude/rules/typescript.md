---
paths:
  - "src/**/*.{ts,tsx}"
---

# TypeScript

## Types

- any 禁止
- オブジェクト型は interface、ユニオン・エイリアスは type

### `as` の使用ルール

原則禁止。以下の場合のみ許容：
- Rust API に `null` を明示送信する必要がある場合：`null as string | null`
- 型推論が効かず `as string` 相当が必要な箇所（コメントで理由を書く）

### Store から export する型

- Union type（`type FocusPanel = 'sidebar' | ...`）は Store ファイルから export してよい
- Store 内部の state interface（`AppState`, `NoteState` など）は export しない

### `useRef` の型指定

- DOM ref は型指定必須：`useRef<HTMLInputElement>(null)`
- state escape ref（`skipBlurSaveRef` など）は型推論に委ね、用途をコメントで説明する

## Naming

| 対象             | 規則              | 例                  |
|-----------------|-------------------|---------------------|
| ファイル         | kebab-case        | note-list-item.tsx  |
| コンポーネント   | PascalCase        | NoteListItem        |
| ストア           | use{Domain}Store  | useNoteStore        |
| フック           | use{Name}         | useIMEGuard         |
| API 関数         | 動詞 + 名詞       | readNote            |
| 型 / Interface  | PascalCase        | GraphiteConfig      |
