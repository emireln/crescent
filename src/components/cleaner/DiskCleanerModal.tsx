import React, { useState, useEffect, useMemo } from 'react';
import {
  IconX,
  IconTrash,
  IconRefresh,
  IconCheck,
  IconAlertTriangle,
  IconFolder,
  IconSparkles,
  IconDatabase,
} from '@tabler/icons-react';
import { useProjects } from '../../context/ProjectContext';
import { api } from '../../services/api';
import { ProjectCleanableInfo, CleanResult } from '../../types';
import { formatBytes } from '../../utils/formatters';

export const DiskCleanerModal: React.FC = () => {
  const { isDiskCleanerOpen, setIsDiskCleanerOpen, projects } = useProjects();

  const [loading, setLoading] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [cleanableProjects, setCleanableProjects] = useState<ProjectCleanableInfo[]>([]);
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [cleanResult, setCleanResult] = useState<CleanResult | null>(null);

  const scanAllProjects = async () => {
    setLoading(true);
    setCleanResult(null);
    try {
      const results: ProjectCleanableInfo[] = [];
      for (const p of projects) {
        if (p.exists_on_disk) {
          const info = await api.analyzeCleanable(p.id, p.name, p.path);
          if (info.items.length > 0) {
            results.push(info);
          }
        }
      }
      setCleanableProjects(results);

      // Select all by default
      const allPaths = new Set<string>();
      for (const r of results) {
        for (const it of r.items) {
          allPaths.add(it.full_path);
        }
      }
      setSelectedPaths(allPaths);
    } catch (e) {
      console.error('Erro ao analisar espaço em disco:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isDiskCleanerOpen) {
      scanAllProjects();
    }
  }, [isDiskCleanerOpen]);

  const totalSelectedBytes = useMemo(() => {
    let sum = 0;
    for (const p of cleanableProjects) {
      for (const it of p.items) {
        if (selectedPaths.has(it.full_path)) {
          sum += it.size_bytes;
        }
      }
    }
    return sum;
  }, [cleanableProjects, selectedPaths]);

  const togglePath = (path: string) => {
    setSelectedPaths(prev => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const toggleProject = (project: ProjectCleanableInfo) => {
    setSelectedPaths(prev => {
      const next = new Set(prev);
      const allSelected = project.items.every(it => next.has(it.full_path));
      for (const it of project.items) {
        if (allSelected) next.delete(it.full_path);
        else next.add(it.full_path);
      }
      return next;
    });
  };

  const handleCleanSelected = async () => {
    if (selectedPaths.size === 0) return;
    setCleaning(true);
    try {
      const res = await api.cleanProjectTargets(Array.from(selectedPaths));
      setCleanResult(res);
      await scanAllProjects();
    } catch (e) {
      console.error('Erro ao limpar arquivos:', e);
    } finally {
      setCleaning(false);
    }
  };

  if (!isDiskCleanerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 select-none animate-in fade-in duration-150">
      <div className="w-full max-w-3xl max-h-[85vh] bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-zinc-800 rounded text-zinc-100 border border-zinc-700">
              <IconDatabase size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-zinc-100">Limpador de Disco & Dependências</h2>
              <p className="text-xs text-zinc-400">
                Remova pastas pesadas (`node_modules`, `target/`, `.venv`) de projetos inativos com segurança
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsDiskCleanerOpen(false)}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded transition-colors"
          >
            <IconX size={18} />
          </button>
        </div>

        {/* Action Summary Bar */}
        <div className="flex items-center justify-between px-6 py-3 bg-zinc-900 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={scanAllProjects}
              disabled={loading || cleaning}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 rounded text-xs transition-colors disabled:opacity-50"
            >
              <IconRefresh size={13} className={loading ? 'animate-spin' : ''} />
              <span>Reanalisar</span>
            </button>

            <span className="text-xs text-zinc-400">
              Espaço selecionado para liberação:{' '}
              <strong className="text-zinc-100 font-mono text-sm">{formatBytes(totalSelectedBytes)}</strong>
            </span>
          </div>

          <button
            type="button"
            onClick={handleCleanSelected}
            disabled={selectedPaths.size === 0 || cleaning || loading}
            className="flex items-center gap-2 px-4 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 font-semibold rounded text-xs transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cleaning ? (
              <IconRefresh size={14} className="animate-spin" />
            ) : (
              <IconTrash size={14} />
            )}
            <span>Liberar {formatBytes(totalSelectedBytes)}</span>
          </button>
        </div>

        {/* Clean Result Alert */}
        {cleanResult && (
          <div className="mx-6 mt-4 p-3 bg-zinc-900 border border-zinc-700 rounded text-xs flex items-center justify-between">
            <div className="flex items-center gap-2 text-zinc-200">
              <IconCheck size={16} className="text-zinc-400" />
              <span>
                Limpeza concluída! <strong>{formatBytes(cleanResult.bytes_freed)}</strong> liberados com sucesso em {cleanResult.cleaned_count} itens.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setCleanResult(null)}
              className="text-zinc-500 hover:text-zinc-300"
            >
              <IconX size={14} />
            </button>
          </div>
        )}

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <IconRefresh size={28} className="mx-auto text-zinc-500 animate-spin" />
              <p className="text-xs text-zinc-400">Calculando tamanho das pastas de compilação em todos os projetos...</p>
            </div>
          ) : cleanableProjects.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <IconSparkles size={32} className="mx-auto text-zinc-600" />
              <p className="text-sm font-medium text-zinc-300">Disco 100% otimizado!</p>
              <p className="text-xs text-zinc-500">Nenhuma pasta de build ou dependência pesada desnecessária encontrada.</p>
            </div>
          ) : (
            cleanableProjects.map(project => {
              const allSelected = project.items.every(it => selectedPaths.has(it.full_path));
              const someSelected = project.items.some(it => selectedPaths.has(it.full_path));

              return (
                <div key={project.project_id} className="bg-zinc-900/60 border border-zinc-800 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={el => {
                          if (el) el.indeterminate = someSelected && !allSelected;
                        }}
                        onChange={() => toggleProject(project)}
                        className="rounded border-zinc-700 bg-zinc-800 text-zinc-100 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                      />
                      <div className="flex items-center gap-1.5 font-medium text-sm text-zinc-200">
                        <IconFolder size={15} className="text-zinc-500" />
                        <span>{project.project_name}</span>
                      </div>
                      <span className="text-[11px] text-zinc-500 font-mono truncate max-w-sm">
                        {project.project_path}
                      </span>
                    </div>

                    <span className="text-xs font-mono text-zinc-400 font-semibold">
                      {formatBytes(project.total_cleanable_bytes)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-6">
                    {project.items.map(item => {
                      const isChecked = selectedPaths.has(item.full_path);
                      return (
                        <label
                          key={item.full_path}
                          className={`flex items-center justify-between p-2 rounded border text-xs cursor-pointer transition-colors ${
                            isChecked
                              ? 'bg-zinc-800/80 border-zinc-700 text-zinc-200'
                              : 'bg-zinc-900/40 border-zinc-850 text-zinc-400 hover:border-zinc-750'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => togglePath(item.full_path)}
                              className="rounded border-zinc-700 bg-zinc-800 text-zinc-100 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                            />
                            <span className="font-mono text-[11px] truncate">{item.relative_path}</span>
                          </div>
                          <span className="font-mono text-[11px] text-zinc-400 font-medium shrink-0 ml-2">
                            {formatBytes(item.size_bytes)}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-zinc-800 bg-zinc-900/50 flex items-center justify-between text-xs text-zinc-500">
          <div className="flex items-center gap-1.5">
            <IconAlertTriangle size={13} className="text-zinc-500" />
            <span>Pastas apagadas serão recriadas automaticamente quando você rodar `npm i` ou `cargo build`.</span>
          </div>
          <button
            type="button"
            onClick={() => setIsDiskCleanerOpen(false)}
            className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 rounded text-xs transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
