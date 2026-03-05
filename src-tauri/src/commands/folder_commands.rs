use crate::commands::trash_commands::{read_manifest, write_manifest, TrashEntry, MANIFEST_LOCK};
use crate::models::folder::Folder;
use crate::utils::frontmatter::parse_frontmatter;
use crate::utils::paths;
use chrono::Utc;
use std::fs;
use walkdir::WalkDir;

#[tauri::command]
pub fn list_folders() -> Result<Vec<Folder>, String> {
    let vault_path = paths::graphite_dir()?;
    if !vault_path.exists() {
        return Ok(Vec::new());
    }

    fn count_md_files(path: &std::path::Path) -> usize {
        let entries = match fs::read_dir(path) {
            Ok(e) => e,
            Err(_) => return 0,
        };
        let mut count = 0;
        for entry in entries.filter_map(|e| e.ok()) {
            let p = entry.path();
            if p.is_file() && p.extension().is_some_and(|ext| ext == "md") {
                count += 1;
            } else if p.is_dir()
                && !p
                    .file_name()
                    .unwrap_or_default()
                    .to_string_lossy()
                    .starts_with('.')
            {
                count += count_md_files(&p);
            }
        }
        count
    }

    fn scan_folder(path: &std::path::Path) -> Vec<Folder> {
        let mut folders = Vec::new();
        let entries = match fs::read_dir(path) {
            Ok(e) => e,
            Err(_) => return folders,
        };

        for entry in entries.filter_map(|e| e.ok()) {
            let entry_path = entry.path();
            if !entry_path.is_dir() {
                continue;
            }
            let name = entry_path
                .file_name()
                .unwrap_or_default()
                .to_string_lossy()
                .to_string();
            if name.starts_with('.') {
                continue;
            }
            folders.push(Folder {
                name,
                path: entry_path.to_string_lossy().to_string(),
                children: scan_folder(&entry_path),
                note_count: count_md_files(&entry_path),
            });
        }

        folders.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
        folders
    }

    Ok(scan_folder(&vault_path))
}

#[tauri::command]
pub fn count_all_notes() -> Result<usize, String> {
    let vault_path = paths::graphite_dir()?;
    if !vault_path.exists() {
        return Ok(0);
    }
    let count = WalkDir::new(&vault_path)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| {
            e.path().is_file()
                && e.path().extension().is_some_and(|ext| ext == "md")
                && !e
                    .path()
                    .components()
                    .any(|c| c.as_os_str().to_string_lossy().starts_with('.'))
        })
        .count();
    Ok(count)
}

#[tauri::command]
pub fn create_folder(name: String, parent: Option<String>) -> Result<Folder, String> {
    let vault_path = paths::graphite_dir()?;
    let base = match &parent {
        Some(p) if !p.is_empty() => std::path::PathBuf::from(p),
        _ => vault_path,
    };
    let folder_path = base.join(&name);

    paths::ensure_within_vault(&folder_path)?;

    if folder_path.exists() {
        return Err("Folder already exists".to_string());
    }

    fs::create_dir_all(&folder_path).map_err(|e| format!("Failed to create folder: {}", e))?;

    Ok(Folder {
        name,
        path: folder_path.to_string_lossy().to_string(),
        children: Vec::new(),
        note_count: 0,
    })
}

#[tauri::command]
pub fn delete_folder(path: String) -> Result<(), String> {
    let folder_path = std::path::Path::new(&path);
    if !folder_path.exists() {
        return Err("Folder does not exist".to_string());
    }

    let trash_dir = paths::trash_dir()?;
    fs::create_dir_all(&trash_dir).map_err(|e| format!("Failed to create trash dir: {}", e))?;

    let now = Utc::now().to_rfc3339();
    let _lock = MANIFEST_LOCK
        .lock()
        .map_err(|e| format!("Manifest lock error: {}", e))?;
    let mut entries = read_manifest()?;

    // Phase 1: Prepare all entries and move files.
    // Track new entries so we can write them to the manifest even if a move fails midway.
    let mut new_entries: Vec<TrashEntry> = Vec::new();

    let files: Vec<_> = WalkDir::new(folder_path)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| e.path().is_file())
        .collect();

    let mut move_error: Option<String> = None;

    for entry in &files {
        let file_path = entry.path();

        let filename = file_path
            .file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string();

        // Extract title: from frontmatter for .md files, filename for others
        let title = if file_path.extension().is_some_and(|ext| ext == "md") {
            fs::read_to_string(file_path)
                .ok()
                .and_then(|content| {
                    let (fm, _) = parse_frontmatter(&content);
                    fm.map(|f| f.title)
                })
                .unwrap_or_else(|| paths::file_stem_string(file_path))
        } else {
            filename.clone()
        };

        let id = uuid::Uuid::new_v4().to_string()[..8].to_string();
        let trash_file_path = trash_dir.join(format!("{}_{}", id, filename));

        match fs::rename(file_path, &trash_file_path) {
            Ok(()) => {
                new_entries.push(TrashEntry {
                    id,
                    original_path: file_path.to_string_lossy().to_string(),
                    trash_path: trash_file_path.to_string_lossy().to_string(),
                    title,
                    deleted_at: now.clone(),
                });
            }
            Err(e) => {
                move_error = Some(format!("Failed to move file to trash: {}", e));
                break;
            }
        }
    }

    // Phase 2: Always persist whatever was successfully moved so manifest stays consistent
    if !new_entries.is_empty() {
        entries.extend(new_entries);
        write_manifest(&entries)?;
    }

    if let Some(err) = move_error {
        return Err(err);
    }

    // Remove the now-empty folder structure
    let _ = fs::remove_dir_all(folder_path);

    Ok(())
}

#[tauri::command]
pub fn rename_folder(path: String, new_name: String) -> Result<String, String> {
    let old_path = std::path::Path::new(&path);
    let parent = old_path.parent().ok_or("Invalid path")?;
    let new_path = parent.join(&new_name);

    if new_path.exists() {
        return Err("A folder with this name already exists".to_string());
    }

    fs::rename(&path, &new_path).map_err(|e| format!("Failed to rename folder: {}", e))?;

    Ok(new_path.to_string_lossy().to_string())
}
