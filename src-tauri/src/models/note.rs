use chrono::Utc;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Note {
    pub id: String,
    pub title: String,
    pub content: String,
    pub path: String,
    pub folder: String,
    pub tags: Vec<String>,
    pub created: String,
    pub modified: String,
    pub pinned: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NoteListItem {
    pub id: String,
    pub title: String,
    pub path: String,
    pub folder: String,
    pub tags: Vec<String>,
    pub created: String,
    pub modified: String,
    pub pinned: bool,
    pub preview: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NoteFrontmatter {
    pub title: String,
    #[serde(default)]
    pub tags: Vec<String>,
    pub created: String,
    pub modified: String,
    #[serde(default)]
    pub pinned: bool,
}

impl NoteFrontmatter {
    pub fn with_title(title: String) -> Self {
        let now = Utc::now().to_rfc3339();
        Self {
            title,
            tags: Vec::new(),
            created: now.clone(),
            modified: now,
            pinned: false,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchResult {
    pub path: String,
    pub title: String,
    pub matches: Vec<SearchMatch>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchMatch {
    pub line: usize,
    pub content: String,
    pub start: usize,
    pub end: usize,
}
