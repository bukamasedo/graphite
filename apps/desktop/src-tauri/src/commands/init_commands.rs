use crate::utils::paths;
use std::fs;

#[tauri::command]
pub fn init_graphite_dir() -> Result<String, String> {
    let vault_dir = paths::graphite_dir()?;
    let config_dir = paths::graphite_config_dir()?;
    let trash_dir = paths::trash_dir()?;
    let plugins_dir = paths::plugins_dir()?;
    let snippets_dir = paths::snippets_dir()?;

    for dir in [&vault_dir, &config_dir, &trash_dir, &plugins_dir, &snippets_dir] {
        fs::create_dir_all(dir).map_err(|e| format!("Failed to create directory: {}", e))?;
    }

    let config_path = paths::config_file_path()?;
    if !config_path.exists() {
        let config = crate::models::config::GraphiteConfig {
            vault_path: vault_dir.to_string_lossy().to_string(),
            ..Default::default()
        };
        let json = serde_json::to_string_pretty(&config)
            .map_err(|e| format!("Failed to serialize config: {}", e))?;
        fs::write(&config_path, json)
            .map_err(|e| format!("Failed to write config: {}", e))?;
    }

    let settings_path = paths::settings_file_path()?;
    if !settings_path.exists() {
        fs::write(&settings_path, "{}")
            .map_err(|e| format!("Failed to write settings: {}", e))?;
    }

    let hotkeys_path = paths::hotkeys_file_path()?;
    if !hotkeys_path.exists() {
        fs::write(&hotkeys_path, "{}")
            .map_err(|e| format!("Failed to write hotkeys: {}", e))?;
    }

    Ok(vault_dir.to_string_lossy().to_string())
}
