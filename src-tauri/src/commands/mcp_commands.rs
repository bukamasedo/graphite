use serde_json::{json, Value};
use std::fs;
use std::path::PathBuf;

/// Resolve the MCP sidecar binary path.
/// - Production: next to the main executable (Tauri externalBin convention)
/// - Dev: in src-tauri/binaries/ (compile-time CARGO_MANIFEST_DIR)
#[tauri::command]
pub fn get_mcp_binary_path() -> Result<String, String> {
    let binary_name = if cfg!(target_os = "windows") {
        format!("graphite-mcp-{}.exe", env!("TARGET_TRIPLE"))
    } else {
        format!("graphite-mcp-{}", env!("TARGET_TRIPLE"))
    };

    // Production: sidecar is next to the main binary
    if let Ok(exe) = std::env::current_exe() {
        if let Some(dir) = exe.parent() {
            let path = dir.join(&binary_name);
            if path.exists() {
                return path
                    .to_str()
                    .map(|s| s.to_string())
                    .ok_or_else(|| "Invalid binary path encoding".to_string());
            }
        }
    }

    // Dev: binary is in src-tauri/binaries/
    let dev_path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("binaries")
        .join(&binary_name);
    if dev_path.exists() {
        return dev_path
            .to_str()
            .map(|s| s.to_string())
            .ok_or_else(|| "Invalid binary path encoding".to_string());
    }

    Err(format!("MCP server binary not found: {}", binary_name))
}

/// Get the config file path for a given MCP client.
fn mcp_client_config_path(client_id: &str) -> Result<PathBuf, String> {
    let home = dirs::home_dir().ok_or("Cannot determine home directory")?;
    let path = match client_id {
        "claude-desktop" => {
            if cfg!(target_os = "macos") {
                home.join("Library/Application Support/Claude/claude_desktop_config.json")
            } else if cfg!(target_os = "windows") {
                home.join("AppData/Roaming/Claude/claude_desktop_config.json")
            } else {
                home.join(".config/Claude/claude_desktop_config.json")
            }
        }
        "cursor" => home.join(".cursor/mcp.json"),
        "windsurf" => home.join(".codeium/windsurf/mcp_config.json"),
        _ => return Err(format!("Unknown MCP client: {}", client_id)),
    };
    Ok(path)
}

/// Write graphite MCP server entry to a client's config file
#[tauri::command]
pub fn configure_mcp_client(client_id: String) -> Result<(), String> {
    let binary_path = get_mcp_binary_path()?;
    let config_path = mcp_client_config_path(&client_id)?;

    if let Some(parent) = config_path.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create config directory: {}", e))?;
    }

    let mut config: Value = if config_path.exists() {
        let content = fs::read_to_string(&config_path)
            .map_err(|e| format!("Failed to read config: {}", e))?;
        serde_json::from_str(&content).map_err(|e| format!("Failed to parse config: {}", e))?
    } else {
        json!({})
    };

    if config.get("mcpServers").is_none() {
        config["mcpServers"] = json!({});
    }

    config["mcpServers"]["graphite"] = json!({
        "command": binary_path
    });

    let content = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;
    fs::write(&config_path, content).map_err(|e| format!("Failed to write config: {}", e))?;

    Ok(())
}

/// Remove graphite MCP server entry from a client's config file
#[tauri::command]
pub fn remove_mcp_client(client_id: String) -> Result<(), String> {
    let config_path = mcp_client_config_path(&client_id)?;

    if !config_path.exists() {
        return Ok(());
    }

    let content =
        fs::read_to_string(&config_path).map_err(|e| format!("Failed to read config: {}", e))?;
    let mut config: Value =
        serde_json::from_str(&content).map_err(|e| format!("Failed to parse config: {}", e))?;

    if let Some(servers) = config.get_mut("mcpServers") {
        if let Some(obj) = servers.as_object_mut() {
            obj.remove("graphite");
        }
    }

    let content = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;
    fs::write(&config_path, content).map_err(|e| format!("Failed to write config: {}", e))?;

    Ok(())
}
