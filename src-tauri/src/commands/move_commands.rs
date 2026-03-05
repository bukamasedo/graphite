use crate::utils::paths;
use std::fs;
use std::path::PathBuf;

#[tauri::command]
pub fn move_note(note_path: String, target_folder: String) -> Result<String, String> {
    let vault = paths::graphite_dir()?;

    let source = PathBuf::from(&note_path);
    let source = paths::ensure_within_vault(&source)?;

    if !source.exists() {
        return Err("Source note does not exist".to_string());
    }

    let file_name = source
        .file_name()
        .ok_or("Invalid source file name")?
        .to_string_lossy()
        .to_string();

    // Build target directory
    let target_dir = if target_folder.is_empty() {
        vault.clone()
    } else {
        let t = PathBuf::from(&target_folder);
        if t.is_absolute() {
            t
        } else {
            vault.join(&target_folder)
        }
    };
    let target_dir = paths::ensure_within_vault(&target_dir)?;

    if !target_dir.exists() {
        return Err("Target folder does not exist".to_string());
    }

    let dest = target_dir.join(&file_name);

    // Don't move to same location
    if source == dest {
        return Ok(dest.to_string_lossy().to_string());
    }

    // Check for name collision
    if dest.exists() {
        return Err("A note with this name already exists in the target folder".to_string());
    }

    fs::rename(&source, &dest).map_err(|e| format!("Failed to move note: {}", e))?;

    Ok(dest.to_string_lossy().to_string())
}
