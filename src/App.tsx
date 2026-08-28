import React from 'react';
import {
  IconLayoutGrid,
  IconList,
  IconFilter,
  IconSortDescending,
  IconX,
  IconLoader2,
  IconBriefcase,
} from '@tabler/icons-react';
import { ProjectProvider, useProjects } from './context/ProjectContext';
import { Titlebar } from './components/layout/Titlebar';
import { Sidebar } from './components/layout/Sidebar';
import { ProjectGrid } from './components/projects/ProjectGrid';
import { ProjectList } from './components/projects/ProjectList';
import { ProjectDetailModal } from './components/projects/ProjectDetailModal';
import { NewProjectModal } from './components/projects/NewProjectModal';
import { ScannerModal } from './components/scanner/ScannerModal';
import { CommandPalette } from './components/command-palette/CommandPalette';
import { SettingsModal } from './components/settings/SettingsModal';
import { DiskCleanerModal } from './components/cleaner/DiskCleanerModal';
import { WorkspaceModal } from './components/workspaces/WorkspaceModal';
import { CodeSearchModal } from './components/code-search/CodeSearchModal';
import { AiChatModal } from './components/ai/AiChatModal';
import { SortOption } from './types';

const Dashboard: React.FC = () => {
  const {
    filteredProjects,
    selectedCategory,
    selectedTagId,
    setSelectedTagId,
    tags,
    selectedTech,
    setSelectedTech,
    availableTechs,
    selectedWorkspaceId,
    setSelectedWorkspaceId,
    workspaces,
    viewMode,
    setViewMode,
    sortOption,
    setSortOption,
    loading,
  } = useProjects();

  const getCategoryTitle = () => {
    if (selectedWorkspaceId) {
      const ws = workspaces.find(w => w.id === selectedWorkspaceId);
      if (ws) return `Workspace: ${ws.name}`;
    }

    switch (selectedCategory) {
      case 'favorites':
        return 'Favoritos & Fixados';
      case 'active':
        return 'Projetos Ativos';
      case 'on_hold':
        return 'Projetos em Espera';
      case 'completed':
        return 'Projetos Concluídos';
      case 'archived':
        return 'Projetos Arquivados';
      case 'dirty':
        return 'Modificações Pendentes (Git)';
      case 'missing':
        return 'Pastas Ausentes no Disco';
      default:
        return 'Todos os Projetos';
    }
  };

  const activeTag = tags.find(t => t.id === selectedTagId);
  const activeWorkspace = workspaces.find(w => w.id === selectedWorkspaceId);

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-2.5rem)] overflow-hidden bg-zinc-950">
      {/* Top Filter and Controls Toolbar */}
      <div className="h-12 border-b border-zinc-800 px-5 flex items-center justify-between shrink-0 bg-zinc-950 select-none">
        {/* Left: Section Title & Active Tag / Workspace Filter Badge */}
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold text-zinc-50 flex items-center gap-2">
            <span>{getCategoryTitle()}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-200 font-mono font-normal">
              {filteredProjects.length}
            </span>
          </h1>

          {activeWorkspace && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-850 border border-zinc-700 text-xs text-zinc-200">
              <IconBriefcase size={12} className="text-zinc-400" />
              <span>{activeWorkspace.name}</span>
              <button
                type="button"
                onClick={() => setSelectedWorkspaceId(null)}
                className="text-zinc-400 hover:text-white ml-0.5"
                title="Sair do filtro de workspace"
              >
                <IconX size={12} />
              </button>
            </div>
          )}

          {activeTag && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-850 border border-zinc-700 text-xs text-zinc-200">
              <span className="text-zinc-500 font-mono">#</span>
              <span>{activeTag.name}</span>
              <button
                type="button"
                onClick={() => setSelectedTagId(null)}
                className="text-zinc-400 hover:text-white ml-0.5"
                title="Remover filtro de tag"
              >
                <IconX size={12} />
              </button>
            </div>
          )}
        </div>

        {/* Right: Tech Filter, Sorting & View Mode Switcher */}
        <div className="flex items-center gap-3">
          {/* Tech Filter Dropdown */}
          <div className="flex items-center gap-1.5">
            <IconFilter size={14} className="text-zinc-500" />
            <select
              value={selectedTech || ''}
              onChange={e => setSelectedTech(e.target.value || null)}
              className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-300 focus:outline-none focus:border-zinc-600 cursor-pointer"
            >
              <option value="">Todas as Stacks</option>
              {availableTechs.map(tech => (
                <option key={tech} value={tech}>
                  {tech}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5">
            <IconSortDescending size={14} className="text-zinc-500" />
            <select
              value={sortOption}
              onChange={e => setSortOption(e.target.value as SortOption)}
              className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-300 focus:outline-none focus:border-zinc-600 cursor-pointer"
            >
              <option value="last_modified">Recentes Primeiro</option>
              <option value="name">Nome (A-Z)</option>
              <option value="size">Tamanho (Maior)</option>
              <option value="status">Status</option>
            </select>
          </div>

          <div className="h-4 w-px bg-zinc-800" />

          {/* View Mode Toggle */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded transition-colors ${
                viewMode === 'grid'
                  ? 'bg-zinc-800 text-zinc-100 font-semibold'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Visualização em Grade"
            >
              <IconLayoutGrid size={15} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1 rounded transition-colors ${
                viewMode === 'list'
                  ? 'bg-zinc-800 text-zinc-100 font-semibold'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Visualização em Lista / Tabela"
            >
              <IconList size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Scrollable View */}
      <main className="flex-1 overflow-y-auto p-5">
        {loading ? (
          <div className="h-full flex items-center justify-center text-zinc-400 text-xs gap-2 py-20">
            <IconLoader2 size={20} className="animate-spin text-zinc-300" />
            <span>Carregando projetos do SQLite local...</span>
          </div>
        ) : viewMode === 'grid' ? (
          <ProjectGrid projects={filteredProjects} />
        ) : (
          <ProjectList projects={filteredProjects} />
        )}
      </main>

      {/* Modals & Overlays */}
      <ProjectDetailModal />
      <NewProjectModal />
      <ScannerModal />
      <CommandPalette />
      <SettingsModal />
      <DiskCleanerModal />
      <WorkspaceModal />
      <CodeSearchModal />
      <AiChatModal />
    </div>
  );
};

export function App() {
  return (
    <ProjectProvider>
      <div className="h-screen w-screen flex flex-col bg-zinc-950 text-zinc-100 overflow-hidden font-sans">
        {/* Custom Window Titlebar */}
        <Titlebar />

        {/* Main Body */}
        <div className="flex-1 flex overflow-hidden">
          <Sidebar />
          <Dashboard />
        </div>
      </div>
    </ProjectProvider>
  );
}

export default App;
