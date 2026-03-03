# Graphite

Tauri + React によるローカルファースのマークダウンノートアプリ。

## Stack

- **Frontend**: React 18, TypeScript, Zustand, TipTap, Tailwind CSS
- **Backend**: Rust / Tauri 2
- **Package Manager**: pnpm
- **Formatter**: Biome（JS/TS）, cargo fmt（Rust）

## Rules

詳細なルールは `.claude/rules/` を参照。

- [architecture.md](.claude/rules/architecture.md) — レイヤー構成・ディレクトリ構造
- [react.md](.claude/rules/react.md) — Component / Store / Hooks / lib/api
- [zustand.md](.claude/rules/zustand.md) — Store 構造・selector・Store 間連携
- [typescript.md](.claude/rules/typescript.md) — 型・命名規則
- [i18n.md](.claude/rules/i18n.md) — 翻訳・i18next 使用パターン
- [rust.md](.claude/rules/rust.md) — Rust コマンド・モデル・エラー処理
- [formatting.md](.claude/rules/formatting.md) — フォーマット実行方法

## Key Constraints

- `invoke()` は `src/lib/api/` にのみ書く。Component から直接呼ばない
- Store 間の直接参照禁止
- Rust のファイルパス操作は必ず `ensure_within_vault()` を先頭で呼ぶ
- `any` 禁止、`unwrap()` / `expect()` 禁止
