use serde::{Deserialize, Serialize};
use std::fs::File;
use std::io::{BufRead, BufReader};
use std::path::Path;
use walkdir::WalkDir;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectSearchTarget {
    pub id: String,
    pub name: String,
    pub path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CodeSearchResult {
    pub project_id: String,
    pub project_name: String,
    pub file_path: String,
    pub relative_path: String,
    pub line_number: usize,
    pub line_content: String,
}

pub fn search_code_across_projects(
    query: &str,
    projects: Vec<ProjectSearchTarget>,
    case_sensitive: bool,
    max_results: usize,
) -> Vec<CodeSearchResult> {
    if query.trim().is_empty() {
        return Vec::new();
    }

    let mut results = Vec::new();
    let max = if max_results == 0 { 100 } else { max_results };
    let query_processed = if case_sensitive {
        query.to_string()
    } else {
        query.to_lowercase()
    };

    let ignores = [
        "node_modules", "target", ".venv", "venv", ".git", "dist", "build",
        ".next", ".nuxt", "vendor", "bin", "obj", ".idea", ".vscode", "coverage",
        ".turbo", "Pods", ".cache", "package-lock.json", "yarn.lock", "pnpm-lock.yaml",
        "Cargo.lock", "poetry.lock"
    ];

    let binary_exts = [
        "png", "jpg", "jpeg", "gif", "ico", "svg", "exe", "dll", "so", "dylib",
        "wasm", "db", "sqlite", "bin", "zip", "tar", "gz", "pdf", "mp4", "mp3",
        "ttf", "woff", "woff2", "eot", "lock", "pyc", "class", "obj", "o", "a"
    ];

    for project in projects {
        let p = Path::new(&project.path);
        if !p.exists() || !p.is_dir() {
            continue;
        }

        for entry in WalkDir::new(p)
            .max_depth(6)
            .into_iter()
            .filter_entry(|e| {
                let name = e.file_name().to_string_lossy();
                !ignores.iter().any(|&ig| name.eq_ignore_ascii_case(ig))
            })
            .flatten()
        {
            if results.len() >= max {
                return results;
            }

            if !entry.file_type().is_file() {
                continue;
            }

            let file_path = entry.path();
            if let Some(ext) = file_path.extension().and_then(|s| s.to_str()) {
                if binary_exts.iter().any(|&be| be.eq_ignore_ascii_case(ext)) {
                    continue;
                }
            }

            // Skip files > 1 MB
            if let Ok(meta) = entry.metadata() {
                if meta.len() > 1_048_576 {
                    continue;
                }
            }

            if let Ok(file) = File::open(file_path) {
                let reader = BufReader::new(file);
                for (idx, line_res) in reader.lines().enumerate() {
                    if results.len() >= max {
                        return results;
                    }

                    if let Ok(line) = line_res {
                        let matches = if case_sensitive {
                            line.contains(&query_processed)
                        } else {
                            line.to_lowercase().contains(&query_processed)
                        };

                        if matches {
                            let rel_path = file_path
                                .strip_prefix(p)
                                .map(|rp| rp.to_string_lossy().to_string())
                                .unwrap_or_else(|_| file_path.to_string_lossy().to_string());

                            results.push(CodeSearchResult {
                                project_id: project.id.clone(),
                                project_name: project.name.clone(),
                                file_path: file_path.to_string_lossy().to_string(),
                                relative_path: rel_path,
                                line_number: idx + 1,
                                line_content: line.trim().to_string(),
                            });
                        }
                    }
                }
            }
        }
    }

    results
}
