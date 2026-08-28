import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Project,
  Tag,
  AppSettings,
  ViewMode,
  FilterCategory,
  SortOption,
  CreateProjectInput,
  UpdateProjectInput,
  ScriptExecutionResult,
  DiscoveredProject,
  Workspace,
  PortStatusInfo,
} from '../types';
import { api } from '../services/api';

interface ProjectContextType {
  projects: Project[];
  tags: Tag[];
  workspaces: Workspace[];
  settings: AppSettings;
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: FilterCategory;
  setSelectedCategory: (cat: FilterCategory) => void;
  selectedTagId: string | null;
  setSelectedTagId: (id: string | null) => void;
  selectedTech: string | null;
  setSelectedTech: (tech: string | null) => void;
  selectedWorkspaceId: string | null;
  setSelectedWorkspaceId: (id: string | null) => void;
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
  sortOption: SortOption;
  setSortOption: (s: SortOption) => void;

  // Active detail modal
  activeProject: Project | null;
  setActiveProject: (p: Project | null) => void;

  // Modals state
  isScannerOpen: boolean;
  setIsScannerOpen: (open: boolean) => void;
  isNewProjectOpen: boolean;
  setIsNewProjectOpen: (open: boolean) => void;
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: (open: boolean) => void;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  isDiskCleanerOpen: boolean;
  setIsDiskCleanerOpen: (open: boolean) => void;
  isWorkspaceModalOpen: boolean;
  setIsWorkspaceModalOpen: (open: boolean) => void;
  isCodeSearchOpen: boolean;
  setIsCodeSearchOpen: (open: boolean) => void;
  isAiChatOpen: boolean;
  setIsAiChatOpen: (open: boolean) => void;
  aiActiveProjectId: string | null;
  setAiActiveProjectId: (id: string | null) => void;

  // Port Sentinel
  portStatuses: Record<number, PortStatusInfo>;
  refreshPortStatuses: () => Promise<void>;
  killPort: (port: number) => Promise<string>;

  // Filtered & Sorted Projects
  filteredProjects: Project[];
  availableTechs: string[];
  stats: {
    total: number;
    favorites: number;
    active: number;
    onHold: number;
    completed: number;
    archived: number;
    missing: number;
    dirty: number;
  };

  // Actions
  refreshProjects: () => Promise<void>;
  refreshTags: () => Promise<void>;
  refreshWorkspaces: () => Promise<void>;
  createProject: (input: CreateProjectInput) => Promise<Project>;
  batchImportProjects: (discovered: DiscoveredProject[]) => Promise<void>;
  updateProject: (input: UpdateProjectInput) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  togglePinned: (id: string) => Promise<void>;
  updateNotes: (id: string, notes: string) => Promise<void>;
  relocateProject: (id: string, newPath: string) => Promise<void>;

  // Workspaces Actions
  createWorkspace: (name: string, description: string, projectIds: string[]) => Promise<Workspace>;
  updateWorkspace: (id: string, name: string, description: string, projectIds: string[]) => Promise<Workspace>;
  deleteWorkspace: (id: string) => Promise<void>;
  openWorkspaceProjects: (workspace: Workspace) => Promise<void>;

  // Tags Actions
  createTag: (name: string, color: string) => Promise<Tag>;
  deleteTag: (id: string) => Promise<void>;

  // Scripts & Ports Actions
  addScript: (projectId: string, name: string, command: string) => Promise<void>;
  deleteScript: (id: string) => Promise<void>;
  addPort: (projectId: string, port: number, description: string) => Promise<void>;
  deletePort: (id: string) => Promise<void>;

  // Launchers
  openInEditor: (project: Project) => Promise<void>;
  openInTerminal: (project: Project) => Promise<void>;
  openInExplorer: (project: Project) => Promise<void>;
  runScript: (project: Project, command: string) => Promise<ScriptExecutionResult>;
  saveSetting: (key: string, value: string) => Promise<void>;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [portStatuses, setPortStatuses] = useState<Record<number, PortStatusInfo>>({});
  const [settings, setSettings] = useState<AppSettings>({
    default_editor: 'code',
    custom_editor_path: '',
    default_terminal: 'powershell',
    custom_terminal_path: '',
    scan_depth: '4',
    scan_ignore: 'node_modules,target,.venv,dist,build,.git,.next,.nuxt',
  });
  const [loading, setLoading] = useState(true);

  // Filters & State with Local/SQLite persistence
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategoryState] = useState<FilterCategory>(() => {
    try {
      return (localStorage.getItem('crescent_selected_category') as FilterCategory) || 'all';
    } catch {
      return 'all';
    }
  });
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [selectedTech, setSelectedTech] = useState<string | null>(null);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    try {
      return (localStorage.getItem('crescent_view_mode') as ViewMode) || 'grid';
    } catch {
      return 'grid';
    }
  });
  const [sortOption, setSortOptionState] = useState<SortOption>(() => {
    try {
      return (localStorage.getItem('crescent_sort_option') as SortOption) || 'last_modified';
    } catch {
      return 'last_modified';
    }
  });

  const setSelectedCategory = useCallback((cat: FilterCategory) => {
    setSelectedCategoryState(cat);
    try {
      localStorage.setItem('crescent_selected_category', cat);
      api.saveSetting('ui_selected_category', cat);
    } catch {}
  }, []);

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode);
    try {
      localStorage.setItem('crescent_view_mode', mode);
      api.saveSetting('ui_view_mode', mode);
    } catch {}
  }, []);

  const setSortOption = useCallback((opt: SortOption) => {
    setSortOptionState(opt);
    try {
      localStorage.setItem('crescent_sort_option', opt);
      api.saveSetting('ui_sort_option', opt);
    } catch {}
  }, []);

  // Modals
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDiskCleanerOpen, setIsDiskCleanerOpen] = useState(false);
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
  const [isCodeSearchOpen, setIsCodeSearchOpen] = useState(false);
  const [isAiChatOpen, setIsAiChatOpen] = useState(false);
  const [aiActiveProjectId, setAiActiveProjectId] = useState<string | null>(null);

  const refreshProjects = useCallback(async () => {
    try {
      const data = await api.getProjects();
      setProjects(data);
      if (activeProject) {
        const updated = data.find(p => p.id === activeProject.id);
        if (updated) setActiveProject(updated);
      }
    } catch (err) {
      console.error('Erro ao carregar projetos:', err);
    }
  }, [activeProject]);

  const refreshTags = useCallback(async () => {
    try {
      const data = await api.getTags();
      setTags(data);
    } catch (err) {
      console.error('Erro ao carregar tags:', err);
    }
  }, []);

  const refreshWorkspaces = useCallback(async () => {
    try {
      const data = await api.getWorkspaces();
      setWorkspaces(data);
    } catch (err) {
      console.error('Erro ao carregar workspaces:', err);
    }
  }, []);

  const refreshSettings = useCallback(async () => {
    try {
      const data = await api.getSettings();
      setSettings(data);
      const raw = data as unknown as Record<string, string>;
      if (raw.ui_view_mode) setViewModeState(raw.ui_view_mode as ViewMode);
      if (raw.ui_sort_option) setSortOptionState(raw.ui_sort_option as SortOption);
      if (raw.ui_selected_category) setSelectedCategoryState(raw.ui_selected_category as FilterCategory);
    } catch (err) {
      console.error('Erro ao carregar configurações:', err);
    }
  }, []);

  const refreshPortStatuses = useCallback(async () => {
    const allPorts: number[] = [];
    for (const p of projects) {
      for (const pt of p.ports) {
        if (!allPorts.includes(pt.port)) {
          allPorts.push(pt.port);
        }
      }
    }
    if (allPorts.length === 0) return;

    try {
      const statuses = await api.checkPortsStatus(allPorts);
      const map: Record<number, PortStatusInfo> = {};
      for (const s of statuses) {
        map[s.port] = s;
      }
      setPortStatuses(map);
    } catch (err) {
      console.error('Erro ao verificar status das portas:', err);
    }
  }, [projects]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([refreshProjects(), refreshTags(), refreshWorkspaces(), refreshSettings()]);
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (projects.length > 0) {
      refreshPortStatuses();
      const interval = setInterval(refreshPortStatuses, 10000); // Check ports every 10s
      return () => clearInterval(interval);
    }
  }, [projects, refreshPortStatuses]);

  // Global keyboard shortcuts (Ctrl+K, Ctrl+N, Ctrl+F, Ctrl+Shift+F, etc.)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsCodeSearchOpen(prev => !prev);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setIsAiChatOpen(prev => !prev);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setIsNewProjectOpen(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsScannerOpen(true);
      }
      if (e.key === 'Escape') {
        if (isAiChatOpen) setIsAiChatOpen(false);
        else if (isCodeSearchOpen) setIsCodeSearchOpen(false);
        else if (isDiskCleanerOpen) setIsDiskCleanerOpen(false);
        else if (isWorkspaceModalOpen) setIsWorkspaceModalOpen(false);
        else if (isCommandPaletteOpen) setIsCommandPaletteOpen(false);
        else if (isScannerOpen) setIsScannerOpen(false);
        else if (isNewProjectOpen) setIsNewProjectOpen(false);
        else if (isSettingsOpen) setIsSettingsOpen(false);
        else if (activeProject) setActiveProject(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, isScannerOpen, isNewProjectOpen, isSettingsOpen, isDiskCleanerOpen, isWorkspaceModalOpen, isCodeSearchOpen, isAiChatOpen, activeProject]);

  // Derived filtered & sorted projects
  const filteredProjects = useMemo(() => {
    return projects
      .filter(p => {
        // Workspace Filter
        if (selectedWorkspaceId) {
          const ws = workspaces.find(w => w.id === selectedWorkspaceId);
          if (ws && !ws.project_ids.includes(p.id)) {
            return false;
          }
        }

        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = p.name.toLowerCase().includes(q);
          const matchPath = p.path.toLowerCase().includes(q);
          const matchDesc = p.description.toLowerCase().includes(q);
          const matchTech = p.tech_stack.some(t => t.toLowerCase().includes(q));
          const matchTag = p.tags.some(t => t.name.toLowerCase().includes(q));
          if (!matchName && !matchPath && !matchDesc && !matchTech && !matchTag) {
            return false;
          }
        }

        // Category Filter
        if (selectedCategory === 'favorites' && !p.is_favorite) return false;
        if (selectedCategory === 'active' && p.status !== 'active') return false;
        if (selectedCategory === 'on_hold' && p.status !== 'on_hold') return false;
        if (selectedCategory === 'completed' && p.status !== 'completed') return false;
        if (selectedCategory === 'archived' && p.status !== 'archived') return false;
        if (selectedCategory === 'missing' && p.exists_on_disk) return false;
        if (selectedCategory === 'dirty' && !p.git_dirty) return false;

        // Tag Filter
        if (selectedTagId && !p.tags.some(t => t.id === selectedTagId)) {
          return false;
        }

        // Tech Filter
        if (selectedTech && !p.tech_stack.includes(selectedTech) && p.primary_tech !== selectedTech) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;

        if (sortOption === 'name') return a.name.localeCompare(b.name);
        if (sortOption === 'size') return b.size_bytes - a.size_bytes;
        if (sortOption === 'status') return a.status.localeCompare(b.status);
        return b.last_modified - a.last_modified;
      });
  }, [projects, searchQuery, selectedCategory, selectedTagId, selectedTech, selectedWorkspaceId, workspaces, sortOption]);

  const availableTechs = useMemo(() => {
    const set = new Set<string>();
    for (const p of projects) {
      if (p.primary_tech) set.add(p.primary_tech);
      for (const t of p.tech_stack) set.add(t);
    }
    return Array.from(set).sort();
  }, [projects]);

  const stats = useMemo(() => {
    return {
      total: projects.length,
      favorites: projects.filter(p => p.is_favorite).length,
      active: projects.filter(p => p.status === 'active').length,
      onHold: projects.filter(p => p.status === 'on_hold').length,
      completed: projects.filter(p => p.status === 'completed').length,
      archived: projects.filter(p => p.status === 'archived').length,
      missing: projects.filter(p => !p.exists_on_disk).length,
      dirty: projects.filter(p => p.git_dirty).length,
    };
  }, [projects]);

  // Actions
  const createProject = async (input: CreateProjectInput): Promise<Project> => {
    const created = await api.createProject(input);
    await refreshProjects();
    return created;
  };

  const batchImportProjects = async (discovered: DiscoveredProject[]): Promise<void> => {
    for (const d of discovered) {
      await api.createProject({
        name: d.name,
        path: d.path,
        primary_tech: d.primary_tech,
        tech_stack: d.tech_stack,
        status: 'active',
      });
    }
    await refreshProjects();
  };

  const updateProject = async (input: UpdateProjectInput): Promise<Project> => {
    const updated = await api.updateProject(input);
    await refreshProjects();
    return updated;
  };

  const deleteProject = async (id: string): Promise<void> => {
    await api.deleteProject(id);
    if (activeProject?.id === id) setActiveProject(null);
    await refreshProjects();
  };

  const toggleFavorite = async (id: string): Promise<void> => {
    await api.toggleFavorite(id);
    setProjects(prev =>
      prev.map(p => (p.id === id ? { ...p, is_favorite: !p.is_favorite } : p))
    );
  };

  const togglePinned = async (id: string): Promise<void> => {
    await api.togglePinned(id);
    setProjects(prev =>
      prev.map(p => (p.id === id ? { ...p, is_pinned: !p.is_pinned } : p))
    );
  };

  const updateNotes = async (id: string, notes: string): Promise<void> => {
    await api.updateProjectNotes(id, notes);
    setProjects(prev =>
      prev.map(p => (p.id === id ? { ...p, notes } : p))
    );
    if (activeProject?.id === id) {
      setActiveProject(prev => (prev ? { ...prev, notes } : null));
    }
  };

  const relocateProject = async (id: string, newPath: string): Promise<void> => {
    const updated = await api.relocateProject(id, newPath);
    await refreshProjects();
    if (activeProject?.id === id) setActiveProject(updated);
  };

  const createWorkspace = async (name: string, description: string, projectIds: string[]): Promise<Workspace> => {
    const ws = await api.createWorkspace(name, description, projectIds);
    await refreshWorkspaces();
    return ws;
  };

  const updateWorkspace = async (id: string, name: string, description: string, projectIds: string[]): Promise<Workspace> => {
    const ws = await api.updateWorkspace(id, name, description, projectIds);
    await refreshWorkspaces();
    return ws;
  };

  const deleteWorkspace = async (id: string): Promise<void> => {
    await api.deleteWorkspace(id);
    if (selectedWorkspaceId === id) setSelectedWorkspaceId(null);
    await refreshWorkspaces();
  };

  const openWorkspaceProjects = async (workspace: Workspace): Promise<void> => {
    const projs = projects.filter(p => workspace.project_ids.includes(p.id));
    for (const p of projs) {
      if (p.exists_on_disk) {
        await api.openInEditor(p.path, settings.default_editor, settings.custom_editor_path);
      }
    }
  };

  const killPort = async (port: number): Promise<string> => {
    const res = await api.killPort(port);
    await refreshPortStatuses();
    return res;
  };

  const createTag = async (name: string, color: string): Promise<Tag> => {
    const t = await api.createTag(name, color);
    await refreshTags();
    return t;
  };

  const deleteTag = async (id: string): Promise<void> => {
    await api.deleteTag(id);
    if (selectedTagId === id) setSelectedTagId(null);
    await refreshTags();
    await refreshProjects();
  };

  const addScript = async (projectId: string, name: string, command: string): Promise<void> => {
    await api.addProjectScript(projectId, name, command);
    await refreshProjects();
  };

  const deleteScript = async (id: string): Promise<void> => {
    await api.deleteProjectScript(id);
    await refreshProjects();
  };

  const addPort = async (projectId: string, port: number, description: string): Promise<void> => {
    await api.addProjectPort(projectId, port, description);
    await refreshProjects();
    await refreshPortStatuses();
  };

  const deletePort = async (id: string): Promise<void> => {
    await api.deleteProjectPort(id);
    await refreshProjects();
    await refreshPortStatuses();
  };

  const openInEditor = async (project: Project): Promise<void> => {
    await api.openInEditor(
      project.path,
      settings.default_editor,
      settings.custom_editor_path
    );
  };

  const openInTerminal = async (project: Project): Promise<void> => {
    await api.openInTerminal(
      project.path,
      settings.default_terminal,
      settings.custom_terminal_path
    );
  };

  const openInExplorer = async (project: Project): Promise<void> => {
    await api.openInExplorer(project.path);
  };

  const runScript = async (project: Project, command: string): Promise<ScriptExecutionResult> => {
    return await api.runScript(project.path, command);
  };

  const saveSetting = async (key: string, value: string): Promise<void> => {
    await api.saveSetting(key, value);
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <ProjectContext.Provider
      value={{
        projects,
        tags,
        workspaces,
        settings,
        loading,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        selectedTagId,
        setSelectedTagId,
        selectedTech,
        setSelectedTech,
        selectedWorkspaceId,
        setSelectedWorkspaceId,
        viewMode,
        setViewMode,
        sortOption,
        setSortOption,
        activeProject,
        setActiveProject,
        isScannerOpen,
        setIsScannerOpen,
        isNewProjectOpen,
        setIsNewProjectOpen,
        isCommandPaletteOpen,
        setIsCommandPaletteOpen,
        isSettingsOpen,
        setIsSettingsOpen,
        isDiskCleanerOpen,
        setIsDiskCleanerOpen,
        isWorkspaceModalOpen,
        setIsWorkspaceModalOpen,
        isCodeSearchOpen,
        setIsCodeSearchOpen,
        isAiChatOpen,
        setIsAiChatOpen,
        aiActiveProjectId,
        setAiActiveProjectId,
        portStatuses,
        refreshPortStatuses,
        killPort,
        filteredProjects,
        availableTechs,
        stats,
        refreshProjects,
        refreshTags,
        refreshWorkspaces,
        createProject,
        batchImportProjects,
        updateProject,
        deleteProject,
        toggleFavorite,
        togglePinned,
        updateNotes,
        relocateProject,
        createWorkspace,
        updateWorkspace,
        deleteWorkspace,
        openWorkspaceProjects,
        createTag,
        deleteTag,
        addScript,
        deleteScript,
        addPort,
        deletePort,
        openInEditor,
        openInTerminal,
        openInExplorer,
        runScript,
        saveSetting,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjects = (): ProjectContextType => {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProjects must be used within a ProjectProvider');
  return ctx;
};
