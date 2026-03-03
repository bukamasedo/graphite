use crate::models::note::Note;
use crate::utils::frontmatter::parse_frontmatter;
use crate::utils::paths;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::fs;
use std::sync::Mutex;

pub static MANIFEST_LOCK: Mutex<()> = Mutex::new(());

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrashEntry {
    pub id: String,
    pub original_path: String,
    pub trash_path: String,
    pub title: String,
    pub deleted_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrashItem {
    pub id: String,
    pub title: String,
    pub original_path: String,
    pub trash_path: String,
    pub deleted_at: String,
    pub preview: String,
}

fn manifest_path() -> Result<std::path::PathBuf, String> {
    Ok(paths::trash_dir()?.join("manifest.json"))
}

pub fn read_manifest() -> Result<Vec<TrashEntry>, String> {
    let path = manifest_path()?;
    if !path.exists() {
        return Ok(Vec::new());
    }
    let content = fs::read_to_string(&path)
        .map_err(|e| format!("Failed to read trash manifest: {}", e))?;
    serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse trash manifest: {}", e))
}

pub fn write_manifest(entries: &[TrashEntry]) -> Result<(), String> {
    let path = manifest_path()?;
    let json = serde_json::to_string_pretty(entries)
        .map_err(|e| format!("Failed to serialize trash manifest: {}", e))?;
    fs::write(&path, json)
        .map_err(|e| format!("Failed to write trash manifest: {}", e))
}

pub fn add_to_manifest(entry: TrashEntry) -> Result<(), String> {
    let _lock = MANIFEST_LOCK.lock().map_err(|e| format!("Manifest lock error: {}", e))?;
    let mut entries = read_manifest()?;
    entries.push(entry);
    write_manifest(&entries)
}

fn extract_preview(content: &str, max_len: usize) -> String {
    let mut lines = Vec::new();
    for line in content.lines() {
        let trimmed = line.trim();
        if trimmed.is_empty() || trimmed.starts_with('#') || trimmed.starts_with("```") {
            continue;
        }
        // Skip frontmatter
        if trimmed == "---" {
            continue;
        }
        // Skip frontmatter fields
        if trimmed.contains(": ") && lines.is_empty() {
            continue;
        }
        lines.push(trimmed.to_string());
        if lines.len() >= 3 {
            break;
        }
    }
    let preview = lines.join(" ");
    if preview.len() > max_len {
        format!("{}...", &preview[..max_len])
    } else {
        preview
    }
}

#[tauri::command]
pub fn list_trash() -> Result<Vec<TrashItem>, String> {
    let _lock = MANIFEST_LOCK.lock().map_err(|e| format!("Manifest lock error: {}", e))?;
    let entries = read_manifest()?;
    let mut live_entries: Vec<TrashEntry> = Vec::new();
    let mut items: Vec<TrashItem> = Vec::new();

    for e in &entries {
        if !std::path::Path::new(&e.trash_path).exists() {
            continue;
        }
        live_entries.push(e.clone());
        let preview = fs::read_to_string(&e.trash_path)
            .map(|c| extract_preview(&c, 120))
            .unwrap_or_default();
        items.push(TrashItem {
            id: e.id.clone(),
            title: e.title.clone(),
            original_path: e.original_path.clone(),
            trash_path: e.trash_path.clone(),
            deleted_at: e.deleted_at.clone(),
            preview,
        });
    }

    // Prune orphaned entries from manifest
    if live_entries.len() != entries.len() {
        let _ = write_manifest(&live_entries);
    }

    // Sort by deleted_at descending (newest first)
    items.sort_by(|a, b| b.deleted_at.cmp(&a.deleted_at));
    Ok(items)
}

#[tauri::command]
pub fn restore_note(id: String) -> Result<(), String> {
    let _lock = MANIFEST_LOCK.lock().map_err(|e| format!("Manifest lock error: {}", e))?;
    let entries = read_manifest()?;
    let entry = entries
        .iter()
        .find(|e| e.id == id)
        .ok_or("Trash item not found")?
        .clone();

    let trash_path = std::path::Path::new(&entry.trash_path);
    if !trash_path.exists() {
        // Remove stale entry from manifest
        let remaining: Vec<_> = entries.into_iter().filter(|e| e.id != id).collect();
        write_manifest(&remaining)?;
        return Err("Trash file no longer exists".to_string());
    }

    let original = std::path::Path::new(&entry.original_path);

    // Ensure parent directory exists
    if let Some(parent) = original.parent() {
        fs::create_dir_all(parent)
            .map_err(|e| format!("Failed to create directory: {}", e))?;
    }

    // If original path is occupied, find a unique name
    let restore_path = if original.exists() {
        let stem = original
            .file_stem()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string();
        let parent = original.parent()
            .ok_or("Invalid restore path: no parent directory")?;
        let mut counter = 1;
        loop {
            let candidate = parent.join(format!("{} ({}).md", stem, counter));
            if !candidate.exists() {
                break candidate;
            }
            counter += 1;
        }
    } else {
        original.to_path_buf()
    };

    fs::rename(&entry.trash_path, &restore_path)
        .map_err(|e| format!("Failed to restore note: {}", e))?;

    let remaining: Vec<_> = entries.into_iter().filter(|e| e.id != id).collect();
    write_manifest(&remaining)?;

    Ok(())
}

#[tauri::command]
pub fn permanently_delete_trash(id: String) -> Result<(), String> {
    let _lock = MANIFEST_LOCK.lock().map_err(|e| format!("Manifest lock error: {}", e))?;
    let entries = read_manifest()?;
    let entry = entries.iter().find(|e| e.id == id);

    if let Some(entry) = entry {
        let trash_path = std::path::Path::new(&entry.trash_path);
        if trash_path.exists() {
            if trash_path.is_dir() {
                fs::remove_dir_all(trash_path)
                    .map_err(|e| format!("Failed to delete: {}", e))?;
            } else {
                fs::remove_file(trash_path)
                    .map_err(|e| format!("Failed to delete: {}", e))?;
            }
        }
    }

    let remaining: Vec<_> = entries.into_iter().filter(|e| e.id != id).collect();
    write_manifest(&remaining)?;

    Ok(())
}

#[tauri::command]
pub fn empty_trash() -> Result<(), String> {
    let _lock = MANIFEST_LOCK.lock().map_err(|e| format!("Manifest lock error: {}", e))?;
    let entries = read_manifest()?;
    for entry in &entries {
        let path = std::path::Path::new(&entry.trash_path);
        if path.exists() {
            if path.is_dir() {
                let _ = fs::remove_dir_all(path);
            } else {
                let _ = fs::remove_file(path);
            }
        }
    }
    write_manifest(&[])?;
    Ok(())
}

#[tauri::command]
pub fn purge_expired_trash(retention_days: u32) -> Result<u32, String> {
    let _lock = MANIFEST_LOCK.lock().map_err(|e| format!("Manifest lock error: {}", e))?;
    let entries = read_manifest()?;
    let now = Utc::now();
    let mut kept = Vec::new();
    let mut purged: u32 = 0;

    for entry in entries {
        let deleted_at = DateTime::parse_from_rfc3339(&entry.deleted_at)
            .map(|dt| dt.with_timezone(&Utc))
            .unwrap_or(now);

        let age_days = (now - deleted_at).num_days();

        if age_days >= retention_days as i64 {
            let path = std::path::Path::new(&entry.trash_path);
            if path.exists() {
                if path.is_dir() {
                    let _ = fs::remove_dir_all(path);
                } else {
                    let _ = fs::remove_file(path);
                }
            }
            purged += 1;
        } else {
            kept.push(entry);
        }
    }

    write_manifest(&kept)?;
    Ok(purged)
}

#[tauri::command]
pub fn read_trash_note(id: String) -> Result<Note, String> {
    let entries = read_manifest()?;
    let entry = entries
        .iter()
        .find(|e| e.id == id)
        .ok_or("Trash item not found")?;

    let trash_path = std::path::Path::new(&entry.trash_path);
    if !trash_path.exists() {
        return Err("Trash file no longer exists".to_string());
    }

    let content = fs::read_to_string(trash_path)
        .map_err(|e| format!("Failed to read trash note: {}", e))?;

    let (fm, body) = parse_frontmatter(&content);

    let title = fm.as_ref().map(|f| f.title.clone()).unwrap_or_else(|| entry.title.clone());
    let tags = fm.as_ref().map(|f| f.tags.clone()).unwrap_or_default();
    let created = fm.as_ref().map(|f| f.created.clone()).unwrap_or_default();
    let modified = fm.as_ref().map(|f| f.modified.clone()).unwrap_or_else(|| entry.deleted_at.clone());

    Ok(Note {
        id: entry.id.clone(),
        title,
        content: body,
        path: entry.trash_path.clone(),
        folder: String::new(),
        tags,
        created,
        modified,
        pinned: false,
    })
}
