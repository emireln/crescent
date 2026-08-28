use serde::{Deserialize, Serialize};
use std::process::Command;

#[cfg(windows)]
use std::os::windows::process::CommandExt;

#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x08000000;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PortStatusInfo {
    pub port: u16,
    pub is_active: bool,
    pub pid: Option<u32>,
    pub process_name: Option<String>,
}

pub fn check_single_port(port: u16) -> PortStatusInfo {
    #[cfg(windows)]
    {
        let mut cmd = Command::new("cmd");
        cmd.args(["/c", &format!("netstat -ano -p tcp | findstr /R /C:\":{}\"", port)]);
        cmd.creation_flags(CREATE_NO_WINDOW);

        if let Ok(output) = cmd.output() {
            let stdout = String::from_utf8_lossy(&output.stdout);
            for line in stdout.lines() {
                let trimmed = line.trim();
                if trimmed.contains("LISTENING") {
                    let parts: Vec<&str> = trimmed.split_whitespace().collect();
                    if let Some(local_addr) = parts.get(1) {
                        // Check if port matches exactly (e.g. ":3000" not ":30001")
                        if local_addr.ends_with(&format!(":{}", port)) {
                            if let Some(pid_str) = parts.last() {
                                if let Ok(pid) = pid_str.parse::<u32>() {
                                    let proc_name = get_process_name_by_pid(pid);
                                    return PortStatusInfo {
                                        port,
                                        is_active: true,
                                        pid: Some(pid),
                                        process_name: proc_name,
                                    };
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    #[cfg(not(windows))]
    {
        if let Ok(listener) = std::net::TcpListener::bind(("127.0.0.1", port)) {
            drop(listener);
            return PortStatusInfo {
                port,
                is_active: false,
                pid: None,
                process_name: None,
            };
        } else {
            return PortStatusInfo {
                port,
                is_active: true,
                pid: None,
                process_name: None,
            };
        }
    }

    PortStatusInfo {
        port,
        is_active: false,
        pid: None,
        process_name: None,
    }
}

pub fn check_multiple_ports(ports: Vec<u16>) -> Vec<PortStatusInfo> {
    ports.into_iter().map(check_single_port).collect()
}

pub fn kill_process_on_port(port: u16) -> Result<String, String> {
    let status = check_single_port(port);
    if !status.is_active || status.pid.is_none() {
        return Err(format!("Nenhum processo ativo escutando na porta {}.", port));
    }

    let pid = status.pid.unwrap();
    let proc_name = status.process_name.unwrap_or_else(|| "processo".to_string());

    #[cfg(windows)]
    {
        let mut cmd = Command::new("cmd");
        cmd.args(["/c", &format!("taskkill /PID {} /F", pid)]);
        cmd.creation_flags(CREATE_NO_WINDOW);

        match cmd.output() {
            Ok(out) => {
                if out.status.success() {
                    Ok(format!("Processo {} (PID {}) encerrado com sucesso na porta {}.", proc_name, pid, port))
                } else {
                    let err = String::from_utf8_lossy(&out.stderr);
                    Err(format!("Falha ao encerrar processo (PID {}): {}", pid, err))
                }
            }
            Err(e) => Err(format!("Erro ao executar taskkill: {}", e)),
        }
    }

    #[cfg(not(windows))]
    {
        let mut cmd = Command::new("kill");
        cmd.args(["-9", &pid.to_string()]);
        match cmd.output() {
            Ok(_) => Ok(format!("Processo {} (PID {}) encerrado na porta {}.", proc_name, pid, port)),
            Err(e) => Err(format!("Falha ao encerrar processo: {}", e)),
        }
    }
}

#[cfg(windows)]
fn get_process_name_by_pid(pid: u32) -> Option<String> {
    let mut cmd = Command::new("cmd");
    cmd.args(["/c", &format!("tasklist /FI \"PID eq {}\" /FO CSV /NH", pid)]);
    cmd.creation_flags(CREATE_NO_WINDOW);

    if let Ok(output) = cmd.output() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        for line in stdout.lines() {
            let line = line.trim();
            if line.starts_with('"') {
                if let Some(first_quote_end) = line[1..].find('"') {
                    let name = &line[1..=first_quote_end];
                    if !name.is_empty() && !name.eq_ignore_ascii_case("info:") {
                        return Some(name.to_string());
                    }
                }
            }
        }
    }
    None
}
