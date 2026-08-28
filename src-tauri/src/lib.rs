pub mod actions;
pub mod db;
pub mod git;
pub mod scanner;
pub mod window;

use std::collections::HashMap;
use tauri::State;

use actions::{
    execute_project_script, open_browser_url, open_editor, open_explorer, open_terminal,
    read_project_readme, ScriptExecutionResult,
};
use db::{
    add_port_record, add_script_record, create_tag_record, delete_port_record,
    delete_project_record, delete_script_record, delete_tag_record, export_all_data,
    fetch_all_projects, fetch_all_settings, fetch_all_tags, fetch_project_by_id,
    init_db, insert_project, save_project_notes, save_setting_record, toggle_project_favorite,
    toggle_project_pinned, update_project_path, update_project_record, CreateProjectInput,
    DbState, Project, ProjectPort, ProjectScript, Tag, UpdateProjectInput,
};
use scanner::{analyze_single_project, scan_directory, DiscoveredProject, ScanOptions};
use window::{window_close, window_is_maximized, window_minimize, window_toggle_maximize};

// -------------------------------------------------------------
// Commands
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
