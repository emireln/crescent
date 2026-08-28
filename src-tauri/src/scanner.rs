use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use walkdir::WalkDir;

use crate::git::{get_git_info, GitInfo};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiscoveredProject {
    pub name: String,
    pub path: String,
    pub primary_tech: String,
    pub tech_stack: Vec<String>,
    pub last_modified: i64,
    pub size_bytes: u64,
    pub git: GitInfo,
    pub has_readme: bool,
    pub is_existing: bool, // already imported in db
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScanOptions {
    pub root_path: String,
    pub max_depth: usize,
    pub ignore_patterns: Vec<String>,
}

pub fn scan_directory(options: &ScanOptions, existing_paths: &[String]) -> Vec<DiscoveredProject> {
    let root = Path::new(&options.root_path);
    if !root.exists() || !root.is_dir() {
        return Vec::new();
    }

    let mut results: Vec<DiscoveredProject> = Vec::new();
    let max_depth = if options.max_depth == 0 { 4 } else { options.max_depth };

    let default_ignores = [
        "node_modules", "target", ".venv", "venv", "env",
        ".git", "dist", "build", ".next", ".nuxt", "vendor",
        "bin", "obj", ".idea", ".vscode", "coverage", ".turbo",
        "$RECYCLE.BIN", "System Volume Information"
    ];

    let mut walker = WalkDir::new(root)
        .max_depth(max_depth)
        .follow_links(false)
        .into_iter();

    while let Some(entry_res) = walker.next() {
        let entry = match entry_res {
            Ok(e) => e,
            Err(_) => continue,
        };

        if !entry.file_type().is_dir() {
            continue;
        }

        let path = entry.path();
        let file_name = entry.file_name().to_string_lossy();

        // Check if directory should be skipped
        if default_ignores.iter().any(|&ig| file_name.eq_ignore_ascii_case(ig))
            || options.ignore_patterns.iter().any(|ig| file_name.eq_ignore_ascii_case(ig))
        {
            walker.skip_current_dir();
            continue;
        }

        // Don't detect root folder itself unless it directly contains a project marker
        let is_root = path == root;

        if let Some((primary_tech, tech_stack, project_name)) = detect_project_markers(path) {
            let final_name = project_name.unwrap_or_else(|| {
                path.file_name()
                    .map(|n| n.to_string_lossy().to_string())
                    .unwrap_or_else(|| "Novo Projeto".to_string())
            });

            let path_str = path.to_string_lossy().to_string();
            let is_existing = existing_paths.iter().any(|ep| {
                Path::new(ep) == path || ep.eq_ignore_ascii_case(&path_str)
            });

            let last_modified = get_last_modified(path);
            let size_bytes = calculate_folder_size_fast(path);
            let git = get_git_info(path);
            let has_readme = path.join("README.md").exists() || path.join("readme.md").exists();

            results.push(DiscoveredProject {
                name: final_name,
                path: path_str,
                primary_tech,
                tech_stack,
                last_modified,
                size_bytes,
                git,
                has_readme,
                is_existing,
            });

            // If we detected a project, we don't recurse deeply inside it unless it's a monorepo root
            let is_monorepo = path.join("packages").exists() || path.join("apps").exists();
            if !is_root && !is_monorepo {
                walker.skip_current_dir();
            }
        }
    }

    results
}

pub fn analyze_single_project<P: AsRef<Path>>(path: P) -> Option<DiscoveredProject> {
    let path = path.as_ref();
    if !path.exists() || !path.is_dir() {
        return None;
    }

    let (primary_tech, tech_stack, detected_name) = detect_project_markers(path)
        .unwrap_or_else(|| {
            (
                "Desconhecido".to_string(),
                vec!["Outro".to_string()],
                None,
            )
        });

    let final_name = detected_name.unwrap_or_else(|| {
        path.file_name()
            .map(|n| n.to_string_lossy().to_string())
            .unwrap_or_else(|| "Projeto".to_string())
    });

    let last_modified = get_last_modified(path);
    let size_bytes = calculate_folder_size_fast(path);
    let git = get_git_info(path);
    let has_readme = path.join("README.md").exists() || path.join("readme.md").exists();

    Some(DiscoveredProject {
        name: final_name,
        path: path.to_string_lossy().to_string(),
        primary_tech,
        tech_stack,
        last_modified,
        size_bytes,
        git,
        has_readme,
        is_existing: false,
    })
}

fn detect_project_markers(dir: &Path) -> Option<(String, Vec<String>, Option<String>)> {
    let mut techs: Vec<String> = Vec::new();
    let mut primary_tech = "Outro".to_string();
    let mut custom_name: Option<String> = None;
    let mut matched = false;

    // 1. Rust / Cargo
    let cargo_toml = dir.join("Cargo.toml");
    if cargo_toml.exists() {
        matched = true;
        techs.push("Rust".to_string());
        if primary_tech == "Outro" {
            primary_tech = "Rust".to_string();
        }
        if let Ok(content) = fs::read_to_string(&cargo_toml) {
            if content.contains("tauri") {
                techs.push("Tauri".to_string());
            }
            if content.contains("actix") {
                techs.push("Actix Web".to_string());
            }
            if content.contains("axum") {
                techs.push("Axum".to_string());
            }
            if content.contains("tokio") {
                techs.push("Tokio".to_string());
            }
            // Parse name from Cargo.toml
            for line in content.lines() {
                let trimmed = line.trim();
                if trimmed.starts_with("name") && trimmed.contains('=') {
                    if let Some(val) = trimmed.split('=').nth(1) {
                        let n = val.trim().trim_matches('"').trim_matches('\'').trim();
                        if !n.is_empty() {
                            custom_name = Some(n.to_string());
                            break;
                        }
                    }
                }
            }
        }
    }

    // 2. Node.js / TypeScript / React / Next / Vue / Angular
    let package_json = dir.join("package.json");
    if package_json.exists() {
        matched = true;
        if let Ok(content) = fs::read_to_string(&package_json) {
            if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
                if let Some(n) = json.get("name").and_then(|v| v.as_str()) {
                    if !n.is_empty() && custom_name.is_none() {
                        custom_name = Some(n.to_string());
                    }
                }

                let deps_str = serde_json::to_string(&json).unwrap_or_default().to_lowercase();

                let is_ts = dir.join("tsconfig.json").exists() || deps_str.contains("\"typescript\"");
                if is_ts {
                    techs.push("TypeScript".to_string());
                } else {
                    techs.push("JavaScript".to_string());
                }

                if deps_str.contains("\"next\"") {
                    techs.push("Next.js".to_string());
                    primary_tech = "Next.js".to_string();
                } else if deps_str.contains("\"react\"") {
                    techs.push("React".to_string());
                    if primary_tech == "Outro" || primary_tech == "TypeScript" || primary_tech == "JavaScript" {
                        primary_tech = "React".to_string();
                    }
                } else if deps_str.contains("\"vue\"") || deps_str.contains("\"nuxt\"") {
                    techs.push("Vue.js".to_string());
                    primary_tech = "Vue.js".to_string();
                } else if deps_str.contains("\"svelte\"") {
                    techs.push("Svelte".to_string());
                    primary_tech = "Svelte".to_string();
                } else if deps_str.contains("\"@nestjs/core\"") {
                    techs.push("NestJS".to_string());
                    primary_tech = "NestJS".to_string();
                } else if deps_str.contains("\"express\"") {
                    techs.push("Express".to_string());
                    if primary_tech == "Outro" {
                        primary_tech = "Node.js".to_string();
                    }
                } else if primary_tech == "Outro" {
                    primary_tech = if is_ts { "TypeScript".to_string() } else { "Node.js".to_string() };
                }

                if deps_str.contains("\"tailwindcss\"") {
                    techs.push("Tailwind CSS".to_string());
                }
                if deps_str.contains("\"vite\"") {
                    techs.push("Vite".to_string());
                }
                if deps_str.contains("\"electron\"") {
                    techs.push("Electron".to_string());
                }
                if deps_str.contains("\"@tauri-apps/api\"") {
                    techs.push("Tauri".to_string());
                }
            }
        }
    }

    // 3. Python
    let py_markers = ["pyproject.toml", "requirements.txt", "Pipfile", "setup.py", "main.py"];
    if py_markers.iter().any(|m| dir.join(m).exists()) {
        matched = true;
        techs.push("Python".to_string());
        if primary_tech == "Outro" {
            primary_tech = "Python".to_string();
        }
        if dir.join("manage.py").exists() {
            techs.push("Django".to_string());
            primary_tech = "Django".to_string();
        }
        if let Ok(reqs) = fs::read_to_string(dir.join("requirements.txt")) {
            let reqs_lower = reqs.to_lowercase();
            if reqs_lower.contains("fastapi") {
                techs.push("FastAPI".to_string());
                primary_tech = "FastAPI".to_string();
            } else if reqs_lower.contains("flask") {
                techs.push("Flask".to_string());
                primary_tech = "Flask".to_string();
            }
        }
    }

    // 4. Go
    if dir.join("go.mod").exists() {
        matched = true;
        techs.push("Go".to_string());
        if primary_tech == "Outro" {
            primary_tech = "Go".to_string();
        }
    }

    // 5. C# / .NET
    let has_dotnet = fs::read_dir(dir).ok().map(|entries| {
        entries.filter_map(|e| e.ok()).any(|e| {
            let n = e.file_name().to_string_lossy().to_lowercase();
            n.ends_with(".sln") || n.ends_with(".csproj")
        })
    }).unwrap_or(false);

    if has_dotnet {
        matched = true;
        techs.push("C# / .NET".to_string());
        if primary_tech == "Outro" {
            primary_tech = ".NET".to_string();
        }
    }

    // 6. Java / Kotlin
    if dir.join("pom.xml").exists() || dir.join("build.gradle").exists() || dir.join("build.gradle.kts").exists() {
        matched = true;
        techs.push("Java".to_string());
        if dir.join("build.gradle.kts").exists() {
            techs.push("Kotlin".to_string());
            primary_tech = "Kotlin".to_string();
        } else if primary_tech == "Outro" {
            primary_tech = "Java".to_string();
        }
    }

    // 7. PHP
    if dir.join("composer.json").exists() {
        matched = true;
        techs.push("PHP".to_string());
        if dir.join("artisan").exists() {
            techs.push("Laravel".to_string());
            primary_tech = "Laravel".to_string();
        } else if primary_tech == "Outro" {
            primary_tech = "PHP".to_string();
        }
    }

    // 8. Flutter / Dart
    if dir.join("pubspec.yaml").exists() {
        matched = true;
        techs.push("Flutter".to_string());
        techs.push("Dart".to_string());
        primary_tech = "Flutter".to_string();
    }

    // 9. Docker
    if dir.join("Dockerfile").exists() || dir.join("docker-compose.yml").exists() || dir.join("compose.yaml").exists() {
        techs.push("Docker".to_string());
    }

    // 10. Pure Git repo fallback if no code markers found
    if !matched && dir.join(".git").exists() {
        matched = true;
        primary_tech = "Git Repo".to_string();
        techs.push("Git".to_string());
    }

    if matched {
        techs.dedup();
        Some((primary_tech, techs, custom_name))
    } else {
        None
    }
}

fn get_last_modified(path: &Path) -> i64 {
    if let Ok(metadata) = fs::metadata(path) {
        if let Ok(modified) = metadata.modified() {
            if let Ok(duration) = modified.duration_since(std::time::UNIX_EPOCH) {
                return duration.as_secs() as i64;
            }
        }
    }
    chrono::Utc::now().timestamp()
}

fn calculate_folder_size_fast(path: &Path) -> u64 {
    let mut total_size = 0;
    let ignores = ["node_modules", "target", ".venv", "venv", ".git", "dist", "build"];

    for entry in WalkDir::new(path)
        .max_depth(3)
        .into_iter()
        .filter_entry(|e| {
            let name = e.file_name().to_string_lossy();
            !ignores.iter().any(|&ig| name.eq_ignore_ascii_case(ig))
        })
        .flatten()
    {
        if let Ok(metadata) = entry.metadata() {
            if metadata.is_file() {
                total_size += metadata.len();
            }
        }
    }

    total_size
}
