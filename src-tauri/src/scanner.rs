use serde::{Deserialize, Serialize};
use std::collections::HashMap;
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
        "$RECYCLE.BIN", "System Volume Information", ".gradle",
        "Pods", ".cache", ".output", "__pycache__", ".tox",
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
            let is_monorepo = path.join("packages").exists()
                || path.join("apps").exists()
                || path.join("pnpm-workspace.yaml").exists()
                || path.join("lerna.json").exists()
                || path.join("turbo.json").exists();

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

pub fn detect_project_markers(dir: &Path) -> Option<(String, Vec<String>, Option<String>)> {
    let mut techs: Vec<String> = Vec::new();
    let mut primary_tech: Option<String> = None;
    let mut custom_name: Option<String> = None;
    let mut matched = false;

    // 1. Rust Ecosystem
    if detect_rust(dir, &mut techs, &mut primary_tech, &mut custom_name) {
        matched = true;
    }

    // 2. JavaScript / TypeScript / Node / Bun / Deno Ecosystem
    if detect_node_ecosystem(dir, &mut techs, &mut primary_tech, &mut custom_name) {
        matched = true;
    }

    // 3. Python Ecosystem
    if detect_python(dir, &mut techs, &mut primary_tech, &mut custom_name) {
        matched = true;
    }

    // 4. Go Ecosystem
    if detect_go(dir, &mut techs, &mut primary_tech, &mut custom_name) {
        matched = true;
    }

    // 5. C# / .NET / F# / Unity
    if detect_dotnet_ecosystem(dir, &mut techs, &mut primary_tech, &mut custom_name) {
        matched = true;
    }

    // 6. C / C++ / CMake / Unreal
    if detect_cpp_c(dir, &mut techs, &mut primary_tech, &mut custom_name) {
        matched = true;
    }

    // 7. Java / Kotlin / Scala / Android
    if detect_jvm_ecosystem(dir, &mut techs, &mut primary_tech, &mut custom_name) {
        matched = true;
    }

    // 8. PHP Ecosystem
    if detect_php(dir, &mut techs, &mut primary_tech, &mut custom_name) {
        matched = true;
    }

    // 9. Ruby Ecosystem
    if detect_ruby(dir, &mut techs, &mut primary_tech, &mut custom_name) {
        matched = true;
    }

    // 10. Elixir / Erlang
    if detect_elixir_erlang(dir, &mut techs, &mut primary_tech) {
        matched = true;
    }

    // 11. Flutter / Dart
    if detect_dart_flutter(dir, &mut techs, &mut primary_tech) {
        matched = true;
    }

    // 12. Swift / iOS / macOS
    if detect_swift_apple(dir, &mut techs, &mut primary_tech) {
        matched = true;
    }

    // 13. Zig
    if detect_zig(dir, &mut techs, &mut primary_tech) {
        matched = true;
    }

    // 14. Lua / LÖVE / Neovim
    if detect_lua(dir, &mut techs, &mut primary_tech) {
        matched = true;
    }

    // 15. Haskell
    if detect_haskell(dir, &mut techs, &mut primary_tech) {
        matched = true;
    }

    // 16. Julia / R
    if detect_julia_r(dir, &mut techs, &mut primary_tech) {
        matched = true;
    }

    // 17. Web3 / Solidity
    if detect_web3_solidity(dir, &mut techs, &mut primary_tech) {
        matched = true;
    }

    // 18. DevOps & Cloud Infrastructure (Docker, Kubernetes, Terraform, etc.)
    detect_devops_cloud(dir, &mut techs);

    // 19. Linguistic Profiling via File Extension Frequency (GitHub Linguist style)
    let lang_counts = profile_extensions(dir);
    for (lang, count) in &lang_counts {
        if *count >= 2 && !techs.iter().any(|t| t.eq_ignore_ascii_case(lang)) {
            techs.push(lang.clone());
        }
    }

    if primary_tech.is_none() {
        if let Some((top_lang, _)) = lang_counts.iter().max_by_key(|(_, &c)| c) {
            primary_tech = Some(top_lang.clone());
            matched = true;
        }
    }

    // 20. Fallback for pure Git repository
    if !matched && dir.join(".git").exists() {
        matched = true;
        primary_tech = Some("Git Repo".to_string());
        techs.push("Git".to_string());
    }

    if matched {
        // Clean and deduplicate techs
        let mut unique_techs: Vec<String> = Vec::new();
        for t in techs {
            if !unique_techs.contains(&t) {
                unique_techs.push(t);
            }
        }

        let primary = primary_tech.unwrap_or_else(|| {
            unique_techs.first().cloned().unwrap_or_else(|| "Outro".to_string())
        });

        Some((primary, unique_techs, custom_name))
    } else {
        None
    }
}

fn detect_rust(
    dir: &Path,
    techs: &mut Vec<String>,
    primary: &mut Option<String>,
    custom_name: &mut Option<String>,
) -> bool {
    let cargo_toml = dir.join("Cargo.toml");
    if !cargo_toml.exists() {
        return false;
    }

    techs.push("Rust".to_string());
    if primary.is_none() {
        *primary = Some("Rust".to_string());
    }

    if let Ok(content) = fs::read_to_string(&cargo_toml) {
        let content_lower = content.to_lowercase();

        if content_lower.contains("tauri") {
            techs.push("Tauri".to_string());
            *primary = Some("Tauri".to_string());
        }
        if content_lower.contains("actix-web") || content_lower.contains("actix") {
            techs.push("Actix Web".to_string());
        }
        if content_lower.contains("axum") {
            techs.push("Axum".to_string());
        }
        if content_lower.contains("tokio") {
            techs.push("Tokio".to_string());
        }
        if content_lower.contains("rocket") {
            techs.push("Rocket".to_string());
        }
        if content_lower.contains("bevy") {
            techs.push("Bevy".to_string());
            *primary = Some("Bevy".to_string());
        }
        if content_lower.contains("leptos") {
            techs.push("Leptos".to_string());
            *primary = Some("Leptos".to_string());
        }
        if content_lower.contains("yew") {
            techs.push("Yew".to_string());
        }
        if content_lower.contains("dioxus") {
            techs.push("Dioxus".to_string());
        }
        if content_lower.contains("diesel") {
            techs.push("Diesel".to_string());
        }
        if content_lower.contains("sqlx") {
            techs.push("SQLx".to_string());
        }
        if content_lower.contains("sea-orm") {
            techs.push("SeaORM".to_string());
        }
        if content_lower.contains("polars") {
            techs.push("Polars".to_string());
        }
        if content_lower.contains("wasm-bindgen") {
            techs.push("WebAssembly".to_string());
        }

        // Parse name from Cargo.toml
        if custom_name.is_none() {
            for line in content.lines() {
                let trimmed = line.trim();
                if trimmed.starts_with("name") && trimmed.contains('=') {
                    if let Some(val) = trimmed.split('=').nth(1) {
                        let n = val.trim().trim_matches('"').trim_matches('\'').trim();
                        if !n.is_empty() {
                            *custom_name = Some(n.to_string());
                            break;
                        }
                    }
                }
            }
        }
    }

    true
}

fn detect_node_ecosystem(
    dir: &Path,
    techs: &mut Vec<String>,
    primary: &mut Option<String>,
    custom_name: &mut Option<String>,
) -> bool {
    let package_json = dir.join("package.json");
    let deno_json = dir.join("deno.json");
    let deno_jsonc = dir.join("deno.jsonc");
    let bunfig_toml = dir.join("bunfig.toml");
    let has_bun_lock = dir.join("bun.lockb").exists() || dir.join("bun.lock").exists();

    if !package_json.exists() && !deno_json.exists() && !deno_jsonc.exists() && !bunfig_toml.exists() && !has_bun_lock {
        return false;
    }

    let is_ts = dir.join("tsconfig.json").exists() || dir.join("deno.json").exists();
    if is_ts {
        techs.push("TypeScript".to_string());
    } else {
        techs.push("JavaScript".to_string());
    }

    // Check runtime indicators
    if has_bun_lock || bunfig_toml.exists() {
        techs.push("Bun".to_string());
    }
    if deno_json.exists() || deno_jsonc.exists() {
        techs.push("Deno".to_string());
        if primary.is_none() {
            *primary = Some("Deno".to_string());
        }
    }

    if package_json.exists() {
        if let Ok(content) = fs::read_to_string(&package_json) {
            if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
                if let Some(n) = json.get("name").and_then(|v| v.as_str()) {
                    if !n.is_empty() && custom_name.is_none() {
                        *custom_name = Some(n.to_string());
                    }
                }

                let deps_str = serde_json::to_string(&json).unwrap_or_default().to_lowercase();

                // Meta-frameworks & Frameworks
                if deps_str.contains("\"next\"") || dir.join("next.config.js").exists() || dir.join("next.config.ts").exists() || dir.join("next.config.mjs").exists() {
                    techs.push("Next.js".to_string());
                    if primary.is_none() { *primary = Some("Next.js".to_string()); }
                }
                if deps_str.contains("\"nuxt\"") || dir.join("nuxt.config.ts").exists() || dir.join("nuxt.config.js").exists() {
                    techs.push("Nuxt".to_string());
                    if primary.is_none() { *primary = Some("Nuxt".to_string()); }
                }
                if deps_str.contains("\"astro\"") || dir.join("astro.config.mjs").exists() || dir.join("astro.config.ts").exists() {
                    techs.push("Astro".to_string());
                    if primary.is_none() { *primary = Some("Astro".to_string()); }
                }
                if deps_str.contains("\"@sveltejs/kit\"") || dir.join("svelte.config.js").exists() {
                    techs.push("SvelteKit".to_string());
                    if primary.is_none() { *primary = Some("SvelteKit".to_string()); }
                }
                if deps_str.contains("\"@remix-run/\"") || dir.join("remix.config.js").exists() {
                    techs.push("Remix".to_string());
                    if primary.is_none() { *primary = Some("Remix".to_string()); }
                }
                if deps_str.contains("\"solid-js\"") {
                    techs.push("SolidJS".to_string());
                    if primary.is_none() { *primary = Some("SolidJS".to_string()); }
                }
                if deps_str.contains("\"@angular/core\"") || dir.join("angular.json").exists() {
                    techs.push("Angular".to_string());
                    if primary.is_none() { *primary = Some("Angular".to_string()); }
                }
                if deps_str.contains("\"@nestjs/core\"") || dir.join("nest-cli.json").exists() {
                    techs.push("NestJS".to_string());
                    if primary.is_none() { *primary = Some("NestJS".to_string()); }
                }
                if deps_str.contains("\"react-native\"") || deps_str.contains("\"expo\"") {
                    techs.push("React Native".to_string());
                    if deps_str.contains("\"expo\"") { techs.push("Expo".to_string()); }
                    if primary.is_none() { *primary = Some("React Native".to_string()); }
                }
                if deps_str.contains("\"electron\"") {
                    techs.push("Electron".to_string());
                    if primary.is_none() { *primary = Some("Electron".to_string()); }
                }
                if deps_str.contains("\"@tauri-apps/api\"") {
                    techs.push("Tauri".to_string());
                }

                // Core UI Libraries
                if deps_str.contains("\"react\"") || deps_str.contains("\"react-dom\"") {
                    techs.push("React".to_string());
                    if primary.is_none() { *primary = Some("React".to_string()); }
                }
                if deps_str.contains("\"vue\"") {
                    techs.push("Vue.js".to_string());
                    if primary.is_none() { *primary = Some("Vue.js".to_string()); }
                }
                if deps_str.contains("\"svelte\"") {
                    techs.push("Svelte".to_string());
                    if primary.is_none() { *primary = Some("Svelte".to_string()); }
                }

                // Backend Servers
                if deps_str.contains("\"express\"") {
                    techs.push("Express".to_string());
                    if primary.is_none() { *primary = Some("Express".to_string()); }
                }
                if deps_str.contains("\"fastify\"") {
                    techs.push("Fastify".to_string());
                    if primary.is_none() { *primary = Some("Fastify".to_string()); }
                }
                if deps_str.contains("\"hono\"") {
                    techs.push("Hono".to_string());
                    if primary.is_none() { *primary = Some("Hono".to_string()); }
                }

                if primary.is_none() {
                    *primary = Some(if is_ts { "TypeScript".to_string() } else { "Node.js".to_string() });
                }

                // UI & Styling Tools
                if deps_str.contains("\"tailwindcss\"") || dir.join("tailwind.config.js").exists() || dir.join("tailwind.config.ts").exists() {
                    techs.push("Tailwind CSS".to_string());
                }
                if deps_str.contains("\"@chakra-ui/\"") {
                    techs.push("Chakra UI".to_string());
                }
                if deps_str.contains("\"@mui/material\"") {
                    techs.push("MUI".to_string());
                }
                if deps_str.contains("\"styled-components\"") {
                    techs.push("styled-components".to_string());
                }
                if deps_str.contains("\"sass\"") {
                    techs.push("Sass".to_string());
                }

                // Bundlers / Tooling
                if deps_str.contains("\"vite\"") || dir.join("vite.config.ts").exists() || dir.join("vite.config.js").exists() {
                    techs.push("Vite".to_string());
                }
                if deps_str.contains("\"webpack\"") || dir.join("webpack.config.js").exists() {
                    techs.push("Webpack".to_string());
                }
                if deps_str.contains("\"turbopack\"") || dir.join("turbo.json").exists() {
                    techs.push("Turborepo".to_string());
                }
                if deps_str.contains("\"@biomejs/biome\"") || dir.join("biome.json").exists() {
                    techs.push("Biome".to_string());
                }

                // Databases & ORMs
                if deps_str.contains("\"@prisma/client\"") || dir.join("prisma/schema.prisma").exists() {
                    techs.push("Prisma".to_string());
                }
                if deps_str.contains("\"drizzle-orm\"") || dir.join("drizzle.config.ts").exists() {
                    techs.push("Drizzle".to_string());
                }
                if deps_str.contains("\"mongoose\"") {
                    techs.push("MongoDB / Mongoose".to_string());
                }
                if deps_str.contains("\"supabase\"") || deps_str.contains("\"@supabase/supabase-js\"") {
                    techs.push("Supabase".to_string());
                }
                if deps_str.contains("\"firebase\"") {
                    techs.push("Firebase".to_string());
                }
                if deps_str.contains("\"three\"") || deps_str.contains("\"@react-three/fiber\"") {
                    techs.push("Three.js".to_string());
                }
                if deps_str.contains("\"graphql\"") {
                    techs.push("GraphQL".to_string());
                }
            }
        }
    }

    true
}

fn detect_python(
    dir: &Path,
    techs: &mut Vec<String>,
    primary: &mut Option<String>,
    custom_name: &mut Option<String>,
) -> bool {
    let py_markers = [
        "pyproject.toml", "requirements.txt", "Pipfile", "setup.py",
        "setup.cfg", "poetry.lock", "uv.lock", "environment.yml", "manage.py"
    ];

    let has_py_marker = py_markers.iter().any(|m| dir.join(m).exists());
    if !has_py_marker {
        return false;
    }

    techs.push("Python".to_string());
    if primary.is_none() {
        *primary = Some("Python".to_string());
    }

    if dir.join("poetry.lock").exists() {
        techs.push("Poetry".to_string());
    }
    if dir.join("uv.lock").exists() {
        techs.push("uv".to_string());
    }
    if dir.join("Pipfile").exists() {
        techs.push("Pipenv".to_string());
    }

    // Django
    if dir.join("manage.py").exists() {
        techs.push("Django".to_string());
        *primary = Some("Django".to_string());
    }

    // Read requirements.txt and pyproject.toml
    let mut combined_content = String::new();
    if let Ok(c) = fs::read_to_string(dir.join("requirements.txt")) {
        combined_content.push_str(&c);
    }
    if let Ok(c) = fs::read_to_string(dir.join("pyproject.toml")) {
        combined_content.push_str(&c);
        // Try to parse name from pyproject.toml
        if custom_name.is_none() {
            for line in c.lines() {
                let trimmed = line.trim();
                if trimmed.starts_with("name") && trimmed.contains('=') {
                    if let Some(val) = trimmed.split('=').nth(1) {
                        let n = val.trim().trim_matches('"').trim_matches('\'').trim();
                        if !n.is_empty() {
                            *custom_name = Some(n.to_string());
                            break;
                        }
                    }
                }
            }
        }
    }
    if let Ok(c) = fs::read_to_string(dir.join("Pipfile")) {
        combined_content.push_str(&c);
    }

    let lower = combined_content.to_lowercase();
    if lower.contains("fastapi") {
        techs.push("FastAPI".to_string());
        *primary = Some("FastAPI".to_string());
    } else if lower.contains("flask") {
        techs.push("Flask".to_string());
        if *primary == Some("Python".to_string()) {
            *primary = Some("Flask".to_string());
        }
    } else if lower.contains("streamlit") || dir.join(".streamlit").exists() {
        techs.push("Streamlit".to_string());
        *primary = Some("Streamlit".to_string());
    }

    // AI / ML / Data
    if lower.contains("torch") || lower.contains("pytorch") {
        techs.push("PyTorch".to_string());
    }
    if lower.contains("tensorflow") || lower.contains("keras") {
        techs.push("TensorFlow".to_string());
    }
    if lower.contains("transformers") || lower.contains("huggingface") {
        techs.push("Hugging Face".to_string());
    }
    if lower.contains("langchain") {
        techs.push("LangChain".to_string());
    }
    if lower.contains("llama-index") || lower.contains("llamaindex") {
        techs.push("LlamaIndex".to_string());
    }
    if lower.contains("pandas") {
        techs.push("Pandas".to_string());
    }
    if lower.contains("numpy") {
        techs.push("NumPy".to_string());
    }
    if lower.contains("scikit-learn") || lower.contains("sklearn") {
        techs.push("Scikit-Learn".to_string());
    }
    if lower.contains("opencv") || lower.contains("cv2") {
        techs.push("OpenCV".to_string());
    }
    if lower.contains("celery") {
        techs.push("Celery".to_string());
    }
    if lower.contains("sqlalchemy") {
        techs.push("SQLAlchemy".to_string());
    }
    if lower.contains("pydantic") {
        techs.push("Pydantic".to_string());
    }

    true
}

fn detect_go(
    dir: &Path,
    techs: &mut Vec<String>,
    primary: &mut Option<String>,
    custom_name: &mut Option<String>,
) -> bool {
    let go_mod = dir.join("go.mod");
    if !go_mod.exists() {
        return false;
    }

    techs.push("Go".to_string());
    if primary.is_none() {
        *primary = Some("Go".to_string());
    }

    if let Ok(content) = fs::read_to_string(&go_mod) {
        let lower = content.to_lowercase();
        if lower.contains("github.com/gin-gonic/gin") {
            techs.push("Gin".to_string());
            *primary = Some("Gin".to_string());
        }
        if lower.contains("github.com/gofiber/fiber") {
            techs.push("Fiber".to_string());
            *primary = Some("Fiber".to_string());
        }
        if lower.contains("github.com/labstack/echo") {
            techs.push("Echo".to_string());
        }
        if lower.contains("github.com/go-chi/chi") {
            techs.push("Chi".to_string());
        }
        if lower.contains("gorm.io/gorm") {
            techs.push("GORM".to_string());
        }
        if lower.contains("github.com/spf13/cobra") {
            techs.push("Cobra CLI".to_string());
        }
        if lower.contains("github.com/wailsapp/wails") {
            techs.push("Wails".to_string());
            *primary = Some("Wails".to_string());
        }
        if lower.contains("github.com/a-h/templ") {
            techs.push("Templ".to_string());
        }

        // Parse module name
        if custom_name.is_none() {
            for line in content.lines() {
                let trimmed = line.trim();
                if trimmed.starts_with("module ") {
                    let mod_name = trimmed.trim_start_matches("module ").trim();
                    let simple = mod_name.split('/').last().unwrap_or(mod_name);
                    if !simple.is_empty() {
                        *custom_name = Some(simple.to_string());
                        break;
                    }
                }
            }
        }
    }

    true
}

fn detect_dotnet_ecosystem(
    dir: &Path,
    techs: &mut Vec<String>,
    primary: &mut Option<String>,
    custom_name: &mut Option<String>,
) -> bool {
    let mut has_dotnet = false;

    // Check Unity project
    if dir.join("Assets").exists() && dir.join("ProjectSettings").exists() {
        techs.push("Unity".to_string());
        techs.push("C#".to_string());
        *primary = Some("Unity".to_string());
        return true;
    }

    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let n = entry.file_name().to_string_lossy().to_lowercase();
            if n.ends_with(".sln") {
                has_dotnet = true;
                if custom_name.is_none() {
                    let stem = entry.path().file_stem().map(|s| s.to_string_lossy().to_string());
                    *custom_name = stem;
                }
            } else if n.ends_with(".csproj") {
                has_dotnet = true;
                techs.push("C#".to_string());
                if custom_name.is_none() {
                    let stem = entry.path().file_stem().map(|s| s.to_string_lossy().to_string());
                    *custom_name = stem;
                }
            } else if n.ends_with(".fsproj") {
                has_dotnet = true;
                techs.push("F#".to_string());
                *primary = Some("F#".to_string());
            }
        }
    }

    if has_dotnet {
        techs.push(".NET".to_string());
        if primary.is_none() {
            *primary = Some(".NET".to_string());
        }

        // Search for sub-frameworks in proj files
        if dir.join("appsettings.json").exists() || dir.join("Program.cs").exists() {
            techs.push("ASP.NET Core".to_string());
            *primary = Some("ASP.NET Core".to_string());
        }
        if dir.join("MauiProgram.cs").exists() {
            techs.push(".NET MAUI".to_string());
            *primary = Some(".NET MAUI".to_string());
        }
        if dir.join("App.xaml").exists() {
            techs.push("WPF / XAML".to_string());
        }
    }

    has_dotnet
}

fn detect_cpp_c(
    dir: &Path,
    techs: &mut Vec<String>,
    primary: &mut Option<String>,
    custom_name: &mut Option<String>,
) -> bool {
    let cmake = dir.join("CMakeLists.txt");
    let makefile = dir.join("Makefile");
    let meson = dir.join("meson.build");
    let conan = dir.join("conanfile.txt");
    let vcpkg = dir.join("vcpkg.json");

    if !cmake.exists() && !makefile.exists() && !meson.exists() && !conan.exists() && !vcpkg.exists() {
        return false;
    }

    if cmake.exists() {
        techs.push("CMake".to_string());
        if let Ok(content) = fs::read_to_string(&cmake) {
            let lower = content.to_lowercase();
            if lower.contains("find_package(qt") || lower.contains("qt5") || lower.contains("qt6") {
                techs.push("Qt".to_string());
                *primary = Some("Qt (C++)".to_string());
            }
            if lower.contains("find_package(opencv") {
                techs.push("OpenCV (C++)".to_string());
            }
            // Parse project(name)
            if custom_name.is_none() {
                for line in content.lines() {
                    let trimmed = line.trim();
                    if trimmed.to_lowercase().starts_with("project(") {
                        let inside = trimmed.trim_start_matches("project(").trim_start_matches("PROJECT(");
                        let name_part = inside.split(')').next().unwrap_or("").split_whitespace().next().unwrap_or("");
                        let clean = name_part.trim_matches('"');
                        if !clean.is_empty() {
                            *custom_name = Some(clean.to_string());
                            break;
                        }
                    }
                }
            }
        }
    }

    if meson.exists() {
        techs.push("Meson".to_string());
    }
    if makefile.exists() {
        techs.push("Makefile".to_string());
    }

    techs.push("C/C++".to_string());
    if primary.is_none() {
        *primary = Some("C++".to_string());
    }

    true
}

fn detect_jvm_ecosystem(
    dir: &Path,
    techs: &mut Vec<String>,
    primary: &mut Option<String>,
    custom_name: &mut Option<String>,
) -> bool {
    let pom_xml = dir.join("pom.xml");
    let build_gradle = dir.join("build.gradle");
    let build_gradle_kts = dir.join("build.gradle.kts");
    let sbt = dir.join("build.sbt");
    let android_manifest = dir.join("app/src/main/AndroidManifest.xml").exists() || dir.join("AndroidManifest.xml").exists();

    if !pom_xml.exists() && !build_gradle.exists() && !build_gradle_kts.exists() && !sbt.exists() && !android_manifest {
        return false;
    }

    if android_manifest {
        techs.push("Android".to_string());
        *primary = Some("Android".to_string());
    }

    if sbt.exists() {
        techs.push("Scala".to_string());
        techs.push("SBT".to_string());
        *primary = Some("Scala".to_string());
        return true;
    }

    if build_gradle_kts.exists() {
        techs.push("Kotlin".to_string());
        techs.push("Gradle".to_string());
        if primary.is_none() {
            *primary = Some("Kotlin".to_string());
        }
    } else if build_gradle.exists() {
        techs.push("Gradle".to_string());
        techs.push("Java".to_string());
        if primary.is_none() {
            *primary = Some("Java".to_string());
        }
    }

    if pom_xml.exists() {
        techs.push("Maven".to_string());
        techs.push("Java".to_string());
        if primary.is_none() {
            *primary = Some("Java".to_string());
        }
        if let Ok(content) = fs::read_to_string(&pom_xml) {
            let lower = content.to_lowercase();
            if lower.contains("spring-boot") {
                techs.push("Spring Boot".to_string());
                *primary = Some("Spring Boot".to_string());
            }
            if lower.contains("quarkus") {
                techs.push("Quarkus".to_string());
                *primary = Some("Quarkus".to_string());
            }
            if lower.contains("micronaut") {
                techs.push("Micronaut".to_string());
            }
            if custom_name.is_none() {
                if let Some(start) = content.find("<artifactId>") {
                    let rest = &content[start + 12..];
                    if let Some(end) = rest.find("</artifactId>") {
                        let art_id = rest[..end].trim();
                        if !art_id.is_empty() {
                            *custom_name = Some(art_id.to_string());
                        }
                    }
                }
            }
        }
    }

    true
}

fn detect_php(
    dir: &Path,
    techs: &mut Vec<String>,
    primary: &mut Option<String>,
    custom_name: &mut Option<String>,
) -> bool {
    let composer_json = dir.join("composer.json");
    let wp_config = dir.join("wp-config.php");

    if !composer_json.exists() && !wp_config.exists() {
        return false;
    }

    techs.push("PHP".to_string());
    if primary.is_none() {
        *primary = Some("PHP".to_string());
    }

    if wp_config.exists() {
        techs.push("WordPress".to_string());
        *primary = Some("WordPress".to_string());
    }

    if dir.join("artisan").exists() {
        techs.push("Laravel".to_string());
        *primary = Some("Laravel".to_string());
    }

    if composer_json.exists() {
        if let Ok(content) = fs::read_to_string(&composer_json) {
            if let Ok(json) = serde_json::from_str::<serde_json::Value>(&content) {
                if let Some(n) = json.get("name").and_then(|v| v.as_str()) {
                    let simple = n.split('/').last().unwrap_or(n);
                    if !simple.is_empty() && custom_name.is_none() {
                        *custom_name = Some(simple.to_string());
                    }
                }
                let lower = serde_json::to_string(&json).unwrap_or_default().to_lowercase();
                if lower.contains("\"symfony/") {
                    techs.push("Symfony".to_string());
                    *primary = Some("Symfony".to_string());
                }
                if lower.contains("\"filament/filament\"") {
                    techs.push("Filament".to_string());
                }
            }
        }
    }

    true
}

fn detect_ruby(
    dir: &Path,
    techs: &mut Vec<String>,
    primary: &mut Option<String>,
    _custom_name: &mut Option<String>,
) -> bool {
    let gemfile = dir.join("Gemfile");
    let rakefile = dir.join("Rakefile");

    if !gemfile.exists() && !rakefile.exists() {
        return false;
    }

    techs.push("Ruby".to_string());
    if primary.is_none() {
        *primary = Some("Ruby".to_string());
    }

    if dir.join("bin/rails").exists() || dir.join("config/application.rb").exists() {
        techs.push("Ruby on Rails".to_string());
        *primary = Some("Rails".to_string());
    }

    if let Ok(content) = fs::read_to_string(&gemfile) {
        let lower = content.to_lowercase();
        if lower.contains("sinatra") {
            techs.push("Sinatra".to_string());
        }
        if lower.contains("jekyll") {
            techs.push("Jekyll".to_string());
            *primary = Some("Jekyll".to_string());
        }
    }

    true
}

fn detect_elixir_erlang(dir: &Path, techs: &mut Vec<String>, primary: &mut Option<String>) -> bool {
    if dir.join("mix.exs").exists() {
        techs.push("Elixir".to_string());
        if primary.is_none() {
            *primary = Some("Elixir".to_string());
        }
        if let Ok(content) = fs::read_to_string(dir.join("mix.exs")) {
            if content.to_lowercase().contains("phoenix") {
                techs.push("Phoenix".to_string());
                *primary = Some("Phoenix".to_string());
            }
        }
        return true;
    }

    if dir.join("rebar.config").exists() {
        techs.push("Erlang".to_string());
        if primary.is_none() {
            *primary = Some("Erlang".to_string());
        }
        return true;
    }

    false
}

fn detect_dart_flutter(dir: &Path, techs: &mut Vec<String>, primary: &mut Option<String>) -> bool {
    if dir.join("pubspec.yaml").exists() {
        techs.push("Dart".to_string());
        if let Ok(content) = fs::read_to_string(dir.join("pubspec.yaml")) {
            if content.contains("flutter:") || content.contains("sdk: flutter") {
                techs.push("Flutter".to_string());
                *primary = Some("Flutter".to_string());
            } else if primary.is_none() {
                *primary = Some("Dart".to_string());
            }
        }
        return true;
    }
    false
}

fn detect_swift_apple(dir: &Path, techs: &mut Vec<String>, primary: &mut Option<String>) -> bool {
    let pkg_swift = dir.join("Package.swift");
    let podfile = dir.join("Podfile");

    let has_xcode = fs::read_dir(dir).ok().map(|entries| {
        entries.filter_map(|e| e.ok()).any(|e| {
            let n = e.file_name().to_string_lossy().to_lowercase();
            n.ends_with(".xcodeproj") || n.ends_with(".xcworkspace")
        })
    }).unwrap_or(false);

    if pkg_swift.exists() || podfile.exists() || has_xcode {
        techs.push("Swift".to_string());
        if primary.is_none() {
            *primary = Some("Swift".to_string());
        }
        if has_xcode {
            techs.push("iOS / Apple".to_string());
        }
        return true;
    }

    false
}

fn detect_zig(dir: &Path, techs: &mut Vec<String>, primary: &mut Option<String>) -> bool {
    if dir.join("build.zig").exists() || dir.join("build.zig.zon").exists() {
        techs.push("Zig".to_string());
        if primary.is_none() {
            *primary = Some("Zig".to_string());
        }
        return true;
    }
    false
}

fn detect_lua(dir: &Path, techs: &mut Vec<String>, primary: &mut Option<String>) -> bool {
    if dir.join("init.lua").exists() || dir.join("conf.lua").exists() || dir.join("main.lua").exists() {
        techs.push("Lua".to_string());
        if dir.join("conf.lua").exists() {
            techs.push("LÖVE 2D".to_string());
            *primary = Some("LÖVE (Lua)".to_string());
        } else if primary.is_none() {
            *primary = Some("Lua".to_string());
        }
        return true;
    }
    false
}

fn detect_haskell(dir: &Path, techs: &mut Vec<String>, primary: &mut Option<String>) -> bool {
    if dir.join("stack.yaml").exists() {
        techs.push("Haskell".to_string());
        techs.push("Stack".to_string());
        if primary.is_none() {
            *primary = Some("Haskell".to_string());
        }
        return true;
    }

    let has_cabal = fs::read_dir(dir).ok().map(|entries| {
        entries.filter_map(|e| e.ok()).any(|e| {
            e.file_name().to_string_lossy().ends_with(".cabal")
        })
    }).unwrap_or(false);

    if has_cabal {
        techs.push("Haskell".to_string());
        techs.push("Cabal".to_string());
        if primary.is_none() {
            *primary = Some("Haskell".to_string());
        }
        return true;
    }

    false
}

fn detect_julia_r(dir: &Path, techs: &mut Vec<String>, primary: &mut Option<String>) -> bool {
    if dir.join("Project.toml").exists() && dir.join("Manifest.toml").exists() {
        techs.push("Julia".to_string());
        if primary.is_none() {
            *primary = Some("Julia".to_string());
        }
        return true;
    }

    if dir.join("DESCRIPTION").exists() || dir.join(".Rproj").exists() {
        techs.push("R".to_string());
        if primary.is_none() {
            *primary = Some("R".to_string());
        }
        return true;
    }

    false
}

fn detect_web3_solidity(dir: &Path, techs: &mut Vec<String>, primary: &mut Option<String>) -> bool {
    let hardhat = dir.join("hardhat.config.js").exists() || dir.join("hardhat.config.ts").exists();
    let foundry = dir.join("foundry.toml").exists();
    let truffle = dir.join("truffle-config.js").exists();

    if hardhat || foundry || truffle {
        techs.push("Solidity".to_string());
        techs.push("Web3".to_string());
        if foundry {
            techs.push("Foundry".to_string());
        }
        if hardhat {
            techs.push("Hardhat".to_string());
        }
        if primary.is_none() {
            *primary = Some("Solidity".to_string());
        }
        return true;
    }

    false
}

fn detect_devops_cloud(dir: &Path, techs: &mut Vec<String>) {
    if dir.join("Dockerfile").exists() || dir.join("Containerfile").exists() {
        techs.push("Docker".to_string());
    }
    if dir.join("docker-compose.yml").exists() || dir.join("docker-compose.yaml").exists() || dir.join("compose.yaml").exists() {
        techs.push("Docker Compose".to_string());
    }
    if dir.join("Chart.yaml").exists() || dir.join("k8s").exists() || dir.join("kubernetes").exists() {
        techs.push("Kubernetes".to_string());
    }
    if dir.join("main.tf").exists() || dir.join("terraform").exists() {
        techs.push("Terraform".to_string());
    }
    if dir.join("Pulumi.yaml").exists() {
        techs.push("Pulumi".to_string());
    }
    if dir.join("wrangler.toml").exists() || dir.join("wrangler.json").exists() {
        techs.push("Cloudflare Workers".to_string());
    }
    if dir.join(".github/workflows").exists() {
        techs.push("GitHub Actions".to_string());
    }
}

fn profile_extensions(dir: &Path) -> HashMap<String, usize> {
    let mut counts: HashMap<String, usize> = HashMap::new();
    let ignores = ["node_modules", "target", ".venv", "venv", ".git", "dist", "build", "vendor", "bin", "obj", ".idea", ".vscode"];

    for entry in WalkDir::new(dir)
        .max_depth(3)
        .into_iter()
        .filter_entry(|e| {
            let name = e.file_name().to_string_lossy();
            !ignores.iter().any(|&ig| name.eq_ignore_ascii_case(ig))
        })
        .flatten()
    {
        if !entry.file_type().is_file() {
            continue;
        }

        let path = entry.path();
        if let Some(ext) = path.extension().and_then(|s| s.to_str()) {
            let ext_lower = ext.to_lowercase();
            let lang = match ext_lower.as_str() {
                "rs" => "Rust",
                "ts" | "tsx" => "TypeScript",
                "js" | "jsx" | "mjs" | "cjs" => "JavaScript",
                "py" | "pyw" | "ipynb" => "Python",
                "go" => "Go",
                "cs" => "C#",
                "fs" | "fsi" | "fsx" => "F#",
                "cpp" | "cc" | "cxx" | "hpp" | "h" => "C++",
                "c" => "C",
                "java" => "Java",
                "kt" | "kts" => "Kotlin",
                "scala" => "Scala",
                "php" => "PHP",
                "rb" => "Ruby",
                "ex" | "exs" => "Elixir",
                "erl" | "hrl" => "Erlang",
                "dart" => "Dart",
                "swift" => "Swift",
                "zig" => "Zig",
                "lua" => "Lua",
                "r" => "R",
                "jl" => "Julia",
                "sol" => "Solidity",
                "vue" => "Vue.js",
                "svelte" => "Svelte",
                "astro" => "Astro",
                "sql" => "SQL",
                "html" | "htm" => "HTML",
                "css" | "scss" | "sass" | "less" => "CSS",
                "sh" | "bash" | "zsh" | "ps1" => "Shell",
                _ => continue,
            };

            *counts.entry(lang.to_string()).or_insert(0) += 1;
        }
    }

    counts
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
    let ignores = ["node_modules", "target", ".venv", "venv", ".git", "dist", "build", "vendor", ".gradle", "bin", "obj"];

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

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs::File;
    use std::io::Write;

    #[test]
    fn test_detect_rust_tauri() {
        let temp_dir = std::env::temp_dir().join(format!("crescent_test_rust_{}", uuid::Uuid::new_v4()));
        let _ = fs::create_dir_all(&temp_dir);

        let cargo_toml = temp_dir.join("Cargo.toml");
        let mut file = File::create(cargo_toml).unwrap();
        writeln!(file, "[package]\nname = \"my-awesome-app\"\nversion = \"0.1.0\"\n\n[dependencies]\ntauri = \"2.0\"\ntokio = \"1.0\"").unwrap();

        let result = detect_project_markers(&temp_dir);
        assert!(result.is_some());
        let (primary, techs, name) = result.unwrap();
        assert_eq!(primary, "Tauri");
        assert!(techs.contains(&"Rust".to_string()));
        assert!(techs.contains(&"Tauri".to_string()));
        assert!(techs.contains(&"Tokio".to_string()));
        assert_eq!(name, Some("my-awesome-app".to_string()));

        let _ = fs::remove_dir_all(&temp_dir);
    }

    #[test]
    fn test_detect_nextjs_ts() {
        let temp_dir = std::env::temp_dir().join(format!("crescent_test_next_{}", uuid::Uuid::new_v4()));
        let _ = fs::create_dir_all(&temp_dir);

        let pkg_json = temp_dir.join("package.json");
        let mut file = File::create(pkg_json).unwrap();
        writeln!(file, r#"{{"name": "frontend-web", "dependencies": {{"next": "15.0.0", "react": "19.0.0", "tailwindcss": "4.0.0"}}}}"#).unwrap();

        let tsconfig = temp_dir.join("tsconfig.json");
        let _ = File::create(tsconfig).unwrap();

        let result = detect_project_markers(&temp_dir);
        assert!(result.is_some());
        let (primary, techs, name) = result.unwrap();
        assert_eq!(primary, "Next.js");
        assert!(techs.contains(&"TypeScript".to_string()));
        assert!(techs.contains(&"Next.js".to_string()));
        assert!(techs.contains(&"React".to_string()));
        assert!(techs.contains(&"Tailwind CSS".to_string()));
        assert_eq!(name, Some("frontend-web".to_string()));

        let _ = fs::remove_dir_all(&temp_dir);
    }

    #[test]
    fn test_detect_fastapi_python() {
        let temp_dir = std::env::temp_dir().join(format!("crescent_test_py_{}", uuid::Uuid::new_v4()));
        let _ = fs::create_dir_all(&temp_dir);

        let reqs = temp_dir.join("requirements.txt");
        let mut file = File::create(reqs).unwrap();
        writeln!(file, "fastapi==0.110.0\nuvicorn==0.28.0\npydantic==2.6.0\ntorch==2.2.0").unwrap();

        let result = detect_project_markers(&temp_dir);
        assert!(result.is_some());
        let (primary, techs, _) = result.unwrap();
        assert_eq!(primary, "FastAPI");
        assert!(techs.contains(&"Python".to_string()));
        assert!(techs.contains(&"FastAPI".to_string()));
        assert!(techs.contains(&"PyTorch".to_string()));
        assert!(techs.contains(&"Pydantic".to_string()));

        let _ = fs::remove_dir_all(&temp_dir);
    }
}

