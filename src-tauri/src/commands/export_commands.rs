use std::fs;
use std::path::PathBuf;

#[tauri::command]
pub fn write_export_file(path: String, content: String) -> Result<(), String> {
    let dest = PathBuf::from(&path);

    // Reject path traversal attempts
    for component in dest.components() {
        if matches!(component, std::path::Component::ParentDir) {
            return Err("Invalid export path".to_string());
        }
    }

    // Ensure parent directory exists
    if let Some(parent) = dest.parent() {
        if !parent.exists() {
            return Err("Parent directory does not exist".to_string());
        }
    }

    fs::write(&dest, content.as_bytes())
        .map_err(|e| format!("Failed to write export file: {}", e))
}
