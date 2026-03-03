use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Folder {
    pub name: String,
    pub path: String,
    pub children: Vec<Folder>,
    pub note_count: usize,
}
