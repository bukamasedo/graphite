# Plan: プロジェクト全体リファクタリング

## Context

`.claude/rules/` で定義したアーキテクチャルールに対して、現行コードに以下の違反がある：

- `invoke()` が stores・components・lib に散在（lib/api/ が存在しない）
- Store 間の直接参照（note-store → history/sidebar/app-store）
- Components から invoke() を直接呼び出し（trash/folder 操作）
- Rust: `read_note`, `write_note`, `rename_note`, `delete_note`, `delete_folder`, `rename_folder` が `ensure_within_vault()` を呼んでいない
- Rust: `lib.rs:250`, `menu_commands.rs:102` に `.expect()` が残存

---

## 変更ファイル一覧

### 新規作成（10ファイル）

```
src/lib/api/
├── app-api.ts       initGraphiteDir, purgeExpiredTrash
├── note-api.ts      listNotes, readNote, writeNote, createNote, deleteNote, renameNote, readTrashNote
├── folder-api.ts    listFolders, createFolder, deleteFolder, renameFolder, moveNote
├── trash-api.ts     listTrash, restoreNote, permanentlyDeleteTrash, emptyTrash
├── search-api.ts    searchNotes
├── settings-api.ts  readSettings, writeSettings
├── hotkey-api.ts    readHotkeys, writeHotkeys
├── tag-api.ts       listTags
├── menu-api.ts      rebuildMenu
└── export-api.ts    writeExportFile
```

### 編集（Store 層）

| ファイル | 変更内容 |
|----------|----------|
| `src/stores/note-store.ts` | invoke → note-api/folder-api に置換。新アクション追加: moveNote, createFolder, deleteFolder, renameFolder。selectNote から `useHistoryStore.getState().push()` 除去。selectTrashGroup のシグネチャを `setTrashGroupNotes(folder, notes)` に変更し Cross-Store 参照を除去 |
| `src/stores/app-store.ts` | invoke → app-api に置換。purgeTrash(days) アクション追加 |
| `src/stores/sidebar-store.ts` | invoke → trash-api/tag-api に置換。新アクション追加: restoreNote, permanentlyDeleteTrash, emptyTrash（各操作後 loadTrash() を呼ぶ） |
| `src/stores/search-store.ts` | invoke → search-api に置換 |
| `src/stores/settings-store.ts` | invoke → settings-api に置換 |
| `src/stores/hotkey-store.ts` | invoke → hotkey-api に置換 |

### 編集（lib 層）

| ファイル | 変更内容 |
|----------|----------|
| `src/lib/export.ts` | invoke → export-api に置換 |
| `src/i18n/sync-menu.ts` | invoke → menu-api に置換 |
| `src/plugins/api/index.ts` | invoke → note-api に置換 |

### 編集（Component 層）

| ファイル | 変更内容 |
|----------|----------|
| `src/app.tsx` | invoke 除去。purge_expired_trash → appStore.purgeTrash() 呼び出しに変更 |
| `src/components/sidebar/folder-item.tsx` | invoke 除去。delete_folder → noteStore.deleteFolder, rename_folder → noteStore.renameFolder, move_note → noteStore.moveNote |
| `src/components/sidebar/folder-tree.tsx` | invoke 除去。create_folder → noteStore.createFolder, move_note → noteStore.moveNote |
| `src/components/trash/trash-modal.tsx` | invoke 除去。list_trash は sidebarStore.trashItems から取得。restore/delete/empty → sidebarStore アクションに移行 |
| `src/components/sidebar/trash-list.tsx` | invoke 除去。restore/delete/empty → sidebarStore アクションに移行 |
| `src/components/notelist/note-list-item.tsx` | invoke 除去。restore/delete → sidebarStore アクション。read_note for export → note-api.readNote 直呼び（export は特殊用途） |

### Cross-Store 除去による Component 側の追加変更

- `selectNote` から history push を除去した影響で、`selectNote` を呼ぶ Component が `useHistoryStore.getState().push(path)` を追加で呼ぶ必要がある。該当箇所を特定して修正。
- `setTrashGroupNotes(folder, notes)` の呼び出し側（trash-list.tsx等）で、`computeTrashGroups(trashItems, vaultPath)` を使って notes を計算してから渡す。

### 編集（Rust 層）

| ファイル | 変更内容 |
|----------|----------|
| `src-tauri/src/commands/fs_commands.rs` | `read_note`, `write_note`, `delete_note`, `rename_note` の先頭に `ensure_within_vault()` 追加 |
| `src-tauri/src/commands/folder_commands.rs` | `delete_folder`, `rename_folder` の先頭に `ensure_within_vault()` 追加 |
| `src-tauri/src/lib.rs:250` | `.expect()` → `unwrap_or_else(\|e\| { eprintln!(...); std::process::exit(1); })` に変更 |
| `src-tauri/src/commands/menu_commands.rs:102` | `.expect("must be on main thread")` → `.ok_or("must be on main thread")?` に変更 |

**注記**: `export_commands.rs` はユーザーが vault 外の任意ディレクトリにエクスポートする用途なので ensure_within_vault は適用しない。

---

## 実装順序

1. `src/lib/api/` の全ファイルを新規作成（破壊的変更なし）
2. Store 層を更新（lib/api を使うよう書き換え + 新アクション追加）
3. lib/plugin 層を更新
4. Component 層を更新（store アクション呼び出しに置換）
5. Rust 層を更新（ensure_within_vault 追加、expect 除去）

---

## 確認方法

- `pnpm check` でビルドエラー・lint エラーなし
- `cargo build` でコンパイルエラーなし
- アプリ起動後：ノート作成・保存・削除・フォルダ操作・ゴミ箱操作・検索・設定変更が正常動作すること
