use serde::{Deserialize, Serialize};
use std::path::Path;
use std::process::Command;

#[cfg(windows)]
use std::os::windows::process::CommandExt;

#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x08000000;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitInfo {
    pub is_repo: bool,
    pub branch: Option<String>,
    pub dirty: bool,
    pub modified_count: usize,
    pub last_commit: Option<String>,
}

pub fn get_git_info<P: AsRef<Path>>(path: P) -> GitInfo {
    let path = path.as_ref();
    let git_dir = path.join(".git");

    if !git_dir.exists() {
        return GitInfo {
            is_repo: false,
            branch: None,
            dirty: false,
            modified_count: 0,
            last_commit: None,
        };
    }

    // 1. Get branch name
    let branch = {
        let mut cmd = Command::new("git");
        cmd.args(["rev-parse", "--abbrev-ref", "HEAD"])
            .current_dir(path);
        
        #[cfg(windows)]
        cmd.creation_flags(CREATE_NO_WINDOW);

        cmd.output()
            .ok()
            .and_then(|output| {
                if output.status.success() {
                    let b = String::from_utf8_lossy(&output.stdout).trim().to_string();
                    if !b.is_empty() { Some(b) } else { None }
                } else {
                    None
                }
            })
    };

    // 2. Check dirty status (uncommitted/untracked changes)
    let (dirty, modified_count) = {
        let mut cmd = Command::new("git");
        cmd.args(["status", "--porcelain"])
            .current_dir(path);

        #[cfg(windows)]
        cmd.creation_flags(CREATE_NO_WINDOW);

        cmd.output()
            .map(|output| {
                if output.status.success() {
                    let text = String::from_utf8_lossy(&output.stdout);
                    let count = text.lines().filter(|l| !l.trim().is_empty()).count();
                    (count > 0, count)
                } else {
                    (false, 0)
                }
            })
            .unwrap_or((false, 0))
    };

    // 3. Get last commit message
    let last_commit = {
        let mut cmd = Command::new("git");
        cmd.args(["log", "-1", "--format=%s (%cr)"])
            .current_dir(path);

        #[cfg(windows)]
        cmd.creation_flags(CREATE_NO_WINDOW);

        cmd.output()
            .ok()
            .and_then(|output| {
                if output.status.success() {
                    let msg = String::from_utf8_lossy(&output.stdout).trim().to_string();
                    if !msg.is_empty() { Some(msg) } else { None }
                } else {
                    None
                }
            })
    };

    GitInfo {
        is_repo: true,
        branch,
        dirty,
        modified_count,
        last_commit,
    }
}
