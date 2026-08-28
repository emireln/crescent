import { invoke } from '@tauri-apps/api/core';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import {
  Project,
  Tag,
  ProjectScript,
  ProjectPort,
  DiscoveredProject,
  ScanOptions,
  CreateProjectInput,
  UpdateProjectInput,
  AppSettings,
  ScriptExecutionResult,
  Workspace,
  PortStatusInfo,
  ProjectCleanableInfo,
  CleanResult,
  GitInfo,
  GitCommitSummary,
  HeatmapDay,
  CodeSearchResult,
  ProjectSearchTarget,
  ProjectTemplate,
  EnvFileInfo,
  AiConversation,
  AiMessage,
  AiProvider,
} from '../types';

const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

export const api = {
  // Window controls
  windowMinimize: async (): Promise<void> => {
    if (isTauri) return await invoke('window_minimize');
  },
  windowToggleMaximize: async (): Promise<boolean> => {
    if (isTauri) return await invoke('window_toggle_maximize');
    return false;
  },
  windowClose: async (): Promise<void> => {
    if (isTauri) return await invoke('window_close');
  },
  windowIsMaximized: async (): Promise<boolean> => {
    if (isTauri) return await invoke('window_is_maximized');
    return false;
  },

  // Projects
  getProjects: async (): Promise<Project[]> => {
    if (isTauri) return await invoke('get_projects');
    return [];
  },
  getProject: async (id: string): Promise<Project | null> => {
    if (isTauri) return await invoke('get_project', { id });
    return null;
  },
  createProject: async (input: CreateProjectInput): Promise<Project> => {
    if (isTauri) return await invoke('create_project', { input });
    throw new Error('Ambiente Tauri indisponível para criar projeto.');
  },
  updateProject: async (input: UpdateProjectInput): Promise<Project> => {
    if (isTauri) return await invoke('update_project', { input });
    throw new Error('Ambiente Tauri indisponível para atualizar projeto.');
  },
  deleteProject: async (id: string): Promise<void> => {
    if (isTauri) return await invoke('delete_project', { id });
  },
  toggleFavorite: async (id: string): Promise<boolean> => {
    if (isTauri) return await invoke('toggle_favorite', { id });
    return false;
  },
  togglePinned: async (id: string): Promise<boolean> => {
    if (isTauri) return await invoke('toggle_pinned', { id });
    return false;
  },
  updateProjectNotes: async (id: string, notes: string): Promise<void> => {
    if (isTauri) return await invoke('update_project_notes', { id, notes });
  },
  relocateProject: async (id: string, newPath: string): Promise<Project> => {
    if (isTauri) return await invoke('relocate_project', { id, newPath });
    throw new Error('Ambiente Tauri indisponível para realocar projeto.');
  },

  // Tags
  getTags: async (): Promise<Tag[]> => {
    if (isTauri) return await invoke('get_tags');
    return [];
  },
  createTag: async (name: string, color: string): Promise<Tag> => {
    if (isTauri) return await invoke('create_tag', { name, color });
    throw new Error('Ambiente Tauri indisponível para criar tag.');
  },
  deleteTag: async (id: string): Promise<void> => {
    if (isTauri) return await invoke('delete_tag', { id });
  },

  // Scripts & Ports
  addProjectScript: async (projectId: string, name: string, command: string): Promise<ProjectScript> => {
    if (isTauri) return await invoke('add_project_script', { projectId, name, command });
    throw new Error('Ambiente Tauri indisponível para adicionar script.');
  },
  deleteProjectScript: async (id: string): Promise<void> => {
    if (isTauri) return await invoke('delete_project_script', { id });
  },
  addProjectPort: async (projectId: string, port: number, description: string): Promise<ProjectPort> => {
    if (isTauri) return await invoke('add_project_port', { projectId, port, description });
    throw new Error('Ambiente Tauri indisponível para adicionar porta.');
  },
  deleteProjectPort: async (id: string): Promise<void> => {
    if (isTauri) return await invoke('delete_project_port', { id });
  },

  // Workspaces
  getWorkspaces: async (): Promise<Workspace[]> => {
    if (isTauri) return await invoke('get_workspaces');
    return [];
  },
  createWorkspace: async (name: string, description: string, projectIds: string[]): Promise<Workspace> => {
    if (isTauri) return await invoke('create_workspace', { name, description, projectIds });
    throw new Error('Ambiente Tauri indisponível para criar workspace.');
  },
  updateWorkspace: async (id: string, name: string, description: string, projectIds: string[]): Promise<Workspace> => {
    if (isTauri) return await invoke('update_workspace', { id, name, description, projectIds });
    throw new Error('Ambiente Tauri indisponível para atualizar workspace.');
  },
  deleteWorkspace: async (id: string): Promise<void> => {
    if (isTauri) return await invoke('delete_workspace', { id });
  },

  // Port Sentinel (Active Port Monitor & Process Killer)
  checkPortStatus: async (port: number): Promise<PortStatusInfo> => {
    if (isTauri) return await invoke('check_port_status', { port });
    return { port, is_active: false, pid: null, process_name: null };
  },
  checkPortsStatus: async (ports: number[]): Promise<PortStatusInfo[]> => {
    if (isTauri) return await invoke('check_ports_status', { ports });
    return ports.map(p => ({ port: p, is_active: false, pid: null, process_name: null }));
  },
  killPort: async (port: number): Promise<string> => {
    if (isTauri) return await invoke('kill_port', { port });
    throw new Error('Ambiente Tauri indisponível para encerrar porta.');
  },

  // Disk Cleaner
  analyzeCleanable: async (projectId: string, projectName: string, projectPath: string): Promise<ProjectCleanableInfo> => {
    if (isTauri) return await invoke('analyze_cleanable', { projectId, projectName, projectPath });
    return {
      project_id: projectId,
      project_name: projectName,
      project_path: projectPath,
      items: [],
      total_cleanable_bytes: 0,
    };
  },
  cleanProjectTargets: async (paths: string[]): Promise<CleanResult> => {
    if (isTauri) return await invoke('clean_project_targets', { paths });
    return { success: true, bytes_freed: 0, cleaned_count: 0, errors: [] };
  },

  // Git Insights & Heatmap
  getProjectGitInfo: async (path: string): Promise<GitInfo> => {
    if (isTauri) return await invoke('get_project_git_info', { path });
    return {
      is_repo: false,
      branch: null,
      dirty: false,
      modified_count: 0,
      last_commit: null,
      ahead: 0,
      behind: 0,
      recent_commits: [],
    };
  },
  getProjectRecentCommits: async (path: string, count: number = 5): Promise<GitCommitSummary[]> => {
    if (isTauri) return await invoke('get_project_recent_commits', { path, count });
    return [];
  },
  getGitActivity: async (projectPaths: string[]): Promise<HeatmapDay[]> => {
    if (isTauri) return await invoke('get_git_activity', { projectPaths });
    return [];
  },

  // Global Code Grep
  searchCode: async (query: string, projects: ProjectSearchTarget[], caseSensitive: boolean = false, maxResults: number = 100): Promise<CodeSearchResult[]> => {
    if (isTauri) return await invoke('search_code', { query, projects, caseSensitive, maxResults });
    return [];
  },

  // Templates & Scaffolder
  getTemplates: async (): Promise<ProjectTemplate[]> => {
    if (isTauri) return await invoke('get_templates');
    return [];
  },
  scaffoldNewProject: async (templateId: string, targetDir: string, projectName: string): Promise<string> => {
    if (isTauri) return await invoke('scaffold_new_project', { templateId, targetDir, projectName });
    throw new Error('Ambiente Tauri indisponível para scaffolding.');
  },

  // Env Manager
  getEnvInfo: async (projectPath: string): Promise<EnvFileInfo> => {
    if (isTauri) return await invoke('get_env_info', { projectPath });
    return {
      has_env: false,
      has_example: false,
      has_local: false,
      example_keys: [],
      env_keys: [],
      missing_keys: [],
      env_example_content: null,
    };
  },
  generateEnvFromExample: async (projectPath: string): Promise<string> => {
    if (isTauri) return await invoke('generate_env_from_example', { projectPath });
    throw new Error('Ambiente Tauri indisponível para gerar .env.');
  },

  // Scanner
  scanDirectory: async (options: ScanOptions): Promise<DiscoveredProject[]> => {
    if (isTauri) return await invoke('scan_projects_directory', { options });
    return [];
  },
  analyzeDirectory: async (path: string): Promise<DiscoveredProject | null> => {
    if (isTauri) return await invoke('analyze_directory', { path });
    return null;
  },

  // Pick folder dialog
  pickDirectory: async (): Promise<string | null> => {
    if (isTauri) {
      const selected = await openDialog({
        directory: true,
        multiple: false,
        title: 'Selecionar Diretório de Projetos',
      });
      return selected as string | null;
    }
    return null;
  },

  // Launchers
  openInEditor: async (path: string, editor: string, customPath?: string): Promise<void> => {
    if (isTauri) return await invoke('open_project_in_editor', { path, editor, customPath: customPath || null });
  },
  openInTerminal: async (path: string, terminal: string, customPath?: string): Promise<void> => {
    if (isTauri) return await invoke('open_project_in_terminal', { path, terminal, customPath: customPath || null });
  },
  openInExplorer: async (path: string): Promise<void> => {
    if (isTauri) return await invoke('open_project_in_explorer', { path });
  },
  openUrl: async (url: string): Promise<void> => {
    if (isTauri) return await invoke('open_url', { url });
    window.open(url, '_blank');
  },
  getProjectReadme: async (path: string): Promise<string | null> => {
    if (isTauri) return await invoke('get_project_readme', { path });
    return null;
  },
  runScript: async (path: string, command: string): Promise<ScriptExecutionResult> => {
    if (isTauri) return await invoke('run_script', { path, command });
    throw new Error('Ambiente Tauri indisponível para execução de script.');
  },

  // Settings
  getSettings: async (): Promise<AppSettings> => {
    if (isTauri) {
      const res = (await invoke('get_settings')) as Record<string, string>;
      return {
        default_editor: res.default_editor || 'code',
        custom_editor_path: res.custom_editor_path || '',
        default_terminal: res.default_terminal || 'powershell',
        custom_terminal_path: res.custom_terminal_path || '',
        scan_depth: res.scan_depth || '4',
        scan_ignore: res.scan_ignore || 'node_modules,target,.venv,dist,build,.git,.next,.nuxt',
      };
    }
    return {
      default_editor: 'code',
      custom_editor_path: '',
      default_terminal: 'powershell',
      custom_terminal_path: '',
      scan_depth: '4',
      scan_ignore: 'node_modules,target,.venv,dist,build,.git,.next,.nuxt',
    };
  },
  saveSetting: async (key: string, value: string): Promise<void> => {
    if (isTauri) return await invoke('save_setting', { key, value });
  },
  exportDatabase: async (): Promise<string> => {
    if (isTauri) return await invoke('export_database');
    return JSON.stringify({ version: '1.0.0' });
  },

  // Crescent AI Assistant (Multi-LLM Gateway)
  getAiConversations: async (projectId?: string | null): Promise<AiConversation[]> => {
    if (isTauri) return await invoke('get_ai_conversations', { projectId: projectId || null });
    return [];
  },

  getAiMessages: async (conversationId: string): Promise<AiMessage[]> => {
    if (isTauri) return await invoke('get_ai_messages', { conversationId });
    return [];
  },

  createAiConversation: async (
    title: string,
    projectId: string | null | undefined,
    provider: AiProvider,
    model: string,
  ): Promise<AiConversation> => {
    if (isTauri) return await invoke('create_ai_conversation', { title, projectId: projectId || null, provider, model });
    throw new Error('Ambiente Tauri indisponível para criar conversa de IA.');
  },

  deleteAiConversation: async (id: string): Promise<void> => {
    if (isTauri) return await invoke('delete_ai_conversation', { id });
  },

  updateAiConversationModel: async (id: string, provider: AiProvider, model: string): Promise<void> => {
    if (isTauri) return await invoke('update_ai_conversation_model', { id, provider, model });
  },

  sendAiChatMessage: async (
    conversationId: string,
    userMessage: string,
    provider: AiProvider,
    model: string,
    projectId?: string | null,
  ): Promise<AiMessage> => {
    if (isTauri) {
      return await invoke('send_ai_chat_message', {
        conversationId,
        userMessage,
        provider,
        model,
        projectId: projectId || null,
      });
    }
    throw new Error('Ambiente Tauri indisponível para enviar mensagem para IA.');
  },

  getOllamaModels: async (ollamaUrl?: string): Promise<string[]> => {
    if (isTauri) return await invoke('get_ollama_models', { ollamaUrl: ollamaUrl || null });
    return [];
  },
};
