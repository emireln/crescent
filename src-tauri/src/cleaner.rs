use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use walkdir::WalkDir;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CleanableItem {
    pub category: String, // "node_modules", "target", ".venv", ".next", "dist/build"
    pub relative_path: String,
    pub full_path: String,
    pub size_bytes: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectCleanableInfo {
    pub project_id: String,
    pub project_name: String,
    pub project_path: String,
    pub items: Vec<CleanableItem>,
    pub total_cleanable_bytes: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CleanResult {
    pub success: bool,
    pub bytes_freed: u64,
    pub cleaned_count: usize,
    pub errors: Vec<String>,
}

pub fn analyze_project_cleanable(
    project_id: &str,
    project_name: &str,
    project_path: &str,
) -> ProjectCleanableInfo {
    let p = Path::new(project_path);
    let mut items: Vec<CleanableItem> = Vec::new();
    let mut total_cleanable_bytes = 0;

    if !p.exists() || !p.is_dir() {
        return ProjectCleanableInfo {
            project_id: project_id.to_string(),
            project_name: project_name.to_string(),
            project_path: project_path.to_string(),
            items,
            total_cleanable_bytes,
        };
    }

    let targets = [
        ("node_modules", "node_modules"),
        ("target", "target"),
        (".venv", ".venv"),
        ("venv", "venv"),
        (".next", ".next"),
        (".nuxt", ".nuxt"),
        (".turbo", ".turbo"),
        ("dist", "dist"),
        ("build", "build"),
    ];

    for (cat, rel) in targets {
        let full = p.join(rel);
        if full.exists() && full.is_dir() {
            let size = calculate_dir_size_exact(&full);
            if size > 0 {
                total_cleanable_bytes += size;
                items.push(CleanableItem {
                    category: cat.to_string(),
                    relative_path: rel.to_string(),
                    full_path: full.to_string_lossy().to_string(),
                    size_bytes: size,
                });
            }
        }
    }

    ProjectCleanableInfo {
        project_id: project_id.to_string(),
        project_name: project_name.to_string(),
        project_path: project_path.to_string(),
        items,
        total_cleanable_bytes,
    }
}

pub fn clean_selected_paths(paths: Vec<String>) -> CleanResult {
    let mut bytes_freed = 0;
    let mut cleaned_count = 0;
    let mut errors = Vec::new();

    for path_str in paths {
        let p = PathBuf::from(&path_str);
        if p.exists() {
            let size = calculate_dir_size_exact(&p);
            match fs::remove_dir_all(&p) {
                Ok(_) => {
                    bytes_freed += size;
                    cleaned_count += 1;
                }
                Err(e) => {
                    errors.push(format!("Falha ao remover {}: {}", path_str, e));
                }
            }
        }
    }

    CleanResult {
        success: errors.is_empty(),
        bytes_freed,
        cleaned_count,
        errors,
    }
}

fn calculate_dir_size_exact(path: &Path) -> u64 {
    let mut total = 0;
    for entry in WalkDir::new(path).into_iter().flatten() {
        if let Ok(meta) = entry.metadata() {
            if meta.is_file() {
                total += meta.len();
            }
        }
    }
    total
}
