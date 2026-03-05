use crate::commands::trash_commands::{add_to_manifest, TrashEntry};
use crate::models::note::{Note, NoteFrontmatter, NoteListItem};
use crate::utils::frontmatter::{extract_preview, parse_frontmatter, serialize_frontmatter};
use crate::utils::paths;
use chrono::Utc;
use std::fs;
use uuid::Uuid;
use walkdir::WalkDir;

#[tauri::command]
pub fn list_notes(
    folder: Option<String>,
    tag: Option<String>,
) -> Result<Vec<NoteListItem>, String> {
    let vault_path = paths::graphite_dir()?;

    // When filtering by tag, always search entire vault
    let search_dir = if tag.is_some() {
        vault_path.clone()
    } else {
        match &folder {
            Some(f) if !f.is_empty() => {
                let p = std::path::PathBuf::from(f);
                if p.is_absolute() {
                    p
                } else {
                    vault_path.join(f)
                }
            }
            _ => vault_path.clone(),
        }
    };

    let search_dir = paths::ensure_within_vault(&search_dir)?;

    if !search_dir.exists() {
        return Ok(Vec::new());
    }

    let mut notes: Vec<NoteListItem> = Vec::new();

    for entry in WalkDir::new(&search_dir).into_iter().filter_map(|e| e.ok()) {
        let path = entry.path();
        if path.extension().is_none_or(|ext| ext != "md") {
            continue;
        }
        if path
            .components()
            .any(|c| c.as_os_str().to_string_lossy().starts_with('.'))
        {
            continue;
        }

        let content = match fs::read_to_string(path) {
            Ok(c) => c,
            Err(e) => {
                eprintln!("Failed to read {}: {}", path.display(), e);
                continue;
            }
        };

        let (fm, body) = parse_frontmatter(&content);
        let fm = fm.unwrap_or_else(|| NoteFrontmatter::with_title(paths::file_stem_string(path)));

        // Filter by tag if specified
        if let Some(ref tag_filter) = tag {
            if !fm.tags.iter().any(|t| t == tag_filter) {
                continue;
            }
        }

        let path_str = path.to_string_lossy().to_string();
        let folder_name = paths::folder_from_path(&path_str, &vault_path.to_string_lossy());

        notes.push(NoteListItem {
            id: path_str.clone(),
            title: fm.title.clone(),
            path: path_str,
            folder: folder_name,
            tags: fm.tags,
            created: fm.created,
            modified: fm.modified.clone(),
            pinned: fm.pinned,
            preview: extract_preview(&body, 120),
        });
    }

    // Sort: pinned first, then by modified date descending
    notes.sort_by(|a, b| {
        b.pinned
            .cmp(&a.pinned)
            .then_with(|| b.modified.cmp(&a.modified))
    });

    Ok(notes)
}

#[tauri::command]
pub fn read_note(path: String) -> Result<Note, String> {
    let content = fs::read_to_string(&path).map_err(|e| format!("Failed to read note: {}", e))?;

    let (fm, body) = parse_frontmatter(&content);
    let vault_path = paths::graphite_dir()?.to_string_lossy().to_string();
    let folder_name = paths::folder_from_path(&path, &vault_path);

    let fm = fm.unwrap_or_else(|| {
        NoteFrontmatter::with_title(paths::file_stem_string(std::path::Path::new(&path)))
    });

    Ok(Note {
        id: path.clone(),
        title: fm.title,
        content: body,
        path,
        folder: folder_name,
        tags: fm.tags,
        created: fm.created,
        modified: fm.modified,
        pinned: fm.pinned,
    })
}

#[tauri::command]
pub fn write_note(
    path: String,
    content: String,
    title: Option<String>,
    tags: Option<Vec<String>>,
    pinned: Option<bool>,
) -> Result<(), String> {
    if !std::path::Path::new(&path).exists() {
        return Err("Note file not found (may have been renamed)".to_string());
    }
    let existing =
        fs::read_to_string(&path).map_err(|e| format!("Failed to read existing note: {}", e))?;
    let (existing_fm, _) = parse_frontmatter(&existing);

    let mut fm = existing_fm.unwrap_or_else(|| {
        NoteFrontmatter::with_title(paths::file_stem_string(std::path::Path::new(&path)))
    });

    if let Some(t) = title {
        fm.title = t;
    }
    if let Some(t) = tags {
        fm.tags = t;
    }
    if let Some(p) = pinned {
        fm.pinned = p;
    }
    fm.modified = Utc::now().to_rfc3339();

    let full_content = serialize_frontmatter(&fm, &content);
    fs::write(&path, full_content).map_err(|e| format!("Failed to write note: {}", e))?;

    Ok(())
}

#[tauri::command]
pub fn create_note(folder: Option<String>, title: Option<String>) -> Result<Note, String> {
    let vault_path = paths::graphite_dir()?;
    let note_title = title.unwrap_or_else(|| "Untitled".to_string());
    let now = Utc::now().to_rfc3339();

    let dir = match &folder {
        Some(f) if !f.is_empty() => {
            let p = std::path::PathBuf::from(f);
            if p.is_absolute() {
                p
            } else {
                vault_path.join(f)
            }
        }
        _ => vault_path.clone(),
    };

    let dir = paths::ensure_within_vault(&dir)?;

    fs::create_dir_all(&dir).map_err(|e| format!("Failed to create folder: {}", e))?;

    // Find unique filename
    let mut filename = format!("{}.md", &note_title);
    let mut path = dir.join(&filename);
    let mut counter = 1;
    while path.exists() {
        filename = format!("{} {}.md", &note_title, counter);
        path = dir.join(&filename);
        counter += 1;
    }

    let fm = NoteFrontmatter {
        title: note_title.clone(),
        tags: Vec::new(),
        created: now.clone(),
        modified: now.clone(),
        pinned: false,
    };

    let content = serialize_frontmatter(&fm, "\n");
    fs::write(&path, &content).map_err(|e| format!("Failed to create note: {}", e))?;

    let path_str = path.to_string_lossy().to_string();
    let folder_name = folder.unwrap_or_default();

    Ok(Note {
        id: path_str.clone(),
        title: note_title,
        content: String::new(),
        path: path_str,
        folder: folder_name,
        tags: Vec::new(),
        created: now.clone(),
        modified: now,
        pinned: false,
    })
}

#[tauri::command]
pub fn delete_note(path: String) -> Result<(), String> {
    let trash_dir = paths::trash_dir()?;
    fs::create_dir_all(&trash_dir).map_err(|e| format!("Failed to create trash dir: {}", e))?;

    let source = std::path::Path::new(&path);
    let filename = source
        .file_name()
        .unwrap_or_default()
        .to_string_lossy()
        .to_string();

    // Read title from frontmatter
    let title = fs::read_to_string(&path)
        .ok()
        .and_then(|content| {
            let (fm, _) = parse_frontmatter(&content);
            fm.map(|f| f.title)
        })
        .unwrap_or_else(|| paths::file_stem_string(source));

    let id = Uuid::new_v4().to_string()[..8].to_string();
    let trash_path = trash_dir.join(format!("{}_{}", id, filename));

    fs::rename(&path, &trash_path).map_err(|e| format!("Failed to move note to trash: {}", e))?;

    add_to_manifest(TrashEntry {
        id,
        original_path: path,
        trash_path: trash_path.to_string_lossy().to_string(),
        title,
        deleted_at: Utc::now().to_rfc3339(),
    })?;

    Ok(())
}

#[tauri::command]
pub fn rename_note(path: String, new_title: String) -> Result<String, String> {
    let old_path = std::path::Path::new(&path);
    let parent = old_path.parent().ok_or("Invalid path")?;
    let new_path = parent.join(format!("{}.md", &new_title));

    if new_path.exists() {
        return Err("A note with this name already exists".to_string());
    }

    // Update frontmatter title
    let content = fs::read_to_string(&path).map_err(|e| format!("Failed to read note: {}", e))?;
    let (fm, body) = parse_frontmatter(&content);
    let mut fm = fm.unwrap_or_else(|| NoteFrontmatter::with_title(new_title.clone()));
    fm.title = new_title;
    fm.modified = Utc::now().to_rfc3339();

    let full_content = serialize_frontmatter(&fm, &body);
    fs::write(&path, &full_content).map_err(|e| format!("Failed to update note: {}", e))?;

    fs::rename(&path, &new_path).map_err(|e| format!("Failed to rename note: {}", e))?;

    Ok(new_path.to_string_lossy().to_string())
}
