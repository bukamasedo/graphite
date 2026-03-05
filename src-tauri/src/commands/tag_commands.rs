use crate::utils::frontmatter::parse_frontmatter;
use crate::utils::paths;
use std::collections::HashMap;
use std::fs;
use walkdir::WalkDir;

#[derive(serde::Serialize)]
pub struct TagInfo {
    pub name: String,
    pub count: usize,
}

#[tauri::command]
pub fn list_tags() -> Result<Vec<TagInfo>, String> {
    let vault_path = paths::graphite_dir()?;
    if !vault_path.exists() {
        return Ok(Vec::new());
    }

    let mut tag_counts: HashMap<String, usize> = HashMap::new();

    for entry in WalkDir::new(&vault_path).into_iter().filter_map(|e| e.ok()) {
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
            Err(_) => continue,
        };

        let (fm, _) = parse_frontmatter(&content);
        if let Some(fm) = fm {
            for tag in fm.tags {
                *tag_counts.entry(tag).or_insert(0) += 1;
            }
        }
    }

    let mut tags: Vec<TagInfo> = tag_counts
        .into_iter()
        .map(|(name, count)| TagInfo { name, count })
        .collect();

    tags.sort_by(|a, b| b.count.cmp(&a.count).then_with(|| a.name.cmp(&b.name)));

    Ok(tags)
}
