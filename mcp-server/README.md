# Graphite MCP Server

GraphiteマークダウンvaultにAIツール（Claude Desktop, Claude Code等）からアクセスするためのMCPサーバー。

## セットアップ

```bash
cd mcp-server
npm install
npm run build
```

## Claude Desktop設定

`~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "graphite": {
      "command": "node",
      "args": ["/path/to/graphite/mcp-server/dist/index.js"]
    }
  }
}
```

## Claude Code設定

`.claude/settings.json`:

```json
{
  "mcpServers": {
    "graphite": {
      "command": "node",
      "args": ["/path/to/graphite/mcp-server/dist/index.js"]
    }
  }
}
```

## Tools (17)

| Tool | Description |
|------|-------------|
| `list_notes` | ノート一覧取得（フォルダ/タグフィルタ対応） |
| `read_note` | ノート内容を読み取り |
| `create_note` | 新規ノート作成 |
| `write_note` | ノート内容を更新 |
| `delete_note` | ノートをゴミ箱に移動 |
| `rename_note` | ノートをリネーム |
| `move_note` | ノートを別フォルダに移動 |
| `search_notes` | 全文検索 |
| `list_folders` | フォルダ一覧取得 |
| `create_folder` | フォルダ作成 |
| `delete_folder` | フォルダ削除（中身はゴミ箱へ） |
| `rename_folder` | フォルダリネーム |
| `list_tags` | タグ一覧取得 |
| `list_trash` | ゴミ箱一覧 |
| `restore_note` | ゴミ箱から復元 |
| `permanently_delete` | ゴミ箱から完全削除 |
| `empty_trash` | ゴミ箱を空にする |

## Resources (4)

| URI | Description |
|-----|-------------|
| `graphite://notes` | 全ノート一覧 |
| `graphite://notes/{path}` | 個別ノート内容 |
| `graphite://folders` | フォルダ一覧 |
| `graphite://tags` | タグ一覧 |

## Vault

デフォルト: `~/Graphite`

`.graphite/config.json` の `vaultPath` で変更可能。
