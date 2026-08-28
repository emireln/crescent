use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use uuid::Uuid;

use crate::git::{get_git_info, GitInfo};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Tag {
    pub id: String,
    pub name: String,
    pub color: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectScript {
    pub id: String,
    pub project_id: String,
    pub name: String,
    pub command: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectPort {
    pub id: String,
    pub project_id: String,
    pub port: u16,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Workspace {
    pub id: String,
    pub name: String,
    pub description: String,
    pub project_ids: Vec<String>,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiConversation {
    pub id: String,
    pub title: String,
    pub project_id: Option<String>,
    pub provider: String,
    pub model: String,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AiMessage {
    pub id: String,
    pub conversation_id: String,
    pub role: String,
    pub content: String,
    pub provider: String,
    pub model: String,
    pub prompt_tokens: u32,
    pub completion_tokens: u32,
    pub created_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Project {
    pub id: String,
    pub name: String,
    pub path: String,
    pub description: String,
    pub tech_stack: Vec<String>,
    pub primary_tech: String,
    pub status: String, // "active", "on_hold", "completed", "archived"
    pub is_favorite: bool,
    pub is_pinned: bool,
    pub notes: String,
    pub readme_cache: Option<String>,
    pub last_modified: i64,
    pub size_bytes: u64,
    pub git_branch: Option<String>,
    pub git_dirty: bool,
    pub exists_on_disk: bool, // Dynamically evaluated
    pub tags: Vec<Tag>,
    pub scripts: Vec<ProjectScript>,
    pub ports: Vec<ProjectPort>,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateProjectInput {
    pub name: String,
    pub path: String,
    pub description: Option<String>,
    pub tech_stack: Vec<String>,
    pub primary_tech: String,
    pub status: Option<String>,
    pub is_favorite: Option<bool>,
    pub is_pinned: Option<bool>,
    pub notes: Option<String>,
    pub tag_ids: Option<Vec<String>>,
    pub ports: Option<Vec<u16>>,
    pub scripts: Option<Vec<(String, String)>>, // (name, command)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateProjectInput {
    pub id: String,
    pub name: String,
    pub path: String,
    pub description: String,
    pub tech_stack: Vec<String>,
    pub primary_tech: String,
    pub status: String,
    pub is_favorite: bool,
    pub is_pinned: bool,
    pub notes: String,
    pub tag_ids: Vec<String>,
}

pub struct DbState {
    pub conn: Mutex<Connection>,
}

pub fn get_db_path() -> PathBuf {
    #[cfg(target_os = "windows")]
    let base_dir = std::env::var("APPDATA")
        .map(PathBuf::from)
        .unwrap_or_else(|_| PathBuf::from("."));

    #[cfg(not(target_os = "windows"))]
    let base_dir = std::env::var("HOME")
        .map(|h| PathBuf::from(h).join(".config"))
        .unwrap_or_else(|_| PathBuf::from("."));

    let app_dir = base_dir.join("Crescent");
    let _ = fs::create_dir_all(&app_dir);
    app_dir.join("crescent.db")
}

pub fn init_db() -> Result<DbState, String> {
    let db_path = get_db_path();
    let conn = Connection::open(&db_path).map_err(|e| format!("Failed to open db: {}", e))?;

    conn.execute_batch(
        r#"
        PRAGMA journal_mode = WAL;
        PRAGMA foreign_keys = ON;

        CREATE TABLE IF NOT EXISTS projects (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            path TEXT NOT NULL UNIQUE,
            description TEXT DEFAULT '',
            tech_stack TEXT NOT NULL,
            primary_tech TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'active',
            is_favorite INTEGER NOT NULL DEFAULT 0,
            is_pinned INTEGER NOT NULL DEFAULT 0,
            notes TEXT DEFAULT '',
            readme_cache TEXT,
            last_modified INTEGER NOT NULL,
            size_bytes INTEGER NOT NULL DEFAULT 0,
            git_branch TEXT,
            git_dirty INTEGER NOT NULL DEFAULT 0,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS tags (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            color TEXT NOT NULL DEFAULT '#3b82f6'
        );

        CREATE TABLE IF NOT EXISTS project_tags (
            project_id TEXT NOT NULL,
            tag_id TEXT NOT NULL,
            PRIMARY KEY (project_id, tag_id),
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
            FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS project_scripts (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            name TEXT NOT NULL,
            command TEXT NOT NULL,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS project_ports (
            id TEXT PRIMARY KEY,
            project_id TEXT NOT NULL,
            port INTEGER NOT NULL,
            description TEXT DEFAULT '',
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS workspaces (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL UNIQUE,
            description TEXT DEFAULT '',
            created_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS workspace_projects (
            workspace_id TEXT NOT NULL,
            project_id TEXT NOT NULL,
            PRIMARY KEY (workspace_id, project_id),
            FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS ai_conversations (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            project_id TEXT,
            provider TEXT NOT NULL,
            model TEXT NOT NULL,
            created_at INTEGER NOT NULL,
            updated_at INTEGER NOT NULL,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
        );

        CREATE TABLE IF NOT EXISTS ai_messages (
            id TEXT PRIMARY KEY,
            conversation_id TEXT NOT NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            provider TEXT NOT NULL,
            model TEXT NOT NULL,
            prompt_tokens INTEGER NOT NULL DEFAULT 0,
            completion_tokens INTEGER NOT NULL DEFAULT 0,
            created_at INTEGER NOT NULL,
            FOREIGN KEY (conversation_id) REFERENCES ai_conversations(id) ON DELETE CASCADE
        );
        "#,
    )
    .map_err(|e| format!("Failed to create tables: {}", e))?;

    // Seed default tags if empty
    let tag_count: i64 = conn
        .query_row("SELECT COUNT(*) FROM tags", [], |r| r.get(0))
        .unwrap_or(0);

    if tag_count == 0 {
        let default_tags = [
            ("Trabalho", "#a1a1aa"),
            ("Estudo", "#a1a1aa"),
            ("Freelance", "#a1a1aa"),
            ("Rust", "#a1a1aa"),
            ("Web", "#a1a1aa"),
            ("Mobile", "#a1a1aa"),
            ("Open Source", "#a1a1aa"),
        ];

        for (name, color) in default_tags {
            let id = Uuid::new_v4().to_string();
            let _ = conn.execute(
                "INSERT INTO tags (id, name, color) VALUES (?1, ?2, ?3)",
                params![id, name, color],
            );
        }
    }

    // Seed default settings if empty
    let default_settings = [
        ("default_editor", "code"),
        ("custom_editor_path", ""),
        ("default_terminal", "powershell"),
        ("custom_terminal_path", ""),
        ("scan_depth", "4"),
        ("scan_ignore", "node_modules,target,.venv,dist,build,.git,.next,.nuxt"),
    ];

    for (key, val) in default_settings {
        let _ = conn.execute(
            "INSERT OR IGNORE INTO settings (key, value) VALUES (?1, ?2)",
            params![key, val],
        );
    }

    Ok(DbState {
        conn: Mutex::new(conn),
    })
}

pub fn fetch_all_projects(conn: &Connection) -> Result<Vec<Project>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, name, path, description, tech_stack, primary_tech, status,
                    is_favorite, is_pinned, notes, readme_cache, last_modified,
                    size_bytes, git_branch, git_dirty, created_at, updated_at
             FROM projects ORDER BY is_pinned DESC, last_modified DESC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            let tech_stack_str: String = row.get(4)?;
            let tech_stack: Vec<String> = serde_json::from_str(&tech_stack_str).unwrap_or_default();

            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, String>(3)?,
                tech_stack,
                row.get::<_, String>(5)?,
                row.get::<_, String>(6)?,
                row.get::<_, i64>(7)? != 0,
                row.get::<_, i64>(8)? != 0,
                row.get::<_, String>(9)?,
                row.get::<_, Option<String>>(10)?,
                row.get::<_, i64>(11)?,
                row.get::<_, i64>(12)? as u64,
                row.get::<_, Option<String>>(13)?,
                row.get::<_, i64>(14)? != 0,
                row.get::<_, i64>(15)?,
                row.get::<_, i64>(16)?,
            ))
        })
        .map_err(|e| e.to_string())?;

    let mut projects = Vec::new();
    for r in rows {
        let (
            id,
            name,
            path,
            description,
            tech_stack,
            primary_tech,
            status,
            is_favorite,
            is_pinned,
            notes,
            readme_cache,
            last_modified,
            size_bytes,
            mut git_branch,
            mut git_dirty,
            created_at,
            updated_at,
        ) = r.map_err(|e| e.to_string())?;

        let path_obj = Path::new(&path);
        let exists_on_disk = path_obj.exists();
        let mut final_size_bytes = size_bytes;

        // Refresh live git status and calculate folder size if exists on disk
        if exists_on_disk {
            let git = get_git_info(&path);
            if git.is_repo {
                git_branch = git.branch;
                git_dirty = git.dirty;
            }
            if final_size_bytes == 0 {
                final_size_bytes = crate::scanner::calculate_folder_size_fast(path_obj);
                if final_size_bytes > 0 {
                    let _ = conn.execute(
                        "UPDATE projects SET size_bytes = ?1 WHERE id = ?2",
                        params![final_size_bytes as i64, id],
                    );
                }
            }
        }

        let tags = fetch_project_tags(conn, &id).unwrap_or_default();
        let scripts = fetch_project_scripts(conn, &id).unwrap_or_default();
        let ports = fetch_project_ports(conn, &id).unwrap_or_default();

        projects.push(Project {
            id,
            name,
            path,
            description,
            tech_stack,
            primary_tech,
            status,
            is_favorite,
            is_pinned,
            notes,
            readme_cache,
            last_modified,
            size_bytes: final_size_bytes,
            git_branch,
            git_dirty,
            exists_on_disk,
            tags,
            scripts,
            ports,
            created_at,
            updated_at,
        });
    }

    Ok(projects)
}

pub fn fetch_project_by_id(conn: &Connection, id: &str) -> Result<Option<Project>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT id, name, path, description, tech_stack, primary_tech, status,
                    is_favorite, is_pinned, notes, readme_cache, last_modified,
                    size_bytes, git_branch, git_dirty, created_at, updated_at
             FROM projects WHERE id = ?1",
        )
        .map_err(|e| e.to_string())?;

    let project = stmt
        .query_row(params![id], |row| {
            let tech_stack_str: String = row.get(4)?;
            let tech_stack: Vec<String> = serde_json::from_str(&tech_stack_str).unwrap_or_default();

            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, String>(3)?,
                tech_stack,
                row.get::<_, String>(5)?,
                row.get::<_, String>(6)?,
                row.get::<_, i64>(7)? != 0,
                row.get::<_, i64>(8)? != 0,
                row.get::<_, String>(9)?,
                row.get::<_, Option<String>>(10)?,
                row.get::<_, i64>(11)?,
                row.get::<_, i64>(12)? as u64,
                row.get::<_, Option<String>>(13)?,
                row.get::<_, i64>(14)? != 0,
                row.get::<_, i64>(15)?,
                row.get::<_, i64>(16)?,
            ))
        })
        .ok();

    if let Some((
        id,
        name,
        path,
        description,
        tech_stack,
        primary_tech,
        status,
        is_favorite,
        is_pinned,
        notes,
        readme_cache,
        last_modified,
        size_bytes,
        mut git_branch,
        mut git_dirty,
        created_at,
        updated_at,
    )) = project
    {
        let path_obj = Path::new(&path);
        let exists_on_disk = path_obj.exists();
        let mut final_size_bytes = size_bytes;

        if exists_on_disk {
            let git = get_git_info(&path);
            if git.is_repo {
                git_branch = git.branch;
                git_dirty = git.dirty;
            }
            if final_size_bytes == 0 {
                final_size_bytes = crate::scanner::calculate_folder_size_fast(path_obj);
                if final_size_bytes > 0 {
                    let _ = conn.execute(
                        "UPDATE projects SET size_bytes = ?1 WHERE id = ?2",
                        params![final_size_bytes as i64, id],
                    );
                }
            }
        }

        let tags = fetch_project_tags(conn, &id).unwrap_or_default();
        let scripts = fetch_project_scripts(conn, &id).unwrap_or_default();
        let ports = fetch_project_ports(conn, &id).unwrap_or_default();

        Ok(Some(Project {
            id,
            name,
            path,
            description,
            tech_stack,
            primary_tech,
            status,
            is_favorite,
            is_pinned,
            notes,
            readme_cache,
            last_modified,
            size_bytes: final_size_bytes,
            git_branch,
            git_dirty,
            exists_on_disk,
            tags,
            scripts,
            ports,
            created_at,
            updated_at,
        }))
    } else {
        Ok(None)
    }
}

pub fn insert_project(conn: &Connection, input: CreateProjectInput) -> Result<Project, String> {
    let id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now().timestamp();
    let tech_stack_json = serde_json::to_string(&input.tech_stack).unwrap_or_else(|_| "[]".to_string());
    let description = input.description.unwrap_or_default();
    let status = input.status.unwrap_or_else(|| "active".to_string());
    let is_favorite = input.is_favorite.unwrap_or(false);
    let is_pinned = input.is_pinned.unwrap_or(false);
    let notes = input.notes.unwrap_or_default();

    let path_obj = Path::new(&input.path);
    let exists_on_disk = path_obj.exists();
    let (last_modified, size_bytes) = if exists_on_disk {
        let lm = fs::metadata(path_obj)
            .and_then(|m| m.modified())
            .ok()
            .and_then(|d| d.duration_since(std::time::UNIX_EPOCH).ok())
            .map(|d| d.as_secs() as i64)
            .unwrap_or(now);
        let sz = crate::scanner::calculate_folder_size_fast(path_obj);
        (lm, sz)
    } else {
        (now, 0)
    };

    let git = if exists_on_disk {
        get_git_info(&input.path)
    } else {
        GitInfo {
            is_repo: false,
            branch: None,
            dirty: false,
            modified_count: 0,
            last_commit: None,
            ahead: 0,
            behind: 0,
            recent_commits: Vec::new(),
        }
    };

    conn.execute(
        "INSERT INTO projects (
            id, name, path, description, tech_stack, primary_tech, status,
            is_favorite, is_pinned, notes, readme_cache, last_modified,
            size_bytes, git_branch, git_dirty, created_at, updated_at
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17)",
        params![
            id,
            input.name,
            input.path,
            description,
            tech_stack_json,
            input.primary_tech,
            status,
            if is_favorite { 1 } else { 0 },
            if is_pinned { 1 } else { 0 },
            notes,
            Option::<String>::None,
            last_modified,
            size_bytes as i64,
            git.branch,
            if git.dirty { 1 } else { 0 },
            now,
            now
        ],
    )
    .map_err(|e| format!("Failed to insert project: {}", e))?;

    // Attach tags
    if let Some(tag_ids) = input.tag_ids {
        for tag_id in tag_ids {
            let _ = conn.execute(
                "INSERT OR IGNORE INTO project_tags (project_id, tag_id) VALUES (?1, ?2)",
                params![id, tag_id],
            );
        }
    }

    // Attach ports
    if let Some(ports) = input.ports {
        for port in ports {
            let port_id = Uuid::new_v4().to_string();
            let _ = conn.execute(
                "INSERT INTO project_ports (id, project_id, port, description) VALUES (?1, ?2, ?3, ?4)",
                params![port_id, id, port as i64, ""],
            );
        }
    }

    // Attach scripts
    if let Some(scripts) = input.scripts {
        for (s_name, s_cmd) in scripts {
            let script_id = Uuid::new_v4().to_string();
            let _ = conn.execute(
                "INSERT INTO project_scripts (id, project_id, name, command) VALUES (?1, ?2, ?3, ?4)",
                params![script_id, id, s_name, s_cmd],
            );
        }
    }

    fetch_project_by_id(conn, &id)?
        .ok_or_else(|| "Failed to load newly created project".to_string())
}

pub fn update_project_record(conn: &Connection, input: UpdateProjectInput) -> Result<Project, String> {
    let now = chrono::Utc::now().timestamp();
    let tech_stack_json = serde_json::to_string(&input.tech_stack).unwrap_or_else(|_| "[]".to_string());

    conn.execute(
        "UPDATE projects SET
            name = ?1,
            path = ?2,
            description = ?3,
            tech_stack = ?4,
            primary_tech = ?5,
            status = ?6,
            is_favorite = ?7,
            is_pinned = ?8,
            notes = ?9,
            updated_at = ?10
         WHERE id = ?11",
        params![
            input.name,
            input.path,
            input.description,
            tech_stack_json,
            input.primary_tech,
            input.status,
            if input.is_favorite { 1 } else { 0 },
            if input.is_pinned { 1 } else { 0 },
            input.notes,
            now,
            input.id
        ],
    )
    .map_err(|e| format!("Failed to update project: {}", e))?;

    // Update tags
    let _ = conn.execute("DELETE FROM project_tags WHERE project_id = ?1", params![input.id]);
    for tag_id in input.tag_ids {
        let _ = conn.execute(
            "INSERT OR IGNORE INTO project_tags (project_id, tag_id) VALUES (?1, ?2)",
            params![input.id, tag_id],
        );
    }

    fetch_project_by_id(conn, &input.id)?
        .ok_or_else(|| "Project not found after update".to_string())
}

pub fn delete_project_record(conn: &Connection, id: &str) -> Result<(), String> {
    conn.execute("DELETE FROM projects WHERE id = ?1", params![id])
        .map_err(|e| format!("Failed to delete project: {}", e))?;
    Ok(())
}

pub fn toggle_project_favorite(conn: &Connection, id: &str) -> Result<bool, String> {
    let current: i64 = conn
        .query_row("SELECT is_favorite FROM projects WHERE id = ?1", params![id], |r| r.get(0))
        .map_err(|e| e.to_string())?;

    let new_val = if current == 0 { 1 } else { 0 };
    conn.execute(
        "UPDATE projects SET is_favorite = ?1, updated_at = ?2 WHERE id = ?3",
        params![new_val, chrono::Utc::now().timestamp(), id],
    )
    .map_err(|e| e.to_string())?;

    Ok(new_val == 1)
}

pub fn toggle_project_pinned(conn: &Connection, id: &str) -> Result<bool, String> {
    let current: i64 = conn
        .query_row("SELECT is_pinned FROM projects WHERE id = ?1", params![id], |r| r.get(0))
        .map_err(|e| e.to_string())?;

    let new_val = if current == 0 { 1 } else { 0 };
    conn.execute(
        "UPDATE projects SET is_pinned = ?1, updated_at = ?2 WHERE id = ?3",
        params![new_val, chrono::Utc::now().timestamp(), id],
    )
    .map_err(|e| e.to_string())?;

    Ok(new_val == 1)
}

pub fn save_project_notes(conn: &Connection, id: &str, notes: &str) -> Result<(), String> {
    conn.execute(
        "UPDATE projects SET notes = ?1, updated_at = ?2 WHERE id = ?3",
        params![notes, chrono::Utc::now().timestamp(), id],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn update_project_path(conn: &Connection, id: &str, new_path: &str) -> Result<Project, String> {
    conn.execute(
        "UPDATE projects SET path = ?1, updated_at = ?2 WHERE id = ?3",
        params![new_path, chrono::Utc::now().timestamp(), id],
    )
    .map_err(|e| e.to_string())?;

    fetch_project_by_id(conn, id)?
        .ok_or_else(|| "Project not found after relocation".to_string())
}

pub fn fetch_all_tags(conn: &Connection) -> Result<Vec<Tag>, String> {
    let mut stmt = conn
        .prepare("SELECT id, name, color FROM tags ORDER BY name ASC")
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            Ok(Tag {
                id: row.get(0)?,
                name: row.get(1)?,
                color: row.get(2)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut tags = Vec::new();
    for r in rows {
        tags.push(r.map_err(|e| e.to_string())?);
    }
    Ok(tags)
}

pub fn create_tag_record(conn: &Connection, name: &str, color: &str) -> Result<Tag, String> {
    let id = Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO tags (id, name, color) VALUES (?1, ?2, ?3)",
        params![id, name, color],
    )
    .map_err(|e| format!("Tag name must be unique: {}", e))?;

    Ok(Tag {
        id,
        name: name.to_string(),
        color: color.to_string(),
    })
}

pub fn delete_tag_record(conn: &Connection, id: &str) -> Result<(), String> {
    conn.execute("DELETE FROM tags WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

fn fetch_project_tags(conn: &Connection, project_id: &str) -> Result<Vec<Tag>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT t.id, t.name, t.color
             FROM tags t
             JOIN project_tags pt ON pt.tag_id = t.id
             WHERE pt.project_id = ?1
             ORDER BY t.name ASC",
        )
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params![project_id], |row| {
            Ok(Tag {
                id: row.get(0)?,
                name: row.get(1)?,
                color: row.get(2)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut tags = Vec::new();
    for r in rows {
        tags.push(r.map_err(|e| e.to_string())?);
    }
    Ok(tags)
}

fn fetch_project_scripts(conn: &Connection, project_id: &str) -> Result<Vec<ProjectScript>, String> {
    let mut stmt = conn
        .prepare("SELECT id, project_id, name, command FROM project_scripts WHERE project_id = ?1")
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params![project_id], |row| {
            Ok(ProjectScript {
                id: row.get(0)?,
                project_id: row.get(1)?,
                name: row.get(2)?,
                command: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut scripts = Vec::new();
    for r in rows {
        scripts.push(r.map_err(|e| e.to_string())?);
    }
    Ok(scripts)
}

pub fn add_script_record(
    conn: &Connection,
    project_id: &str,
    name: &str,
    command: &str,
) -> Result<ProjectScript, String> {
    let id = Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO project_scripts (id, project_id, name, command) VALUES (?1, ?2, ?3, ?4)",
        params![id, project_id, name, command],
    )
    .map_err(|e| e.to_string())?;

    Ok(ProjectScript {
        id,
        project_id: project_id.to_string(),
        name: name.to_string(),
        command: command.to_string(),
    })
}

pub fn delete_script_record(conn: &Connection, id: &str) -> Result<(), String> {
    conn.execute("DELETE FROM project_scripts WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

fn fetch_project_ports(conn: &Connection, project_id: &str) -> Result<Vec<ProjectPort>, String> {
    let mut stmt = conn
        .prepare("SELECT id, project_id, port, description FROM project_ports WHERE project_id = ?1 ORDER BY port ASC")
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params![project_id], |row| {
            Ok(ProjectPort {
                id: row.get(0)?,
                project_id: row.get(1)?,
                port: row.get::<_, i64>(2)? as u16,
                description: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?;

    let mut ports = Vec::new();
    for r in rows {
        ports.push(r.map_err(|e| e.to_string())?);
    }
    Ok(ports)
}

pub fn add_port_record(
    conn: &Connection,
    project_id: &str,
    port: u16,
    description: &str,
) -> Result<ProjectPort, String> {
    let id = Uuid::new_v4().to_string();
    conn.execute(
        "INSERT INTO project_ports (id, project_id, port, description) VALUES (?1, ?2, ?3, ?4)",
        params![id, project_id, port as i64, description],
    )
    .map_err(|e| e.to_string())?;

    Ok(ProjectPort {
        id,
        project_id: project_id.to_string(),
        port,
        description: description.to_string(),
    })
}

pub fn delete_port_record(conn: &Connection, id: &str) -> Result<(), String> {
    conn.execute("DELETE FROM project_ports WHERE id = ?1", params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn fetch_all_settings(conn: &Connection) -> Result<HashMap<String, String>, String> {
    let mut stmt = conn
        .prepare("SELECT key, value FROM settings")
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?)))
        .map_err(|e| e.to_string())?;

    let mut map = HashMap::new();
    for r in rows {
        let (k, v) = r.map_err(|e| e.to_string())?;
        map.insert(k, v);
    }
    Ok(map)
}

pub fn save_setting_record(conn: &Connection, key: &str, value: &str) -> Result<(), String> {
    conn.execute(
        "INSERT INTO settings (key, value) VALUES (?1, ?2) ON CONFLICT(key) DO UPDATE SET value = ?2",
        params![key, value],
    )
    .map_err(|e| e.to_string())?;
    Ok(())
}

#[derive(Serialize, Deserialize)]
pub struct FullExportData {
    pub version: String,
    pub exported_at: i64,
    pub projects: Vec<Project>,
    pub tags: Vec<Tag>,
    pub settings: HashMap<String, String>,
}

pub fn export_all_data(conn: &Connection) -> Result<String, String> {
    let projects = fetch_all_projects(conn)?;
    let tags = fetch_all_tags(conn)?;
    let settings = fetch_all_settings(conn)?;

    let export = FullExportData {
        version: "1.0.0".to_string(),
        exported_at: chrono::Utc::now().timestamp(),
        projects,
        tags,
        settings,
    };

    serde_json::to_string_pretty(&export).map_err(|e| e.to_string())
}

pub fn fetch_all_workspaces(conn: &Connection) -> Result<Vec<Workspace>, String> {
    let mut stmt = conn
        .prepare("SELECT id, name, description, created_at FROM workspaces ORDER BY name ASC")
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map([], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, i64>(3)?,
            ))
        })
        .map_err(|e| e.to_string())?;

    let mut workspaces = Vec::new();
    for r in rows {
        let (id, name, description, created_at) = r.map_err(|e| e.to_string())?;

        // Fetch associated project IDs
        let mut p_stmt = conn
            .prepare("SELECT project_id FROM workspace_projects WHERE workspace_id = ?1")
            .map_err(|e| e.to_string())?;

        let p_rows = p_stmt
            .query_map(params![id], |row| row.get::<_, String>(0))
            .map_err(|e| e.to_string())?;

        let mut project_ids = Vec::new();
        for pr in p_rows {
            if let Ok(pid) = pr {
                project_ids.push(pid);
            }
        }

        workspaces.push(Workspace {
            id,
            name,
            description,
            project_ids,
            created_at,
        });
    }

    Ok(workspaces)
}

pub fn insert_workspace(
    conn: &Connection,
    name: &str,
    description: &str,
    project_ids: Vec<String>,
) -> Result<Workspace, String> {
    let id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now().timestamp();

    conn.execute(
        "INSERT INTO workspaces (id, name, description, created_at) VALUES (?1, ?2, ?3, ?4)",
        params![id, name, description, now],
    )
    .map_err(|e| format!("Falha ao criar workspace: {}", e))?;

    for pid in &project_ids {
        let _ = conn.execute(
            "INSERT OR IGNORE INTO workspace_projects (workspace_id, project_id) VALUES (?1, ?2)",
            params![id, pid],
        );
    }

    Ok(Workspace {
        id,
        name: name.to_string(),
        description: description.to_string(),
        project_ids,
        created_at: now,
    })
}

pub fn update_workspace_record(
    conn: &Connection,
    id: &str,
    name: &str,
    description: &str,
    project_ids: Vec<String>,
) -> Result<Workspace, String> {
    conn.execute(
        "UPDATE workspaces SET name = ?1, description = ?2 WHERE id = ?3",
        params![name, description, id],
    )
    .map_err(|e| format!("Falha ao atualizar workspace: {}", e))?;

    // Replace project relations
    let _ = conn.execute(
        "DELETE FROM workspace_projects WHERE workspace_id = ?1",
        params![id],
    );

    for pid in &project_ids {
        let _ = conn.execute(
            "INSERT OR IGNORE INTO workspace_projects (workspace_id, project_id) VALUES (?1, ?2)",
            params![id, pid],
        );
    }

    let created_at: i64 = conn
        .query_row(
            "SELECT created_at FROM workspaces WHERE id = ?1",
            params![id],
            |r| r.get(0),
        )
        .unwrap_or_else(|_| chrono::Utc::now().timestamp());

    Ok(Workspace {
        id: id.to_string(),
        name: name.to_string(),
        description: description.to_string(),
        project_ids,
        created_at,
    })
}

pub fn delete_workspace_record(conn: &Connection, id: &str) -> Result<(), String> {
    conn.execute("DELETE FROM workspaces WHERE id = ?1", params![id])
        .map_err(|e| format!("Falha ao excluir workspace: {}", e))?;
    Ok(())
}

pub fn fetch_all_ai_conversations(
    conn: &Connection,
    project_id: Option<&str>,
) -> Result<Vec<AiConversation>, String> {
    let mut sql = "SELECT id, title, project_id, provider, model, created_at, updated_at FROM ai_conversations".to_string();
    if project_id.is_some() {
        sql.push_str(" WHERE project_id = ?1");
    }
    sql.push_str(" ORDER BY updated_at DESC");

    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;

    let map_row = |row: &rusqlite::Row| {
        Ok(AiConversation {
            id: row.get(0)?,
            title: row.get(1)?,
            project_id: row.get(2)?,
            provider: row.get(3)?,
            model: row.get(4)?,
            created_at: row.get(5)?,
            updated_at: row.get(6)?,
        })
    };

    let convs = if let Some(pid) = project_id {
        let rows = stmt.query_map(params![pid], map_row).map_err(|e| e.to_string())?;
        rows.filter_map(Result::ok).collect()
    } else {
        let rows = stmt.query_map([], map_row).map_err(|e| e.to_string())?;
        rows.filter_map(Result::ok).collect()
    };

    Ok(convs)
}

pub fn fetch_messages_for_conversation(
    conn: &Connection,
    conversation_id: &str,
) -> Result<Vec<AiMessage>, String> {
    let mut stmt = conn
        .prepare("SELECT id, conversation_id, role, content, provider, model, prompt_tokens, completion_tokens, created_at FROM ai_messages WHERE conversation_id = ?1 ORDER BY created_at ASC")
        .map_err(|e| e.to_string())?;

    let rows = stmt
        .query_map(params![conversation_id], |row| {
            Ok(AiMessage {
                id: row.get(0)?,
                conversation_id: row.get(1)?,
                role: row.get(2)?,
                content: row.get(3)?,
                provider: row.get(4)?,
                model: row.get(5)?,
                prompt_tokens: row.get(6)?,
                completion_tokens: row.get(7)?,
                created_at: row.get(8)?,
            })
        })
        .map_err(|e| e.to_string())?;

    Ok(rows.filter_map(Result::ok).collect())
}

pub fn insert_ai_conversation(
    conn: &Connection,
    title: &str,
    project_id: Option<&str>,
    provider: &str,
    model: &str,
) -> Result<AiConversation, String> {
    let id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now().timestamp();

    conn.execute(
        "INSERT INTO ai_conversations (id, title, project_id, provider, model, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        params![id, title, project_id, provider, model, now, now],
    )
    .map_err(|e| format!("Falha ao criar conversa de IA: {}", e))?;

    Ok(AiConversation {
        id,
        title: title.to_string(),
        project_id: project_id.map(|s| s.to_string()),
        provider: provider.to_string(),
        model: model.to_string(),
        created_at: now,
        updated_at: now,
    })
}

pub fn delete_ai_conversation_record(conn: &Connection, id: &str) -> Result<(), String> {
    conn.execute("DELETE FROM ai_conversations WHERE id = ?1", params![id])
        .map_err(|e| format!("Falha ao excluir conversa de IA: {}", e))?;
    Ok(())
}

pub fn insert_ai_message_record(
    conn: &Connection,
    conversation_id: &str,
    role: &str,
    content: &str,
    provider: &str,
    model: &str,
    prompt_tokens: u32,
    completion_tokens: u32,
) -> Result<AiMessage, String> {
    let id = Uuid::new_v4().to_string();
    let now = chrono::Utc::now().timestamp();

    conn.execute(
        "INSERT INTO ai_messages (id, conversation_id, role, content, provider, model, prompt_tokens, completion_tokens, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![id, conversation_id, role, content, provider, model, prompt_tokens, completion_tokens, now],
    )
    .map_err(|e| format!("Falha ao gravar mensagem de IA: {}", e))?;

    // Update conversation updated_at and provider/model
    let _ = conn.execute(
        "UPDATE ai_conversations SET updated_at = ?1, provider = ?2, model = ?3 WHERE id = ?4",
        params![now, provider, model, conversation_id],
    );

    Ok(AiMessage {
        id,
        conversation_id: conversation_id.to_string(),
        role: role.to_string(),
        content: content.to_string(),
        provider: provider.to_string(),
        model: model.to_string(),
        prompt_tokens,
        completion_tokens,
        created_at: now,
    })
}

pub fn update_ai_conversation_model(
    conn: &Connection,
    id: &str,
    provider: &str,
    model: &str,
) -> Result<(), String> {
    let now = chrono::Utc::now().timestamp();
    conn.execute(
        "UPDATE ai_conversations SET provider = ?1, model = ?2, updated_at = ?3 WHERE id = ?4",
        params![provider, model, now, id],
    )
    .map_err(|e| format!("Falha ao atualizar modelo da conversa: {}", e))?;
    Ok(())
}


