use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphiteConfig {
    pub vault_path: String,
    #[serde(default = "default_theme")]
    pub theme: String,
    #[serde(default = "default_font_size")]
    pub font_size: u32,
    #[serde(default)]
    pub recent_notes: Vec<String>,
}

fn default_theme() -> String {
    "dark".to_string()
}

fn default_font_size() -> u32 {
    15
}

impl Default for GraphiteConfig {
    fn default() -> Self {
        Self {
            vault_path: String::new(),
            theme: default_theme(),
            font_size: default_font_size(),
            recent_notes: Vec::new(),
        }
    }
}
