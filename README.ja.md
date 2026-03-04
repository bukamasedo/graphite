<p align="center">
  <img src="src-tauri/icons/128x128@2x.png" width="128" height="128" alt="Graphite" />
</p>

<h1 align="center">Graphite</h1>

<p align="center">
  Tauri で作ったローカルファーストの Markdown ノートアプリ
</p>

<p align="center">
  <a href="README.md">English</a> | 日本語
</p>

<p align="center">
  <img src="docs/screenshot.png" width="800" alt="Graphite Screenshot" />
</p>

## Why Graphite

| | Notion | Obsidian | Graphite |
|---|---|---|---|
| オフライン動作 | クラウド必須 | 可能 | **可能** |
| アプリサイズ (macOS) | ~93 MB | ~283 MB | **18 MB** |
| データ形式 | 独自形式 | Markdown | **プレーン Markdown** |
| ベンダーロックイン | あり | プラグインエコシステム | **なし** |

ノートはすべてディスク上のプレーン `.md` ファイル。クラウドもアカウントもロックインも不要。Electron ではなく Tauri で構築しているため軽量で、瞬時に起動します。

## Features

- **Markdown エディタ** — コードハイライト、数式 (KaTeX)、Mermaid 図表
- **フォルダ & タグ** — ノートをフォルダで分類し、タグで横断管理
- **コマンドパレット** — `⌘P` でノート検索・コマンド実行
- **キーボード駆動** — Vi / Emacs / Arrow キー、すべてカスタマイズ可能
- **多言語対応** — 日本語 / English
- **クロスプラットフォーム** — macOS / Windows / Linux

## Installation

### Homebrew (macOS)

```bash
brew install --cask bukamasedo/tap/graphite-notes
```

### ダウンロード

[Releases](https://github.com/bukamasedo/graphite/releases) から各プラットフォーム向けのファイルをダウンロードしてください。

| プラットフォーム | ファイル |
|------------------|----------|
| macOS (Apple Silicon) | `Graphite_x.x.x_aarch64.dmg` |
| macOS (Intel) | `Graphite_x.x.x_x64.dmg` |
| Windows | `Graphite_x.x.x_x64-setup.exe` / `.msi` |
| Linux (Debian/Ubuntu) | `graphite_x.x.x_amd64.deb` |
| Linux (AppImage) | `graphite_x.x.x_amd64.AppImage` |

## Development

### 前提条件

- [Node.js](https://nodejs.org/) 20+ / [pnpm](https://pnpm.io/) 9+
- [Rust](https://www.rust-lang.org/tools/install) 1.75+
- [Tauri CLI](https://v2.tauri.app/start/prerequisites/)

```bash
pnpm install
pnpm tauri dev    # 開発サーバー起動
pnpm tauri build  # プロダクションビルド
```

### ディレクトリ構成

```
src/                  # フロントエンド (React + TypeScript)
├── components/       # UI コンポーネント
├── stores/           # Zustand ストア
├── lib/api/          # Tauri invoke ラッパー
└── i18n/             # 多言語リソース

src-tauri/            # バックエンド (Rust + Tauri)
├── src/commands/     # Tauri コマンド
├── src/models/       # データモデル
└── src/utils/        # ユーティリティ
```

### Tech Stack

[Tauri 2](https://v2.tauri.app/) · [React 19](https://react.dev/) · [TypeScript](https://www.typescriptlang.org/) · [TipTap](https://tiptap.dev/) · [Zustand](https://zustand.docs.pmnd.rs/) · [Tailwind CSS](https://tailwindcss.com/) · [shadcn/ui](https://ui.shadcn.com/) · [Biome](https://biomejs.dev/)

## License

[MIT](LICENSE)
