use std::path::{Path, PathBuf};

pub fn graphite_dir() -> Result<PathBuf, String> {
    let home = dirs::home_dir().ok_or("Could not find home directory")?;
    Ok(home.join("Graphite"))
}

pub fn graphite_config_dir() -> Result<PathBuf, String> {
    Ok(graphite_dir()?.join(".graphite"))
}

pub fn config_file_path() -> Result<PathBuf, String> {
    Ok(graphite_config_dir()?.join("config.json"))
}

pub fn settings_file_path() -> Result<PathBuf, String> {
    Ok(graphite_config_dir()?.join("settings.json"))
}

pub fn hotkeys_file_path() -> Result<PathBuf, String> {
    Ok(graphite_config_dir()?.join("hotkeys.json"))
}

pub fn trash_dir() -> Result<PathBuf, String> {
    Ok(graphite_config_dir()?.join("trash"))
}

pub fn plugins_dir() -> Result<PathBuf, String> {
    Ok(graphite_config_dir()?.join("plugins"))
}

pub fn snippets_dir() -> Result<PathBuf, String> {
    Ok(graphite_config_dir()?.join("snippets"))
}

pub fn relative_path(full_path: &str, base: &str) -> String {
    full_path
        .strip_prefix(base)
        .unwrap_or(full_path)
        .trim_start_matches('/')
        .to_string()
}

pub fn folder_from_path(note_path: &str, vault_path: &str) -> String {
    let rel = relative_path(note_path, vault_path);
    match rel.rfind('/') {
        Some(idx) => rel[..idx].to_string(),
        None => String::new(),
    }
}

pub fn ensure_within_vault(path: &Path) -> Result<PathBuf, String> {
    let vault = graphite_dir()?;
    let vault_canonical = vault
        .canonicalize()
        .map_err(|e| format!("Vault directory not accessible: {}", e))?;

    // Reject explicit parent directory traversal
    for component in path.components() {
        if matches!(component, std::path::Component::ParentDir) {
            return Err("Access denied: path traversal detected".to_string());
        }
    }

    // Resolve the path
    let resolved = if path.exists() {
        path.canonicalize()
            .map_err(|e| format!("Failed to resolve path: {}", e))?
    } else if path.is_absolute() {
        path.to_path_buf()
    } else {
        vault_canonical.join(path)
    };

    if !resolved.starts_with(&vault_canonical) {
        return Err("Access denied: path is outside the vault directory".to_string());
    }

    Ok(resolved)
}

pub fn file_stem_string(path: &Path) -> String {
    path.file_stem()
        .unwrap_or_default()
        .to_string_lossy()
        .to_string()
}
