use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use walkdir::WalkDir;

const CLEANABLE_TARGETS: [(&str, &str); 9] = [
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

    for (cat, rel) in CLEANABLE_TARGETS {
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

pub fn clean_selected_paths(paths: Vec<String>, project_roots: &[String]) -> CleanResult {
    let mut bytes_freed = 0;
    let mut cleaned_count = 0;
    let mut errors = Vec::new();

    for path_str in paths {
        let p = PathBuf::from(&path_str);
        if p.exists() {
            if !is_permitted_clean_target(&p, project_roots) {
                errors.push(format!("Caminho não permitido para limpeza: {}", path_str));
                continue;
            }

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

fn is_permitted_clean_target(path: &Path, project_roots: &[String]) -> bool {
    let Some(file_name) = path.file_name().and_then(|name| name.to_str()) else {
        return false;
    };
    let file_name = file_name.to_ascii_lowercase();
    if !CLEANABLE_TARGETS
        .iter()
        .any(|(_, target)| *target == file_name)
    {
        return false;
    }

    let Ok(metadata) = fs::symlink_metadata(path) else {
        return false;
    };
    if !metadata.is_dir() || metadata.file_type().is_symlink() {
        return false;
    }

    let Ok(canonical_target) = path.canonicalize() else {
        return false;
    };
    let Some(target_parent) = canonical_target.parent() else {
        return false;
    };

    project_roots.iter().any(|root| {
        Path::new(root)
            .canonicalize()
            .is_ok_and(|canonical_root| canonical_root == target_parent)
    })
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

#[cfg(test)]
mod tests {
    use super::is_permitted_clean_target;
    use std::fs;
    use std::time::{SystemTime, UNIX_EPOCH};

    #[test]
    fn only_allows_known_cleanup_folders_at_registered_project_roots() {
        let unique_id = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let temp_root = std::env::temp_dir().join(format!(
            "crescent-cleaner-{}-{}",
            std::process::id(),
            unique_id
        ));
        let project_root = temp_root.join("project");
        let allowed = project_root.join("node_modules");
        let nested = project_root.join("important");
        let unrelated = temp_root.join("other").join("dist");
        fs::create_dir_all(&allowed).unwrap();
        fs::create_dir_all(&nested).unwrap();
        fs::create_dir_all(&unrelated).unwrap();

        let project_roots = vec![project_root.to_string_lossy().to_string()];
        assert!(is_permitted_clean_target(&allowed, &project_roots));
        assert!(!is_permitted_clean_target(&nested, &project_roots));
        assert!(!is_permitted_clean_target(&unrelated, &project_roots));

        fs::remove_dir_all(temp_root).unwrap();
    }
}
