import React, { useState } from 'react';
import {
  IconX,
  IconScan,
  IconFolder,
  IconFolderPlus,
  IconGitBranch,
  IconCircleFilled,
  IconLoader2,
  IconSparkles,
  IconInfoCircle,
} from '@tabler/icons-react';
import { useProjects } from '../../context/ProjectContext';
import { DiscoveredProject } from '../../types';
import { api } from '../../services/api';
import { formatBytes, formatRelativeTime, getTechColor } from '../../utils/formatters';

export const ScannerModal: React.FC = () => {
  const { isScannerOpen, setIsScannerOpen, batchImportProjects, settings } = useProjects();

  const [rootPath, setRootPath] = useState('');
  const [maxDepth, setMaxDepth] = useState(4);
  const [isScanning, setIsScanning] = useState(false);
  const [results, setResults] = useState<DiscoveredProject[]>([]);
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [hasScanned, setHasScanned] = useState(false);

  if (!isScannerOpen) return null;

  const handleSelectRoot = async () => {
    try {
      const selected = await api.pickDirectory();
      if (selected) {
        setRootPath(selected);
      }
    } catch (err) {
      console.error('Erro ao escolher pasta raiz:', err);
    }
  };

  const handleStartScan = async () => {
    if (!rootPath.trim()) return;
    setIsScanning(true);
    setHasScanned(false);
    try {
      const ignoreArr = settings.scan_ignore.split(',').map(s => s.trim()).filter(Boolean);
      const discovered = await api.scanDirectory({
        root_path: rootPath.trim(),
        max_depth: maxDepth,
        ignore_patterns: ignoreArr,
      });

      setResults(discovered);
      // Auto-select all new projects (exclude existing)
      const newPaths = new Set(
        discovered.filter(d => !d.is_existing).map(d => d.path)
      );
      setSelectedPaths(newPaths);
      setHasScanned(true);
    } catch (err) {
      console.error('Erro durante a varredura:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const toggleSelectAll = () => {
    const newItems = results.filter(r => !r.is_existing);
    if (selectedPaths.size === newItems.length) {
      setSelectedPaths(new Set());
    } else {
      setSelectedPaths(new Set(newItems.map(d => d.path)));
    }
  };

  const toggleSelectPath = (path: string) => {
    const next = new Set(selectedPaths);
    if (next.has(path)) next.delete(path);
    else next.add(path);
    setSelectedPaths(next);
  };

  const handleBatchImport = async () => {
    const toImport = results.filter(r => selectedPaths.has(r.path));
    if (toImport.length === 0) return;
    try {
      await batchImportProjects(toImport);
      setIsScannerOpen(false);
    } catch (err) {
      console.error('Erro ao importar projetos:', err);
    }
  };

  const newProjectsCount = results.filter(r => !r.is_existing).length;
  const existingProjectsCount = results.filter(r => r.is_existing).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-zinc-100 font-semibold text-sm">
            <IconScan size={18} className="text-zinc-100" />
            <span>Varredura Automática</span>
          </div>
          <button
            type="button"
            onClick={() => setIsScannerOpen(false)}
            className="p-1 text-zinc-400 hover:text-white rounded"
          >
            <IconX size={16} />
          </button>
        </div>

        {/* Scan Config Bar */}
        <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center gap-3 shrink-0 flex-wrap">
          <div className="flex-1 min-w-[260px]">
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">
              Diretório Raiz
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={rootPath}
                onChange={e => setRootPath(e.target.value)}
                placeholder="Ex: C:\Projetos ou D:\Dev"
                className="flex-1 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 font-mono focus:outline-none focus:border-zinc-600"
              />
              <button
                type="button"
                onClick={handleSelectRoot}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded text-xs border border-zinc-700 font-medium shrink-0"
              >
                <IconFolder size={14} />
                <span>Escolher Pasta</span>
              </button>
            </div>
          </div>

          <div className="w-28">
            <label className="block text-[11px] font-medium text-zinc-400 mb-1">
              Profundidade
            </label>
            <select
              value={maxDepth}
              onChange={e => setMaxDepth(parseInt(e.target.value, 10))}
              className="w-full px-2.5 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 focus:outline-none focus:border-zinc-600 font-medium"
            >
              <option value={2}>2 níveis</option>
              <option value={3}>3 níveis</option>
              <option value={4}>4 níveis</option>
              <option value={5}>5 níveis</option>
              <option value={6}>6 níveis</option>
            </select>
          </div>

          <div className="pt-5">
            <button
              type="button"
              onClick={handleStartScan}
              disabled={isScanning || !rootPath.trim()}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-zinc-100 hover:bg-white disabled:opacity-40 text-zinc-950 rounded text-xs font-semibold transition-colors shadow-sm"
            >
              {isScanning ? (
                <>
                  <IconLoader2 size={14} className="animate-spin" />
                  <span>Varrendo...</span>
                </>
              ) : (
                <>
                  <IconSparkles size={14} />
                  <span>Escanear</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {hasScanned && (
            <div className="flex items-center justify-between text-xs text-zinc-400 pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <span>
                  Encontrados: <strong className="text-zinc-100">{results.length}</strong>
                </span>
                <span>•</span>
                <span className="text-zinc-200">
                  <strong>{newProjectsCount}</strong> novos
                </span>
                {existingProjectsCount > 0 && (
                  <>
                    <span>•</span>
                    <span className="text-zinc-500">
                      <strong>{existingProjectsCount}</strong> já cadastrados
                    </span>
                  </>
                )}
              </div>

              {newProjectsCount > 0 && (
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-xs text-zinc-200 hover:text-white font-medium underline"
                >
                  {selectedPaths.size === newProjectsCount ? 'Desmarcar Todos' : 'Selecionar Novos'}
                </button>
              )}
            </div>
          )}

          {!hasScanned && !isScanning && (
            <div className="py-16 text-center text-zinc-500 text-xs flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400">
                <IconScan size={20} />
              </div>
              <p className="max-w-sm text-zinc-400">
                Selecione a pasta onde ficam seus projetos para detectar repositórios e tecnologias automaticamente.
              </p>
            </div>
          )}

          {isScanning && (
            <div className="py-16 text-center text-zinc-400 text-xs flex flex-col items-center gap-3">
              <IconLoader2 size={24} className="animate-spin text-zinc-200" />
              <span>Analisando diretórios e dependências...</span>
            </div>
          )}

          {hasScanned && results.length === 0 && (
            <div className="py-12 text-center text-zinc-500 text-xs">
              Nenhum repositório ou projeto reconhecido foi encontrado neste diretório.
            </div>
          )}

          {hasScanned && results.length > 0 && (
            <div className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-zinc-900 border-b border-zinc-800 text-[11px] text-zinc-400 uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-3 w-8"></th>
                    <th className="py-2.5 px-3">Projeto</th>
                    <th className="py-2.5 px-3">Stack</th>
                    <th className="py-2.5 px-3">Git</th>
                    <th className="py-2.5 px-3">Tamanho</th>
                    <th className="py-2.5 px-3">Modificado</th>
                    <th className="py-2.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {results.map(proj => {
                    const isSelected = selectedPaths.has(proj.path);
                    return (
                      <tr
                        key={proj.path}
                        onClick={() => {
                          if (!proj.is_existing) toggleSelectPath(proj.path);
                        }}
                        className={`transition-colors ${
                          proj.is_existing
                            ? 'opacity-50 cursor-not-allowed bg-zinc-950/40'
                            : isSelected
                            ? 'bg-zinc-850 hover:bg-zinc-800 cursor-pointer'
                            : 'hover:bg-zinc-900 cursor-pointer'
                        }`}
                      >
                        <td className="py-2 px-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={proj.is_existing}
                            onChange={() => toggleSelectPath(proj.path)}
                            className="rounded border-zinc-700 text-zinc-100 focus:ring-0 bg-zinc-900 cursor-pointer"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex flex-col">
                            <span className="font-semibold text-zinc-100">{proj.name}</span>
                            <span className="text-[11px] font-mono text-zinc-500 truncate max-w-xs" title={proj.path}>
                              {proj.path}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded border ${getTechColor(
                              proj.primary_tech
                            )}`}
                          >
                            {proj.primary_tech}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          {proj.git.is_repo ? (
                            <div className="flex items-center gap-1 text-[11px] font-mono text-zinc-400">
                              <IconGitBranch size={12} />
                              <span>{proj.git.branch || 'git'}</span>
                              {proj.git.dirty && <IconCircleFilled size={5} className="text-zinc-100" />}
                            </div>
                          ) : (
                            <span className="text-zinc-600">—</span>
                          )}
                        </td>
                        <td className="py-2 px-3 font-mono text-zinc-400">
                          {proj.size_bytes > 0 ? formatBytes(proj.size_bytes) : '—'}
                        </td>
                        <td className="py-2 px-3 text-zinc-400">
                          {formatRelativeTime(proj.last_modified)}
                        </td>
                        <td className="py-2 px-3 text-right">
                          {proj.is_existing ? (
                            <span className="text-[10px] font-medium text-zinc-500 px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800">
                              Já Cadastrado
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-zinc-100 px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700">
                              Novo
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between shrink-0">
          <div className="text-xs text-zinc-400 flex items-center gap-1.5">
            <IconInfoCircle size={14} className="text-zinc-500" />
            <span>Pastas como <code>node_modules</code> e <code>target</code> são ignoradas automaticamente.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsScannerOpen(false)}
              className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200"
            >
              Fechar
            </button>
            <button
              type="button"
              onClick={handleBatchImport}
              disabled={selectedPaths.size === 0}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-zinc-100 hover:bg-white disabled:opacity-40 text-zinc-950 rounded text-xs font-semibold transition-colors shadow-sm"
            >
              <IconFolderPlus size={15} />
              <span>Importar Selecionados ({selectedPaths.size})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
