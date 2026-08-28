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
  IconCheck,
  IconGitPullRequest,
  IconGitCommit,
  IconFileCode,
  IconAlertTriangle,
  IconSquareLetterX,
  IconBrain,
  IconSparkles,
} from '@tabler/icons-react';
import { ScriptExecutionResult, GitCommitSummary, EnvFileInfo } from '../../types';
import { useProjects } from '../../context/ProjectContext';
import { formatBytes, formatRelativeTime, getStatusBadge, getTechColor } from '../../utils/formatters';
import { api } from '../../services/api';

type Tab = 'overview' | 'notes' | 'readme' | 'git' | 'env' | 'ports' | 'scripts' | 'ai';

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
    portStatuses,
    killPort,
    setIsAiChatOpen,
    setAiActiveProjectId,
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

  // Git Insights state
  const [recentCommits, setRecentCommits] = useState<GitCommitSummary[]>([]);
  const [gitLoading, setGitLoading] = useState(false);

  // Env state
  const [envInfo, setEnvInfo] = useState<EnvFileInfo | null>(null);
  const [envLoading, setEnvLoading] = useState(false);
  const [envMsg, setEnvMsg] = useState<string | null>(null);

  // Ports state
  const [newPort, setNewPort] = useState<string>('');
  const [newPortDesc, setNewPortDesc] = useState<string>('');
  const [killingPort, setKillingPort] = useState<number | null>(null);

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
    setReadmeContent(null);
    setRecentCommits([]);
    setEnvInfo(null);
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

  // Load Git commits when switching to git tab
  useEffect(() => {
    if (activeTab === 'git') {
      setGitLoading(true);
      api.getProjectRecentCommits(activeProject.path, 10)
        .then(commits => setRecentCommits(commits))
        .catch(() => setRecentCommits([]))
        .finally(() => setGitLoading(false));
    }
  }, [activeTab, activeProject.path]);

  // Load .env info when switching to env tab
  useEffect(() => {
    if (activeTab === 'env') {
      setEnvLoading(true);
      api.getEnvInfo(activeProject.path)
        .then(info => setEnvInfo(info))
        .catch(() => setEnvInfo(null))
        .finally(() => setEnvLoading(false));
    }
  }, [activeTab, activeProject.path]);

  const [overviewSaved, setOverviewSaved] = useState(false);

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
    setOverviewSaved(true);
    setTimeout(() => setOverviewSaved(false), 1500);
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

  const handleKillPort = async (port: number) => {
    setKillingPort(port);
    try {
      await killPort(port);
    } catch (err) {
      console.error(err);
    } finally {
      setKillingPort(null);
    }
  };

  const handleGenerateEnv = async () => {
    try {
      const msg = await api.generateEnvFromExample(activeProject.path);
      setEnvMsg(msg);
      const updated = await api.getEnvInfo(activeProject.path);
      setEnvInfo(updated);
    } catch (err: any) {
      setEnvMsg(`Erro: ${err?.message || err}`);
    }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 select-none animate-in fade-in duration-150">
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
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
              className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-zinc-200 rounded border border-zinc-800 hover:border-zinc-700 text-xs font-medium transition-colors"
              title={`Abrir no editor (${settings.default_editor})`}
            >
              <IconCode size={14} />
              <span>Editor</span>
            </button>

            <button
              type="button"
              onClick={() => openInTerminal(activeProject)}
              disabled={!activeProject.exists_on_disk}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-zinc-200 rounded border border-zinc-800 hover:border-zinc-700 text-xs font-medium transition-colors"
              title={`Abrir no terminal (${settings.default_terminal})`}
            >
              <IconTerminal2 size={14} />
              <span>Terminal</span>
            </button>

            <button
              type="button"
              onClick={() => openInExplorer(activeProject)}
              disabled={!activeProject.exists_on_disk}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 text-zinc-200 rounded border border-zinc-800 hover:border-zinc-700 text-xs font-medium transition-colors"
              title="Abrir no Explorer"
            >
              <IconFolder size={14} />
              <span>Explorer</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveProject(null)}
              className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded transition-colors ml-2"
            >
              <IconX size={18} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-4 bg-zinc-900/60 border-b border-zinc-800 shrink-0 gap-1 overflow-x-auto">
          {[
            { id: 'overview', label: 'Visão Geral', icon: <IconNotes size={14} /> },
            { id: 'notes', label: 'Anotações', icon: <IconEdit size={14} /> },
            { id: 'readme', label: 'README.md', icon: <IconFileText size={14} /> },
            { id: 'git', label: 'Git Insights', icon: <IconGitPullRequest size={14} /> },
            { id: 'env', label: 'Variáveis .env', icon: <IconFileCode size={14} /> },
            { id: 'ports', label: `Portas (${activeProject.ports.length})`, icon: <IconWorld size={14} /> },
            { id: 'scripts', label: `Scripts (${activeProject.scripts.length})`, icon: <IconPlayerPlay size={14} /> },
            { id: 'ai', label: 'IA Assistente', icon: <IconBrain size={14} /> },
          ].map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-zinc-100 text-zinc-100 bg-zinc-900'
                  : 'border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
          {/* TAB 1: VISÃO GERAL */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column: Metadata summary */}
              <div className="space-y-4 md:border-r md:border-zinc-800 md:pr-6">
                <div className="space-y-3">
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Metadados</h3>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center justify-between text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <IconGitBranch size={14} /> Branch Atual:
                      </span>
                      <span className="font-mono text-zinc-200">{activeProject.git_branch || 'Sem git'}</span>
                    </div>

                    <div className="flex items-center justify-between text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <IconCircleFilled size={10} className={activeProject.git_dirty ? 'text-zinc-400' : 'text-zinc-600'} />
                        Status Git:
                      </span>
                      <span className="text-zinc-200">{activeProject.git_dirty ? 'Alterações não salvas' : 'Sincronizado'}</span>
                    </div>

                    <div className="flex items-center justify-between text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <IconClock size={14} /> Última Modificação:
                      </span>
                      <span className="text-zinc-200">{formatRelativeTime(activeProject.last_modified)}</span>
                    </div>

                    <div className="flex items-center justify-between text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <IconDatabase size={14} /> Tamanho no Disco:
                      </span>
                      <span className="font-mono text-zinc-200">{formatBytes(activeProject.size_bytes)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-zinc-800">
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Tecnologias Detectadas</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {activeProject.tech_stack.map(tech => (
                      <span
                        key={tech}
                        className={`text-[11px] font-mono px-2 py-0.5 rounded border ${getTechColor(tech)}`}
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Editable fields */}
              <div className="md:col-span-2 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">Nome do Projeto</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-100 focus:outline-none focus:border-zinc-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">Descrição</label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Descrição breve do objetivo deste projeto..."
                    className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-100 focus:outline-none focus:border-zinc-600 resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">Status do Projeto</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-100 focus:outline-none focus:border-zinc-600 cursor-pointer"
                  >
                    <option value="active">Ativo (Em desenvolvimento)</option>
                    <option value="on_hold">Em Espera</option>
                    <option value="completed">Concluído</option>
                    <option value="archived">Arquivado</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">Tags Associadas</label>
                  <div className="flex flex-wrap gap-1.5 p-2 bg-zinc-900 border border-zinc-800 rounded max-h-28 overflow-y-auto">
                    {tags.map(tag => {
                      const isSelected = selectedTagIds.includes(tag.id);
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => {
                            setSelectedTagIds(prev =>
                              isSelected ? prev.filter(id => id !== tag.id) : [...prev, tag.id]
                            );
                          }}
                          className={`text-xs px-2.5 py-0.5 rounded border transition-colors ${
                            isSelected
                              ? 'bg-zinc-100 text-zinc-950 border-zinc-100 font-semibold'
                              : 'bg-zinc-850 text-zinc-400 border-zinc-750 hover:text-zinc-200'
                          }`}
                        >
                          #{tag.name}
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
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-zinc-100 rounded border border-zinc-800 text-xs font-medium transition-colors"
                  >
                    <IconTrash size={14} />
                    <span>Remover do Crescent</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveOverview}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 rounded text-xs font-semibold transition-colors shadow-sm"
                  >
                    {overviewSaved ? <IconCheck size={15} /> : <IconDeviceFloppy size={15} />}
                    <span>{overviewSaved ? 'Salvo!' : 'Salvar Alterações'}</span>
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
                  <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded p-0.5">
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
                    className={`w-full h-full min-h-[360px] p-3 bg-zinc-900 border border-zinc-800 rounded font-mono text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 resize-none ${
                      notesViewMode === 'edit' ? 'col-span-2' : ''
                    }`}
                  />
                )}

                {(notesViewMode === 'preview' || notesViewMode === 'split') && (
                  <div
                    className={`p-3 bg-zinc-900 border border-zinc-800 rounded overflow-y-auto prose-crescent min-h-[360px] ${
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
            <div className="p-4 bg-zinc-900 border border-zinc-800 rounded prose-crescent overflow-y-auto max-h-[500px]">
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

          {/* TAB 4: GIT INSIGHTS */}
          {activeTab === 'git' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-lg space-y-1">
                  <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">Branch Atual</span>
                  <div className="text-sm font-mono font-semibold text-zinc-100 flex items-center gap-1.5">
                    <IconGitBranch size={15} />
                    <span>{activeProject.git_branch || 'Sem Git'}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-lg space-y-1">
                  <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">Arquivos Modificados</span>
                  <div className="text-sm font-mono font-semibold text-zinc-100 flex items-center gap-1.5">
                    <IconCircleFilled size={10} className={activeProject.git_dirty ? 'text-zinc-300' : 'text-zinc-600'} />
                    <span>{activeProject.git_dirty ? 'Mudanças pendentes' : 'Árvore Limpa'}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-lg space-y-1">
                  <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">Sincronização Remota</span>
                  <div className="text-sm font-mono font-semibold text-zinc-100 flex items-center gap-1.5">
                    <IconGitPullRequest size={15} />
                    <span>Local</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Últimos Commits</h4>
                {gitLoading ? (
                  <div className="py-8 text-center text-xs text-zinc-500">Lendo histórico do repositório...</div>
                ) : recentCommits.length === 0 ? (
                  <div className="py-8 text-center text-xs text-zinc-500 bg-zinc-900 border border-zinc-800 rounded">
                    Nenhum commit encontrado no repositório.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {recentCommits.map(c => (
                      <div
                        key={c.hash}
                        className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <IconGitCommit size={16} className="text-zinc-500 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-medium text-zinc-200 truncate">{c.message}</p>
                            <p className="text-[11px] text-zinc-500 font-mono">
                              {c.author} • {c.relative_time}
                            </p>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 bg-zinc-850 border border-zinc-700 rounded font-mono text-[11px] text-zinc-300 shrink-0">
                          {c.short_hash}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: VARIÁVEIS .ENV */}
          {activeTab === 'env' && (
            <div className="space-y-4">
              {envLoading && (
                <div className="text-center py-6 text-xs text-zinc-500">Inspecionando arquivos .env...</div>
              )}
              {envMsg && (
                <div className="p-3 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-200 flex items-center justify-between">
                  <span>{envMsg}</span>
                  <button type="button" onClick={() => setEnvMsg(null)} className="text-zinc-500 hover:text-zinc-300">
                    <IconX size={14} />
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-lg space-y-1">
                  <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">Arquivo .env</span>
                  <div className="text-xs font-mono text-zinc-200">
                    {envInfo?.has_env ? 'Presente' : 'Ausente'}
                  </div>
                </div>

                <div className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-lg space-y-1">
                  <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">Template .env.example</span>
                  <div className="text-xs font-mono text-zinc-200">
                    {envInfo?.has_example ? 'Presente' : 'Não encontrado'}
                  </div>
                </div>

                <div className="p-3.5 bg-zinc-900 border border-zinc-800 rounded-lg space-y-1">
                  <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-semibold">Variáveis Faltantes</span>
                  <div className="text-xs font-mono text-zinc-200">
                    {envInfo?.missing_keys.length || 0} variável(is)
                  </div>
                </div>
              </div>

              {envInfo?.has_example && !envInfo?.has_env && (
                <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-semibold text-zinc-200">Criar arquivo .env local</h4>
                    <p className="text-xs text-zinc-400">Copiar automaticamente todas as chaves do .env.example para um novo .env.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleGenerateEnv}
                    className="px-3 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 rounded text-xs font-semibold transition-colors"
                  >
                    Gerar .env
                  </button>
                </div>
              )}

              {envInfo?.missing_keys && envInfo.missing_keys.length > 0 && (
                <div className="p-3 bg-zinc-900 border border-zinc-700 rounded-lg space-y-2">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-300 font-semibold">
                    <IconAlertTriangle size={14} />
                    <span>Variáveis em .env.example que não estão no seu .env:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {envInfo.missing_keys.map(k => (
                      <span key={k} className="px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded font-mono text-[11px] text-zinc-200">
                        {k}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {envInfo?.env_example_content && (
                <div className="space-y-1.5">
                  <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Conteúdo do .env.example</h4>
                  <pre className="p-3 bg-zinc-900 border border-zinc-800 rounded text-xs font-mono text-zinc-300 overflow-x-auto">
                    {envInfo.env_example_content}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: PORTAS LOCAIS */}
          {activeTab === 'ports' && (
            <div className="space-y-4">
              <form onSubmit={handleAddPort} className="p-3 bg-zinc-900 border border-zinc-800 rounded flex items-center gap-3">
                <div className="w-32">
                  <label className="block text-[11px] text-zinc-400 mb-1">Porta (ex: 3000)</label>
                  <input
                    type="number"
                    value={newPort}
                    onChange={e => setNewPort(e.target.value)}
                    placeholder="3000"
                    className="w-full px-2.5 py-1 bg-zinc-950 border border-zinc-800 rounded text-xs text-zinc-100 focus:outline-none focus:border-zinc-600 font-mono"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[11px] text-zinc-400 mb-1">Descrição / Serviço</label>
                  <input
                    type="text"
                    value={newPortDesc}
                    onChange={e => setNewPortDesc(e.target.value)}
                    placeholder="Frontend Vite / Backend API..."
                    className="w-full px-2.5 py-1 bg-zinc-950 border border-zinc-800 rounded text-xs text-zinc-100 focus:outline-none focus:border-zinc-600"
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
                  <div className="text-center py-8 text-zinc-500 text-xs bg-zinc-900 border border-zinc-800 rounded">
                    Nenhuma porta registrada para este projeto.
                  </div>
                ) : (
                  activeProject.ports.map(p => {
                    const statusInfo = portStatuses[p.port];
                    const isActive = statusInfo?.is_active;

                    return (
                      <div
                        key={p.id}
                        className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2.5 py-1 bg-zinc-850 border border-zinc-700 rounded text-zinc-100 font-mono text-xs font-semibold">
                              :{p.port}
                            </span>
                            {isActive ? (
                              <span className="px-2 py-0.5 rounded text-[10px] bg-zinc-800 text-zinc-200 border border-zinc-700 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                                <span>Ativo {statusInfo.process_name ? `(${statusInfo.process_name})` : ''}</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] text-zinc-500 font-mono">
                                Inativo
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-zinc-300">
                            {p.description || `Serviço local na porta ${p.port}`}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {isActive && (
                            <button
                              type="button"
                              onClick={() => handleKillPort(p.port)}
                              disabled={killingPort === p.port}
                              className="flex items-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded text-xs border border-zinc-700 transition-colors"
                              title="Encerrar processo travando a porta"
                            >
                              <IconSquareLetterX size={13} />
                              <span>{killingPort === p.port ? 'Encerrando...' : 'Liberar Porta'}</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => api.openUrl(`http://localhost:${p.port}`)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs border border-zinc-700 transition-colors"
                          >
                            <IconExternalLink size={13} />
                            <span>Abrir</span>
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
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 7: SCRIPTS RÁPIDOS */}
          {activeTab === 'scripts' && (
            <div className="space-y-4">
              <form onSubmit={handleAddScript} className="p-3 bg-zinc-900 border border-zinc-800 rounded flex items-center gap-3">
                <div className="w-48">
                  <label className="block text-[11px] text-zinc-400 mb-1">Nome do Script</label>
                  <input
                    type="text"
                    value={newScriptName}
                    onChange={e => setNewScriptName(e.target.value)}
                    placeholder="Dev Server"
                    className="w-full px-2.5 py-1 bg-zinc-950 border border-zinc-800 rounded text-xs text-zinc-100 focus:outline-none focus:border-zinc-600"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[11px] text-zinc-400 mb-1">Comando (executado na raiz)</label>
                  <input
                    type="text"
                    value={newScriptCmd}
                    onChange={e => setNewScriptCmd(e.target.value)}
                    placeholder="npm run dev / cargo check / pytest"
                    className="w-full px-2.5 py-1 bg-zinc-950 border border-zinc-800 rounded text-xs text-zinc-100 focus:outline-none focus:border-zinc-600 font-mono"
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
                  <div className="text-center py-8 text-zinc-500 text-xs bg-zinc-900 border border-zinc-800 rounded">
                    Nenhum script pré-configurado para este projeto.
                  </div>
                ) : (
                  activeProject.scripts.map(s => (
                    <div
                      key={s.id}
                      className="p-3 bg-zinc-900 border border-zinc-800 rounded flex items-center justify-between gap-3"
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
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded space-y-2">
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

          {/* TAB 8: IA ASSISTENTE */}
          {activeTab === 'ai' && (
            <div className="space-y-4">
              <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold text-zinc-100">
                    <IconBrain size={16} className="text-zinc-100" />
                    <span>Crescent AI Contextualizado: {activeProject.name}</span>
                  </div>
                  <p className="text-xs text-zinc-400">
                    O assistente tem acesso direto aos manifestos, notas, portas e README deste repositório via RAG local.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAiActiveProjectId(activeProject.id);
                    setIsAiChatOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-100 hover:bg-white text-zinc-950 rounded text-xs font-semibold shadow-sm transition-colors"
                >
                  <IconSparkles size={14} />
                  <span>Abrir Chat com IA</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  {
                    title: 'Auditar Segurança & Dependências',
                    desc: 'Analisa o manifesto do projeto para encontrar versões desatualizadas ou problemas.',
                  },
                  {
                    title: 'Gerar Scripts de Deploy / CI/CD',
                    desc: 'Cria workflows de GitHub Actions ou Dockerfile adaptados à stack do projeto.',
                  },
                  {
                    title: 'Explicar Arquitetura & Fluxo',
                    desc: 'Resume a estrutura do projeto e pontos de entrada do código.',
                  },
                  {
                    title: 'Otimizar Performance & Build',
                    desc: 'Sugere flags de compilação, linkers rápidos e técnicas de bundle splitting.',
                  },
                ].map(card => (
                  <div
                    key={card.title}
                    onClick={() => {
                      setAiActiveProjectId(activeProject.id);
                      setIsAiChatOpen(true);
                    }}
                    className="p-3.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 rounded-lg cursor-pointer transition-colors space-y-1"
                  >
                    <div className="text-xs font-semibold text-zinc-200">{card.title} →</div>
                    <div className="text-[11px] text-zinc-400">{card.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
