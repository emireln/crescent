use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use std::process::Command;

#[cfg(windows)]
use std::process::Child;

#[cfg(windows)]
use std::os::windows::process::CommandExt;

#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x08000000;

#[cfg(windows)]
const CREATE_NEW_CONSOLE: u32 = 0x00000010;

#[cfg(windows)]
fn spawn_windows_editor(command: &str, path: &str) -> std::io::Result<Child> {
    let shell_command = format!("{} \"%CRESCENT_PROJECT_PATH%\"", command);
    Command::new("cmd.exe")
        .args(["/D", "/C", shell_command.as_str()])
        .env("CRESCENT_PROJECT_PATH", path)
        .creation_flags(CREATE_NO_WINDOW)
        .spawn()
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScriptExecutionResult {
    pub success: bool,
    pub exit_code: Option<i32>,
    pub stdout: String,
    pub stderr: String,
}

pub fn open_editor(path: &str, editor: &str, custom_path: Option<&str>) -> Result<(), String> {
    if !Path::new(path).exists() {
        return Err("O diretório do projeto não existe no disco.".to_string());
    }

    #[cfg(windows)]
    {
        match editor {
            "code" => {
                spawn_windows_editor("code", path)
                    .map_err(|e| format!("Falha ao abrir no VS Code: {}", e))?;
            }
            "cursor" => {
                spawn_windows_editor("cursor", path)
                    .map_err(|e| format!("Falha ao abrir no Cursor: {}", e))?;
            }
            "windsurf" => {
                spawn_windows_editor("windsurf", path)
                    .map_err(|e| format!("Falha ao abrir no Windsurf: {}", e))?;
            }
            "trae" => {
                spawn_windows_editor("trae", path)
                    .map_err(|e| format!("Falha ao abrir no Trae: {}", e))?;
            }
            "kiro" => {
                spawn_windows_editor("kiro", path)
                    .map_err(|e| format!("Falha ao abrir no Kiro: {}", e))?;
            }
            "sublime" => {
                spawn_windows_editor("subl", path)
                    .map_err(|e| format!("Falha ao abrir no Sublime Text: {}", e))?;
            }
            "neovim" => {
                spawn_windows_editor("nvim-qt", path)
                    .or_else(|_| spawn_windows_editor("nvim", path))
                    .map_err(|e| format!("Falha ao abrir no Neovim: {}", e))?;
            }
            "zed" => {
                spawn_windows_editor("zed", path)
                    .map_err(|e| format!("Falha ao abrir no Zed: {}", e))?;
            }
            "idea" => {
                spawn_windows_editor("idea", path)
                    .map_err(|e| format!("Falha ao abrir no IntelliJ IDEA: {}", e))?;
            }
            "webstorm" => {
                spawn_windows_editor("webstorm", path)
                    .map_err(|e| format!("Falha ao abrir no WebStorm: {}", e))?;
            }
            "pycharm" => {
                spawn_windows_editor("pycharm", path)
                    .map_err(|e| format!("Falha ao abrir no PyCharm: {}", e))?;
            }
            "custom" => {
                if let Some(cp) = custom_path {
                    if !cp.trim().is_empty() {
                        Command::new(cp)
                            .arg(path)
                            .spawn()
                            .map_err(|e| format!("Falha ao abrir no editor customizado: {}", e))?;
                        return Ok(());
                    }
                }
                return Err("Caminho do editor customizado não foi configurado.".to_string());
            }
            _ => {
                // Fallback to code
                spawn_windows_editor("code", path)
                    .map_err(|e| format!("Falha ao executar editor: {}", e))?;
            }
        }
    }

    #[cfg(not(windows))]
    {
        let prog = match editor {
            "cursor" => "cursor",
            "windsurf" => "windsurf",
            "trae" => "trae",
            "kiro" => "kiro",
            "sublime" => "subl",
            "neovim" => "nvim",
            "zed" => "zed",
            "idea" => "idea",
            "webstorm" => "webstorm",
            "pycharm" => "pycharm",
            _ => "code",
        };
        Command::new(prog)
            .arg(path)
            .spawn()
            .map_err(|e| format!("Falha ao abrir editor: {}", e))?;
    }

    Ok(())
}

pub fn open_terminal(path: &str, terminal: &str, custom_path: Option<&str>) -> Result<(), String> {
    if !Path::new(path).exists() {
        return Err("O diretório do projeto não existe no disco.".to_string());
    }

    #[cfg(windows)]
    {
        match terminal {
            "wt" => {
                Command::new("wt.exe")
                    .args(["-d", path])
                    .spawn()
                    .map_err(|e| format!("Falha ao abrir Windows Terminal: {}", e))?;
            }
            "git-bash" => {
                // Try standard Git Bash locations or 'bash.exe'
                let git_bash_paths = [
                    "C:\\Program Files\\Git\\git-bash.exe",
                    "C:\\Program Files (x86)\\Git\\git-bash.exe",
                ];
                let mut spawned = false;
                for gbp in git_bash_paths {
                    if Path::new(gbp).exists() {
                        if Command::new(gbp).arg(format!("--cd={}", path)).spawn().is_ok() {
                            spawned = true;
                            break;
                        }
                    }
                }
                if !spawned {
                    Command::new("powershell.exe")
                        .args(["-NoExit"])
                        .current_dir(path)
                        .creation_flags(CREATE_NEW_CONSOLE)
                        .spawn()
                        .map_err(|e| format!("Falha ao abrir terminal: {}", e))?;
                }
            }
            "cmd" => {
                Command::new("cmd.exe")
                    .args(["/K"])
                    .current_dir(path)
                    .creation_flags(CREATE_NEW_CONSOLE)
                    .spawn()
                    .map_err(|e| format!("Falha ao abrir CMD: {}", e))?;
            }
            "custom" => {
                if let Some(cp) = custom_path {
                    if !cp.trim().is_empty() {
                        Command::new(cp)
                            .current_dir(path)
                            .spawn()
                            .map_err(|e| format!("Falha ao abrir terminal customizado: {}", e))?;
                        return Ok(());
                    }
                }
                return Err("Caminho do terminal customizado não foi configurado.".to_string());
            }
            _ => {
                // Default: PowerShell
                Command::new("powershell.exe")
                    .args(["-NoExit"])
                    .current_dir(path)
                    .creation_flags(CREATE_NEW_CONSOLE)
                    .spawn()
                    .map_err(|e| format!("Falha ao abrir PowerShell: {}", e))?;
            }
        }
    }

    #[cfg(not(windows))]
    {
        Command::new("x-terminal-emulator")
            .current_dir(path)
            .spawn()
            .map_err(|e| format!("Falha ao abrir terminal: {}", e))?;
    }

    Ok(())
}

pub fn open_explorer(path: &str) -> Result<(), String> {
    if !Path::new(path).exists() {
        return Err("O diretório do projeto não existe no disco.".to_string());
    }

    #[cfg(windows)]
    {
        Command::new("explorer.exe")
            .arg(path)
            .spawn()
            .map_err(|e| format!("Falha ao abrir Explorador de Arquivos: {}", e))?;
    }

    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .arg(path)
            .spawn()
            .map_err(|e| format!("Falha ao abrir Finder: {}", e))?;
    }

    #[cfg(target_os = "linux")]
    {
        Command::new("xdg-open")
            .arg(path)
            .spawn()
            .map_err(|e| format!("Falha ao abrir gerenciador de arquivos: {}", e))?;
    }

    Ok(())
}

pub fn open_browser_url(url: &str) -> Result<(), String> {
    open::that(url).map_err(|e| format!("Falha ao abrir navegador: {}", e))
}

pub fn read_project_readme(path: &str) -> Option<String> {
    let p = Path::new(path);
    let candidates = [
        p.join("README.md"),
        p.join("readme.md"),
        p.join("README.txt"),
        p.join("Readme.md"),
    ];

    for candidate in candidates {
        if candidate.exists() && candidate.is_file() {
            if let Ok(content) = fs::read_to_string(candidate) {
                // Limit to 200KB for safety
                if content.len() > 200_000 {
                    return Some(content[..200_000].to_string());
                }
                return Some(content);
            }
        }
    }

    None
}

pub fn execute_project_script(path: &str, command_str: &str) -> ScriptExecutionResult {
    if !Path::new(path).exists() {
        return ScriptExecutionResult {
            success: false,
            exit_code: Some(1),
            stdout: String::new(),
            stderr: "Diretório do projeto não existe no disco.".to_string(),
        };
    }

    #[cfg(windows)]
    let output = {
        let mut cmd = Command::new("cmd");
        cmd.args(["/c", command_str])
            .current_dir(path);
        cmd.creation_flags(CREATE_NO_WINDOW);
        cmd.output()
    };

    #[cfg(not(windows))]
    let output = {
        let mut cmd = Command::new("sh");
        cmd.args(["-c", command_str])
            .current_dir(path);
        cmd.output()
    };

    match output {
        Ok(out) => ScriptExecutionResult {
            success: out.status.success(),
            exit_code: out.status.code(),
            stdout: String::from_utf8_lossy(&out.stdout).to_string(),
            stderr: String::from_utf8_lossy(&out.stderr).to_string(),
        },
        Err(e) => ScriptExecutionResult {
            success: false,
            exit_code: Some(-1),
            stdout: String::new(),
            stderr: format!("Erro ao executar script: {}", e),
        },
    }
}
