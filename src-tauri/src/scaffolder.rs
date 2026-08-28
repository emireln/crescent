use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use std::process::Command;

#[cfg(windows)]
use std::os::windows::process::CommandExt;

#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x08000000;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectTemplate {
    pub id: String,
    pub name: String,
    pub description: String,
    pub primary_tech: String,
    pub tech_stack: Vec<String>,
    pub command_preview: String,
}

pub fn get_available_templates() -> Vec<ProjectTemplate> {
    vec![
        ProjectTemplate {
            id: "vite-react-ts".to_string(),
            name: "React + TypeScript (Vite)".to_string(),
            description: "Template moderno com React 19, TypeScript, Vite e Tailwind CSS".to_string(),
            primary_tech: "React".to_string(),
            tech_stack: vec!["React".to_string(), "TypeScript".to_string(), "Vite".to_string(), "Tailwind CSS".to_string()],
            command_preview: "npm create vite@latest <nome> -- --template react-ts".to_string(),
        },
        ProjectTemplate {
            id: "nextjs-app".to_string(),
            name: "Next.js (App Router)".to_string(),
            description: "Fullstack Next.js com App Router, TypeScript, Tailwind CSS e ESLint".to_string(),
            primary_tech: "Next.js".to_string(),
            tech_stack: vec!["Next.js".to_string(), "React".to_string(), "TypeScript".to_string(), "Tailwind CSS".to_string()],
            command_preview: "npx create-next-app@latest <nome> --ts --tailwind --app --eslint".to_string(),
        },
        ProjectTemplate {
            id: "tauri-app".to_string(),
            name: "Tauri v2 Desktop App".to_string(),
            description: "Aplicativo nativo desktop leve com backend em Rust e frontend React".to_string(),
            primary_tech: "Tauri".to_string(),
            tech_stack: vec!["Tauri".to_string(), "Rust".to_string(), "React".to_string(), "TypeScript".to_string()],
            command_preview: "npm create tauri-app@latest <nome> -- --template react-ts".to_string(),
        },
        ProjectTemplate {
            id: "rust-cli".to_string(),
            name: "Rust CLI / Backend Binary".to_string(),
            description: "Projeto Rust com Cargo, Tokio assíncrono e Serde".to_string(),
            primary_tech: "Rust".to_string(),
            tech_stack: vec!["Rust".to_string(), "Tokio".to_string(), "Serde".to_string()],
            command_preview: "cargo new <nome> --bin".to_string(),
        },
        ProjectTemplate {
            id: "fastapi-python".to_string(),
            name: "FastAPI REST API".to_string(),
            description: "API assíncrona moderna em Python com FastAPI, Pydantic e Uvicorn".to_string(),
            primary_tech: "FastAPI".to_string(),
            tech_stack: vec!["Python".to_string(), "FastAPI".to_string(), "Pydantic".to_string(), "Uvicorn".to_string()],
            command_preview: "uv init <nome> / pip install fastapi uvicorn".to_string(),
        },
        ProjectTemplate {
            id: "go-gin".to_string(),
            name: "Go Gin Web API".to_string(),
            description: "Serviço de alta performance em Go com Gin Framework".to_string(),
            primary_tech: "Go".to_string(),
            tech_stack: vec!["Go".to_string(), "Gin".to_string()],
            command_preview: "go mod init <nome> && go get github.com/gin-gonic/gin".to_string(),
        },
        ProjectTemplate {
            id: "astro-web".to_string(),
            name: "Astro Website".to_string(),
            description: "Site ultrarrápido com Astro, Islands Architecture e Markdown".to_string(),
            primary_tech: "Astro".to_string(),
            tech_stack: vec!["Astro".to_string(), "TypeScript".to_string(), "Tailwind CSS".to_string()],
            command_preview: "npm create astro@latest <nome> -- --template minimal".to_string(),
        },
    ]
}

pub fn scaffold_project(
    template_id: &str,
    target_parent_dir: &str,
    project_name: &str,
) -> Result<String, String> {
    let parent = Path::new(target_parent_dir);
    if !parent.exists() || !parent.is_dir() {
        return Err("O diretório pai de destino não existe.".to_string());
    }

    let project_dir = parent.join(project_name);
    if project_dir.exists() {
        return Err(format!("O diretório já existe: {}", project_dir.display()));
    }

    let _ = fs::create_dir_all(&project_dir);

    #[cfg(windows)]
    let res = match template_id {
        "vite-react-ts" => {
            let mut cmd = Command::new("cmd");
            cmd.args(["/c", &format!("npm create vite@latest \"{}\" -- --template react-ts", project_name)])
                .current_dir(target_parent_dir);
            cmd.creation_flags(CREATE_NO_WINDOW);
            cmd.output()
        }
        "nextjs-app" => {
            let mut cmd = Command::new("cmd");
            cmd.args(["/c", &format!("npx --yes create-next-app@latest \"{}\" --ts --tailwind --app --eslint --no-src-dir --import-alias \"@/*\" --use-npm", project_name)])
                .current_dir(target_parent_dir);
            cmd.creation_flags(CREATE_NO_WINDOW);
            cmd.output()
        }
        "rust-cli" => {
            let mut cmd = Command::new("cmd");
            cmd.args(["/c", &format!("cargo new \"{}\" --bin", project_name)])
                .current_dir(target_parent_dir);
            cmd.creation_flags(CREATE_NO_WINDOW);
            cmd.output()
        }
        "fastapi-python" => {
            // Create minimal starter files
            let main_py = project_dir.join("main.py");
            let reqs = project_dir.join("requirements.txt");
            let readme = project_dir.join("README.md");

            let _ = fs::write(&main_py, "from fastapi import FastAPI\n\napp = FastAPI(title=\"".to_string() + project_name + "\")\n\n@app.get(\"/\")\ndef read_root():\n    return {\"message\": \"API Online\"}\n");
            let _ = fs::write(&reqs, "fastapi>=0.110.0\nuvicorn>=0.28.0\npydantic>=2.6.0\n");
            let _ = fs::write(&readme, format!("# {}\n\nAPI FastAPI gerada via Crescent.\n\n### Executar:\n```bash\npip install -r requirements.txt\nuvicorn main:app --reload\n```\n", project_name));
            return Ok(project_dir.to_string_lossy().to_string());
        }
        "go-gin" => {
            let main_go = project_dir.join("main.go");
            let _ = fs::write(&main_go, "package main\n\nimport \"github.com/gin-gonic/gin\"\n\nfunc main() {\n\tr := gin.Default()\n\tr.GET(\"/\", func(c *gin.Context) {\n\t\tc.JSON(200, gin.H{\"message\": \"API Online\"})\n\t})\n\tr.Run(\":8080\")\n}\n");

            let mut cmd = Command::new("cmd");
            cmd.args(["/c", &format!("go mod init {} && go get github.com/gin-gonic/gin", project_name)])
                .current_dir(&project_dir);
            cmd.creation_flags(CREATE_NO_WINDOW);
            cmd.output()
        }
        _ => {
            // Generic fallback
            let readme = project_dir.join("README.md");
            let _ = fs::write(&readme, format!("# {}\n\nCriado via Crescent.\n", project_name));
            return Ok(project_dir.to_string_lossy().to_string());
        }
    };

    #[cfg(not(windows))]
    let res = Ok(std::process::Output {
        status: std::os::unix::process::ExitStatusExt::from_raw(0),
        stdout: Vec::new(),
        stderr: Vec::new(),
    });

    match res {
        Ok(out) => {
            if out.status.success() || project_dir.exists() {
                Ok(project_dir.to_string_lossy().to_string())
            } else {
                let err = String::from_utf8_lossy(&out.stderr);
                Err(format!("Falha ao gerar projeto: {}", err))
            }
        }
        Err(e) => Err(format!("Erro ao executar gerador: {}", e)),
    }
}
