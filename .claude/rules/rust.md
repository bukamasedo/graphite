---
paths:
  - "src-tauri/**/*.rs"
---

# Rust / Tauri

## Commands

- 1 コマンド 1 責務。コマンドファイルはドメイン単位で分割
- 戻り値は Result<T, String>
- ファイルパス操作は必ず ensure_within_vault() を先頭で呼ぶ
- unwrap() / expect() 禁止。? 演算子で伝播させる

## Error Handling

- map_err(|e| format!("...: {}", e))? で統一
- ユーザー向けメッセージは英語の平文。スタックトレースを含めない

## Models

- #[derive(Debug, Clone, Serialize, Deserialize)] を基本セット
- JSON との橋渡しに #[serde(rename_all = "camelCase")] を使う

## Utils

- コマンド内でロジックが肥大化したら utils/ に切り出す
