pub mod actions;
pub mod cleaner;
pub mod code_search;
pub mod db;
pub mod env_manager;
pub mod git;
pub mod port_sentinel;
pub mod scaffolder;
pub mod scanner;
pub mod tray;
pub mod window;

use std::collections::HashMap;
use std::path::Path;
use tauri::State;

use actions::{
    execute_project_script, open_browser_url, open_editor, open_explorer, open_terminal,
    read_project_readme, ScriptExecutionResult,
};
use cleaner::{
    analyze_project_cleanable, clean_selected_paths, CleanResult, ProjectCleanableInfo,
};
use code_search::{search_code_across_projects, CodeSearchResult, ProjectSearchTarget};
use db::{
    add_port_record, add_script_record, create_tag_record, delete_port_record,
    delete_project_record, delete_script_record, delete_tag_record, delete_workspace_record,
    export_all_data, fetch_all_projects, fetch_all_settings, fetch_all_tags, fetch_all_workspaces,
    fetch_project_by_id, init_db, insert_project, insert_workspace, save_project_notes,
    save_setting_record, toggle_project_favorite, toggle_project_pinned, update_project_path,
    update_project_record, update_workspace_record, CreateProjectInput, DbState, Project,
    ProjectPort, ProjectScript, Tag, UpdateProjectInput, Workspace,
};
use env_manager::{create_env_from_example, inspect_env_files, EnvFileInfo};
use git::{
    get_activity_heatmap, get_git_info, get_recent_commits, GitCommitSummary, GitInfo, HeatmapDay,
};
use port_sentinel::{
    check_multiple_ports, check_single_port, kill_process_on_port, PortStatusInfo,
};
use scaffolder::{get_available_templates, scaffold_project, ProjectTemplate};
use scanner::{analyze_single_project, scan_directory, DiscoveredProject, ScanOptions};
use tray::setup_tray;
use window::{window_close, window_is_maximized, window_minimize, window_toggle_maximize};

// -------------------------------------------------------------
// Core Project Commands
// -------------------------------------------------------------

#[tauri::command]
fn get_projects(state: State<DbState>) -> Result<Vec<Project>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    fetch_all_projects(&conn)
}

#[tauri::command]
fn get_project(state: State<DbState>, id: String) -> Result<Option<Project>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    fetch_project_by_id(&conn, &id)
}

#[tauri::command]
fn create_project(state: State<DbState>, input: CreateProjectInput) -> Result<Project, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    insert_project(&conn, input)
}

#[tauri::command]
fn update_project(state: State<DbState>, input: UpdateProjectInput) -> Result<Project, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    update_project_record(&conn, input)
}

#[tauri::command]
fn delete_project(state: State<DbState>, id: String) -> Result<(), String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    delete_project_record(&conn, &id)
}

#[tauri::command]
fn toggle_favorite(state: State<DbState>, id: String) -> Result<bool, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    toggle_project_favorite(&conn, &id)
}

#[tauri::command]
fn toggle_pinned(state: State<DbState>, id: String) -> Result<bool, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    toggle_project_pinned(&conn, &id)
}

#[tauri::command]
fn update_project_notes(state: State<DbState>, id: String, notes: String) -> Result<(), String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    save_project_notes(&conn, &id, &notes)
}

#[tauri::command]
fn relocate_project(state: State<DbState>, id: String, new_path: String) -> Result<Project, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    update_project_path(&conn, &id, &new_path)
}

// -------------------------------------------------------------
// Tags
// -------------------------------------------------------------

#[tauri::command]
fn get_tags(state: State<DbState>) -> Result<Vec<Tag>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    fetch_all_tags(&conn)
}

#[tauri::command]
fn create_tag(state: State<DbState>, name: String, color: String) -> Result<Tag, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    create_tag_record(&conn, &name, &color)
}

#[tauri::command]
fn delete_tag(state: State<DbState>, id: String) -> Result<(), String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    delete_tag_record(&conn, &id)
}

// -------------------------------------------------------------
// Scripts & Ports
// -------------------------------------------------------------

#[tauri::command]
fn add_project_script(
    state: State<DbState>,
    project_id: String,
    name: String,
    command: String,
) -> Result<ProjectScript, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    add_script_record(&conn, &project_id, &name, &command)
}

#[tauri::command]
fn delete_project_script(state: State<DbState>, id: String) -> Result<(), String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    delete_script_record(&conn, &id)
}

#[tauri::command]
fn add_project_port(
    state: State<DbState>,
    project_id: String,
    port: u16,
    description: String,
) -> Result<ProjectPort, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    add_port_record(&conn, &project_id, port, &description)
}

#[tauri::command]
fn delete_project_port(state: State<DbState>, id: String) -> Result<(), String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    delete_port_record(&conn, &id)
}

// -------------------------------------------------------------
// Workspaces
// -------------------------------------------------------------

#[tauri::command]
fn get_workspaces(state: State<DbState>) -> Result<Vec<Workspace>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    fetch_all_workspaces(&conn)
}

#[tauri::command]
fn create_workspace(
    state: State<DbState>,
    name: String,
    description: String,
    project_ids: Vec<String>,
) -> Result<Workspace, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    insert_workspace(&conn, &name, &description, project_ids)
}

#[tauri::command]
fn update_workspace(
    state: State<DbState>,
    id: String,
    name: String,
    description: String,
    project_ids: Vec<String>,
) -> Result<Workspace, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    update_workspace_record(&conn, &id, &name, &description, project_ids)
}

#[tauri::command]
fn delete_workspace(state: State<DbState>, id: String) -> Result<(), String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    delete_workspace_record(&conn, &id)
}

// -------------------------------------------------------------
// Port Sentinel (Active TCP Monitor & Process Killer)
// -------------------------------------------------------------

#[tauri::command]
fn check_port_status(port: u16) -> PortStatusInfo {
    check_single_port(port)
}

#[tauri::command]
fn check_ports_status(ports: Vec<u16>) -> Vec<PortStatusInfo> {
    check_multiple_ports(ports)
}

#[tauri::command]
fn kill_port(port: u16) -> Result<String, String> {
    kill_process_on_port(port)
}

// -------------------------------------------------------------
// Disk Cleaner
// -------------------------------------------------------------

#[tauri::command]
fn analyze_cleanable(
    project_id: String,
    project_name: String,
    project_path: String,
) -> ProjectCleanableInfo {
    analyze_project_cleanable(&project_id, &project_name, &project_path)
}

#[tauri::command]
fn clean_project_targets(paths: Vec<String>) -> CleanResult {
    clean_selected_paths(paths)
}

// -------------------------------------------------------------
// Advanced Git Insights & Heatmap
// -------------------------------------------------------------

#[tauri::command]
fn get_project_git_info(path: String) -> GitInfo {
    get_git_info(path)
}

#[tauri::command]
fn get_project_recent_commits(path: String, count: usize) -> Vec<GitCommitSummary> {
    get_recent_commits(Path::new(&path), count)
}

#[tauri::command]
fn get_git_activity(project_paths: Vec<String>) -> Vec<HeatmapDay> {
    get_activity_heatmap(project_paths)
}

// -------------------------------------------------------------
// Global Code Grep
// -------------------------------------------------------------

#[tauri::command]
fn search_code(
    query: String,
    projects: Vec<ProjectSearchTarget>,
    case_sensitive: bool,
    max_results: usize,
) -> Vec<CodeSearchResult> {
    search_code_across_projects(&query, projects, case_sensitive, max_results)
}

// -------------------------------------------------------------
// Templates & Scaffolder
// -------------------------------------------------------------

#[tauri::command]
fn get_templates() -> Vec<ProjectTemplate> {
    get_available_templates()
}

#[tauri::command]
fn scaffold_new_project(
    template_id: String,
    target_dir: String,
    project_name: String,
) -> Result<String, String> {
    scaffold_project(&template_id, &target_dir, &project_name)
}

// -------------------------------------------------------------
// Env Manager (.env & .env.example)
// -------------------------------------------------------------

#[tauri::command]
fn get_env_info(project_path: String) -> EnvFileInfo {
    inspect_env_files(&project_path)
}

#[tauri::command]
fn generate_env_from_example(project_path: String) -> Result<String, String> {
    create_env_from_example(&project_path)
}

// -------------------------------------------------------------
// Scanner & Launchers
// -------------------------------------------------------------

#[tauri::command]
fn scan_projects_directory(
    state: State<DbState>,
    options: ScanOptions,
) -> Result<Vec<DiscoveredProject>, String> {
    let existing_paths: Vec<String> = {
        let conn = state.conn.lock().map_err(|e| e.to_string())?;
        fetch_all_projects(&conn)?
            .into_iter()
            .map(|p| p.path)
            .collect()
    };

    Ok(scan_directory(&options, &existing_paths))
}

#[tauri::command]
fn analyze_directory(path: String) -> Result<Option<DiscoveredProject>, String> {
    Ok(analyze_single_project(&path))
}

#[tauri::command]
fn open_project_in_editor(
    path: String,
    editor: String,
    custom_path: Option<String>,
) -> Result<(), String> {
    open_editor(&path, &editor, custom_path.as_deref())
}

#[tauri::command]
fn open_project_in_terminal(
    path: String,
    terminal: String,
    custom_path: Option<String>,
) -> Result<(), String> {
    open_terminal(&path, &terminal, custom_path.as_deref())
}

#[tauri::command]
fn open_project_in_explorer(path: String) -> Result<(), String> {
    open_explorer(&path)
}

#[tauri::command]
fn open_url(url: String) -> Result<(), String> {
    open_browser_url(&url)
}

#[tauri::command]
fn get_project_readme(path: String) -> Result<Option<String>, String> {
    Ok(read_project_readme(&path))
}

#[tauri::command]
fn run_script(path: String, command: String) -> Result<ScriptExecutionResult, String> {
    Ok(execute_project_script(&path, &command))
}

#[tauri::command]
fn get_settings(state: State<DbState>) -> Result<HashMap<String, String>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    fetch_all_settings(&conn)
}

#[tauri::command]
fn save_setting(state: State<DbState>, key: String, value: String) -> Result<(), String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    save_setting_record(&conn, &key, &value)
}

#[tauri::command]
fn export_database(state: State<DbState>) -> Result<String, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    export_all_data(&conn)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let db_state = init_db().expect("Failed to initialize SQLite database");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(db_state)
        .setup(|app| {
            // Setup Windows System Tray
            if let Err(e) = setup_tray(app.handle()) {
                eprintln!("[Crescent Tray Error] {}", e);
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            window_minimize,
            window_toggle_maximize,
            window_close,
            window_is_maximized,
            get_projects,
            get_project,
            create_project,
            update_project,
            delete_project,
            toggle_favorite,
            toggle_pinned,
            update_project_notes,
            relocate_project,
            get_tags,
            create_tag,
            delete_tag,
            add_project_script,
            delete_project_script,
            add_project_port,
            delete_project_port,
            get_workspaces,
            create_workspace,
            update_workspace,
            delete_workspace,
            check_port_status,
            check_ports_status,
            kill_port,
            analyze_cleanable,
            clean_project_targets,
            get_project_git_info,
            get_project_recent_commits,
            get_git_activity,
            search_code,
            get_templates,
            scaffold_new_project,
            get_env_info,
            generate_env_from_example,
            scan_projects_directory,
            analyze_directory,
            open_project_in_editor,
            open_project_in_terminal,
            open_project_in_explorer,
            open_url,
            get_project_readme,
            run_script,
            get_settings,
            save_setting,
            export_database,
        ])
        .run(tauri::generate_context!())
        .expect("error while running Crescent application");
}
