import React, { useState, useEffect, useRef } from 'react';
import {
  IconSearch,
  IconFolderPlus,
  IconScan,
  IconSettings,
  IconTerminal2,
  IconStar,
  IconBrain,
  IconDatabase,
  IconCode,
  IconBriefcase,
} from '@tabler/icons-react';
import { useProjects } from '../../context/ProjectContext';
import { getTechColor } from '../../utils/formatters';
import { EditorIcon } from '../common/EditorIcons';

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
    setIsAiChatOpen,
    openInEditor,
    openInTerminal,
    settings,
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

  // Filter projects
  const filteredProjects = projects.filter(p => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      p.path.toLowerCase().includes(q) ||
      p.primary_tech.toLowerCase().includes(q) ||
      p.tags.some(t => t.name.toLowerCase().includes(q))
    );
  }).slice(0, 7);

  // Global Actions
  const actions = [
    {
      id: 'act-ai-chat',
      title: 'Crescent AI Assistant',
      subtitle: 'Chat inteligente com contexto dos seus projetos locais (Ctrl + J)',
      icon: <IconBrain size={15} className="text-zinc-200" />,
      action: () => {
        setIsCommandPaletteOpen(false);
        setIsAiChatOpen(true);
      },
    },
    {
      id: 'act-new',
      title: 'Adicionar Projeto',
      subtitle: 'Cadastrar manualmente ou por templates (Ctrl + N)',
      icon: <IconFolderPlus size={15} className="text-zinc-200" />,
      action: () => {
        setIsCommandPaletteOpen(false);
        setIsNewProjectOpen(true);
      },
    },
    {
      id: 'act-scan',
      title: 'Escanear Pastas',
      subtitle: 'Varredura recursiva de diretórios no computador (Ctrl + F)',
      icon: <IconScan size={15} className="text-zinc-200" />,
      action: () => {
        setIsCommandPaletteOpen(false);
        setIsScannerOpen(true);
      },
    },
    {
      id: 'act-code-search',
      title: 'Buscar Código',
      subtitle: 'Pesquisar termos em todos os repositórios (Ctrl + Shift + F)',
      icon: <IconCode size={15} className="text-zinc-200" />,
      action: () => {
        setIsCommandPaletteOpen(false);
        setIsCodeSearchOpen(true);
      },
    },
    {
      id: 'act-workspaces',
      title: 'Workspaces',
      subtitle: 'Gerenciar grupos e abertura em lote de projetos',
      icon: <IconBriefcase size={15} className="text-zinc-200" />,
      action: () => {
        setIsCommandPaletteOpen(false);
        setIsWorkspaceModalOpen(true);
      },
    },
    {
      id: 'act-cleaner',
      title: 'Limpador de Disco',
      subtitle: 'Liberar espaço em disco removendo node_modules e target',
      icon: <IconDatabase size={15} className="text-zinc-200" />,
      action: () => {
        setIsCommandPaletteOpen(false);
        setIsDiskCleanerOpen(true);
      },
    },
    {
      id: 'act-settings',
      title: 'Configurações',
      subtitle: 'Preferências de editor, terminal e backup',
      icon: <IconSettings size={15} className="text-zinc-200" />,
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
      className="fixed top-11 inset-x-0 bottom-0 z-40 flex items-start justify-center bg-black/75 p-4 pt-12 animate-in fade-in duration-100"
      onClick={() => setIsCommandPaletteOpen(false)}
    >
      <div
        className="bg-zinc-950 border border-zinc-800 rounded-lg w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-3 bg-zinc-950 border-b border-zinc-850 flex items-center gap-3">
          <IconSearch size={16} className="text-zinc-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Buscar projetos, tags ou comandos..."
            className="flex-1 bg-transparent text-sm text-zinc-100 placeholder-zinc-400 focus:outline-none"
          />
          <kbd className="px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 rounded text-[10px] text-zinc-400 font-mono">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-1.5 space-y-0.5 custom-scrollbar">
          {filteredProjects.length > 0 && (
            <div>
              <div className="px-2.5 py-1 text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
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
                    className={`flex items-center justify-between px-2.5 py-2 rounded-md text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-850 text-zinc-100'
                        : 'text-zinc-300 hover:bg-zinc-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded border shrink-0 ${getTechColor(p.primary_tech)}`}>
                        {p.primary_tech}
                      </span>
                      <div className="min-w-0">
                        <div className="font-medium text-zinc-100 truncate flex items-center gap-1.5">
                          <span>{p.name}</span>
                          {p.is_favorite && <IconStar size={12} className="text-zinc-100" />}
                        </div>
                        <div className="text-[11px] font-mono text-zinc-400 truncate">
                          {p.path}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-2" onClick={e => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => {
                          openInEditor(p);
                          setIsCommandPaletteOpen(false);
                        }}
                        className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded transition-colors"
                        title={`Abrir no ${settings.default_editor}`}
                      >
                        <EditorIcon editor={settings.default_editor} size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          openInTerminal(p);
                          setIsCommandPaletteOpen(false);
                        }}
                        className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded transition-colors"
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
            <div className={filteredProjects.length > 0 ? 'pt-1.5' : ''}>
              <div className="px-2.5 py-1 text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                Ações
              </div>
              {actions.map((act, idx) => {
                const itemIdx = filteredProjects.length + idx;
                const isSelected = selectedIndex === itemIdx;
                return (
                  <div
                    key={act.id}
                    onClick={act.action}
                    onMouseEnter={() => setSelectedIndex(itemIdx)}
                    className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-850 text-zinc-100'
                        : 'text-zinc-300 hover:bg-zinc-900'
                    }`}
                  >
                    <div className="p-1 rounded bg-zinc-900 text-zinc-300 shrink-0">
                      {act.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-zinc-100 truncate">{act.title}</div>
                      <div className="text-[11px] text-zinc-400 truncate">{act.subtitle}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {totalItems === 0 && (
            <div className="p-6 text-center text-zinc-400 text-xs">
              Nenhum resultado para "{query}".
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-2 bg-zinc-950 border-t border-zinc-850 flex items-center justify-between text-[11px] text-zinc-400">
          <div className="flex items-center gap-3">
            <span>↑↓ navegar</span>
            <span>↵ selecionar</span>
            <span>ESC fechar</span>
          </div>
        </div>
      </div>
    </div>
  );
};
