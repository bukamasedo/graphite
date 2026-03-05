use crate::models::note::{SearchMatch, SearchResult};
use crate::utils::frontmatter::parse_frontmatter;
use crate::utils::paths;
use rayon::prelude::*;
use std::fs;
use walkdir::WalkDir;

#[tauri::command]
pub fn search_notes(query: String) -> Result<Vec<SearchResult>, String> {
    let vault_path = paths::graphite_dir()?;
    if !vault_path.exists() || query.is_empty() {
        return Ok(Vec::new());
    }

    let query_lower = query.to_lowercase();

    let paths: Vec<_> = WalkDir::new(&vault_path)
        .into_iter()
        .filter_map(|e| e.ok())
        .filter(|e| {
            let p = e.path();
            p.extension().is_some_and(|ext| ext == "md")
                && !p
                    .components()
                    .any(|c| c.as_os_str().to_string_lossy().starts_with('.'))
        })
        .map(|e| e.path().to_path_buf())
        .collect();

    let results: Vec<SearchResult> = paths
        .par_iter()
        .filter_map(|path| {
            let content = fs::read_to_string(path).ok()?;
            let (fm, body) = parse_frontmatter(&content);
            let title = fm
                .map(|f| f.title)
                .unwrap_or_else(|| paths::file_stem_string(path));

            let mut matches = Vec::new();
            for (line_num, line) in body.lines().enumerate() {
                let line_lower = line.to_lowercase();
                let mut start = 0;
                while let Some(idx) = line_lower[start..].find(&query_lower) {
                    let abs_start = start + idx;
                    matches.push(SearchMatch {
                        line: line_num + 1,
                        content: line.to_string(),
                        start: abs_start,
                        end: abs_start + query.len(),
                    });
                    start = abs_start + query.len();
                }
            }

            // Also check title
            if title.to_lowercase().contains(&query_lower) && matches.is_empty() {
                matches.push(SearchMatch {
                    line: 0,
                    content: title.clone(),
                    start: 0,
                    end: 0,
                });
            }

            if matches.is_empty() {
                None
            } else {
                Some(SearchResult {
                    path: path.to_string_lossy().to_string(),
                    title,
                    matches,
                })
            }
        })
        .collect();

    Ok(results)
}
