---
paths:
  - "src/**/*.{ts,tsx}"
---

# Formatting

- JS/TS: `pnpm check`（Biome: format + lint）
- Rust: `cargo fmt`
- コミット前に必ず実行

## pnpm スクリプト

| コマンド | 内容 |
|----------|------|
| `pnpm check` | format + lint（コミット前に実行） |
| `pnpm lint` | lint のみ |
| `pnpm format` | format のみ |

## Biome 設定（biome.json）

| 項目 | 設定 |
|------|------|
| インデント | スペース 2 |
| クォート | シングル（JSX 属性のみダブル） |
| セミコロン | 常に付ける |
| Trailing comma | ES5 スタイル（配列・オブジェクト末尾 OK） |
| Import 整列 | 自動（assist.organizeImports: on） |
