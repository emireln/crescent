use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EnvFileInfo {
    pub has_env: bool,
    pub has_example: bool,
    pub has_local: bool,
    pub example_keys: Vec<String>,
    pub env_keys: Vec<String>,
    pub missing_keys: Vec<String>,
    pub env_example_content: Option<String>,
}

pub fn inspect_env_files(project_path: &str) -> EnvFileInfo {
    let p = Path::new(project_path);
    let env_file = p.join(".env");
    let env_example_file = p.join(".env.example");
    let env_local_file = p.join(".env.local");

    let has_env = env_file.exists();
    let has_example = env_example_file.exists();
    let has_local = env_local_file.exists();

    let mut example_keys = Vec::new();
    let mut env_keys = Vec::new();
    let mut env_example_content = None;

    if has_example {
        if let Ok(content) = fs::read_to_string(&env_example_file) {
            example_keys = parse_env_keys(&content);
            env_example_content = Some(content);
        }
    }

    if has_env {
        if let Ok(content) = fs::read_to_string(&env_file) {
            env_keys = parse_env_keys(&content);
        }
    }

    let mut missing_keys = Vec::new();
    for k in &example_keys {
        if !env_keys.contains(k) {
            missing_keys.push(k.clone());
        }
    }

    EnvFileInfo {
        has_env,
        has_example,
        has_local,
        example_keys,
        env_keys,
        missing_keys,
        env_example_content,
    }
}

pub fn create_env_from_example(project_path: &str) -> Result<String, String> {
    let p = Path::new(project_path);
    let env_file = p.join(".env");
    let env_example_file = p.join(".env.example");

    if !env_example_file.exists() {
        return Err("Arquivo .env.example não foi encontrado neste projeto.".to_string());
    }

    if env_file.exists() {
        return Err("O arquivo .env já existe neste projeto.".to_string());
    }

    fs::copy(&env_example_file, &env_file)
        .map_err(|e| format!("Falha ao copiar .env.example para .env: {}", e))?;

    Ok("Arquivo .env criado com sucesso a partir do .env.example!".to_string())
}

fn parse_env_keys(content: &str) -> Vec<String> {
    let mut keys = Vec::new();
    for line in content.lines() {
        let trimmed = line.trim();
        if trimmed.is_empty() || trimmed.starts_with('#') {
            continue;
        }
        if let Some(eq_idx) = trimmed.find('=') {
            let key = trimmed[..eq_idx].trim().to_string();
            if !key.is_empty() && !keys.contains(&key) {
                keys.push(key);
            }
        }
    }
    keys
}
