use std::collections::HashMap;
use std::path::Path;
use tauri::State;

mod actions;
mod ai;
mod cleaner;
mod code_search;
mod db;
mod env_manager;
mod git;
mod port_sentinel;
mod scaffolder;
mod scanner;
mod tray;
mod window;

use actions::{
    execute_project_script, open_browser_url, open_editor, open_explorer, open_terminal,
    read_project_readme, ScriptExecutionResult,
};
use ai::{list_ollama_local_models, send_chat_to_provider, LlmResponse};
use cleaner::{analyze_project_cleanable, clean_selected_paths, CleanResult, ProjectCleanableInfo};
use code_search::{
    search_code_across_projects, CodeSearchResult, ProjectSearchTarget,
};
use db::{
    add_port_record, add_script_record, create_tag_record, delete_ai_conversation_record,
    delete_port_record, delete_project_record, delete_script_record, delete_tag_record,
    delete_workspace_record, export_all_data, fetch_all_ai_conversations,
    fetch_all_projects, fetch_all_settings, fetch_all_tags, fetch_all_workspaces,
    fetch_messages_for_conversation, fetch_project_by_id, init_db, insert_ai_conversation,
    insert_ai_message_record, insert_project, insert_workspace, save_project_notes,
    save_setting_record, toggle_project_favorite, toggle_project_pinned,
    update_ai_conversation_model as update_ai_conversation_model_db, update_project_path,
    update_project_record, update_workspace_record, AiConversation, AiMessage, CreateProjectInput, DbState, Project,
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
fn update_tag(state: State<DbState>, id: String, name: String, color: String) -> Result<Tag, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    db::update_tag_record(&conn, &id, &name, &color)
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

#[tauri::command]
fn get_ai_conversations(
    state: State<DbState>,
    project_id: Option<String>,
) -> Result<Vec<AiConversation>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    fetch_all_ai_conversations(&conn, project_id.as_deref())
}

#[tauri::command]
fn get_ai_messages(state: State<DbState>, conversation_id: String) -> Result<Vec<AiMessage>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    fetch_messages_for_conversation(&conn, &conversation_id)
}

#[tauri::command]
fn create_ai_conversation(
    state: State<DbState>,
    title: String,
    project_id: Option<String>,
    provider: String,
    model: String,
) -> Result<AiConversation, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    insert_ai_conversation(&conn, &title, project_id.as_deref(), &provider, &model)
}

#[tauri::command]
fn delete_ai_conversation(state: State<DbState>, id: String) -> Result<(), String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    delete_ai_conversation_record(&conn, &id)
}

#[tauri::command]
fn update_ai_conversation_model(
    state: State<DbState>,
    id: String,
    provider: String,
    model: String,
) -> Result<(), String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    update_ai_conversation_model_db(&conn, &id, &provider, &model)
}

#[tauri::command]
fn send_ai_chat_message(
    state: State<DbState>,
    conversation_id: String,
    user_message: String,
    provider: String,
    model: String,
    project_id: Option<String>,
) -> Result<AiMessage, String> {
    let (all_projects, active_project, history, settings) = {
        let conn = state.conn.lock().map_err(|e| e.to_string())?;
        let all = fetch_all_projects(&conn)?;
        let active = match project_id.as_deref() {
            Some(pid) => fetch_project_by_id(&conn, pid)?,
            None => None,
        };
        let hist = fetch_messages_for_conversation(&conn, &conversation_id)?;
        let st = fetch_all_settings(&conn)?;
        (all, active, hist, st)
    };

    let high_density = settings
        .get("ai_high_density_mode")
        .map(|v| v != "false")
        .unwrap_or(true);

    let system_context = ai::build_system_context(&all_projects, active_project.as_ref(), high_density);

    {
        let conn = state.conn.lock().map_err(|e| e.to_string())?;
        insert_ai_message_record(&conn, &conversation_id, "user", &user_message, &provider, &model, 0, 0)?;
    }

    let response: LlmResponse = send_chat_to_provider(
        &provider,
        &model,
        &system_context,
        &history,
        &user_message,
        &settings,
    )?;

    let assistant_msg = {
        let conn = state.conn.lock().map_err(|e| e.to_string())?;
        insert_ai_message_record(
            &conn,
            &conversation_id,
            "assistant",
            &response.content,
            &response.provider,
            &response.model,
            response.prompt_tokens,
            response.completion_tokens,
        )?
    };

    Ok(assistant_msg)
}

#[tauri::command]
fn get_ollama_models(ollama_url: Option<String>) -> Result<Vec<String>, String> {
    list_ollama_local_models(&ollama_url.unwrap_or_default())
}

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

#[tauri::command]
fn search_code(
    query: String,
    projects: Vec<ProjectSearchTarget>,
    case_sensitive: bool,
    max_results: usize,
) -> Vec<CodeSearchResult> {
    search_code_across_projects(&query, projects, case_sensitive, max_results)
}

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

#[tauri::command]
fn get_env_info(project_path: String) -> EnvFileInfo {
    inspect_env_files(&project_path)
}

#[tauri::command]
fn generate_env_from_example(project_path: String) -> Result<String, String> {
    create_env_from_example(&project_path)
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
        .setup(|app| {
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
            update_tag,
            delete_tag,
            add_project_script,
            delete_project_script,
            add_project_port,
            delete_project_port,
            get_workspaces,
            create_workspace,
            update_workspace,
            delete_workspace,
            get_ai_conversations,
            get_ai_messages,
            create_ai_conversation,
            delete_ai_conversation,
            update_ai_conversation_model,
            send_ai_chat_message,
            get_ollama_models,
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
