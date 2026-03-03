use crate::models::note::NoteFrontmatter;

pub fn parse_frontmatter(content: &str) -> (Option<NoteFrontmatter>, String) {
    if !content.starts_with("---") {
        return (None, content.to_string());
    }

    let rest = &content[3..];
    if let Some(end_idx) = rest.find("\n---") {
        let yaml_str = &rest[..end_idx].trim();
        let body = &rest[end_idx + 4..].trim_start_matches('\n');

        match serde_yaml::from_str::<NoteFrontmatter>(yaml_str) {
            Ok(fm) => (Some(fm), body.to_string()),
            Err(_) => (None, content.to_string()),
        }
    } else {
        (None, content.to_string())
    }
}

pub fn serialize_frontmatter(fm: &NoteFrontmatter, body: &str) -> String {
    let yaml = serde_yaml::to_string(fm).unwrap_or_default();
    format!("---\n{}---\n{}", yaml, body)
}

pub fn extract_preview(body: &str, max_len: usize) -> String {
    let preview: String = body
        .lines()
        .filter(|line| {
            let trimmed = line.trim();
            !trimmed.is_empty() && !trimmed.starts_with('#') && !trimmed.starts_with("```")
        })
        .take(3)
        .collect::<Vec<&str>>()
        .join(" ");

    if preview.chars().count() > max_len {
        let truncated: String = preview.chars().take(max_len).collect();
        format!("{}...", truncated)
    } else {
        preview
    }
}
