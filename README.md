<p align="center">
  <img src="src-tauri/icons/128x128@2x.png" width="128" height="128" alt="Graphite" />
</p>

<h1 align="center">Graphite</h1>

<p align="center">
  ローカルファーストのマークダウンノートアプリ
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#development">Development</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <img src="docs/screenshot.png" width="800" alt="Graphite Screenshot" />
</p>

## Features

- **Markdown エディタ** — リッチなプレビューとコードハイライト、数式 (KaTeX)、Mermaid 図表に対応
- **フォルダ & タグ** — ノートをフォルダで分類し、タグで横断的に管理
- **コマンドパレット** — `⌘P` でノート検索・コマンド実行
- **キーボード駆動** — Vi / Emacs / Arrow キー、すべてカスタマイズ可能
- **ローカルファースト** — データはすべてローカルの Markdown ファイル。クラウド不要
- **多言語対応** — 日本語 / English
- **クロスプラットフォーム** — macOS / Windows / Linux

## Installation

### Homebrew (macOS)

```bash
brew install --cask bukamasedo/tap/graphite-notes
```

### ダウンロード

[Releases](https://github.com/bukamasedo/graphite/releases) ページからプラットフォームに合ったファイルをダウンロードしてください。

| プラットフォーム | ファイル |
|------------------|----------|
| macOS (Apple Silicon) | `Graphite_x.x.x_aarch64.dmg` |
| macOS (Intel) | `Graphite_x.x.x_x64.dmg` |
| Windows | `Graphite_x.x.x_x64-setup.exe` / `.msi` |
| Linux (Debian/Ubuntu) | `graphite_x.x.x_amd64.deb` |
| Linux (AppImage) | `graphite_x.x.x_amd64.AppImage` |

### ソースからビルド

```bash
# 依存関係のインストール
pnpm install

# 開発サーバー起動
pnpm tauri dev

# プロダクションビルド
pnpm tauri build
```

## Development

### 前提条件

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 9+
- [Rust](https://www.rust-lang.org/tools/install) 1.75+
- [Tauri CLI](https://v2.tauri.app/start/prerequisites/)

### コマンド

| コマンド | 説明 |
|----------|------|
| `pnpm tauri dev` | 開発サーバー起動 |
| `pnpm tauri build` | プロダクションビルド |
| `pnpm check` | Biome lint + format |
| `cargo fmt` | Rust フォーマット |

### ディレクトリ構成

```
src/                  # フロントエンド (React + TypeScript)
├── components/       # UI コンポーネント
├── stores/           # Zustand ストア
├── hooks/            # カスタムフック
├── lib/api/          # Tauri invoke ラッパー
├── i18n/             # 多言語リソース
└── types/            # 型定義

src-tauri/            # バックエンド (Rust + Tauri)
├── src/commands/     # Tauri コマンド
├── src/models/       # データモデル
└── src/utils/        # ユーティリティ
```

## Tech Stack

| 領域 | 技術 |
|------|------|
| フレームワーク | [Tauri 2](https://v2.tauri.app/) |
| フロントエンド | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| エディタ | [TipTap](https://tiptap.dev/) |
| 状態管理 | [Zustand](https://zustand.docs.pmnd.rs/) |
| スタイル | [Tailwind CSS](https://tailwindcss.com/) |
| UI | [shadcn/ui](https://ui.shadcn.com/) + [Radix](https://www.radix-ui.com/) |
| バックエンド | [Rust](https://www.rust-lang.org/) |
| フォーマッタ | [Biome](https://biomejs.dev/) |

## License

[MIT](LICENSE)
