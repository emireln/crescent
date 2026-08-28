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
} from '@tabler/icons-react';
import { Project } from '../../types';
import { useProjects } from '../../context/ProjectContext';
import { formatBytes, formatRelativeTime, getStatusBadge, getTechColor } from '../../utils/formatters';
import { api } from '../../services/api';
import { EditorIcon } from '../common/EditorIcons';

interface ProjectListProps {
  projects: Project[];
}

export const ProjectList: React.FC<ProjectListProps> = ({ projects }) => {
  const {
    toggleFavorite,
    togglePinned,
    setActiveProject,
    openInEditor,
    openInTerminal,
    openInExplorer,
    relocateProject,
    settings,
  } = useProjects();

  return (
    <div className="w-full overflow-x-auto border border-zinc-800 rounded-lg bg-zinc-900">
      <table className="w-full text-left text-xs text-zinc-300">
        <thead className="bg-zinc-950 border-b border-zinc-800 text-[11px] text-zinc-400 uppercase font-semibold">
          <tr>
            <th className="py-2.5 px-3 w-10"></th>
            <th className="py-2.5 px-3">Projeto</th>
            <th className="py-2.5 px-3">Stack</th>
            <th className="py-2.5 px-3">Status</th>
            <th className="py-2.5 px-3">Git</th>
            <th className="py-2.5 px-3">Tamanho</th>
            <th className="py-2.5 px-3">Modificado</th>
            <th className="py-2.5 px-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/60">
          {projects.map(project => {
            const statusBadge = getStatusBadge(project.status);
            return (
              <tr
                key={project.id}
                onClick={() => setActiveProject(project)}
                className={`group hover:bg-zinc-850 transition-colors cursor-pointer ${
                  !project.exists_on_disk ? 'bg-zinc-950/60' : project.is_pinned ? 'bg-zinc-850/40' : ''
                }`}
              >
                {/* Pin & Star */}
                <td className="py-2.5 px-3" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => togglePinned(project.id)}
                      className={`p-0.5 rounded ${
                        project.is_pinned ? 'text-zinc-100' : 'text-zinc-600 hover:text-zinc-400'
                      }`}
                      title={project.is_pinned ? 'Desafixar' : 'Fixar'}
                    >
                      {project.is_pinned ? <IconPinFilled size={13} /> : <IconPin size={13} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleFavorite(project.id)}
                      className={`p-0.5 rounded ${
                        project.is_favorite ? 'text-zinc-100' : 'text-zinc-600 hover:text-zinc-400'
                      }`}
                      title={project.is_favorite ? 'Favorito' : 'Favoritar'}
                    >
                      {project.is_favorite ? <IconStarFilled size={13} /> : <IconStar size={13} />}
                    </button>
                  </div>
                </td>

                {/* Name and Path */}
                <td className="py-2.5 px-3">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-zinc-100">{project.name}</span>
                      {!project.exists_on_disk && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-zinc-300 bg-zinc-950 px-1.5 py-0.2 rounded border border-zinc-700">
                          <IconFolderOff size={11} /> Ausente
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-zinc-500 truncate max-w-xs" title={project.path}>
                      {project.path}
                    </span>
                  </div>
                </td>

                {/* Tech Badge */}
                <td className="py-2.5 px-3">
                  <span
                    className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded border ${getTechColor(
                      project.primary_tech
                    )}`}
                  >
                    {project.primary_tech}
                  </span>
                </td>

                {/* Status */}
                <td className="py-2.5 px-3">
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}
                  >
                    {statusBadge.label}
                  </span>
                </td>

                {/* Git */}
                <td className="py-2.5 px-3">
                  {project.git_branch ? (
                    <div
                      className={`inline-flex items-center gap-1 text-[11px] font-mono px-1.5 py-0.5 rounded border ${
                        project.git_dirty
                          ? 'border-zinc-600 bg-zinc-800 text-zinc-100'
                          : 'border-zinc-800 bg-zinc-950 text-zinc-400'
                      }`}
                    >
                      <IconGitBranch size={12} />
                      <span>{project.git_branch}</span>
                      {project.git_dirty && <IconCircleFilled size={5} className="text-zinc-100" />}
                    </div>
                  ) : (
                    <span className="text-zinc-600">—</span>
                  )}
                </td>

                {/* Size */}
                <td className="py-2.5 px-3 font-mono text-zinc-400">
                  {project.size_bytes > 0 ? formatBytes(project.size_bytes) : '—'}
                </td>

                {/* Last Modified */}
                <td className="py-2.5 px-3 text-zinc-400">
                  {formatRelativeTime(project.last_modified)}
                </td>

                {/* Actions */}
                <td className="py-2.5 px-3 text-right" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    {!project.exists_on_disk ? (
                      <button
                        type="button"
                        onClick={async () => {
                          const p = await api.pickDirectory();
                          if (p) relocateProject(project.id, p);
                        }}
                        className="px-2 py-1 bg-zinc-100 hover:bg-white text-zinc-950 rounded text-[11px] font-semibold"
                      >
                        Localizar
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => openInEditor(project)}
                          className="p-1 bg-zinc-800 hover:bg-zinc-100 hover:text-zinc-950 text-zinc-300 rounded border border-zinc-700 transition-colors"
                          title={`Abrir no editor (${settings.default_editor})`}
                        >
                          <EditorIcon editor={settings.default_editor} size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => openInTerminal(project)}
                          className="p-1 bg-zinc-800 hover:bg-zinc-100 hover:text-zinc-950 text-zinc-300 rounded border border-zinc-700 transition-colors"
                          title={`Abrir no terminal (${settings.default_terminal})`}
                        >
                          <IconTerminal2 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => openInExplorer(project)}
                          className="p-1 bg-zinc-800 hover:bg-zinc-100 hover:text-zinc-950 text-zinc-300 rounded border border-zinc-700 transition-colors"
                          title="Explorador de Arquivos"
                        >
                          <IconFolder size={13} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
