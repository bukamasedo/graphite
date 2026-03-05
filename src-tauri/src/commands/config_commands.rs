use crate::utils::paths;
use std::fs;

#[tauri::command]
pub fn read_config() -> Result<serde_json::Value, String> {
    let path = paths::config_file_path()?;
    if !path.exists() {
        return Ok(serde_json::json!({}));
    }
    let content = fs::read_to_string(&path).map_err(|e| format!("Failed to read config: {}", e))?;
    serde_json::from_str(&content).map_err(|e| format!("Failed to parse config: {}", e))
}

#[tauri::command]
pub fn write_config(config: serde_json::Value) -> Result<(), String> {
    let path = paths::config_file_path()?;
    let json = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;
    fs::write(&path, json).map_err(|e| format!("Failed to write config: {}", e))
}

#[tauri::command]
pub fn read_settings() -> Result<serde_json::Value, String> {
    let path = paths::settings_file_path()?;
    if !path.exists() {
        return Ok(serde_json::json!({}));
    }
    let content =
        fs::read_to_string(&path).map_err(|e| format!("Failed to read settings: {}", e))?;
    serde_json::from_str(&content).map_err(|e| format!("Failed to parse settings: {}", e))
}

#[tauri::command]
pub fn write_settings(settings: serde_json::Value) -> Result<(), String> {
    let path = paths::settings_file_path()?;
    let json = serde_json::to_string_pretty(&settings)
        .map_err(|e| format!("Failed to serialize settings: {}", e))?;
    fs::write(&path, json).map_err(|e| format!("Failed to write settings: {}", e))
}

#[tauri::command]
pub fn read_hotkeys() -> Result<serde_json::Value, String> {
    let path = paths::hotkeys_file_path()?;
    if !path.exists() {
        return Ok(serde_json::json!({}));
    }
    let content =
        fs::read_to_string(&path).map_err(|e| format!("Failed to read hotkeys: {}", e))?;
    serde_json::from_str(&content).map_err(|e| format!("Failed to parse hotkeys: {}", e))
}

#[tauri::command]
pub fn write_hotkeys(hotkeys: serde_json::Value) -> Result<(), String> {
    let path = paths::hotkeys_file_path()?;
    let json = serde_json::to_string_pretty(&hotkeys)
        .map_err(|e| format!("Failed to serialize hotkeys: {}", e))?;
    fs::write(&path, json).map_err(|e| format!("Failed to write hotkeys: {}", e))
}

#[tauri::command]
pub fn read_custom_css() -> Result<String, String> {
    let path = paths::snippets_dir()?.join("custom.css");
    if !path.exists() {
        return Ok(String::new());
    }
    fs::read_to_string(&path).map_err(|e| format!("Failed to read custom CSS: {}", e))
}

#[tauri::command]
pub fn open_custom_css_file() -> Result<String, String> {
    let dir = paths::snippets_dir()?;
    fs::create_dir_all(&dir).map_err(|e| format!("Failed to create snippets dir: {}", e))?;
    let path = dir.join("custom.css");
    if !path.exists() {
        fs::write(&path, "/* Custom CSS for Graphite */\n")
            .map_err(|e| format!("Failed to create custom.css: {}", e))?;
    }
    path.to_str()
        .map(|s| s.to_string())
        .ok_or_else(|| "Invalid path".to_string())
}
