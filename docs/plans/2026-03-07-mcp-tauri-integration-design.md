# MCP サーバー Tauri 統合設計

## 概要

MCP サーバーを Node SEA でスタンドアロンバイナリ化し、Tauri アプリに同梱する。
設定画面の「連携」セクションからワンクリックで Claude Desktop と連携できるようにする。

## 重要な設計判断

MCP の stdio トランスポートでは **クライアント (Claude Desktop) がサーバープロセスを spawn する**。
そのため Tauri アプリはプロセス管理を行わない。役割は以下の2つのみ：

1. MCP サーバーバイナリをアプリに同梱する
2. Claude Desktop の設定ファイルにバイナリパスを書き出す

## アーキテクチャ

```
[Tauri App]
  ├── Settings UI (連携セクション)
  │     └── 「Claude Desktop と連携」トグル
  ├── Store (Zustand)
  │     └── mcpEnabled in settings-store
  ├── lib/api/mcp-api.ts
  │     └── configureClaude / removeClaude / getMcpBinaryPath
  └── Rust (src-tauri)
        ├── commands/mcp_commands.rs
        │     └── get_mcp_binary_path / configure_claude_desktop / remove_claude_desktop
        └── tauri.conf.json
              └── externalBin: ["binaries/graphite-mcp"]
```

## ビルドパイプライン

1. `esbuild` で `mcp-server/src/index.ts` → 単一 JS ファイルにバンドル
2. Node SEA (`node --experimental-sea-config`) でスタンドアロンバイナリ化
3. 出力: `src-tauri/binaries/graphite-mcp-{target-triple}`
4. Tauri の `externalBin` に登録、ビルド時に自動同梱

## Rust コマンド

### `get_mcp_binary_path`
- 同梱バイナリの絶対パスを返す
- `app.path().resource_dir()` からパス解決

### `configure_claude_desktop`
- `~/Library/Application Support/Claude/claude_desktop_config.json` を読み込み
- 既存設定を保持しつつ `mcpServers.graphite` エントリを追加
- ファイル/ディレクトリが存在しない場合は作成

### `remove_claude_desktop`
- `claude_desktop_config.json` から `mcpServers.graphite` エントリを削除
- 他の設定は保持

## フロントエンド

### 設定 UI: `integrations-section.tsx`
- 「Claude Desktop と連携」Switch トグル
- ON → `configureClaude()` 呼び出し → 成功メッセージ「Claude Desktop を再起動してください」
- OFF → `removeClaude()` 呼び出し
- Claude Desktop 未インストール時のエラーハンドリング

### Store
- `GraphiteConfig` に `mcpEnabled: boolean` を追加
- `settings-store` の既存パターンに従う

### API: `src/lib/api/mcp-api.ts`
- `getMcpBinaryPath(): Promise<string>`
- `configureClaude(): Promise<void>`
- `removeClaude(): Promise<void>`

## トグル ON フロー

1. `getMcpBinaryPath()` でバイナリパスを取得
2. `configureClaude()` で config.json に書き出し:
   ```json
   {
     "mcpServers": {
       "graphite": {
         "command": "/Applications/Graphite.app/.../graphite-mcp"
       }
     }
   }
   ```
3. 設定保存 (`mcpEnabled: true`)
4. トースト表示:「Claude Desktop を再起動してください」

## トグル OFF フロー

1. `removeClaude()` で config.json からエントリ削除
2. 設定保存 (`mcpEnabled: false`)

## アプリ起動時の動作

- 特になし（プロセス管理不要）
- Claude Desktop が必要に応じて MCP サーバーを spawn する

## プラットフォーム対応

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%/Claude/claude_desktop_config.json` (将来対応)
- Linux: `~/.config/Claude/claude_desktop_config.json` (将来対応)
- 初期実装は macOS のみ
