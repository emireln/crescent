import React, { useState, useEffect } from 'react';
import {
  IconX,
  IconFolder,
  IconFolderPlus,
  IconGitBranch,
  IconSparkles,
  IconTemplate,
  IconPlayerPlay,
  IconCheck,
} from '@tabler/icons-react';
import { useProjects } from '../../context/ProjectContext';
import { api } from '../../services/api';
import { ProjectTemplate } from '../../types';
import { getTechColor } from '../../utils/formatters';
import { CustomSelect } from '../common/CustomSelect';

type Mode = 'existing' | 'template';

export const NewProjectModal: React.FC = () => {
  const { isNewProjectOpen, setIsNewProjectOpen, createProject, tags } = useProjects();

  const [mode, setMode] = useState<Mode>('existing');

  // Existing Folder States
  const [path, setPath] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [primaryTech, setPrimaryTech] = useState('Outro');
  const [techStack, setTechStack] = useState<string[]>([]);
  const [status, setStatus] = useState('active');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [ports, setPorts] = useState<number[]>([]);
  const [newPortInput, setNewPortInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [gitBranch, setGitBranch] = useState<string | null>(null);

  // Template Scaffolder States
  const [templates, setTemplates] = useState<ProjectTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('vite-react-ts');
  const [parentFolder, setParentFolder] = useState<string>('');
  const [newProjectName, setNewProjectName] = useState<string>('meu-novo-projeto');
  const [isScaffolding, setIsScaffolding] = useState<boolean>(false);
  const [scaffoldError, setScaffoldError] = useState<string>('');

  useEffect(() => {
    if (isNewProjectOpen) {
      api.getTemplates()
        .then(t => {
          setTemplates(t);
          if (t.length > 0) setSelectedTemplateId(t[0].id);
        })
        .catch(console.error);
    }
  }, [isNewProjectOpen]);

  if (!isNewProjectOpen) return null;

  const handleSelectFolder = async () => {
    try {
      const selected = await api.pickDirectory();
      if (!selected) return;

      setPath(selected);
      setIsAnalyzing(true);

      const info = await api.analyzeDirectory(selected);
      if (info) {
        setName(info.name);
        setPrimaryTech(info.primary_tech);
        setTechStack(info.tech_stack);
        if (info.git.is_repo && info.git.branch) {
          setGitBranch(info.git.branch);
        }
      } else {
        const folderName = selected.split(/[/\\]/).filter(Boolean).pop() || 'Novo Projeto';
        setName(folderName);
      }
    } catch (err) {
      console.error('Erro ao selecionar pasta:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSelectParentFolder = async () => {
    try {
      const selected = await api.pickDirectory();
      if (selected) setParentFolder(selected);
    } catch (err) {
      console.error('Erro ao selecionar diretório pai:', err);
    }
  };

  const handleAddPort = () => {
    const p = parseInt(newPortInput, 10);
    if (!isNaN(p) && p > 0 && !ports.includes(p)) {
      setPorts([...ports, p]);
      setNewPortInput('');
    }
  };

  const handleRemovePort = (p: number) => {
    setPorts(ports.filter(item => item !== p));
  };

  const handleSubmitExisting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!path.trim() || !name.trim()) return;

    try {
      await createProject({
        name: name.trim(),
        path: path.trim(),
        description: description.trim(),
        primary_tech: primaryTech,
        tech_stack: techStack.length > 0 ? techStack : [primaryTech],
        status,
        tag_ids: selectedTagIds,
        ports: ports.length > 0 ? ports : undefined,
      });

      setIsNewProjectOpen(false);
      resetForm();
    } catch (err) {
      console.error('Erro ao cadastrar projeto:', err);
    }
  };

  const handleScaffoldTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentFolder.trim() || !newProjectName.trim()) {
      setScaffoldError('Informe o diretório pai e o nome do projeto.');
      return;
    }

    setIsScaffolding(true);
    setScaffoldError('');

    try {
      const createdPath = await api.scaffoldNewProject(selectedTemplateId, parentFolder, newProjectName.trim());
      const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

      await createProject({
        name: newProjectName.trim(),
        path: createdPath,
        description: selectedTemplate?.description || '',
        primary_tech: selectedTemplate?.primary_tech || 'Outro',
        tech_stack: selectedTemplate?.tech_stack || [],
        status: 'active',
      });

      setIsNewProjectOpen(false);
      resetForm();
    } catch (err: any) {
      setScaffoldError(err?.message || String(err));
    } finally {
      setIsScaffolding(false);
    }
  };

  const resetForm = () => {
    setPath('');
    setName('');
    setDescription('');
    setPrimaryTech('Outro');
    setTechStack([]);
    setSelectedTagIds([]);
    setPorts([]);
    setParentFolder('');
    setNewProjectName('meu-novo-projeto');
    setScaffoldError('');
  };

  return (
    <div className="fixed top-11 inset-x-0 bottom-0 z-40 flex items-center justify-center bg-black/75 p-4 select-none animate-in fade-in duration-150">
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-zinc-100 font-semibold text-sm">
            <IconFolderPlus size={18} className="text-zinc-100" />
            <span>Adicionar Projeto ao Crescent</span>
          </div>
          <button
            type="button"
            onClick={() => setIsNewProjectOpen(false)}
            className="p-1 text-zinc-400 hover:text-white rounded"
          >
            <IconX size={16} />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center px-4 bg-zinc-900/60 border-b border-zinc-800 gap-2">
          <button
            type="button"
            onClick={() => setMode('existing')}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              mode === 'existing'
                ? 'border-zinc-100 text-zinc-100 bg-zinc-900'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <IconFolder size={14} />
            <span>Importar Pasta Local</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('template')}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              mode === 'template'
                ? 'border-zinc-100 text-zinc-100 bg-zinc-900'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <IconTemplate size={14} />
            <span>Criar a partir de Template</span>
          </button>
        </div>

        {/* TAB 1: EXISTING FOLDER FORM */}
        {mode === 'existing' && (
          <form onSubmit={handleSubmitExisting} className="p-5 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
            {/* Path Picker */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Caminho do Projeto no Disco *
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={path}
                  onChange={e => setPath(e.target.value)}
                  placeholder="C:\Users\...\projetos\meu-app"
                  required
                  className="flex-1 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 font-mono placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
                />
                <button
                  type="button"
                  onClick={handleSelectFolder}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 rounded-md text-xs font-medium transition-colors shrink-0 cursor-pointer"
                >
                  <IconFolder size={14} />
                  <span>Selecionar Pasta</span>
                </button>
              </div>
              {isAnalyzing && (
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-300 mt-1.5 animate-pulse">
                  <IconSparkles size={13} />
                  <span>Analisando diretório e detectando stack tecnológica...</span>
                </div>
              )}
            </div>

            {/* Name & Primary Tech */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Nome do Projeto *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: Crescent"
                  required
                  className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 focus:outline-none focus:border-zinc-600 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Tecnologia Principal
                </label>
                <input
                  type="text"
                  value={primaryTech}
                  onChange={e => setPrimaryTech(e.target.value)}
                  placeholder="Ex: React, Rust, Python, Go..."
                  className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 focus:outline-none focus:border-zinc-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Status Inicial
                </label>
                <CustomSelect
                  value={status}
                  onChange={v => setStatus(v)}
                  options={[
                    { value: 'active', label: 'Ativo' },
                    { value: 'on_hold', label: 'Em Espera' },
                    { value: 'completed', label: 'Concluído' },
                    { value: 'archived', label: 'Arquivado' },
                  ]}
                  className="w-full"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Descrição (Opcional)
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Objetivo principal, links rápidos ou notas..."
                className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-600 resize-none"
              />
            </div>

            {/* Detected Stacks Preview */}
            {techStack.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Stack Detectada
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {techStack.map(t => (
                    <span
                      key={t}
                      className={`text-xs font-mono px-2 py-0.5 rounded border ${getTechColor(t)}`}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Git Branch Info */}
            {gitBranch && (
              <div className="flex items-center gap-2 p-2 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-300 font-mono">
                <IconGitBranch size={14} className="text-zinc-400" />
                <span>Repositório Git detectado na branch: <strong>{gitBranch}</strong></span>
              </div>
            )}

            {/* Tags */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Tags
              </label>
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
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors cursor-pointer ${
                        isAssigned
                          ? 'bg-zinc-100 text-zinc-950 font-semibold'
                          : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: t.color || '#a1a1aa' }} />
                      <span>#{t.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ports Tracker */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Portas Locais Usadas (Ex: 3000, 5173)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={newPortInput}
                  onChange={e => setNewPortInput(e.target.value)}
                  placeholder="3000"
                  className="w-28 px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 font-mono focus:outline-none focus:border-zinc-600"
                />
                <button
                  type="button"
                  onClick={handleAddPort}
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 rounded text-xs font-medium"
                >
                  Adicionar Porta
                </button>
              </div>
              {ports.length > 0 && (
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {ports.map(p => (
                    <span
                      key={p}
                      className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-zinc-850 border border-zinc-700 text-zinc-200 rounded font-mono text-xs"
                    >
                      :{p}
                      <button
                        type="button"
                        onClick={() => handleRemovePort(p)}
                        className="text-zinc-400 hover:text-white"
                      >
                        <IconX size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsNewProjectOpen(false)}
                className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!path || !name}
                className="px-4 py-1.5 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-40 text-zinc-950 rounded text-xs font-medium shadow-sm transition-colors cursor-pointer"
              >
                Cadastrar Projeto
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: SCAFFOLD FROM TEMPLATE FORM */}
        {mode === 'template' && (
          <form onSubmit={handleScaffoldTemplate} className="p-5 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
            {scaffoldError && (
              <div className="p-3 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-200">
                {scaffoldError}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-xs font-medium text-zinc-300">
                Escolha o Boilerplate / Template *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {templates.map(t => {
                  const isSelected = selectedTemplateId === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTemplateId(t.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors space-y-1.5 ${
                        isSelected
                          ? 'bg-zinc-850 border-zinc-600'
                          : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-zinc-100">{t.name}</span>
                        {isSelected && <IconCheck size={14} className="text-zinc-200" />}
                      </div>
                      <p className="text-[11px] text-zinc-400 line-clamp-2">{t.description}</p>
                      <div className="flex items-center gap-1 flex-wrap pt-1">
                        {t.tech_stack.map(tech => (
                          <span key={tech} className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-800 border border-zinc-700 text-zinc-300">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Destination folder */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Pasta Onde Criar o Projeto *
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={parentFolder}
                  onChange={e => setParentFolder(e.target.value)}
                  placeholder="C:\Users\...\projetos"
                  required
                  className="flex-1 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 font-mono placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
                />
                <button
                  type="button"
                  onClick={handleSelectParentFolder}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 rounded text-xs font-medium transition-colors shrink-0"
                >
                  <IconFolder size={14} />
                  <span>Selecionar Pasta</span>
                </button>
              </div>
            </div>

            {/* New Project Name */}
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Nome da Pasta / Projeto *
              </label>
              <input
                type="text"
                value={newProjectName}
                onChange={e => setNewProjectName(e.target.value)}
                placeholder="meu-novo-app"
                required
                className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 font-mono focus:outline-none focus:border-zinc-600"
              />
              <p className="text-[11px] text-zinc-500 mt-1">
                O projeto será criado em: <code className="text-zinc-400 font-mono">{parentFolder ? `${parentFolder}\\${newProjectName}` : `[Pasta]\\${newProjectName}`}</code>
              </p>
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsNewProjectOpen(false)}
                className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!parentFolder || !newProjectName || isScaffolding}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-40 text-zinc-950 rounded text-xs font-medium shadow-sm transition-colors cursor-pointer"
              >
                <IconPlayerPlay size={14} />
                <span>{isScaffolding ? 'Gerando Projeto...' : 'Criar & Importar Projeto'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
