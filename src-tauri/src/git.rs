use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::Path;
use std::process::Command;

#[cfg(windows)]
use std::os::windows::process::CommandExt;

#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x08000000;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitCommitSummary {
    pub hash: String,
    pub short_hash: String,
    pub message: String,
    pub author: String,
    pub relative_time: String,
    pub timestamp: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GitInfo {
    pub is_repo: bool,
    pub branch: Option<String>,
    pub dirty: bool,
    pub modified_count: usize,
    pub last_commit: Option<String>,
    pub ahead: usize,
    pub behind: usize,
    pub recent_commits: Vec<GitCommitSummary>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HeatmapDay {
    pub date: String, // YYYY-MM-DD
    pub count: usize,
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
            ahead: 0,
            behind: 0,
            recent_commits: Vec::new(),
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

    // 3. Get ahead / behind count
    let (ahead, behind) = {
        let mut cmd = Command::new("git");
        cmd.args(["rev-list", "--left-right", "--count", "@{u}...HEAD"])
            .current_dir(path);

        #[cfg(windows)]
        cmd.creation_flags(CREATE_NO_WINDOW);

        cmd.output()
            .ok()
            .and_then(|output| {
                if output.status.success() {
                    let txt = String::from_utf8_lossy(&output.stdout);
                    let parts: Vec<&str> = txt.trim().split_whitespace().collect();
                    if parts.len() == 2 {
                        let beh = parts[0].parse::<usize>().unwrap_or(0);
                        let ah = parts[1].parse::<usize>().unwrap_or(0);
                        return Some((ah, beh));
                    }
                }
                None
            })
            .unwrap_or((0, 0))
    };

    // 4. Get recent commits (last 5)
    let recent_commits = get_recent_commits(path, 5);

    let last_commit = recent_commits.first().map(|c| {
        format!("{} ({})", c.message, c.relative_time)
    });

    GitInfo {
        is_repo: true,
        branch,
        dirty,
        modified_count,
        last_commit,
        ahead,
        behind,
        recent_commits,
    }
}

pub fn get_recent_commits(path: &Path, count: usize) -> Vec<GitCommitSummary> {
    let mut cmd = Command::new("git");
    // format: %H|%h|%s|%an|%cr|%at
    cmd.args([
        "log",
        &format!("-{}", count),
        "--format=%H|%h|%s|%an|%cr|%at",
    ])
    .current_dir(path);

    #[cfg(windows)]
    cmd.creation_flags(CREATE_NO_WINDOW);

    let mut results = Vec::new();
    if let Ok(output) = cmd.output() {
        if output.status.success() {
            let stdout = String::from_utf8_lossy(&output.stdout);
            for line in stdout.lines() {
                let parts: Vec<&str> = line.split('|').collect();
                if parts.len() >= 6 {
                    results.push(GitCommitSummary {
                        hash: parts[0].to_string(),
                        short_hash: parts[1].to_string(),
                        message: parts[2].to_string(),
                        author: parts[3].to_string(),
                        relative_time: parts[4].to_string(),
                        timestamp: parts[5].parse::<i64>().unwrap_or(0),
                    });
                }
            }
        }
    }
    results
}

pub fn get_activity_heatmap(project_paths: Vec<String>) -> Vec<HeatmapDay> {
    let mut day_counts: HashMap<String, usize> = HashMap::new();

    for path_str in project_paths {
        let p = Path::new(&path_str);
        if !p.join(".git").exists() {
            continue;
        }

        let mut cmd = Command::new("git");
        // Get commit dates in YYYY-MM-DD for the last 90 days
        cmd.args([
            "log",
            "--since=90.days",
            "--format=%ad",
            "--date=short",
        ])
        .current_dir(p);

        #[cfg(windows)]
        cmd.creation_flags(CREATE_NO_WINDOW);

        if let Ok(output) = cmd.output() {
            if output.status.success() {
                let stdout = String::from_utf8_lossy(&output.stdout);
                for line in stdout.lines() {
                    let date_str = line.trim();
                    if date_str.len() == 10 {
                        *day_counts.entry(date_str.to_string()).or_insert(0) += 1;
                    }
                }
            }
        }
    }

    let mut result: Vec<HeatmapDay> = day_counts
        .into_iter()
        .map(|(date, count)| HeatmapDay { date, count })
        .collect();

    result.sort_by(|a, b| a.date.cmp(&b.date));
    result
}
