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
    return getMockProjects();
  },
  getProject: async (id: string): Promise<Project | null> => {
    if (isTauri) return await invoke('get_project', { id });
    return getMockProjects().find(p => p.id === id) || null;
  },
  createProject: async (input: CreateProjectInput): Promise<Project> => {
    if (isTauri) return await invoke('create_project', { input });
    return createMockProject(input);
  },
  updateProject: async (input: UpdateProjectInput): Promise<Project> => {
    if (isTauri) return await invoke('update_project', { input });
    const projects = getMockProjects();
    const existing = projects.find(p => p.id === input.id);
    if (!existing) throw new Error('Project not found');
    return {
      ...existing,
      ...input,
      status: (input.status as 'active' | 'on_hold' | 'completed' | 'archived') || existing.status,
    };
  },
  deleteProject: async (id: string): Promise<void> => {
    if (isTauri) return await invoke('delete_project', { id });
  },
  toggleFavorite: async (id: string): Promise<boolean> => {
    if (isTauri) return await invoke('toggle_favorite', { id });
    return true;
  },
  togglePinned: async (id: string): Promise<boolean> => {
    if (isTauri) return await invoke('toggle_pinned', { id });
    return true;
  },
  updateProjectNotes: async (id: string, notes: string): Promise<void> => {
    if (isTauri) return await invoke('update_project_notes', { id, notes });
  },
  relocateProject: async (id: string, newPath: string): Promise<Project> => {
    if (isTauri) return await invoke('relocate_project', { id, newPath });
    const p = getMockProjects().find(proj => proj.id === id);
    if (!p) throw new Error('Project not found');
    p.path = newPath;
    p.exists_on_disk = true;
    return p;
  },

  // Tags
  getTags: async (): Promise<Tag[]> => {
    if (isTauri) return await invoke('get_tags');
    return getMockTags();
  },
  createTag: async (name: string, color: string): Promise<Tag> => {
    if (isTauri) return await invoke('create_tag', { name, color });
    return { id: Math.random().toString(36).substring(2, 9), name, color };
  },
  deleteTag: async (id: string): Promise<void> => {
    if (isTauri) return await invoke('delete_tag', { id });
  },

  // Scripts & Ports
  addProjectScript: async (projectId: string, name: string, command: string): Promise<ProjectScript> => {
    if (isTauri) return await invoke('add_project_script', { projectId, name, command });
    return { id: Math.random().toString(36).substring(2, 9), project_id: projectId, name, command };
  },
  deleteProjectScript: async (id: string): Promise<void> => {
    if (isTauri) return await invoke('delete_project_script', { id });
  },
  addProjectPort: async (projectId: string, port: number, description: string): Promise<ProjectPort> => {
    if (isTauri) return await invoke('add_project_port', { projectId, port, description });
    return { id: Math.random().toString(36).substring(2, 9), project_id: projectId, port, description };
  },
  deleteProjectPort: async (id: string): Promise<void> => {
    if (isTauri) return await invoke('delete_project_port', { id });
  },

  // Workspaces
  getWorkspaces: async (): Promise<Workspace[]> => {
    if (isTauri) return await invoke('get_workspaces');
    return getMockWorkspaces();
  },
  createWorkspace: async (name: string, description: string, projectIds: string[]): Promise<Workspace> => {
    if (isTauri) return await invoke('create_workspace', { name, description, projectIds });
    return { id: Math.random().toString(36).substring(2, 9), name, description, project_ids: projectIds, created_at: Date.now() / 1000 };
  },
  updateWorkspace: async (id: string, name: string, description: string, projectIds: string[]): Promise<Workspace> => {
    if (isTauri) return await invoke('update_workspace', { id, name, description, projectIds });
    return { id, name, description, project_ids: projectIds, created_at: Date.now() / 1000 };
  },
  deleteWorkspace: async (id: string): Promise<void> => {
    if (isTauri) return await invoke('delete_workspace', { id });
  },

  // Port Sentinel (Active Port Monitor & Process Killer)
  checkPortStatus: async (port: number): Promise<PortStatusInfo> => {
    if (isTauri) return await invoke('check_port_status', { port });
    return { port, is_active: port === 1420 || port === 3000, pid: 8840, process_name: 'node.exe' };
  },
  checkPortsStatus: async (ports: number[]): Promise<PortStatusInfo[]> => {
    if (isTauri) return await invoke('check_ports_status', { ports });
    return ports.map(p => ({ port: p, is_active: p === 1420 || p === 3000, pid: 8840, process_name: 'node.exe' }));
  },
  killPort: async (port: number): Promise<string> => {
    if (isTauri) return await invoke('kill_port', { port });
    return `[Mock] Processo na porta ${port} finalizado.`;
  },

  // Disk Cleaner
  analyzeCleanable: async (projectId: string, projectName: string, projectPath: string): Promise<ProjectCleanableInfo> => {
    if (isTauri) return await invoke('analyze_cleanable', { projectId, projectName, projectPath });
    return {
      project_id: projectId,
      project_name: projectName,
      project_path: projectPath,
      items: [
        { category: 'node_modules', relative_path: 'node_modules', full_path: `${projectPath}\\node_modules`, size_bytes: 280000000 },
        { category: 'target', relative_path: 'src-tauri/target', full_path: `${projectPath}\\src-tauri\\target`, size_bytes: 950000000 },
      ],
      total_cleanable_bytes: 1230000000,
    };
  },
  cleanProjectTargets: async (paths: string[]): Promise<CleanResult> => {
    if (isTauri) return await invoke('clean_project_targets', { paths });
    return { success: true, bytes_freed: 1230000000, cleaned_count: paths.length, errors: [] };
  },

  // Git Insights & Heatmap
  getProjectGitInfo: async (path: string): Promise<GitInfo> => {
    if (isTauri) return await invoke('get_project_git_info', { path });
    return {
      is_repo: true,
      branch: 'main',
      dirty: true,
      modified_count: 2,
      last_commit: 'feat: add insights (2 hours ago)',
      ahead: 1,
      behind: 0,
      recent_commits: [
        { hash: 'a1b2c3d4e5f6', short_hash: 'a1b2c3d', message: 'feat: add insights', author: 'Emir Neto', relative_time: '2 hours ago', timestamp: Date.now() / 1000 - 7200 },
        { hash: 'b2c3d4e5f6a1', short_hash: 'b2c3d4e', message: 'chore: bump version', author: 'Emir Neto', relative_time: '1 day ago', timestamp: Date.now() / 1000 - 86400 },
      ],
    };
  },
  getProjectRecentCommits: async (path: string, count: number = 5): Promise<GitCommitSummary[]> => {
    if (isTauri) return await invoke('get_project_recent_commits', { path, count });
    return [
      { hash: 'a1b2c3d4e5f6', short_hash: 'a1b2c3d', message: 'feat: add insights', author: 'Emir Neto', relative_time: '2 hours ago', timestamp: Date.now() / 1000 - 7200 },
      { hash: 'b2c3d4e5f6a1', short_hash: 'b2c3d4e', message: 'chore: bump version', author: 'Emir Neto', relative_time: '1 day ago', timestamp: Date.now() / 1000 - 86400 },
    ];
  },
  getGitActivity: async (projectPaths: string[]): Promise<HeatmapDay[]> => {
    if (isTauri) return await invoke('get_git_activity', { projectPaths });
    return getMockHeatmap();
  },

  // Global Code Grep
  searchCode: async (query: string, projects: ProjectSearchTarget[], caseSensitive: boolean = false, maxResults: number = 100): Promise<CodeSearchResult[]> => {
    if (isTauri) return await invoke('search_code', { query, projects, caseSensitive, maxResults });
    return [
      {
        project_id: 'proj-1',
        project_name: 'crescent',
        file_path: 'C:\\Users\\emir.neto\\Desktop\\crescent\\src\\services\\api.ts',
        relative_path: 'src\\services\\api.ts',
        line_number: 42,
        line_content: 'export const api = {',
      },
    ];
  },

  // Templates & Scaffolder
  getTemplates: async (): Promise<ProjectTemplate[]> => {
    if (isTauri) return await invoke('get_templates');
    return getMockTemplates();
  },
  scaffoldNewProject: async (templateId: string, targetDir: string, projectName: string): Promise<string> => {
    if (isTauri) return await invoke('scaffold_new_project', { templateId, targetDir, projectName });
    return `${targetDir}\\${projectName}`;
  },

  // Env Manager
  getEnvInfo: async (projectPath: string): Promise<EnvFileInfo> => {
    if (isTauri) return await invoke('get_env_info', { projectPath });
    return {
      has_env: true,
      has_example: true,
      has_local: false,
      example_keys: ['DATABASE_URL', 'PORT', 'API_SECRET'],
      env_keys: ['DATABASE_URL', 'PORT'],
      missing_keys: ['API_SECRET'],
      env_example_content: 'DATABASE_URL=sqlite://crescent.db\nPORT=3000\nAPI_SECRET=your-secret-here\n',
    };
  },
  generateEnvFromExample: async (projectPath: string): Promise<string> => {
    if (isTauri) return await invoke('generate_env_from_example', { projectPath });
    return 'Arquivo .env criado com sucesso!';
  },

  // Scanner
  scanDirectory: async (options: ScanOptions): Promise<DiscoveredProject[]> => {
    if (isTauri) return await invoke('scan_projects_directory', { options });
    return getMockDiscoveredProjects();
  },
  analyzeDirectory: async (path: string): Promise<DiscoveredProject | null> => {
    if (isTauri) return await invoke('analyze_directory', { path });
    return {
      name: path.split(/[/\\]/).pop() || 'Projeto',
      path,
      primary_tech: 'React',
      tech_stack: ['React', 'TypeScript', 'Tailwind CSS'],
      last_modified: Date.now() / 1000,
      size_bytes: 4500000,
      git: { is_repo: true, branch: 'main', dirty: false, modified_count: 0, last_commit: 'chore: initial setup', ahead: 0, behind: 0, recent_commits: [] },
      has_readme: true,
      is_existing: false,
    };
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
    return 'C:\\Users\\emir.neto\\Desktop\\crescent';
  },

  // Launchers
  openInEditor: async (path: string, editor: string, customPath?: string): Promise<void> => {
    if (isTauri) return await invoke('open_project_in_editor', { path, editor, customPath: customPath || null });
    console.log(`[Mock] Abrindo ${path} no editor ${editor}`);
  },
  openInTerminal: async (path: string, terminal: string, customPath?: string): Promise<void> => {
    if (isTauri) return await invoke('open_project_in_terminal', { path, terminal, customPath: customPath || null });
    console.log(`[Mock] Abrindo ${path} no terminal ${terminal}`);
  },
  openInExplorer: async (path: string): Promise<void> => {
    if (isTauri) return await invoke('open_project_in_explorer', { path });
    console.log(`[Mock] Revelando ${path} no Explorer`);
  },
  openUrl: async (url: string): Promise<void> => {
    if (isTauri) return await invoke('open_url', { url });
    window.open(url, '_blank');
  },
  getProjectReadme: async (path: string): Promise<string | null> => {
    if (isTauri) return await invoke('get_project_readme', { path });
    return `# Documentação do Projeto\n\nEste projeto foi detectado localmente.\n\n### Executar localmente\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n\n> Gerenciado pelo Crescent.`;
  },
  runScript: async (path: string, command: string): Promise<ScriptExecutionResult> => {
    if (isTauri) return await invoke('run_script', { path, command });
    return {
      success: true,
      exit_code: 0,
      stdout: `[Mock Output] Executando comando: ${command}\n> Vite dev server running at: http://localhost:5173/\n> Ready in 240ms.`,
      stderr: '',
    };
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
    return JSON.stringify({ version: '1.0.0', mock: true });
  },

  // -------------------------------------------------------------
  // AI Assistant & Multi-LLM Gateway
  // -------------------------------------------------------------
  getAiConversations: async (projectId?: string | null): Promise<AiConversation[]> => {
    if (isTauri) return await invoke('get_ai_conversations', { projectId: projectId || null });
    return getMockAiConversations(projectId);
  },

  getAiMessages: async (conversationId: string): Promise<AiMessage[]> => {
    if (isTauri) return await invoke('get_ai_messages', { conversationId });
    return getMockAiMessages(conversationId);
  },

  createAiConversation: async (
    title: string,
    projectId: string | null | undefined,
    provider: AiProvider,
    model: string,
  ): Promise<AiConversation> => {
    if (isTauri) return await invoke('create_ai_conversation', { title, projectId: projectId || null, provider, model });
    return {
      id: Math.random().toString(36).substring(2, 9),
      title,
      project_id: projectId || null,
      provider,
      model,
      created_at: Date.now() / 1000,
      updated_at: Date.now() / 1000,
    };
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
    // Web Fallback Mock response
    return {
      id: Math.random().toString(36).substring(2, 9),
      conversation_id: conversationId,
      role: 'assistant',
      content: `[Mock Crescent AI via ${provider.toUpperCase()} (${model})]\n\nRecebi sua mensagem sobre o ecossistema local:\n\n> "${userMessage}"\n\nTodos os ${projectId ? 'metadados do projeto selecionado' : 'repositórios do Crescent'} estão indexados com compressão de alta densidade no banco SQLite.`,
      provider,
      model,
      prompt_tokens: 120,
      completion_tokens: 48,
      created_at: Date.now() / 1000,
    };
  },

  getOllamaModels: async (ollamaUrl?: string): Promise<string[]> => {
    if (isTauri) return await invoke('get_ollama_models', { ollamaUrl: ollamaUrl || null });
    return ['llama3.3:70b', 'qwen2.5-coder:latest', 'deepseek-r1:latest', 'mistral:latest'];
  },
};

function getMockAiConversations(projectId?: string | null): AiConversation[] {
  return [
    {
      id: 'conv-1',
      title: 'Arquitetura e Otimização',
      project_id: projectId || null,
      provider: 'ollama',
      model: 'qwen2.5-coder:latest',
      created_at: Date.now() / 1000 - 3600,
      updated_at: Date.now() / 1000 - 600,
    },
  ];
}

function getMockAiMessages(convId: string): AiMessage[] {
  return [
    {
      id: 'msg-1',
      conversation_id: convId,
      role: 'user',
      content: 'Como posso melhorar a performance de build dos meus projetos Rust e React no Crescent?',
      provider: 'ollama',
      model: 'qwen2.5-coder:latest',
      prompt_tokens: 45,
      completion_tokens: 0,
      created_at: Date.now() / 1000 - 600,
    },
    {
      id: 'msg-2',
      conversation_id: convId,
      role: 'assistant',
      content: '1. Utilize o linker rápido `mold` ou `lld` no Cargo (`.cargo/config.toml`).\n2. Ative cache sccache para builds Rust repetidos.\n3. Utilize o Limpador de Disco do Crescent periodicamente para purgar `target/` e `node_modules` órfãos.',
      provider: 'ollama',
      model: 'qwen2.5-coder:latest',
      prompt_tokens: 180,
      completion_tokens: 72,
      created_at: Date.now() / 1000 - 580,
    },
  ];
}

// Fallback mock data for web previews
function getMockTags(): Tag[] {
  return [
    { id: '1', name: 'Trabalho', color: '#a1a1aa' },
    { id: '2', name: 'Estudo', color: '#a1a1aa' },
    { id: '3', name: 'Freelance', color: '#a1a1aa' },
    { id: '4', name: 'Rust', color: '#a1a1aa' },
    { id: '5', name: 'Web', color: '#a1a1aa' },
    { id: '6', name: 'Mobile', color: '#a1a1aa' },
  ];
}

function getMockWorkspaces(): Workspace[] {
  return [
    { id: 'ws-1', name: 'Projetos Pessoais', description: 'Projetos open-source e apps de produtividade', project_ids: ['proj-1'], created_at: Date.now() / 1000 },
    { id: 'ws-2', name: 'Trabalho & Clientes', description: 'Repositórios de produção', project_ids: [], created_at: Date.now() / 1000 },
  ];
}

function getMockProjects(): Project[] {
  return [
    {
      id: 'proj-1',
      name: 'crescent',
      path: 'C:\\Users\\emir.neto\\Desktop\\crescent',
      description: 'Gerenciador local de projetos nativo para Windows em Rust e React',
      tech_stack: ['Rust', 'Tauri', 'React', 'TypeScript', 'Tailwind CSS'],
      primary_tech: 'Tauri',
      status: 'active',
      is_favorite: true,
      is_pinned: true,
      notes: '# Setup Notes\nExecutar `npm run tauri dev` para iniciar o ciclo de desenvolvimento.',
      readme_cache: null,
      last_modified: Date.now() / 1000 - 3600,
      size_bytes: 38400000,
      git_branch: 'main',
      git_dirty: true,
      exists_on_disk: true,
      tags: [
        { id: '1', name: 'Trabalho', color: '#a1a1aa' },
        { id: '4', name: 'Rust', color: '#a1a1aa' },
      ],
      scripts: [
        { id: 'sc-1', project_id: 'proj-1', name: 'Dev Server', command: 'npm run tauri dev' },
        { id: 'sc-2', project_id: 'proj-1', name: 'Build Frontend', command: 'npm run build' },
      ],
      ports: [
        { id: 'p-1', project_id: 'proj-1', port: 1420, description: 'Vite Dev Server' },
      ],
      created_at: Date.now() / 1000 - 86400,
      updated_at: Date.now() / 1000,
    },
  ];
}

function createMockProject(input: CreateProjectInput): Project {
  return {
    id: Math.random().toString(36).substring(2, 9),
    name: input.name,
    path: input.path,
    description: input.description || '',
    tech_stack: input.tech_stack,
    primary_tech: input.primary_tech,
    status: (input.status as any) || 'active',
    is_favorite: !!input.is_favorite,
    is_pinned: !!input.is_pinned,
    notes: input.notes || '',
    readme_cache: null,
    last_modified: Date.now() / 1000,
    size_bytes: 12000000,
    git_branch: 'main',
    git_dirty: false,
    exists_on_disk: true,
    tags: [],
    scripts: [],
    ports: [],
    created_at: Date.now() / 1000,
    updated_at: Date.now() / 1000,
  };
}

function getMockDiscoveredProjects(): DiscoveredProject[] {
  return [
    {
      name: 'crescent',
      path: 'C:\\Users\\emir.neto\\Desktop\\crescent',
      primary_tech: 'Tauri',
      tech_stack: ['Rust', 'Tauri', 'React', 'TypeScript'],
      last_modified: Date.now() / 1000,
      size_bytes: 42000000,
      git: { is_repo: true, branch: 'main', dirty: true, modified_count: 3, last_commit: 'feat: scanner implementation', ahead: 1, behind: 0, recent_commits: [] },
      has_readme: true,
      is_existing: true,
    },
    {
      name: 'api-gateway',
      path: 'D:\\Dev\\api-gateway',
      primary_tech: 'Go',
      tech_stack: ['Go', 'Docker'],
      last_modified: Date.now() / 1000 - 86400 * 2,
      size_bytes: 18000000,
      git: { is_repo: true, branch: 'develop', dirty: false, modified_count: 0, last_commit: 'fix: auth middleware', ahead: 0, behind: 0, recent_commits: [] },
      has_readme: true,
      is_existing: false,
    },
  ];
}

function getMockHeatmap(): HeatmapDay[] {
  const days: HeatmapDay[] = [];
  const now = new Date();
  for (let i = 89; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const count = (i % 3 === 0 || i % 7 === 0) ? (i % 5) + 1 : 0;
    days.push({ date: dateStr, count });
  }
  return days;
}

function getMockTemplates(): ProjectTemplate[] {
  return [
    {
      id: 'vite-react-ts',
      name: 'React + TypeScript (Vite)',
      description: 'Template moderno com React 19, TypeScript, Vite e Tailwind CSS',
      primary_tech: 'React',
      tech_stack: ['React', 'TypeScript', 'Vite', 'Tailwind CSS'],
      command_preview: 'npm create vite@latest <nome> -- --template react-ts',
    },
    {
      id: 'nextjs-app',
      name: 'Next.js (App Router)',
      description: 'Fullstack Next.js com App Router, TypeScript, Tailwind CSS e ESLint',
      primary_tech: 'Next.js',
      tech_stack: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS'],
      command_preview: 'npx create-next-app@latest <nome> --ts --tailwind --app --eslint',
    },
    {
      id: 'tauri-app',
      name: 'Tauri v2 Desktop App',
      description: 'Aplicativo nativo desktop leve com backend em Rust e frontend React',
      primary_tech: 'Tauri',
      tech_stack: ['Tauri', 'Rust', 'React', 'TypeScript'],
      command_preview: 'npm create tauri-app@latest <nome> -- --template react-ts',
    },
    {
      id: 'fastapi-python',
      name: 'FastAPI REST API',
      description: 'API assíncrona moderna em Python com FastAPI, Pydantic e Uvicorn',
      primary_tech: 'FastAPI',
      tech_stack: ['Python', 'FastAPI', 'Pydantic', 'Uvicorn'],
      command_preview: 'uv init <nome> / pip install fastapi uvicorn',
    },
    {
      id: 'rust-cli',
      name: 'Rust CLI / Backend Binary',
      description: 'Projeto Rust com Cargo, Tokio assíncrono e Serde',
      primary_tech: 'Rust',
      tech_stack: ['Rust', 'Tokio', 'Serde'],
      command_preview: 'cargo new <nome> --bin',
    },
    {
      id: 'go-gin',
      name: 'Go Gin Web API',
      description: 'Serviço de alta performance em Go com Gin Framework',
      primary_tech: 'Go',
      tech_stack: ['Go', 'Gin'],
      command_preview: 'go mod init <nome> && go get github.com/gin-gonic/gin',
    },
  ];
}
