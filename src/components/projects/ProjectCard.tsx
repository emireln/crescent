import React from 'react';
import {
  IconStar,
  IconStarFilled,
  IconPin,
  IconPinFilled,
  IconGitBranch,
  IconCircleFilled,
  IconFolderOff,
  IconFolderCheck,
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
      className={`group relative flex flex-col justify-between bg-zinc-900 border rounded-lg p-4 transition-all cursor-pointer ${
        !project.exists_on_disk
          ? 'border-zinc-600 bg-zinc-900 hover:border-zinc-500'
          : project.is_pinned
          ? 'border-zinc-600 bg-zinc-900 hover:border-zinc-500 shadow-sm'
          : 'border-zinc-800 hover:border-zinc-700 hover:bg-zinc-850'
      }`}
    >
      <div>
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
            {/* Pinned & Favorite buttons */}
            <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => togglePinned(project.id)}
                className={`p-1 rounded transition-colors ${
                  project.is_pinned
                    ? 'text-zinc-100 bg-zinc-800 hover:bg-zinc-700'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                }`}
                title={project.is_pinned ? 'Desafixar' : 'Fixar no topo'}
              >
                {project.is_pinned ? <IconPinFilled size={14} /> : <IconPin size={14} />}
              </button>

              <button
                type="button"
                onClick={() => toggleFavorite(project.id)}
                className={`p-1 rounded transition-colors ${
                  project.is_favorite
                    ? 'text-zinc-100 bg-zinc-800 hover:bg-zinc-700'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'
                }`}
                title={project.is_favorite ? 'Remover dos favoritos' : 'Favoritar'}
              >
                {project.is_favorite ? <IconStarFilled size={14} /> : <IconStar size={14} />}
              </button>
            </div>

            {/* Project Name */}
            <h3 className="font-semibold text-zinc-50 text-sm truncate tracking-tight" title={project.name}>
              {project.name}
            </h3>

            {/* Primary Tech Badge */}
            <span
              className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded border shrink-0 ${getTechColor(
                project.primary_tech
              )}`}
            >
              {project.primary_tech}
            </span>
          </div>

          {/* Status Badge */}
          <span
            className={`text-[10px] font-medium px-2 py-0.5 rounded border shrink-0 ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}
          >
            {statusBadge.label}
          </span>
        </div>

        {/* Missing Folder Warning Banner */}
        {!project.exists_on_disk && (
          <div
            className="mb-3 p-2.5 bg-zinc-950 border border-zinc-700 rounded text-xs flex flex-col gap-2"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-zinc-200 font-medium">
              <IconFolderOff size={16} className="text-zinc-300 shrink-0" />
              <span>Diretório não encontrado no disco (movido ou deletado).</span>
            </div>
            <div className="flex items-center gap-2 pt-1 border-t border-zinc-800">
              <button
                type="button"
                onClick={handleRelocate}
                className="flex items-center gap-1 px-2.5 py-1 bg-zinc-100 hover:bg-white text-zinc-950 rounded text-[11px] font-semibold transition-colors"
              >
                <IconFolderCheck size={13} />
                <span>Localizar Pasta</span>
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="flex items-center gap-1 px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 rounded text-[11px] transition-colors"
              >
                <IconTrash size={13} />
                <span>Remover da Lista</span>
              </button>
            </div>
          </div>
        )}

        {/* Path and Description */}
        <div className="space-y-1 mb-3">
          <p
            className="text-[11px] font-mono text-zinc-400 truncate bg-zinc-950 px-2 py-1 rounded border border-zinc-800 select-text"
            title={project.path}
          >
            {project.path}
          </p>
          {project.description && (
            <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">
              {project.description}
            </p>
          )}
        </div>

        {/* Git & Ports Indicators */}
        <div className="flex items-center gap-2 flex-wrap mb-3 text-xs">
          {project.git_branch && (
            <div
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-[11px] font-mono ${
                project.git_dirty
                  ? 'border-zinc-600 bg-zinc-800 text-zinc-100'
                  : 'border-zinc-800 bg-zinc-950 text-zinc-400'
              }`}
              title={
                project.git_dirty
                  ? `Branch: ${project.git_branch} (Arquivos modificados / uncommitted)`
                  : `Branch: ${project.git_branch} (Tudo sincronizado)`
              }
            >
              <IconGitBranch size={13} />
              <span>{project.git_branch}</span>
              {project.git_dirty && (
                <IconCircleFilled size={6} className="text-zinc-100 ml-0.5" />
              )}
            </div>
          )}

          {project.ports.length > 0 && (
            <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded border text-[11px] font-mono ${
              hasActivePort ? 'border-zinc-600 bg-zinc-800 text-zinc-100' : 'border-zinc-700 bg-zinc-850 text-zinc-200'
            }`}>
              <IconWorld size={12} />
              <span>:{project.ports.map(p => p.port).join(', ')}</span>
              {hasActivePort && (
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" title="Porta ativa em execução" />
              )}
            </div>
          )}

          {project.notes && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded border border-zinc-800 bg-zinc-950 text-zinc-400 text-[11px]" title="Contém anotações">
              <IconNotes size={12} />
              <span>Notas</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {project.tags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap mb-3">
            {project.tags.map(tag => (
              <span
                key={tag.id}
                className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-zinc-850 border border-zinc-700 text-zinc-300 font-medium"
              >
                #{tag.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer: Metadata & Quick Actions */}
      <div className="pt-3 border-t border-zinc-800 flex items-center justify-between gap-2 text-[11px] text-zinc-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1" title="Última modificação">
            <IconClock size={13} className="text-zinc-500" />
            <span>{formatRelativeTime(project.last_modified)}</span>
          </span>

          {project.size_bytes > 0 && (
            <span className="flex items-center gap-1" title="Tamanho aproximado">
              <IconDatabase size={13} className="text-zinc-500" />
              <span>{formatBytes(project.size_bytes)}</span>
            </span>
          )}
        </div>

        {/* One-Click Action Buttons */}
        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => openInEditor(project)}
            disabled={!project.exists_on_disk}
            className="p-1.5 bg-zinc-800 hover:bg-zinc-100 hover:text-zinc-950 disabled:opacity-40 disabled:hover:bg-zinc-800 disabled:hover:text-zinc-200 text-zinc-200 rounded border border-zinc-700 transition-colors"
            title={`Abrir no editor (${settings.default_editor})`}
          >
            <EditorIcon editor={settings.default_editor} size={14} />
          </button>

          <button
            type="button"
            onClick={() => openInTerminal(project)}
            disabled={!project.exists_on_disk}
            className="p-1.5 bg-zinc-800 hover:bg-zinc-100 hover:text-zinc-950 disabled:opacity-40 disabled:hover:bg-zinc-800 disabled:hover:text-zinc-200 text-zinc-200 rounded border border-zinc-700 transition-colors"
            title={`Abrir no terminal (${settings.default_terminal})`}
          >
            <IconTerminal2 size={14} />
          </button>

          <button
            type="button"
            onClick={() => openInExplorer(project)}
            disabled={!project.exists_on_disk}
            className="p-1.5 bg-zinc-800 hover:bg-zinc-100 hover:text-zinc-950 disabled:opacity-40 disabled:hover:bg-zinc-800 disabled:hover:text-zinc-200 text-zinc-200 rounded border border-zinc-700 transition-colors"
            title="Revelar no Explorador de Arquivos"
          >
            <IconFolder size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
