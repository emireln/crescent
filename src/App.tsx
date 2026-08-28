import React from 'react';
import {
  IconLayoutGrid,
  IconList,
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
      if (ws) return ws.name;
    }

    switch (selectedCategory) {
      case 'favorites':
        return 'Favoritos & Fixados';
      case 'active':
        return 'Ativos';
      case 'on_hold':
        return 'Em Espera';
      case 'completed':
        return 'Concluídos';
      case 'archived':
        return 'Arquivados';
      case 'dirty':
        return 'Git Pendente';
      case 'missing':
        return 'Pastas Ausentes';
      default:
        return 'Todos os Projetos';
    }
  };

  const activeTag = tags.find(t => t.id === selectedTagId);
  const activeWorkspace = workspaces.find(w => w.id === selectedWorkspaceId);

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-2.5rem)] overflow-hidden bg-zinc-950">
      {/* Top Filter and Controls Toolbar */}
      <div className="h-11 border-b border-zinc-900 px-5 flex items-center justify-between shrink-0 bg-zinc-950 select-none">
        {/* Left: Section Title & Active Tag / Workspace Filter Badge */}
        <div className="flex items-center gap-2.5">
          <h1 className="text-xs font-semibold text-zinc-100 flex items-center gap-2">
            <span>{getCategoryTitle()}</span>
            <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-zinc-850 text-zinc-300 font-mono font-normal">
              {filteredProjects.length}
            </span>
          </h1>

          {activeWorkspace && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300">
              <IconBriefcase size={12} className="text-zinc-400" />
              <span>{activeWorkspace.name}</span>
              <button
                type="button"
                onClick={() => setSelectedWorkspaceId(null)}
                className="text-zinc-400 hover:text-white ml-0.5"
                title="Remover filtro"
              >
                <IconX size={11} />
              </button>
            </div>
          )}

          {activeTag && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-300">
              <span className="text-zinc-400 font-mono">#</span>
              <span>{activeTag.name}</span>
              <button
                type="button"
                onClick={() => setSelectedTagId(null)}
                className="text-zinc-400 hover:text-white ml-0.5"
                title="Remover filtro de tag"
              >
                <IconX size={11} />
              </button>
            </div>
          )}
        </div>

        {/* Right: Tech Filter, Sorting & View Mode Switcher */}
        <div className="flex items-center gap-2">
          {/* Tech Filter Dropdown */}
          <div className="flex items-center gap-1">
            <select
              value={selectedTech || ''}
              onChange={e => setSelectedTech(e.target.value || null)}
              className="px-2 py-1 bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-800 rounded text-xs text-zinc-300 focus:outline-none focus:border-zinc-700 cursor-pointer"
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
          <div className="flex items-center gap-1">
            <select
              value={sortOption}
              onChange={e => setSortOption(e.target.value as SortOption)}
              className="px-2 py-1 bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-800 rounded text-xs text-zinc-300 focus:outline-none focus:border-zinc-700 cursor-pointer"
            >
              <option value="last_modified">Recentes</option>
              <option value="name">Nome (A-Z)</option>
              <option value="size">Tamanho</option>
              <option value="status">Status</option>
            </select>
          </div>

          <div className="h-3.5 w-px bg-zinc-850 mx-0.5" />

          {/* View Mode Toggle */}
          <div className="flex items-center bg-zinc-900 border border-zinc-850 rounded p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1 rounded transition-colors ${
                viewMode === 'grid'
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Grade"
            >
              <IconLayoutGrid size={14} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`p-1 rounded transition-colors ${
                viewMode === 'list'
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Lista"
            >
              <IconList size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Scrollable View */}
      <main className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {loading ? (
          <div className="h-full flex items-center justify-center text-zinc-400 text-xs gap-2 py-20">
            <IconLoader2 size={18} className="animate-spin text-zinc-300" />
            <span>Carregando projetos...</span>
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
