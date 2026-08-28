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
    const mock = createMockProject(input);
    return mock;
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
      git: { is_repo: true, branch: 'main', dirty: false, modified_count: 0, last_commit: 'chore: initial setup' },
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
};

// Fallback mock data for web previews
function getMockTags(): Tag[] {
  return [
    { id: '1', name: 'Trabalho', color: '#3b82f6' },
    { id: '2', name: 'Estudo', color: '#10b981' },
    { id: '3', name: 'Freelance', color: '#f59e0b' },
    { id: '4', name: 'Rust', color: '#ef4444' },
    { id: '5', name: 'Web', color: '#8b5cf6' },
    { id: '6', name: 'Mobile', color: '#ec4899' },
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
        { id: '1', name: 'Trabalho', color: '#3b82f6' },
        { id: '4', name: 'Rust', color: '#ef4444' },
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
      git: { is_repo: true, branch: 'main', dirty: true, modified_count: 3, last_commit: 'feat: scanner implementation' },
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
      git: { is_repo: true, branch: 'develop', dirty: false, modified_count: 0, last_commit: 'fix: auth middleware' },
      has_readme: true,
      is_existing: false,
    },
    {
      name: 'dashboard-next',
      path: 'D:\\Dev\\dashboard-next',
      primary_tech: 'Next.js',
      tech_stack: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS'],
      last_modified: Date.now() / 1000 - 86400 * 5,
      size_bytes: 65000000,
      git: { is_repo: true, branch: 'feature/analytics', dirty: true, modified_count: 5, last_commit: 'feat: add charts' },
      has_readme: true,
      is_existing: false,
    },
  ];
}
