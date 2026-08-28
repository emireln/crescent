use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::Path;
use std::time::Duration;

use crate::db::{AiMessage, Project};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LlmResponse {
    pub content: String,
    pub provider: String,
    pub model: String,
    pub prompt_tokens: u32,
    pub completion_tokens: u32,
    pub latency_ms: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OllamaTagItem {
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OllamaTagsResponse {
    pub models: Option<Vec<OllamaTagItem>>,
}

// -------------------------------------------------------------
// High-Density Context Builder (RAG & Token Optimizer)
// -------------------------------------------------------------

pub fn build_system_context(
    all_projects: &[Project],
    active_project: Option<&Project>,
    high_density: bool,
) -> String {
    let mut ctx = String::new();

    ctx.push_str("Você é o Crescent AI, assistente sênior de desenvolvimento de software e arquitetura integrado nativamente ao Crescent (Gerenciador Local de Projetos no Windows).\n");
    ctx.push_str("SOBRE O CRIADOR:\n");
    ctx.push_str("- Criador e Mantenedor: Emir Lima Neto (GitHub: https://github.com/emireln | Website: https://emirln.com | Apoio: https://buymeacoffee.com/emireln).\n\n");

    ctx.push_str("SOBRE O CRESCENT:\n");
    ctx.push_str("- O Crescent é um aplicativo desktop nativo para Windows (100% offline, seguro, sem telemetria).\n");
    ctx.push_str("- Stack Tecnológica: Backend em Rust (Tauri v2), Persistência em SQLite (%AppData%/Crescent/crescent.db), Frontend em React 19 + TypeScript + Tailwind CSS v4 e ícones @tabler/icons-react.\n");
    ctx.push_str("- Recursos Integrados do Crescent:\n");
    ctx.push_str("  1. Port Sentinel: Monitoramento TCP em tempo real e encerramento forçado (Kill) de processos bloqueando portas locais.\n");
    ctx.push_str("  2. Limpador de Disco: Análise e purga segura de gigabytes em node_modules, target/, .venv, .next, dist, build.\n");
    ctx.push_str("  3. Git Insights: Rastreamento de commits pendentes (ahead/behind), status dirty e histórico detalhado.\n");
    ctx.push_str("  4. Busca Global de Código (Grep): Pesquisa ultra-rápida de código em todos os repositórios cadastrados (Ctrl+Shift+F).\n");
    ctx.push_str("  5. Workspaces: Organização de repositórios por grupos e abertura de múltiplos projetos no editor com 1 clique.\n");
    ctx.push_str("  6. Gerador de Templates: Scaffolder instantâneo de projetos Vite React, Next.js, Tauri v2, FastAPI, Go Gin e Rust CLI.\n");
    ctx.push_str("  7. Inspetor .env: Comparação e geração automática de variáveis de ambiente a partir de .env.example.\n");
    ctx.push_str("  8. Windows System Tray: Acesso rápido na bandeja do sistema.\n\n");

    if high_density {
        ctx.push_str("DIRETRIZES DE RESPOSTA (ALTA DENSIDADE / HIGH-DENSITY TOKEN OPTIMIZER):\n");
        ctx.push_str("- Seja ultra-direto, técnico, inteligente e preciso.\n");
        ctx.push_str("- Elimine saudações prolixas ou formalismos desnecessários.\n");
        ctx.push_str("- Forneça blocos de código completos, comandos de terminal prontos para execução e soluções arquiteturais limpas.\n");
        ctx.push_str("- Idioma padrão: Português do Brasil (PT-BR).\n\n");
    } else {
        ctx.push_str("DIRETRIZES: Ajude o desenvolvedor com arquitetura, código, scripts, depuração, análise de dependências e organização de seus repositórios locais em PT-BR.\n\n");
    }

    ctx.push_str("=== ECOSSISTEMA DE PROJETOS LOCAIS NO CRESCENT ===\n");
    for p in all_projects.iter().take(50) {
        ctx.push_str(&format!(
            "- [{}] Path: {} | Stack: {} | Git: {} | Dirty: {}\n",
            p.name,
            p.path,
            p.primary_tech,
            p.git_branch.as_deref().unwrap_or("sem git"),
            p.git_dirty
        ));
    }
    ctx.push_str("\n");

    if let Some(p) = active_project {
        ctx.push_str("=== PROJETO ATUAL EM FOCO ===\n");
        ctx.push_str(&format!("Nome: {}\n", p.name));
        ctx.push_str(&format!("Caminho no Disco: {}\n", p.path));
        ctx.push_str(&format!("Stack Completa: {}\n", p.tech_stack.join(", ")));
        if !p.description.is_empty() {
            ctx.push_str(&format!("Descrição: {}\n", p.description));
        }
        if !p.notes.is_empty() {
            ctx.push_str(&format!("Anotações do Projeto:\n{}\n", p.notes));
        }

        // Add snippet of README if available
        let proj_path = Path::new(&p.path);
        let readme_p = proj_path.join("README.md");
        if readme_p.exists() {
            if let Ok(content) = fs::read_to_string(&readme_p) {
                let snippet: String = content.lines().take(40).collect::<Vec<&str>>().join("\n");
                ctx.push_str(&format!("Trecho do README.md:\n```markdown\n{}\n```\n", snippet));
            }
        }

        // Add ports and scripts
        if !p.ports.is_empty() {
            let ports_str = p.ports.iter().map(|pt| format!(":{}", pt.port)).collect::<Vec<_>>().join(", ");
            ctx.push_str(&format!("Portas Registradas: {}\n", ports_str));
        }
        if !p.scripts.is_empty() {
            ctx.push_str("Scripts Cadastrados:\n");
            for s in &p.scripts {
                ctx.push_str(&format!("- {}: `{}`\n", s.name, s.command));
            }
        }
        ctx.push_str("\n");
    }

    ctx
}

// -------------------------------------------------------------
// Multi-LLM API Dispatcher
// -------------------------------------------------------------

pub fn send_chat_to_provider(
    provider: &str,
    model: &str,
    system_prompt: &str,
    history: &[AiMessage],
    user_message: &str,
    settings: &HashMap<String, String>,
) -> Result<LlmResponse, String> {
    let start_time = std::time::Instant::now();
    let client = reqwest::blocking::Client::builder()
        .timeout(Duration::from_secs(90))
        .build()
        .map_err(|e| format!("Falha ao inicializar cliente HTTP: {}", e))?;

    match provider.to_lowercase().as_str() {
        "ollama" => {
            let base_url = settings
                .get("ai_ollama_url")
                .map(|s| s.trim())
                .filter(|s| !s.is_empty())
                .unwrap_or("http://localhost:11434");

            let url = format!("{}/api/chat", base_url.trim_end_matches('/'));

            let mut messages = Vec::new();
            messages.push(serde_json::json!({
                "role": "system",
                "content": system_prompt
            }));

            for m in history {
                messages.push(serde_json::json!({
                    "role": m.role,
                    "content": m.content
                }));
            }

            messages.push(serde_json::json!({
                "role": "user",
                "content": user_message
            }));

            let payload = serde_json::json!({
                "model": model,
                "messages": messages,
                "stream": false,
                "options": {
                    "temperature": 0.2
                }
            });

            let resp = client
                .post(&url)
                .json(&payload)
                .send()
                .map_err(|e| format!("Falha ao conectar com Ollama em {}: {}. Certifique-se de que o Ollama está rodando.", url, e))?;

            if !resp.status().is_success() {
                let err_txt = resp.text().unwrap_or_default();
                return Err(format!("Erro retornado pelo Ollama: {}", err_txt));
            }

            let json: serde_json::Value = resp.json().map_err(|e| format!("Resposta inválida do Ollama: {}", e))?;
            let content = json
                .get("message")
                .and_then(|m| m.get("content"))
                .and_then(|c| c.as_str())
                .unwrap_or("")
                .to_string();

            let prompt_tokens = json.get("prompt_eval_count").and_then(|v| v.as_u64()).unwrap_or(0) as u32;
            let completion_tokens = json.get("eval_count").and_then(|v| v.as_u64()).unwrap_or(0) as u32;

            Ok(LlmResponse {
                content,
                provider: "ollama".to_string(),
                model: model.to_string(),
                prompt_tokens,
                completion_tokens,
                latency_ms: start_time.elapsed().as_millis() as u64,
            })
        }

        "gemini" => {
            let api_key = settings
                .get("ai_gemini_key")
                .map(|s| s.trim())
                .filter(|s| !s.is_empty())
                .ok_or("Chave de API do Google Gemini não configurada. Configure nas Configurações.")?;

            let model_clean = if model.is_empty() { "gemini-2.5-flash" } else { model };
            let url = format!(
                "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent?key={}",
                model_clean, api_key
            );

            let mut contents = Vec::new();
            for m in history {
                let role = if m.role == "assistant" { "model" } else { "user" };
                contents.push(serde_json::json!({
                    "role": role,
                    "parts": [{ "text": m.content }]
                }));
            }
            contents.push(serde_json::json!({
                "role": "user",
                "parts": [{ "text": user_message }]
            }));

            let payload = serde_json::json!({
                "systemInstruction": {
                    "parts": [{ "text": system_prompt }]
                },
                "contents": contents,
                "generationConfig": {
                    "temperature": 0.2
                }
            });

            let resp = client
                .post(&url)
                .json(&payload)
                .send()
                .map_err(|e| format!("Falha ao conectar com a API do Gemini: {}", e))?;

            if !resp.status().is_success() {
                let err_txt = resp.text().unwrap_or_default();
                return Err(format!("Erro retornado pela API do Gemini: {}", err_txt));
            }

            let json: serde_json::Value = resp.json().map_err(|e| format!("Resposta inválida do Gemini: {}", e))?;
            let content = json
                .get("candidates")
                .and_then(|c| c.get(0))
                .and_then(|c0| c0.get("content"))
                .and_then(|cnt| cnt.get("parts"))
                .and_then(|pts| pts.get(0))
                .and_then(|p0| p0.get("text"))
                .and_then(|t| t.as_str())
                .unwrap_or("")
                .to_string();

            let prompt_tokens = json
                .get("usageMetadata")
                .and_then(|u| u.get("promptTokenCount"))
                .and_then(|v| v.as_u64())
                .unwrap_or(0) as u32;

            let completion_tokens = json
                .get("usageMetadata")
                .and_then(|u| u.get("candidatesTokenCount"))
                .and_then(|v| v.as_u64())
                .unwrap_or(0) as u32;

            Ok(LlmResponse {
                content,
                provider: "gemini".to_string(),
                model: model_clean.to_string(),
                prompt_tokens,
                completion_tokens,
                latency_ms: start_time.elapsed().as_millis() as u64,
            })
        }

        "openai" => {
            let api_key = settings
                .get("ai_openai_key")
                .map(|s| s.trim())
                .filter(|s| !s.is_empty())
                .ok_or("Chave de API da OpenAI não configurada. Configure nas Configurações.")?;

            let model_clean = if model.is_empty() { "gpt-4o" } else { model };
            let url = "https://api.openai.com/v1/chat/completions";

            let mut messages = Vec::new();
            messages.push(serde_json::json!({
                "role": "system",
                "content": system_prompt
            }));

            for m in history {
                messages.push(serde_json::json!({
                    "role": m.role,
                    "content": m.content
                }));
            }

            messages.push(serde_json::json!({
                "role": "user",
                "content": user_message
            }));

            let payload = serde_json::json!({
                "model": model_clean,
                "messages": messages,
                "temperature": 0.2
            });

            let resp = client
                .post(url)
                .header("Authorization", format!("Bearer {}", api_key))
                .json(&payload)
                .send()
                .map_err(|e| format!("Falha ao conectar com a API da OpenAI: {}", e))?;

            if !resp.status().is_success() {
                let err_txt = resp.text().unwrap_or_default();
                return Err(format!("Erro retornado pela OpenAI: {}", err_txt));
            }

            let json: serde_json::Value = resp.json().map_err(|e| format!("Resposta inválida da OpenAI: {}", e))?;
            let content = json
                .get("choices")
                .and_then(|c| c.get(0))
                .and_then(|c0| c0.get("message"))
                .and_then(|m| m.get("content"))
                .and_then(|cnt| cnt.as_str())
                .unwrap_or("")
                .to_string();

            let prompt_tokens = json.get("usage").and_then(|u| u.get("prompt_tokens")).and_then(|v| v.as_u64()).unwrap_or(0) as u32;
            let completion_tokens = json.get("usage").and_then(|u| u.get("completion_tokens")).and_then(|v| v.as_u64()).unwrap_or(0) as u32;

            Ok(LlmResponse {
                content,
                provider: "openai".to_string(),
                model: model_clean.to_string(),
                prompt_tokens,
                completion_tokens,
                latency_ms: start_time.elapsed().as_millis() as u64,
            })
        }

        "deepseek" => {
            let api_key = settings
                .get("ai_deepseek_key")
                .map(|s| s.trim())
                .filter(|s| !s.is_empty())
                .ok_or("Chave de API do DeepSeek não configurada. Configure nas Configurações.")?;

            let model_clean = if model.is_empty() { "deepseek-chat" } else { model };
            let url = "https://api.deepseek.com/chat/completions";

            let mut messages = Vec::new();
            messages.push(serde_json::json!({
                "role": "system",
                "content": system_prompt
            }));

            for m in history {
                messages.push(serde_json::json!({
                    "role": m.role,
                    "content": m.content
                }));
            }

            messages.push(serde_json::json!({
                "role": "user",
                "content": user_message
            }));

            let payload = serde_json::json!({
                "model": model_clean,
                "messages": messages,
                "temperature": 0.2
            });

            let resp = client
                .post(url)
                .header("Authorization", format!("Bearer {}", api_key))
                .json(&payload)
                .send()
                .map_err(|e| format!("Falha ao conectar com a API do DeepSeek: {}", e))?;

            if !resp.status().is_success() {
                let err_txt = resp.text().unwrap_or_default();
                return Err(format!("Erro retornado pelo DeepSeek: {}", err_txt));
            }

            let json: serde_json::Value = resp.json().map_err(|e| format!("Resposta inválida do DeepSeek: {}", e))?;
            let content = json
                .get("choices")
                .and_then(|c| c.get(0))
                .and_then(|c0| c0.get("message"))
                .and_then(|m| m.get("content"))
                .and_then(|cnt| cnt.as_str())
                .unwrap_or("")
                .to_string();

            let prompt_tokens = json.get("usage").and_then(|u| u.get("prompt_tokens")).and_then(|v| v.as_u64()).unwrap_or(0) as u32;
            let completion_tokens = json.get("usage").and_then(|u| u.get("completion_tokens")).and_then(|v| v.as_u64()).unwrap_or(0) as u32;

            Ok(LlmResponse {
                content,
                provider: "deepseek".to_string(),
                model: model_clean.to_string(),
                prompt_tokens,
                completion_tokens,
                latency_ms: start_time.elapsed().as_millis() as u64,
            })
        }

        "claude" => {
            let api_key = settings
                .get("ai_claude_key")
                .map(|s| s.trim())
                .filter(|s| !s.is_empty())
                .ok_or("Chave de API do Anthropic Claude não configurada. Configure nas Configurações.")?;

            let model_clean = if model.is_empty() { "claude-3-7-sonnet-20250219" } else { model };
            let url = "https://api.anthropic.com/v1/messages";

            let mut messages = Vec::new();
            for m in history {
                messages.push(serde_json::json!({
                    "role": m.role,
                    "content": m.content
                }));
            }

            messages.push(serde_json::json!({
                "role": "user",
                "content": user_message
            }));

            let payload = serde_json::json!({
                "model": model_clean,
                "max_tokens": 4096,
                "system": system_prompt,
                "messages": messages,
                "temperature": 0.2
            });

            let resp = client
                .post(url)
                .header("x-api-key", api_key)
                .header("anthropic-version", "2023-06-01")
                .json(&payload)
                .send()
                .map_err(|e| format!("Falha ao conectar com a API do Claude: {}", e))?;

            if !resp.status().is_success() {
                let err_txt = resp.text().unwrap_or_default();
                return Err(format!("Erro retornado pela Anthropic: {}", err_txt));
            }

            let json: serde_json::Value = resp.json().map_err(|e| format!("Resposta inválida do Claude: {}", e))?;
            let content = json
                .get("content")
                .and_then(|c| c.get(0))
                .and_then(|c0| c0.get("text"))
                .and_then(|t| t.as_str())
                .unwrap_or("")
                .to_string();

            let prompt_tokens = json.get("usage").and_then(|u| u.get("input_tokens")).and_then(|v| v.as_u64()).unwrap_or(0) as u32;
            let completion_tokens = json.get("usage").and_then(|u| u.get("output_tokens")).and_then(|v| v.as_u64()).unwrap_or(0) as u32;

            Ok(LlmResponse {
                content,
                provider: "claude".to_string(),
                model: model_clean.to_string(),
                prompt_tokens,
                completion_tokens,
                latency_ms: start_time.elapsed().as_millis() as u64,
            })
        }

        _ => Err(format!("Provedor de IA desconhecido: '{}'. Suportados: ollama, gemini, openai, deepseek, claude.", provider)),
    }
}

pub fn list_ollama_local_models(ollama_url: &str) -> Result<Vec<String>, String> {
    let client = reqwest::blocking::Client::builder()
        .timeout(Duration::from_secs(5))
        .build()
        .map_err(|e| e.to_string())?;

    let base = if ollama_url.trim().is_empty() {
        "http://localhost:11434"
    } else {
        ollama_url.trim()
    };

    let url = format!("{}/api/tags", base.trim_end_matches('/'));

    let resp = client
        .get(&url)
        .send()
        .map_err(|e| format!("Ollama offline ou inacessível em {}: {}", url, e))?;

    if !resp.status().is_success() {
        return Err(format!("Ollama retornou status {}", resp.status()));
    }

    let parsed: OllamaTagsResponse = resp
        .json()
        .map_err(|e| format!("Falha ao interpretar resposta do Ollama: {}", e))?;

    let models = parsed
        .models
        .unwrap_or_default()
        .into_iter()
        .map(|m| m.name)
        .collect();

    Ok(models)
}
