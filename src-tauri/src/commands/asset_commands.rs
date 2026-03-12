use std::collections::hash_map::DefaultHasher;
use std::fs;
use std::hash::{Hash, Hasher};
use std::path::Path;

use crate::utils::paths::{assets_dir, ensure_within_vault, graphite_dir};

const ALLOWED_EXTENSIONS: &[&str] = &["png", "jpg", "jpeg", "gif", "webp", "svg"];

fn validate_extension(ext: &str) -> Result<(), String> {
    if !ALLOWED_EXTENSIONS.contains(&ext.to_lowercase().as_str()) {
        return Err(format!("Unsupported image format: {}", ext));
    }
    Ok(())
}

fn generate_filename(seed: &str, ext: &str) -> String {
    let timestamp = chrono::Utc::now().timestamp();
    let mut hasher = DefaultHasher::new();
    seed.hash(&mut hasher);
    let hash = format!("{:016x}", hasher.finish());
    format!("{}_{}.{}", timestamp, &hash[..8], ext)
}

fn ensure_assets_dir() -> Result<std::path::PathBuf, String> {
    let dir = assets_dir()?;
    if !dir.exists() {
        fs::create_dir_all(&dir)
            .map_err(|e| format!("Failed to create assets directory: {}", e))?;
    }
    Ok(dir)
}

#[tauri::command]
pub fn save_image(source_path: String) -> Result<String, String> {
    let source = Path::new(&source_path);
    if !source.exists() {
        return Err("Source file does not exist".to_string());
    }

    let ext = source
        .extension()
        .and_then(|e| e.to_str())
        .ok_or("File has no extension")?
        .to_lowercase();
    validate_extension(&ext)?;

    let dir = ensure_assets_dir()?;
    let filename = generate_filename(&source_path, &ext);
    let dest = dir.join(&filename);

    ensure_within_vault(&dest)?;

    fs::copy(source, &dest).map_err(|e| format!("Failed to copy image: {}", e))?;

    Ok(format!(".graphite/assets/{}", filename))
}

#[tauri::command]
pub fn save_image_from_bytes(bytes: Vec<u8>, extension: String) -> Result<String, String> {
    let ext = extension.to_lowercase();
    validate_extension(&ext)?;

    let dir = ensure_assets_dir()?;
    let seed = format!("clipboard_{}", bytes.len());
    let filename = generate_filename(&seed, &ext);
    let dest = dir.join(&filename);

    ensure_within_vault(&dest)?;

    fs::write(&dest, &bytes).map_err(|e| format!("Failed to write image: {}", e))?;

    Ok(format!(".graphite/assets/{}", filename))
}

#[tauri::command]
pub fn export_image(relative_path: String, dest_path: String) -> Result<(), String> {
    let vault = graphite_dir()?;
    let source = vault.join(&relative_path);
    ensure_within_vault(&source)?;

    if !source.exists() {
        return Err("Source image does not exist".to_string());
    }

    let dest = Path::new(&dest_path);
    fs::copy(&source, dest).map_err(|e| format!("Failed to export image: {}", e))?;

    Ok(())
}
