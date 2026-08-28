import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  IconX,
  IconStar,
  IconStarFilled,
  IconPin,
  IconPinFilled,
  IconCode,
  IconTerminal2,
  IconFolder,
  IconGitBranch,
  IconCircleFilled,
  IconClock,
  IconDatabase,
  IconNotes,
  IconFileText,
  IconWorld,
  IconPlayerPlay,
  IconPlus,
  IconTrash,
  IconExternalLink,
  IconDeviceFloppy,
  IconEdit,
  IconEye,
  IconFolderOff,
  IconCheck,
} from '@tabler/icons-react';
import { ScriptExecutionResult } from '../../types';
import { useProjects } from '../../context/ProjectContext';
import { formatBytes, formatRelativeTime, getStatusBadge, getTechColor } from '../../utils/formatters';
import { api } from '../../services/api';

type Tab = 'overview' | 'notes' | 'readme' | 'ports' | 'scripts';

export const ProjectDetailModal: React.FC = () => {
  const {
    activeProject,
    setActiveProject,
    updateProject,
    toggleFavorite,
    togglePinned,
    updateNotes,
    deleteProject,
    tags,
    settings,
    openInEditor,
    openInTerminal,
    openInExplorer,
    addScript,
    deleteScript,
    addPort,
    deletePort,
    runScript,
  } = useProjects();

  if (!activeProject) return null;

  const [activeTab, setActiveTab] = useState<Tab>('overview');

  // Form states for editing overview
  const [name, setName] = useState(activeProject.name);
  const [description, setDescription] = useState(activeProject.description);
  const [status, setStatus] = useState(activeProject.status);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    activeProject.tags.map(t => t.id)
  );

  // Notes state
  const [notesContent, setNotesContent] = useState(activeProject.notes);
  const [notesViewMode, setNotesViewMode] = useState<'edit' | 'preview' | 'split'>('split');
  const [notesSaved, setNotesSaved] = useState(true);

  // Readme state
  const [readmeContent, setReadmeContent] = useState<string | null>(null);
  const [readmeLoading, setReadmeLoading] = useState(false);

  // Ports state
  const [newPort, setNewPort] = useState<string>('');
  const [newPortDesc, setNewPortDesc] = useState<string>('');

  // Scripts state
  const [newScriptName, setNewScriptName] = useState<string>('');
  const [newScriptCmd, setNewScriptCmd] = useState<string>('');
  const [executingScriptId, setExecutingScriptId] = useState<string | null>(null);
  const [scriptOutput, setScriptOutput] = useState<{ id: string; result: ScriptExecutionResult } | null>(null);

  // Sync state when activeProject changes
  useEffect(() => {
    setName(activeProject.name);
    setDescription(activeProject.description);
    setStatus(activeProject.status);
    setSelectedTagIds(activeProject.tags.map(t => t.id));
    setNotesContent(activeProject.notes);
  }, [activeProject.id]);

  // Load README when switching to readme tab
  useEffect(() => {
    if (activeTab === 'readme' && !readmeContent) {
      setReadmeLoading(true);
      api.getProjectReadme(activeProject.path)
        .then(content => setReadmeContent(content))
        .catch(() => setReadmeContent(null))
        .finally(() => setReadmeLoading(false));
    }
  }, [activeTab, activeProject.path, readmeContent]);

  const handleSaveOverview = async () => {
    await updateProject({
      id: activeProject.id,
      name,
      path: activeProject.path,
      description,
      tech_stack: activeProject.tech_stack,
      primary_tech: activeProject.primary_tech,
      status,
      is_favorite: activeProject.is_favorite,
      is_pinned: activeProject.is_pinned,
      notes: notesContent,
      tag_ids: selectedTagIds,
    });
  };

  const handleSaveNotes = async () => {
    await updateNotes(activeProject.id, notesContent);
    setNotesSaved(true);
  };

  const handleAddPort = async (e: React.FormEvent) => {
    e.preventDefault();
    const portNum = parseInt(newPort, 10);
    if (isNaN(portNum) || portNum <= 0) return;
    await addPort(activeProject.id, portNum, newPortDesc.trim());
    setNewPort('');
    setNewPortDesc('');
  };

  const handleAddScript = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newScriptName.trim() || !newScriptCmd.trim()) return;
    await addScript(activeProject.id, newScriptName.trim(), newScriptCmd.trim());
    setNewScriptName('');
    setNewScriptCmd('');
  };

  const handleExecuteScript = async (scriptId: string, cmd: string) => {
    setExecutingScriptId(scriptId);
    try {
      const res = await runScript(activeProject, cmd);
      setScriptOutput({ id: scriptId, result: res });
    } catch (err: any) {
      setScriptOutput({
        id: scriptId,
        result: {
          success: false,
          exit_code: 1,
          stdout: '',
          stderr: String(err),
        },
      });
    } finally {
      setExecutingScriptId(null);
    }
  };

  const handleDeleteProject = async () => {
    if (window.confirm(`Deseja realmente remover "${activeProject.name}" do Crescent? (Os arquivos no disco permanecerão intactos)`)) {
      await deleteProject(activeProject.id);
      setActiveProject(null);
    }
  };

  const statusBadge = getStatusBadge(status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => togglePinned(activeProject.id)}
                className={`p-1.5 rounded transition-colors ${
                  activeProject.is_pinned ? 'text-zinc-100 bg-zinc-800' : 'text-zinc-500 hover:text-zinc-300'
                }`}
                title="Fixar no topo"
              >
                {activeProject.is_pinned ? <IconPinFilled size={16} /> : <IconPin size={16} />}
              </button>
              <button
                type="button"
                onClick={() => toggleFavorite(activeProject.id)}
                className={`p-1.5 rounded transition-colors ${
                  activeProject.is_favorite ? 'text-zinc-100 bg-zinc-800' : 'text-zinc-500 hover:text-zinc-300'
                }`}
                title="Favoritar"
              >
                {activeProject.is_favorite ? <IconStarFilled size={16} /> : <IconStar size={16} />}
              </button>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-zinc-100 truncate">{activeProject.name}</h2>
                <span className={`text-xs font-mono px-2 py-0.5 rounded border ${getTechColor(activeProject.primary_tech)}`}>
                  {activeProject.primary_tech}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}>
                  {statusBadge.label}
                </span>
              </div>
              <p className="text-[11px] font-mono text-zinc-400 truncate mt-0.5 select-text">
                {activeProject.path}
              </p>
            </div>
          </div>

          {/* Quick Launcher Icons in Header */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => openInEditor(activeProject)}
              disabled={!activeProject.exists_on_disk}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-100 hover:text-zinc-950 disabled:opacity-40 text-zinc-200 rounded border border-zinc-700 text-xs font-medium transition-colors"
              title={`Abrir no editor (${settings.default_editor})`}
            >
              <IconCode size={14} />
              <span>Editor</span>
            </button>

            <button
              type="button"
              onClick={() => openInTerminal(activeProject)}
              disabled={!activeProject.exists_on_disk}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-100 hover:text-zinc-950 disabled:opacity-40 text-zinc-200 rounded border border-zinc-700 text-xs font-medium transition-colors"
              title={`Abrir no terminal (${settings.default_terminal})`}
            >
              <IconTerminal2 size={14} />
              <span>Terminal</span>
            </button>

            <button
              type="button"
              onClick={() => openInExplorer(activeProject)}
              disabled={!activeProject.exists_on_disk}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-100 hover:text-zinc-950 disabled:opacity-40 text-zinc-200 rounded border border-zinc-700 text-xs font-medium transition-colors"
              title="Abrir pasta no Windows Explorer"
            >
              <IconFolder size={14} />
              <span>Explorer</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveProject(null)}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors ml-2"
              title="Fechar"
            >
              <IconX size={18} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 bg-zinc-950 border-b border-zinc-800 flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-zinc-100 text-zinc-100 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <IconFileText size={14} />
            <span>Visão Geral</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notes')}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'notes'
                ? 'border-zinc-100 text-zinc-100 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <IconNotes size={14} />
            <span>Anotações</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('readme')}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'readme'
                ? 'border-zinc-100 text-zinc-100 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <IconFileText size={14} />
            <span>README.md</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ports')}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'ports'
                ? 'border-zinc-100 text-zinc-100 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <IconWorld size={14} />
            <span>Portas ({activeProject.ports.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('scripts')}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'scripts'
                ? 'border-zinc-100 text-zinc-100 font-semibold'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <IconPlayerPlay size={14} />
            <span>Scripts Rápidos ({activeProject.scripts.length})</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* TAB 1: VISÃO GERAL */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Missing warning if folder not found */}
              {!activeProject.exists_on_disk && (
                <div className="p-3 bg-zinc-950 border border-zinc-700 rounded flex items-center justify-between text-xs text-zinc-200">
                  <div className="flex items-center gap-2">
                    <IconFolderOff size={18} className="text-zinc-400 shrink-0" />
                    <span>O diretório do projeto não existe no disco (foi movido ou apagado).</span>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const newP = await api.pickDirectory();
                      if (newP) await api.relocateProject(activeProject.id, newP);
                    }}
                    className="px-3 py-1 bg-zinc-100 hover:bg-white text-zinc-950 rounded font-semibold"
                  >
                    Localizar Novo Caminho
                  </button>
                </div>
              )}

              {/* Status & Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 bg-zinc-950 border border-zinc-800 rounded space-y-2">
                  <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Informações do Sistema
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-zinc-800">
                      <span className="text-zinc-400">Última Modificação:</span>
                      <span className="text-zinc-200 font-mono flex items-center gap-1">
                        <IconClock size={13} /> {formatRelativeTime(activeProject.last_modified)}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-zinc-800">
                      <span className="text-zinc-400">Tamanho no Disco:</span>
                      <span className="text-zinc-200 font-mono flex items-center gap-1">
                        <IconDatabase size={13} /> {formatBytes(activeProject.size_bytes)}
                      </span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-zinc-400">Cadastrado em:</span>
                      <span className="text-zinc-200 font-mono">
                        {new Date(activeProject.created_at * 1000).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-zinc-950 border border-zinc-800 rounded space-y-2">
                  <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Status do Git
                  </div>
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between py-1 border-b border-zinc-800">
                      <span className="text-zinc-400">Branch Atual:</span>
                      <span className="text-zinc-200 font-mono flex items-center gap-1">
                        <IconGitBranch size={13} /> {activeProject.git_branch || 'Não é repositório'}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-zinc-800">
                      <span className="text-zinc-400">Alterações Pendentes:</span>
                      <span className="font-mono flex items-center gap-1 text-zinc-200">
                        {activeProject.git_dirty ? (
                          <>
                            <IconCircleFilled size={6} className="text-zinc-100" />
                            <span>Arquivos modificados</span>
                          </>
                        ) : (
                          <span>Diretório limpo</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Edit Form */}
              <div className="space-y-4 pt-2 border-t border-zinc-800">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">Nome do Projeto</label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-xs text-zinc-100 focus:outline-none focus:border-zinc-600 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">Status do Projeto</label>
                    <select
                      value={status}
                      onChange={e => setStatus(e.target.value as any)}
                      className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-xs text-zinc-100 focus:outline-none focus:border-zinc-600"
                    >
                      <option value="active">Ativo</option>
                      <option value="on_hold">Em Espera</option>
                      <option value="completed">Concluído</option>
                      <option value="archived">Arquivado</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">Descrição</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Adicione uma descrição objetiva sobre o propósito deste projeto..."
                    className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-zinc-600 leading-relaxed"
                  />
                </div>

                {/* Stacks Detectadas */}
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">Stack Tecnológica Detectada</label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {activeProject.tech_stack.map(tech => (
                      <span
                        key={tech}
                        className={`text-xs font-mono px-2.5 py-1 rounded border ${getTechColor(tech)}`}
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Tags Selector */}
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1.5">Tags Associadas</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {tags.map(t => {
                      const isAssigned = selectedTagIds.includes(t.id);
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            setSelectedTagIds(prev =>
                              isAssigned ? prev.filter(id => id !== t.id) : [...prev, t.id]
                            );
                          }}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors border ${
                            isAssigned
                              ? 'bg-zinc-800 text-zinc-100 border-zinc-600 font-medium'
                              : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                          }`}
                        >
                          <span className="text-zinc-500 font-mono">#</span>
                          <span>{t.name}</span>
                          {isAssigned && <IconCheck size={12} className="text-zinc-100 ml-0.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Save button & Danger Zone */}
                <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                  <button
                    type="button"
                    onClick={handleDeleteProject}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-950 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-100 rounded border border-zinc-800 text-xs font-medium transition-colors"
                  >
                    <IconTrash size={14} />
                    <span>Remover Projeto</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveOverview}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 rounded text-xs font-semibold transition-colors shadow-sm"
                  >
                    <IconDeviceFloppy size={15} />
                    <span>Salvar Alterações</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ANOTAÇÕES */}
          {activeTab === 'notes' && (
            <div className="h-full flex flex-col space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <div className="text-xs text-zinc-400">
                  Anotações locais em Markdown (salvas em SQLite offline).
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded p-0.5">
                    <button
                      type="button"
                      onClick={() => setNotesViewMode('edit')}
                      className={`px-2 py-1 rounded text-xs ${
                        notesViewMode === 'edit' ? 'bg-zinc-800 text-zinc-100 font-medium' : 'text-zinc-400'
                      }`}
                    >
                      <IconEdit size={13} className="inline mr-1" /> Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => setNotesViewMode('preview')}
                      className={`px-2 py-1 rounded text-xs ${
                        notesViewMode === 'preview' ? 'bg-zinc-800 text-zinc-100 font-medium' : 'text-zinc-400'
                      }`}
                    >
                      <IconEye size={13} className="inline mr-1" /> Visualizar
                    </button>
                    <button
                      type="button"
                      onClick={() => setNotesViewMode('split')}
                      className={`px-2 py-1 rounded text-xs ${
                        notesViewMode === 'split' ? 'bg-zinc-800 text-zinc-100 font-medium' : 'text-zinc-400'
                      }`}
                    >
                      Dividido
                    </button>
                  </div>

                  <span className={`text-[11px] font-mono px-2 py-0.5 rounded ${notesSaved ? 'text-zinc-500' : 'text-zinc-100 bg-zinc-800 border border-zinc-700'}`}>
                    {notesSaved ? 'Salvo no banco' : 'Alterações não salvas'}
                  </span>

                  <button
                    type="button"
                    onClick={handleSaveNotes}
                    className="flex items-center gap-1 px-3 py-1 bg-zinc-100 hover:bg-white text-zinc-950 rounded text-xs font-semibold"
                  >
                    <IconDeviceFloppy size={14} />
                    <span>Salvar Notas</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-[360px]">
                {(notesViewMode === 'edit' || notesViewMode === 'split') && (
                  <textarea
                    value={notesContent}
                    onChange={e => {
                      setNotesContent(e.target.value);
                      setNotesSaved(false);
                    }}
                    placeholder="# Comandos de setup, credenciais e arquitetura..."
                    className={`w-full h-full min-h-[360px] p-3 bg-zinc-950 border border-zinc-800 rounded font-mono text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 resize-none ${
                      notesViewMode === 'edit' ? 'col-span-2' : ''
                    }`}
                  />
                )}

                {(notesViewMode === 'preview' || notesViewMode === 'split') && (
                  <div
                    className={`p-3 bg-zinc-950 border border-zinc-800 rounded overflow-y-auto prose-crescent min-h-[360px] ${
                      notesViewMode === 'preview' ? 'col-span-2' : ''
                    }`}
                  >
                    {notesContent.trim() ? (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{notesContent}</ReactMarkdown>
                    ) : (
                      <span className="text-zinc-600 italic">Nenhuma anotação registrada ainda.</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: README.MD */}
          {activeTab === 'readme' && (
            <div className="p-4 bg-zinc-950 border border-zinc-800 rounded prose-crescent overflow-y-auto max-h-[500px]">
              {readmeLoading ? (
                <div className="text-zinc-400 text-xs py-8 text-center">Carregando README.md...</div>
              ) : readmeContent ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{readmeContent}</ReactMarkdown>
              ) : (
                <div className="text-center py-12 text-zinc-500 text-xs">
                  Nenhum arquivo README.md encontrado na raiz deste projeto.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PORTAS LOCAIS */}
          {activeTab === 'ports' && (
            <div className="space-y-4">
              <form onSubmit={handleAddPort} className="p-3 bg-zinc-950 border border-zinc-800 rounded flex items-center gap-3">
                <div className="w-32">
                  <label className="block text-[11px] text-zinc-400 mb-1">Porta (ex: 3000)</label>
                  <input
                    type="number"
                    value={newPort}
                    onChange={e => setNewPort(e.target.value)}
                    placeholder="3000"
                    className="w-full px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-100 focus:outline-none focus:border-zinc-600 font-mono"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[11px] text-zinc-400 mb-1">Descrição / Serviço</label>
                  <input
                    type="text"
                    value={newPortDesc}
                    onChange={e => setNewPortDesc(e.target.value)}
                    placeholder="Frontend Vite / Backend API..."
                    className="w-full px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-100 focus:outline-none focus:border-zinc-600"
                  />
                </div>
                <div className="pt-5">
                  <button
                    type="submit"
                    className="flex items-center gap-1 px-3 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 rounded text-xs font-semibold"
                  >
                    <IconPlus size={14} />
                    <span>Adicionar</span>
                  </button>
                </div>
              </form>

              <div className="space-y-2">
                {activeProject.ports.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500 text-xs bg-zinc-950 border border-zinc-800 rounded">
                    Nenhuma porta registrada para este projeto.
                  </div>
                ) : (
                  activeProject.ports.map(p => (
                    <div
                      key={p.id}
                      className="p-3 bg-zinc-950 border border-zinc-800 rounded flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 bg-zinc-850 border border-zinc-700 rounded text-zinc-100 font-mono text-xs font-semibold">
                          :{p.port}
                        </span>
                        <span className="text-xs text-zinc-300">
                          {p.description || `Serviço local na porta ${p.port}`}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => api.openUrl(`http://localhost:${p.port}`)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs border border-zinc-700 transition-colors"
                        >
                          <IconExternalLink size={13} />
                          <span>Abrir http://localhost:{p.port}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => deletePort(p.id)}
                          className="p-1 text-zinc-500 hover:text-zinc-200 rounded"
                          title="Remover Porta"
                        >
                          <IconTrash size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 5: SCRIPTS RÁPIDOS */}
          {activeTab === 'scripts' && (
            <div className="space-y-4">
              <form onSubmit={handleAddScript} className="p-3 bg-zinc-950 border border-zinc-800 rounded flex items-center gap-3">
                <div className="w-48">
                  <label className="block text-[11px] text-zinc-400 mb-1">Nome do Script</label>
                  <input
                    type="text"
                    value={newScriptName}
                    onChange={e => setNewScriptName(e.target.value)}
                    placeholder="Dev Server"
                    className="w-full px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-100 focus:outline-none focus:border-zinc-600"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[11px] text-zinc-400 mb-1">Comando (executado na raiz)</label>
                  <input
                    type="text"
                    value={newScriptCmd}
                    onChange={e => setNewScriptCmd(e.target.value)}
                    placeholder="npm run dev / cargo check / pytest"
                    className="w-full px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-100 focus:outline-none focus:border-zinc-600 font-mono"
                  />
                </div>
                <div className="pt-5">
                  <button
                    type="submit"
                    className="flex items-center gap-1 px-3 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 rounded text-xs font-semibold"
                  >
                    <IconPlus size={14} />
                    <span>Adicionar Script</span>
                  </button>
                </div>
              </form>

              <div className="space-y-2">
                {activeProject.scripts.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500 text-xs bg-zinc-950 border border-zinc-800 rounded">
                    Nenhum script pré-configurado para este projeto.
                  </div>
                ) : (
                  activeProject.scripts.map(s => (
                    <div
                      key={s.id}
                      className="p-3 bg-zinc-950 border border-zinc-800 rounded flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="text-xs font-semibold text-zinc-200">{s.name}</div>
                        <code className="text-[11px] text-zinc-400 font-mono">{s.command}</code>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleExecuteScript(s.id, s.command)}
                          disabled={executingScriptId === s.id}
                          className="flex items-center gap-1.5 px-3 py-1 bg-zinc-100 hover:bg-white disabled:opacity-50 text-zinc-950 rounded text-xs font-semibold transition-colors"
                        >
                          <IconPlayerPlay size={13} />
                          <span>{executingScriptId === s.id ? 'Executando...' : 'Executar'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteScript(s.id)}
                          className="p-1 text-zinc-500 hover:text-zinc-200 rounded"
                          title="Remover Script"
                        >
                          <IconTrash size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Console output drawer if script executed */}
              {scriptOutput && (
                <div className="p-3 bg-zinc-950 border border-zinc-800 rounded space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-zinc-300">Console de Saída:</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-850 text-zinc-200 border border-zinc-700">
                      {scriptOutput.result.success ? 'Código 0 (Sucesso)' : `Código ${scriptOutput.result.exit_code} (Erro)`}
                    </span>
                  </div>
                  <pre className="p-2.5 bg-black border border-zinc-800 rounded text-xs font-mono text-zinc-300 overflow-x-auto max-h-48 whitespace-pre-wrap">
                    {scriptOutput.result.stdout || scriptOutput.result.stderr || '(Nenhuma saída gerada)'}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
