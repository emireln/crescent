import React from 'react';
import {
  IconStar,
  IconStarFilled,
  IconPin,
  IconPinFilled,
  IconGitBranch,
  IconCircleFilled,
  IconFolderOff,
  IconTerminal2,
  IconFolder,
  IconNotes,
  IconWorld,
  IconClock,
  IconDatabase,
  IconTrash,
} from '@tabler/icons-react';
import { Project } from '../../types';
import { useProjects } from '../../context/ProjectContext';
import { formatBytes, formatRelativeTime, getStatusBadge, getTechColor } from '../../utils/formatters';
import { api } from '../../services/api';
import { EditorIcon } from '../common/EditorIcons';

interface ProjectCardProps {
  project: Project;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const {
    toggleFavorite,
    togglePinned,
    setActiveProject,
    openInEditor,
    openInTerminal,
    openInExplorer,
    relocateProject,
    deleteProject,
    settings,
    portStatuses,
  } = useProjects();

  const statusBadge = getStatusBadge(project.status);
  const hasActivePort = project.ports.some(p => portStatuses[p.port]?.is_active);

  const handleRelocate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newPath = await api.pickDirectory();
    if (newPath) {
      await relocateProject(project.id, newPath);
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Deseja remover "${project.name}" da listagem? (Os arquivos no disco não serão apagados)`)) {
      await deleteProject(project.id);
    }
  };

  return (
    <div
      onClick={() => setActiveProject(project)}
      className={`group relative flex flex-col justify-between bg-zinc-900 hover:bg-zinc-850/80 rounded-xl p-3.5 transition-colors cursor-pointer ${
        !project.exists_on_disk
          ? 'bg-zinc-950/80'
          : project.is_pinned
          ? 'bg-zinc-900'
          : ''
      }`}
    >
      <div>
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {/* Pinned & Favorite */}
            <div className="flex items-center gap-0.5 shrink-0" onClick={e => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => togglePinned(project.id)}
                className={`p-1 rounded-md transition-colors cursor-pointer ${
                  project.is_pinned
                    ? 'text-zinc-100'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
                title={project.is_pinned ? 'Desafixar' : 'Fixar no topo'}
              >
                {project.is_pinned ? <IconPinFilled size={14} /> : <IconPin size={14} />}
              </button>

              <button
                type="button"
                onClick={() => toggleFavorite(project.id)}
                className={`p-1 rounded-md transition-colors cursor-pointer ${
                  project.is_favorite
                    ? 'text-zinc-100'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                }`}
                title={project.is_favorite ? 'Remover dos favoritos' : 'Favoritar'}
              >
                {project.is_favorite ? <IconStarFilled size={14} /> : <IconStar size={14} />}
              </button>
            </div>

            {/* Project Name */}
            <h3 className="font-semibold text-zinc-100 text-sm truncate tracking-tight" title={project.name}>
              {project.name}
            </h3>

            {/* Primary Tech */}
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-md shrink-0 ${getTechColor(
                project.primary_tech
              )}`}
            >
              {project.primary_tech}
            </span>
          </div>

          {/* Status Badge */}
          <span
            className={`text-[10px] font-medium px-2 py-0.5 rounded-md shrink-0 ${statusBadge.bg} ${statusBadge.text}`}
          >
            {statusBadge.label}
          </span>
        </div>

        {/* Missing Folder Warning */}
        {!project.exists_on_disk && (
          <div
            className="mb-2.5 p-2 bg-zinc-950 rounded-lg text-xs flex items-center justify-between gap-2"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-1.5 text-zinc-300 text-[11px] truncate">
              <IconFolderOff size={14} className="shrink-0 text-zinc-400" />
              <span className="truncate">Pasta não encontrada</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleRelocate}
                className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 rounded-md text-[11px] font-medium transition-colors cursor-pointer"
              >
                Localizar
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="p-1 text-zinc-400 hover:text-zinc-200 cursor-pointer"
                title="Remover"
              >
                <IconTrash size={12} />
              </button>
            </div>
          </div>
        )}

        {/* Path and Description */}
        <div className="space-y-1 mb-2.5">
          <p
            className="text-[11px] font-mono text-zinc-400 truncate select-text"
            title={project.path}
          >
            {project.path}
          </p>
          {project.description && (
            <p className="text-xs text-zinc-300 line-clamp-1 leading-normal">
              {project.description}
            </p>
          )}
        </div>

        {/* Git & Indicators */}
        <div className="flex items-center gap-1.5 flex-wrap mb-2 text-xs">
          {project.git_branch && (
            <div
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono ${
                project.git_dirty
                  ? 'bg-zinc-800 text-zinc-200'
                  : 'bg-zinc-950 text-zinc-400'
              }`}
              title={
                project.git_dirty
                  ? `Branch: ${project.git_branch} (Alterações pendentes)`
                  : `Branch: ${project.git_branch}`
              }
            >
              <IconGitBranch size={12} />
              <span>{project.git_branch}</span>
              {project.git_dirty && (
                <IconCircleFilled size={5} className="text-zinc-100 ml-0.5" />
              )}
            </div>
          )}

          {project.ports.length > 0 && (
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono ${
              hasActivePort ? 'bg-zinc-800 text-zinc-100' : 'bg-zinc-950 text-zinc-400'
            }`}>
              <IconWorld size={11} />
              <span>:{project.ports.map(p => p.port).join(', ')}</span>
              {hasActivePort && (
                <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
              )}
            </div>
          )}

          {project.notes && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-950 text-zinc-400 text-[10px]" title="Contém anotações">
              <IconNotes size={11} />
              <span>Notas</span>
            </div>
          )}

          {project.tags.map(tag => (
            <span
              key={tag.id}
              className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-md bg-zinc-950 text-zinc-300"
            >
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: tag.color || '#a1a1aa' }} />
              <span>#{tag.name}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Footer: Metadata & Quick Actions */}
      <div className="pt-2 flex items-center justify-between gap-2 text-[11px] text-zinc-400">
        <div className="flex items-center gap-2.5 text-zinc-400">
          <span className="flex items-center gap-1" title="Última modificação">
            <IconClock size={12} />
            <span>{formatRelativeTime(project.last_modified)}</span>
          </span>

          {project.size_bytes > 0 && (
            <span className="flex items-center gap-1" title="Tamanho">
              <IconDatabase size={12} />
              <span>{formatBytes(project.size_bytes)}</span>
            </span>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-0.5" onClick={e => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => openInEditor(project)}
            disabled={!project.exists_on_disk}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 disabled:opacity-30 rounded-md transition-colors cursor-pointer"
            title={`Abrir no ${settings.default_editor}`}
          >
            <EditorIcon editor={settings.default_editor} size={14} />
          </button>

          <button
            type="button"
            onClick={() => openInTerminal(project)}
            disabled={!project.exists_on_disk}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 disabled:opacity-30 rounded-md transition-colors cursor-pointer"
            title="Abrir no Terminal"
          >
            <IconTerminal2 size={14} />
          </button>

          <button
            type="button"
            onClick={() => openInExplorer(project)}
            disabled={!project.exists_on_disk}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 disabled:opacity-30 rounded-md transition-colors cursor-pointer"
            title="Explorador de Arquivos"
          >
            <IconFolder size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
