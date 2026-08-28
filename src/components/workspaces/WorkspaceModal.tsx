import React, { useState } from 'react';
import {
  IconX,
  IconCheck,
  IconTrash,
  IconBriefcase,
  IconPlayerPlay,
} from '@tabler/icons-react';
import { useProjects } from '../../context/ProjectContext';
import { Workspace } from '../../types';

export const WorkspaceModal: React.FC = () => {
  const {
    isWorkspaceModalOpen,
    setIsWorkspaceModalOpen,
    workspaces,
    projects,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
    openWorkspaceProjects,
    selectedWorkspaceId,
  } = useProjects();

  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [error, setError] = useState('');

  const resetForm = () => {
    setEditingWorkspace(null);
    setName('');
    setDescription('');
    setSelectedProjectIds([]);
    setError('');
  };

  const handleEdit = (ws: Workspace) => {
    setEditingWorkspace(ws);
    setName(ws.name);
    setDescription(ws.description);
    setSelectedProjectIds(ws.project_ids);
    setError('');
  };

  const toggleProjectSelection = (id: string) => {
    setSelectedProjectIds(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('O nome do workspace é obrigatório.');
      return;
    }

    try {
      if (editingWorkspace) {
        await updateWorkspace(editingWorkspace.id, name.trim(), description.trim(), selectedProjectIds);
      } else {
        await createWorkspace(name.trim(), description.trim(), selectedProjectIds);
      }
      resetForm();
    } catch (err: any) {
      setError(err?.message || 'Falha ao salvar workspace.');
    }
  };

  if (!isWorkspaceModalOpen) return null;

  return (
    <div className="fixed top-11 inset-x-0 bottom-0 z-40 flex items-center justify-center p-4 bg-black/75 select-none animate-in fade-in duration-150">
      <div className="w-full max-w-2xl max-h-[85vh] bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-zinc-800 rounded text-zinc-100 border border-zinc-700">
              <IconBriefcase size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-100">Workspaces & Grupos de Projetos</h2>
              <p className="text-xs text-zinc-400">
                Organize múltiplos repositórios relacionados para abrir juntos no seu editor
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setIsWorkspaceModalOpen(false);
            }}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded transition-colors"
          >
            <IconX size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* Workspaces List */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Workspaces Existentes ({workspaces.length})
            </h3>

            {workspaces.length === 0 ? (
              <p className="text-xs text-zinc-500 italic">Nenhum workspace criado ainda. Crie seu primeiro grupo abaixo.</p>
            ) : (
              <div className="space-y-2">
                {workspaces.map(ws => (
                  <div
                    key={ws.id}
                    className={`p-3.5 rounded-lg border flex items-center justify-between transition-colors ${
                      selectedWorkspaceId === ws.id
                        ? 'bg-zinc-850 border-zinc-700'
                        : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-zinc-100">{ws.name}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                          {ws.project_ids.length} {ws.project_ids.length === 1 ? 'projeto' : 'projetos'}
                        </span>
                      </div>
                      {ws.description && (
                        <p className="text-xs text-zinc-400">{ws.description}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openWorkspaceProjects(ws)}
                        title="Abrir todos os projetos no Editor"
                        className="flex items-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 rounded text-xs transition-colors"
                      >
                        <IconPlayerPlay size={13} />
                        <span>Abrir Todos</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleEdit(ws)}
                        className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded text-xs transition-colors"
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteWorkspace(ws.id)}
                        className="p-1 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
                        title="Excluir Workspace"
                      >
                        <IconTrash size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <hr className="border-zinc-800" />

          {/* Form Create / Edit */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              {editingWorkspace ? 'Editar Workspace' : 'Criar Novo Workspace'}
            </h3>

            {error && (
              <div className="p-2.5 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-300">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Nome do Workspace *</label>
              <input
                type="text"
                placeholder="Ex: Ecossistema Fintech, Apps Pessoais, Freelances"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Descrição (Opcional)</label>
              <input
                type="text"
                placeholder="Ex: Frontend Next.js + API Go + Worker Rust"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">
                Selecione os Projetos deste Workspace ({selectedProjectIds.length})
              </label>
              <div className="max-h-40 overflow-y-auto border border-zinc-800 bg-zinc-900/60 rounded p-2 space-y-1 custom-scrollbar">
                {projects.map(p => {
                  const isChecked = selectedProjectIds.includes(p.id);
                  return (
                    <label
                      key={p.id}
                      className={`flex items-center justify-between p-1.5 rounded text-xs cursor-pointer ${
                        isChecked ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-400 hover:bg-zinc-850'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleProjectSelection(p.id)}
                          className="rounded border-zinc-700 bg-zinc-800 text-zinc-100 focus:ring-0 cursor-pointer"
                        />
                        <span className="font-medium truncate">{p.name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500">{p.primary_tech}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              {editingWorkspace && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 rounded text-xs transition-colors"
                >
                  Cancelar Edição
                </button>
              )}

              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-medium rounded text-xs transition-colors shadow-sm cursor-pointer"
              >
                <IconCheck size={14} />
                <span>{editingWorkspace ? 'Salvar Alterações' : 'Criar Workspace'}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
