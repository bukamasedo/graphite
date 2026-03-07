# MCP サーバー Tauri 統合 実装計画

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** MCP サーバーをスタンドアロンバイナリとして Tauri アプリに同梱し、設定画面からワンクリックで Claude Desktop と連携できるようにする。

**Architecture:** Node SEA でバイナリ化した MCP サーバーを Tauri の externalBin として同梱。設定画面に「連携」セクションを追加し、トグルで `claude_desktop_config.json` への設定書き出し/削除を行う。プロセス管理は不要（Claude Desktop が stdio で spawn する）。

**Tech Stack:** Rust (Tauri 2), React 18, TypeScript, Zustand, esbuild, Node SEA

**Design doc:** `docs/plans/2026-03-07-mcp-tauri-integration-design.md`

---

### Task 1: MCP サーバーバイナリのビルドスクリプト作成

**Files:**
- Create: `mcp-server/build.mjs`
- Create: `mcp-server/sea-config.json`
- Modify: `mcp-server/package.json`

**Step 1: esbuild を devDependency に追加**

```bash
cd mcp-server && npm install --save-dev esbuild
```

**Step 2: Node SEA 設定ファイルを作成**

Create `mcp-server/sea-config.json`:
```json
{
  "main": "dist/bundle.cjs",
  "output": "dist/sea-prep.blob",
  "disableExperimentalSEAWarning": true
}
```

**Step 3: ビルドスクリプトを作成**

Create `mcp-server/build.mjs`:
```javascript
import { build } from 'esbuild';
import { execSync } from 'child_process';
import { cpSync, chmodSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isCI = process.env.CI === 'true';

// Step 1: TypeScript compile
console.log('Compiling TypeScript...');
execSync('npx tsc', { cwd: __dirname, stdio: 'inherit' });

// Step 2: Bundle to single CJS file (Node SEA requires CJS)
console.log('Bundling with esbuild...');
await build({
  entryPoints: [resolve(__dirname, 'dist/index.js')],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'cjs',
  outfile: resolve(__dirname, 'dist/bundle.cjs'),
});

// Step 3: Generate SEA blob
console.log('Generating SEA blob...');
execSync('node --experimental-sea-config sea-config.json', {
  cwd: __dirname,
  stdio: 'inherit',
});

// Step 4: Copy node binary and inject blob
const nodePath = process.execPath;
const outputName = `graphite-mcp`;
const outputPath = resolve(__dirname, `dist/${outputName}`);

console.log('Creating standalone binary...');
cpSync(nodePath, outputPath);
chmodSync(outputPath, 0o755);

// Remove signature (macOS)
if (process.platform === 'darwin') {
  try {
    execSync(`codesign --remove-signature "${outputPath}"`, { stdio: 'inherit' });
  } catch {
    console.warn('codesign --remove-signature failed, continuing...');
  }
}

// Inject SEA blob
execSync(
  `npx postject "${outputPath}" NODE_SEA_BLOB dist/sea-prep.blob --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6ac44da5e856c3132 --macho-segment-name NODE_SEA`,
  { cwd: __dirname, stdio: 'inherit' }
);

// Re-sign (macOS)
if (process.platform === 'darwin') {
  try {
    execSync(`codesign --sign - "${outputPath}"`, { stdio: 'inherit' });
  } catch {
    console.warn('codesign --sign failed, continuing...');
  }
}

console.log(`Built: ${outputPath}`);
```

**Step 4: package.json にスクリプト追加**

`mcp-server/package.json` の `scripts` に追加:
```json
"scripts": {
  "build": "tsc",
  "build:binary": "node build.mjs",
  "dev": "tsc --watch"
}
```

Also add `postject` to devDependencies:
```bash
cd mcp-server && npm install --save-dev postject
```

**Step 5: ビルドテスト**

```bash
cd mcp-server && npm run build:binary
```
Expected: `mcp-server/dist/graphite-mcp` バイナリが生成される。

**Step 6: バイナリ動作テスト**

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"0.1.0"}}}' | ./mcp-server/dist/graphite-mcp
```
Expected: JSON-RPC レスポンスが返る。

**Step 7: コミット**

```bash
git add mcp-server/build.mjs mcp-server/sea-config.json mcp-server/package.json mcp-server/package-lock.json
git commit -m "feat(mcp): add standalone binary build script with Node SEA"
```

---

### Task 2: Tauri externalBin 設定とバイナリ配置

**Files:**
- Modify: `src-tauri/tauri.conf.json:1-53`
- Create: `src-tauri/binaries/` (directory)

**Step 1: バイナリディレクトリ作成とバイナリコピー**

Tauri の externalBin は `src-tauri/binaries/` に target triple 付きで配置する必要がある。

```bash
mkdir -p src-tauri/binaries
```

ターゲットトリプルを確認:
```bash
rustc -vV | grep host
```
例: `host: aarch64-apple-darwin`

バイナリをコピー:
```bash
cp mcp-server/dist/graphite-mcp "src-tauri/binaries/graphite-mcp-$(rustc -vV | grep host | cut -d' ' -f2)"
```

**Step 2: tauri.conf.json に externalBin を追加**

`src-tauri/tauri.conf.json` の `bundle` セクションに追加:
```json
{
  "bundle": {
    "externalBin": [
      "binaries/graphite-mcp"
    ]
  }
}
```

**Note:** Tauri は自動的にターゲットトリプルのサフィックスを補完する。

**Step 3: .gitignore にバイナリを追加**

`src-tauri/binaries/` 内のバイナリは git 管理しない（CI でビルドする）:
```bash
echo "src-tauri/binaries/" >> .gitignore
```

**Step 4: コミット**

```bash
git add src-tauri/tauri.conf.json .gitignore
git commit -m "feat(mcp): configure Tauri externalBin for MCP server sidecar"
```

---

### Task 3: Rust コマンド実装

**Files:**
- Create: `src-tauri/src/commands/mcp_commands.rs`
- Modify: `src-tauri/src/commands/mod.rs:1-11`
- Modify: `src-tauri/src/lib.rs:287-319` (generate_handler に追加)

**Step 1: mcp_commands.rs を作成**

Create `src-tauri/src/commands/mcp_commands.rs`:
```rust
use serde_json::{json, Value};
use std::fs;
use std::path::PathBuf;
use tauri::Manager;

/// Get the absolute path to the bundled MCP server binary
#[tauri::command]
pub fn get_mcp_binary_path(app_handle: tauri::AppHandle) -> Result<String, String> {
    let resource_path = app_handle
        .path()
        .resource_dir()
        .map_err(|e| format!("Failed to get resource dir: {}", e))?
        .join("binaries")
        .join(if cfg!(target_os = "windows") {
            "graphite-mcp.exe"
        } else {
            "graphite-mcp"
        });

    if !resource_path.exists() {
        return Err("MCP server binary not found".to_string());
    }

    resource_path
        .to_str()
        .map(|s| s.to_string())
        .ok_or_else(|| "Invalid binary path encoding".to_string())
}

/// Get the Claude Desktop config file path
fn claude_desktop_config_path() -> Result<PathBuf, String> {
    let home = dirs::home_dir().ok_or("Cannot determine home directory")?;
    let path = if cfg!(target_os = "macos") {
        home.join("Library")
            .join("Application Support")
            .join("Claude")
            .join("claude_desktop_config.json")
    } else if cfg!(target_os = "windows") {
        home.join("AppData")
            .join("Roaming")
            .join("Claude")
            .join("claude_desktop_config.json")
    } else {
        home.join(".config")
            .join("Claude")
            .join("claude_desktop_config.json")
    };
    Ok(path)
}

/// Write graphite MCP server entry to Claude Desktop config
#[tauri::command]
pub fn configure_claude_desktop(app_handle: tauri::AppHandle) -> Result<(), String> {
    let binary_path = get_mcp_binary_path(app_handle)?;
    let config_path = claude_desktop_config_path()?;

    // Ensure parent directory exists
    if let Some(parent) = config_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create config directory: {}", e))?;
    }

    // Read existing config or start with empty object
    let mut config: Value = if config_path.exists() {
        let content = fs::read_to_string(&config_path)
            .map_err(|e| format!("Failed to read Claude config: {}", e))?;
        serde_json::from_str(&content)
            .map_err(|e| format!("Failed to parse Claude config: {}", e))?
    } else {
        json!({})
    };

    // Ensure mcpServers object exists
    if config.get("mcpServers").is_none() {
        config["mcpServers"] = json!({});
    }

    // Add graphite entry
    config["mcpServers"]["graphite"] = json!({
        "command": binary_path
    });

    // Write back
    let content = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;
    fs::write(&config_path, content)
        .map_err(|e| format!("Failed to write Claude config: {}", e))?;

    Ok(())
}

/// Remove graphite MCP server entry from Claude Desktop config
#[tauri::command]
pub fn remove_claude_desktop() -> Result<(), String> {
    let config_path = claude_desktop_config_path()?;

    if !config_path.exists() {
        return Ok(());
    }

    let content = fs::read_to_string(&config_path)
        .map_err(|e| format!("Failed to read Claude config: {}", e))?;
    let mut config: Value = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse Claude config: {}", e))?;

    // Remove graphite entry
    if let Some(servers) = config.get_mut("mcpServers") {
        if let Some(obj) = servers.as_object_mut() {
            obj.remove("graphite");
        }
    }

    let content = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;
    fs::write(&config_path, content)
        .map_err(|e| format!("Failed to write Claude config: {}", e))?;

    Ok(())
}
```

**Step 2: mod.rs にモジュール追加**

`src-tauri/src/commands/mod.rs` に追加:
```rust
pub mod mcp_commands;
```

**Step 3: lib.rs の generate_handler にコマンド登録**

`src-tauri/src/lib.rs` の `generate_handler![]` マクロ内に追加:
```rust
commands::mcp_commands::get_mcp_binary_path,
commands::mcp_commands::configure_claude_desktop,
commands::mcp_commands::remove_claude_desktop,
```

**Step 4: Tauri capabilities に shell:allow-execute を追加**

`src-tauri/capabilities/default.json` の permissions に追加:
```json
"shell:allow-execute"
```

Note: externalBin の実行には shell:allow-execute 権限が必要。

**Step 5: ビルド確認**

```bash
cd src-tauri && cargo check
```
Expected: コンパイルエラーなし。

**Step 6: コミット**

```bash
git add src-tauri/src/commands/mcp_commands.rs src-tauri/src/commands/mod.rs src-tauri/src/lib.rs src-tauri/capabilities/default.json
git commit -m "feat(mcp): add Rust commands for Claude Desktop config management"
```

---

### Task 4: フロントエンド API ラッパー

**Files:**
- Create: `src/lib/api/mcp-api.ts`

**Step 1: API ラッパー作成**

Create `src/lib/api/mcp-api.ts`:
```typescript
import { invoke } from '@tauri-apps/api/core';

export const mcpApi = {
  getMcpBinaryPath: () => invoke<string>('get_mcp_binary_path'),
  configureClaude: () => invoke<void>('configure_claude_desktop'),
  removeClaude: () => invoke<void>('remove_claude_desktop'),
};
```

**Step 2: コミット**

```bash
git add src/lib/api/mcp-api.ts
git commit -m "feat(mcp): add frontend API wrapper for MCP commands"
```

---

### Task 5: GraphiteConfig に mcpEnabled を追加

**Files:**
- Modify: `src/types/config.ts:1-15`

**Step 1: GraphiteConfig インターフェースに追加**

`src/types/config.ts` の `GraphiteConfig` に追加:
```typescript
mcpEnabled: boolean;
```

**Step 2: DEFAULT_CONFIG にデフォルト値追加**

`src/types/config.ts` の `DEFAULT_CONFIG` に追加:
```typescript
mcpEnabled: false,
```

**Step 3: コミット**

```bash
git add src/types/config.ts
git commit -m "feat(mcp): add mcpEnabled to GraphiteConfig"
```

---

### Task 6: SettingsSection に 'integrations' を追加

**Files:**
- Modify: `src/stores/app-store.ts:6-11` (SettingsSection 型)

**Step 1: SettingsSection 型に追加**

`src/stores/app-store.ts` の `SettingsSection` 型に `'integrations'` を追加:
```typescript
export type SettingsSection =
  | 'general'
  | 'editor'
  | 'appearance'
  | 'hotkeys'
  | 'integrations'
  | 'about';
```

**Step 2: コミット**

```bash
git add src/stores/app-store.ts
git commit -m "feat(mcp): add integrations to SettingsSection type"
```

---

### Task 7: i18n 翻訳キーの追加

**Files:**
- Modify: `src/i18n/locales/en.json`
- Modify: `src/i18n/locales/ja.json`

**Step 1: en.json に翻訳キー追加**

settings セクション内に追加:
```json
"settings.integrations": "Integrations",
"settings.mcpServer": "Claude Desktop",
"settings.mcpServerDescription": "Connect Graphite to Claude Desktop via MCP",
"settings.mcpEnabled": "Enable integration",
"settings.mcpConfigured": "Please restart Claude Desktop to apply changes.",
"settings.mcpRemoved": "Integration removed. Restart Claude Desktop to apply.",
"settings.mcpError": "Failed to configure: {{error}}"
```

**Step 2: ja.json に翻訳キー追加**

```json
"settings.integrations": "連携",
"settings.mcpServer": "Claude Desktop",
"settings.mcpServerDescription": "MCP を通じて Graphite を Claude Desktop に接続",
"settings.mcpEnabled": "連携を有効にする",
"settings.mcpConfigured": "Claude Desktop を再起動してください。",
"settings.mcpRemoved": "連携を解除しました。Claude Desktop を再起動してください。",
"settings.mcpError": "設定に失敗しました: {{error}}"
```

**Step 3: コミット**

```bash
git add src/i18n/locales/en.json src/i18n/locales/ja.json
git commit -m "feat(mcp): add i18n keys for integrations section"
```

---

### Task 8: 連携セクション UI コンポーネント

**Files:**
- Create: `src/components/settings/sections/integrations-section.tsx`

**Step 1: コンポーネント作成**

Create `src/components/settings/sections/integrations-section.tsx`:
```tsx
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Switch } from '@/components/ui/switch';
import { useSettingsStore } from '@/stores/settings-store';
import { mcpApi } from '@/lib/api/mcp-api';

export function IntegrationsSection() {
  const { t } = useTranslation();
  const { settings, updateSetting } = useSettingsStore();
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleToggle = async (enabled: boolean) => {
    setMessage(null);
    try {
      if (enabled) {
        await mcpApi.configureClaude();
        setMessage({ type: 'success', text: t('settings.mcpConfigured') });
      } else {
        await mcpApi.removeClaude();
        setMessage({ type: 'success', text: t('settings.mcpRemoved') });
      }
      updateSetting('mcpEnabled', enabled);
    } catch (e) {
      setMessage({
        type: 'error',
        text: t('settings.mcpError', { error: e instanceof Error ? e.message : String(e) }),
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-foreground">
          {t('settings.mcpServer')}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t('settings.mcpServerDescription')}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-sm">{t('settings.mcpEnabled')}</span>
          <Switch
            checked={settings.mcpEnabled}
            onCheckedChange={handleToggle}
          />
        </div>
        {message && (
          <p
            className={`text-sm ${
              message.type === 'success' ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {message.text}
          </p>
        )}
      </div>
    </div>
  );
}
```

**Step 2: コミット**

```bash
git add src/components/settings/sections/integrations-section.tsx
git commit -m "feat(mcp): add integrations settings section component"
```

---

### Task 9: 設定画面に連携セクションを統合

**Files:**
- Modify: `src/components/settings/settings-content.tsx:1-42`
- Modify: `src/components/settings/settings-sidebar.tsx:13-28`

**Step 1: settings-content.tsx に IntegrationsSection を追加**

Import を追加:
```typescript
import { IntegrationsSection } from './sections/integrations-section';
```

条件レンダリングに追加 (`hotkeys` セクションの後、`about` の前):
```tsx
{settingsSection === 'integrations' && <IntegrationsSection />}
```

**Step 2: settings-sidebar.tsx にメニュー項目を追加**

Import を追加:
```typescript
import { Plug } from 'lucide-react';
```

`sectionIcons` に追加:
```typescript
integrations: Plug,
```

`sectionKeys` 配列に `'integrations'` を追加:
```typescript
const sectionKeys: SettingsSection[] = ['general', 'editor', 'appearance', 'hotkeys', 'integrations'];
```

**Step 3: ビルド確認**

```bash
pnpm build
```
Expected: ビルド成功。

**Step 4: コミット**

```bash
git add src/components/settings/settings-content.tsx src/components/settings/settings-sidebar.tsx
git commit -m "feat(mcp): integrate settings section into settings UI"
```

---

### Task 10: 動作確認と最終コミット

**Step 1: フロントエンドビルド確認**

```bash
pnpm build
```

**Step 2: Rust ビルド確認**

```bash
cd src-tauri && cargo check
```

**Step 3: Tauri アプリ起動テスト**

```bash
pnpm tauri dev
```

手動確認:
1. Settings → 連携セクションが表示される
2. トグル ON → Claude Desktop config に graphite エントリが書き出される
3. トグル OFF → エントリが削除される

**Step 4: 最終コミット（必要に応じて修正）**

```bash
git add -A
git commit -m "feat(mcp): finalize MCP server Tauri integration"
```
