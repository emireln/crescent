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
        "#,
    )
    .map_err(|e| format!("Failed to create tables: {}", e))?;

    // Seed default tags if empty
    let tag_count: i64 = conn
        .query_row("SELECT COUNT(*) FROM tags", [], |r| r.get(0))
        .unwrap_or(0);

    if tag_count == 0 {
        let default_tags = [
            ("Trabalho", "#3b82f6"),   // Blue
            ("Estudo", "#10b981"),     // Green
            ("Freelance", "#f59e0b"),  // Amber
            ("Rust", "#ef4444"),       // Red
            ("Web", "#8b5cf6"),        // Purple
            ("Mobile", "#ec4899"),     // Pink
            ("Open Source", "#06b6d4"),// Cyan
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

// -------------------------------------------------------------
// Database Operations
// -------------------------------------------------------------

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

        let exists_on_disk = Path::new(&path).exists();

        // Refresh live git status if folder exists on disk
        if exists_on_disk {
            let git = get_git_info(&path);
            if git.is_repo {
                git_branch = git.branch;
                git_dirty = git.dirty;
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
            size_bytes,
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
        let exists_on_disk = Path::new(&path).exists();
        if exists_on_disk {
            let git = get_git_info(&path);
            if git.is_repo {
                git_branch = git.branch;
                git_dirty = git.dirty;
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
            size_bytes,
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
        (lm, 0)
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

// -------------------------------------------------------------
// Tags
// -------------------------------------------------------------

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

// -------------------------------------------------------------
// Scripts & Ports
// -------------------------------------------------------------

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

// -------------------------------------------------------------
// Settings
// -------------------------------------------------------------

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

// -------------------------------------------------------------
// Backup & Export / Import
// -------------------------------------------------------------

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
