import React, { useState, useEffect, useRef } from 'react';
import {
  IconSearch,
  IconFolderPlus,
  IconScan,
  IconSettings,
  IconCode,
  IconTerminal2,
  IconStar,
} from '@tabler/icons-react';
import { useProjects } from '../../context/ProjectContext';
import { getTechColor } from '../../utils/formatters';

export const CommandPalette: React.FC = () => {
  const {
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,
    projects,
    setActiveProject,
    setIsNewProjectOpen,
    setIsScannerOpen,
    setIsSettingsOpen,
    setIsDiskCleanerOpen,
    setIsWorkspaceModalOpen,
    setIsCodeSearchOpen,
    openInEditor,
    openInTerminal,
  } = useProjects();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  // Filter projects and command actions
  const filteredProjects = projects.filter(p => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.path.toLowerCase().includes(q) ||
      p.primary_tech.toLowerCase().includes(q) ||
      p.tags.some(t => t.name.toLowerCase().includes(q))
    );
  }).slice(0, 8);

  const actions = [
    {
      id: 'act-new',
      title: 'Adicionar Novo Projeto',
      subtitle: 'Cadastrar manualmente via seletor de pastas (Ctrl+N)',
      icon: <IconFolderPlus size={16} className="text-zinc-100" />,
      action: () => {
        setIsCommandPaletteOpen(false);
        setIsNewProjectOpen(true);
      },
    },
    {
      id: 'act-code-search',
      title: 'Buscar Código nos Projetos',
      subtitle: 'Pesquisar termos, funções ou variáveis em todos os repositórios (Ctrl+Shift+F)',
      icon: <IconCode size={16} className="text-zinc-100" />,
      action: () => {
        setIsCommandPaletteOpen(false);
        setIsCodeSearchOpen(true);
      },
    },
    {
      id: 'act-cleaner',
      title: 'Limpador de Disco & Dependências',
      subtitle: 'Remover node_modules, target/ e build artifacts com segurança',
      icon: <IconSettings size={16} className="text-zinc-100" />,
      action: () => {
        setIsCommandPaletteOpen(false);
        setIsDiskCleanerOpen(true);
      },
    },
    {
      id: 'act-workspaces',
      title: 'Gerenciar Workspaces',
      subtitle: 'Criar e organizar grupos de projetos para abertura em lote',
      icon: <IconFolderPlus size={16} className="text-zinc-100" />,
      action: () => {
        setIsCommandPaletteOpen(false);
        setIsWorkspaceModalOpen(true);
      },
    },
    {
      id: 'act-scan',
      title: 'Varredura Automática de Diretórios',
      subtitle: 'Escanear pastas e detectar repositórios (Ctrl+F)',
      icon: <IconScan size={16} className="text-zinc-100" />,
      action: () => {
        setIsCommandPaletteOpen(false);
        setIsScannerOpen(true);
      },
    },
    {
      id: 'act-settings',
      title: 'Abrir Configurações',
      subtitle: 'Configurar editor padrão, terminal e backup do banco SQLite',
      icon: <IconSettings size={16} className="text-zinc-400" />,
      action: () => {
        setIsCommandPaletteOpen(false);
        setIsSettingsOpen(true);
      },
    },
  ].filter(a => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return a.title.toLowerCase().includes(q) || a.subtitle.toLowerCase().includes(q);
  });

  const totalItems = filteredProjects.length + actions.length;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % (totalItems || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + totalItems) % (totalItems || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex < filteredProjects.length) {
        const project = filteredProjects[selectedIndex];
        setActiveProject(project);
        setIsCommandPaletteOpen(false);
      } else {
        const actionIdx = selectedIndex - filteredProjects.length;
        if (actions[actionIdx]) {
          actions[actionIdx].action();
        }
      }
    } else if (e.key === 'Escape') {
      setIsCommandPaletteOpen(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/80 p-4 pt-20"
      onClick={() => setIsCommandPaletteOpen(false)}
    >
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-lg w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-3 bg-zinc-950 border-b border-zinc-800 flex items-center gap-3">
          <IconSearch size={18} className="text-zinc-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Digite para buscar projetos, caminhos, stacks ou ações..."
            className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
          />
          <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-[10px] text-zinc-400 font-mono">
            ESC para fechar
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {filteredProjects.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                Projetos
              </div>
              {filteredProjects.map((p, idx) => {
                const isSelected = selectedIndex === idx;
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      setActiveProject(p);
                      setIsCommandPaletteOpen(false);
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex items-center justify-between px-3 py-2 rounded text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-800 text-zinc-50 border border-zinc-700'
                        : 'text-zinc-300 hover:bg-zinc-850 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded border shrink-0 ${getTechColor(p.primary_tech)}`}>
                        {p.primary_tech}
                      </span>
                      <div className="min-w-0">
                        <div className="font-semibold text-zinc-100 truncate flex items-center gap-1.5">
                          <span>{p.name}</span>
                          {p.is_favorite && <IconStar size={12} className="text-zinc-100" />}
                        </div>
                        <div className="text-[11px] font-mono text-zinc-500 truncate">
                          {p.path}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2" onClick={e => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => {
                          openInEditor(p);
                          setIsCommandPaletteOpen(false);
                        }}
                        className="p-1 text-zinc-400 hover:text-zinc-950 hover:bg-zinc-100 rounded"
                        title="Abrir no Editor"
                      >
                        <IconCode size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          openInTerminal(p);
                          setIsCommandPaletteOpen(false);
                        }}
                        className="p-1 text-zinc-400 hover:text-zinc-950 hover:bg-zinc-100 rounded"
                        title="Abrir no Terminal"
                      >
                        <IconTerminal2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {actions.length > 0 && (
            <div>
              <div className="px-3 py-1.5 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                Ações Globais
              </div>
              {actions.map((act, idx) => {
                const itemIdx = filteredProjects.length + idx;
                const isSelected = selectedIndex === itemIdx;
                return (
                  <div
                    key={act.id}
                    onClick={act.action}
                    onMouseEnter={() => setSelectedIndex(itemIdx)}
                    className={`flex items-center gap-3 px-3 py-2 rounded text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-800 text-zinc-50 border border-zinc-700'
                        : 'text-zinc-300 hover:bg-zinc-850 border border-transparent'
                    }`}
                  >
                    <div className="p-1.5 rounded bg-zinc-950 border border-zinc-800 shrink-0">
                      {act.icon}
                    </div>
                    <div>
                      <div className="font-semibold text-zinc-100">{act.title}</div>
                      <div className="text-[11px] text-zinc-400">{act.subtitle}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {totalItems === 0 && (
            <div className="p-8 text-center text-zinc-500 text-xs">
              Nenhum projeto ou ação corresponde a "{query}".
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-2.5 bg-zinc-950 border-t border-zinc-800 flex items-center justify-between text-[11px] text-zinc-500">
          <div className="flex items-center gap-3">
            <span>↑↓ para navegar</span>
            <span>↵ para selecionar</span>
            <span>ESC para sair</span>
          </div>
          <span>Crescent Command Palette</span>
        </div>
      </div>
    </div>
  );
};
