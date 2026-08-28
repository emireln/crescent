import React, { useState } from 'react';
import {
  IconX,
  IconFolder,
  IconFolderPlus,
  IconGitBranch,
  IconSparkles,
} from '@tabler/icons-react';
import { useProjects } from '../../context/ProjectContext';
import { api } from '../../services/api';
import { getTechColor } from '../../utils/formatters';

export const NewProjectModal: React.FC = () => {
  const { isNewProjectOpen, setIsNewProjectOpen, createProject, tags } = useProjects();

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

  const handleSubmit = async (e: React.FormEvent) => {
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
      // Reset form
      setPath('');
      setName('');
      setDescription('');
      setPrimaryTech('Outro');
      setTechStack([]);
      setSelectedTagIds([]);
      setPorts([]);
    } catch (err) {
      console.error('Erro ao cadastrar projeto:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-zinc-100 font-semibold text-sm">
            <IconFolderPlus size={18} className="text-zinc-100" />
            <span>Adicionar Novo Projeto</span>
          </div>
          <button
            type="button"
            onClick={() => setIsNewProjectOpen(false)}
            className="p-1 text-zinc-400 hover:text-white rounded"
          >
            <IconX size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Path Picker */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Caminho do Projeto no Disco
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={path}
                onChange={e => setPath(e.target.value)}
                placeholder="C:\Users\...\projetos\meu-app"
                required
                className="flex-1 px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-xs text-zinc-200 font-mono placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
              />
              <button
                type="button"
                onClick={handleSelectFolder}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 rounded text-xs font-medium transition-colors shrink-0"
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
                Nome do Projeto
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: Crescent"
                required
                className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-xs text-zinc-200 focus:outline-none focus:border-zinc-600 font-medium"
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
                className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-xs text-zinc-200 focus:outline-none focus:border-zinc-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Status Inicial
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value)}
                className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-xs text-zinc-200 focus:outline-none focus:border-zinc-600"
              >
                <option value="active">Ativo</option>
                <option value="on_hold">Em Espera</option>
                <option value="completed">Concluído</option>
                <option value="archived">Arquivado</option>
              </select>
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
              placeholder="Objetivo principal, links rápidos ou notas rápidas..."
              className="w-full px-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-600"
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

          {/* Git Branch Info if detected */}
          {gitBranch && (
            <div className="flex items-center gap-2 p-2 bg-zinc-950 border border-zinc-800 rounded text-xs text-zinc-300 font-mono">
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
                    className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs border transition-colors ${
                      isAssigned
                        ? 'bg-zinc-800 text-zinc-100 border-zinc-600 font-medium'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <span className="text-zinc-500 font-mono">#</span>
                    <span>{t.name}</span>
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
                className="w-28 px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded text-xs text-zinc-200 font-mono focus:outline-none focus:border-zinc-600"
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
              className="px-4 py-1.5 bg-zinc-100 hover:bg-white disabled:opacity-40 text-zinc-950 rounded text-xs font-semibold shadow-sm transition-colors"
            >
              Cadastrar Projeto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
