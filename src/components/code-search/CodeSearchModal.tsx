import React, { useState, useEffect } from 'react';
import {
  IconSearch,
  IconX,
  IconCode,
  IconExternalLink,
  IconRefresh,
} from '@tabler/icons-react';
import { useProjects } from '../../context/ProjectContext';
import { api } from '../../services/api';
import { CodeSearchResult, ProjectSearchTarget } from '../../types';

export const CodeSearchModal: React.FC = () => {
  const { isCodeSearchOpen, setIsCodeSearchOpen, projects, openInEditor } = useProjects();

  const [query, setQuery] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [results, setResults] = useState<CodeSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!isCodeSearchOpen) {
      setQuery('');
      setResults([]);
    }
  }, [isCodeSearchOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const targets: ProjectSearchTarget[] = projects
          .filter(p => p.exists_on_disk)
          .map(p => ({ id: p.id, name: p.name, path: p.path }));

        const res = await api.searchCode(query.trim(), targets, caseSensitive, 80);
        setResults(res);
      } catch (err) {
        console.error('Erro ao buscar código:', err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, caseSensitive, projects]);

  const handleOpenResult = async (item: CodeSearchResult) => {
    const proj = projects.find(p => p.id === item.project_id);
    if (proj) {
      await openInEditor(proj);
    }
  };

  if (!isCodeSearchOpen) return null;

  return (
    <div className="fixed top-11 inset-x-0 bottom-0 z-40 flex items-center justify-center p-4 bg-black/75 select-none animate-in fade-in duration-150">
      <div className="w-full max-w-3xl max-h-[85vh] bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl flex flex-col overflow-hidden">
        {/* Header Search Input */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-900/60 flex items-center gap-3">
          <IconSearch size={18} className="text-zinc-500 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Buscar código em todos os projetos (funções, strings, configs)..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
          />

          <label className="flex items-center gap-1.5 text-xs text-zinc-400 cursor-pointer bg-zinc-850 px-2 py-1 rounded border border-zinc-700 select-none">
            <input
              type="checkbox"
              checked={caseSensitive}
              onChange={e => setCaseSensitive(e.target.checked)}
              className="rounded border-zinc-700 bg-zinc-800 text-zinc-100 focus:ring-0 cursor-pointer"
            />
            <span>Aa</span>
          </label>

          <button
            type="button"
            onClick={() => setIsCodeSearchOpen(false)}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded transition-colors"
          >
            <IconX size={18} />
          </button>
        </div>

        {/* Results Info Bar */}
        <div className="px-6 py-2 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            {searching ? (
              <>
                <IconRefresh size={13} className="animate-spin text-zinc-400" />
                <span>Buscando em {projects.length} projetos...</span>
              </>
            ) : query.trim() ? (
              <span>{results.length} ocorrência(s) encontrada(s)</span>
            ) : (
              <span>Digite acima para buscar termos em todos os arquivos de código</span>
            )}
          </div>
          <span className="font-mono text-[10px] text-zinc-500">Esc para fechar • Ctrl+Shift+F</span>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar">
          {results.length === 0 && query.trim() && !searching ? (
            <div className="py-16 text-center space-y-2">
              <IconCode size={32} className="mx-auto text-zinc-600" />
              <p className="text-sm font-medium text-zinc-300">Nenhum resultado para "{query}"</p>
              <p className="text-xs text-zinc-500">Tente buscar por termos mais genéricos ou verifique a sensibilidade de maiúsculas/minúsculas.</p>
            </div>
          ) : (
            results.map((item, idx) => (
              <div
                key={idx}
                onClick={() => handleOpenResult(item)}
                className="p-3 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 rounded-lg cursor-pointer transition-colors space-y-1.5 group"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-zinc-200">{item.project_name}</span>
                    <span className="text-zinc-600">•</span>
                    <span className="font-mono text-zinc-400 text-[11px] truncate max-w-md">
                      {item.relative_path}:{item.line_number}
                    </span>
                  </div>

                  <span className="text-[10px] text-zinc-500 group-hover:text-zinc-300 font-medium flex items-center gap-1">
                    Abrir no Editor
                    <IconExternalLink size={12} />
                  </span>
                </div>

                <div className="p-2 bg-zinc-950 border border-zinc-850 rounded font-mono text-xs text-zinc-300 overflow-x-auto">
                  <span className="text-zinc-600 mr-2 select-none">{item.line_number}:</span>
                  <span>{item.line_content}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
