import React, { useState, useEffect } from 'react';
import {
  IconFolders,
  IconStar,
  IconPlayerPlay,
  IconPlayerPause,
  IconCircleCheck,
  IconArchive,
  IconGitPullRequest,
  IconAlertTriangle,
  IconTag,
  IconPlus,
  IconSettings,
  IconScan,
  IconFolderPlus,
  IconTrash,
  IconBriefcase,
  IconDatabase,
  IconCode,
  IconBrain,
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarLeftExpand,
} from '@tabler/icons-react';
import { useProjects } from '../../context/ProjectContext';
import { FilterCategory } from '../../types';
import { Tooltip } from '../common/Tooltip';

import { api } from '../../services/api';

export const Sidebar: React.FC = () => {
  const {
    selectedCategory,
    setSelectedCategory,
    selectedTagId,
    setSelectedTagId,
    workspaces,
    selectedWorkspaceId,
    setSelectedWorkspaceId,
    tags,
    stats,
    createTag,
    deleteTag,
    setIsNewProjectOpen,
    setIsScannerOpen,
    setIsSettingsOpen,
    setIsDiskCleanerOpen,
    setIsWorkspaceModalOpen,
    setIsCodeSearchOpen,
    setIsAiChatOpen,
  } = useProjects();

  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('crescent_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const newTagColor = '#a1a1aa';

  // Load from SQLite on mount
  useEffect(() => {
    const loadState = async () => {
      try {
        const raw = await api.getSettings();
        if ((raw as unknown as Record<string, string>).ui_sidebar_collapsed !== undefined) {
          setIsCollapsed((raw as unknown as Record<string, string>).ui_sidebar_collapsed === 'true');
        }
      } catch {}
    };
    loadState();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('crescent_sidebar_collapsed', isCollapsed ? 'true' : 'false');
      api.saveSetting('ui_sidebar_collapsed', isCollapsed ? 'true' : 'false');
    } catch {
      // Ignore
    }
  }, [isCollapsed]);

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    try {
      await createTag(newTagName.trim(), newTagColor);
      setNewTagName('');
      setIsAddingTag(false);
    } catch (err) {
      console.error(err);
    }
  };

  const categories: { id: FilterCategory; label: string; icon: React.ReactNode; count: number }[] = [
    { id: 'all', label: 'Todos os Projetos', icon: <IconFolders size={18} />, count: stats.total },
    { id: 'favorites', label: 'Favoritos & Fixados', icon: <IconStar size={18} />, count: stats.favorites },
    { id: 'active', label: 'Ativos', icon: <IconPlayerPlay size={18} />, count: stats.active },
    { id: 'on_hold', label: 'Em Espera', icon: <IconPlayerPause size={18} />, count: stats.onHold },
    { id: 'completed', label: 'Concluídos', icon: <IconCircleCheck size={18} />, count: stats.completed },
    { id: 'archived', label: 'Arquivados', icon: <IconArchive size={18} />, count: stats.archived },
    { id: 'dirty', label: 'Git Pendente', icon: <IconGitPullRequest size={18} />, count: stats.dirty },
  ];

  return (
    <aside
      className={`h-[calc(100vh-2.75rem)] bg-zinc-950 flex flex-col justify-between select-none shrink-0 transition-all duration-150 ${
        isCollapsed ? 'w-14' : 'w-64'
      }`}
    >
      {/* Top Header & Actions */}
      <div className="p-2.5">
        {!isCollapsed ? (
          <div className="flex items-center gap-1.5 w-full">
            <button
              type="button"
              onClick={() => setIsNewProjectOpen(true)}
              className="flex-1 flex items-center justify-center gap-2 h-9 px-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 rounded-lg text-xs font-medium transition-colors shadow-sm cursor-pointer"
            >
              <IconFolderPlus size={16} />
              <span>Novo Projeto</span>
            </button>

            <Tooltip content="Escanear Pastas" shortcut="Ctrl F" position="bottom">
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="w-9 h-9 flex items-center justify-center bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100 rounded-lg transition-colors cursor-pointer"
              >
                <IconScan size={17} />
              </button>
            </Tooltip>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5">
            <Tooltip content="Novo Projeto" shortcut="Ctrl N" position="right" className="w-full">
              <button
                type="button"
                onClick={() => setIsNewProjectOpen(true)}
                className="w-10 h-10 flex items-center justify-center mx-auto bg-zinc-100 hover:bg-zinc-200 text-zinc-950 rounded-lg transition-colors cursor-pointer shadow-sm"
              >
                <IconFolderPlus size={18} />
              </button>
            </Tooltip>

            <Tooltip content="Escanear Pastas" shortcut="Ctrl F" position="right" className="w-full">
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="w-10 h-10 flex items-center justify-center mx-auto bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100 rounded-lg transition-colors cursor-pointer"
              >
                <IconScan size={18} />
              </button>
            </Tooltip>
          </div>
        )}
      </div>

      {/* Main Navigation Area */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3 custom-scrollbar">
        {/* Categories Section */}
        <div className="space-y-0.5">
          {!isCollapsed && (
            <div className="px-2.5 pb-1 text-[10px] font-medium tracking-wider text-zinc-500 uppercase">
              Visualizações
            </div>
          )}

          {categories.map(cat => {
            const isSelected = selectedCategory === cat.id && selectedTagId === null && selectedWorkspaceId === null;
            const btn = (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setSelectedTagId(null);
                  setSelectedWorkspaceId(null);
                }}
                className={`w-full flex items-center justify-between rounded-lg text-xs transition-colors cursor-pointer ${
                  isCollapsed ? 'w-10 h-10 p-0 justify-center mx-auto' : 'px-2.5 py-2'
                } ${
                  isSelected
                    ? 'bg-zinc-850 text-zinc-100 font-medium'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={isSelected ? 'text-zinc-100' : 'text-zinc-400'}>{cat.icon}</span>
                  {!isCollapsed && <span className="truncate">{cat.label}</span>}
                </div>

                {!isCollapsed && (
                  <span className={`text-[11px] font-mono ${isSelected ? 'text-zinc-300 font-medium' : 'text-zinc-500'}`}>
                    {cat.count}
                  </span>
                )}
              </button>
            );

            return isCollapsed ? (
              <Tooltip key={cat.id} content={`${cat.label} (${cat.count})`} position="right" className="w-full">
                {btn}
              </Tooltip>
            ) : (
              <React.Fragment key={cat.id}>{btn}</React.Fragment>
            );
          })}

          {/* Missing folders filter */}
          {stats.missing > 0 && (
            isCollapsed ? (
              <Tooltip content={`Pastas Ausentes (${stats.missing})`} position="right" className="w-full">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('missing');
                    setSelectedTagId(null);
                    setSelectedWorkspaceId(null);
                  }}
                  className={`w-10 h-10 flex items-center justify-center mx-auto rounded-lg text-xs transition-colors cursor-pointer ${
                    selectedCategory === 'missing' && selectedTagId === null && selectedWorkspaceId === null
                      ? 'bg-zinc-850 text-zinc-100 font-medium'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  <IconAlertTriangle size={18} className="text-zinc-400" />
                </button>
              </Tooltip>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('missing');
                  setSelectedTagId(null);
                  setSelectedWorkspaceId(null);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                  selectedCategory === 'missing' && selectedTagId === null && selectedWorkspaceId === null
                    ? 'bg-zinc-850 text-zinc-100 font-medium'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <IconAlertTriangle size={18} className="text-zinc-400" />
                  <span>Pastas Ausentes</span>
                </div>
                <span className="text-[11px] font-mono text-zinc-300">
                  {stats.missing}
                </span>
              </button>
            )
          )}
        </div>

        {/* Supertools Section */}
        <div className="space-y-0.5 pt-1">
          {!isCollapsed && (
            <div className="px-2.5 pb-1 text-[10px] font-medium tracking-wider text-zinc-500 uppercase">
              Ferramentas
            </div>
          )}

          {/* Crescent AI Button */}
          {isCollapsed ? (
            <Tooltip content="Crescent AI Assistant" shortcut="Ctrl J" position="right" className="w-full">
              <button
                type="button"
                onClick={() => setIsAiChatOpen(true)}
                className="w-10 h-10 flex items-center justify-center mx-auto rounded-lg text-xs text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
              >
                <IconBrain size={18} className="text-zinc-200" />
              </button>
            </Tooltip>
          ) : (
            <button
              type="button"
              onClick={() => setIsAiChatOpen(true)}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <IconBrain size={18} className="text-zinc-200" />
                <span>Crescent AI</span>
              </div>
              <kbd className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded">
                Ctrl J
              </kbd>
            </button>
          )}

          {/* Global Code Grep */}
          {isCollapsed ? (
            <Tooltip content="Buscar Código nos Repositórios" shortcut="Ctrl+Shift+F" position="right" className="w-full">
              <button
                type="button"
                onClick={() => setIsCodeSearchOpen(true)}
                className="w-10 h-10 flex items-center justify-center mx-auto rounded-lg text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors cursor-pointer"
              >
                <IconCode size={18} className="text-zinc-400" />
              </button>
            </Tooltip>
          ) : (
            <button
              type="button"
              onClick={() => setIsCodeSearchOpen(true)}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <IconCode size={18} className="text-zinc-400" />
                <span>Busca de Código</span>
              </div>
              <kbd className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded">
                Ctrl+Shift+F
              </kbd>
            </button>
          )}

          {/* Disk Cleaner */}
          {isCollapsed ? (
            <Tooltip content="Limpador de Disco & Dependências" position="right" className="w-full">
              <button
                type="button"
                onClick={() => setIsDiskCleanerOpen(true)}
                className="w-10 h-10 flex items-center justify-center mx-auto rounded-lg text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors cursor-pointer"
              >
                <IconDatabase size={18} className="text-zinc-400" />
              </button>
            </Tooltip>
          ) : (
            <button
              type="button"
              onClick={() => setIsDiskCleanerOpen(true)}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <IconDatabase size={18} className="text-zinc-400" />
                <span>Limpador de Disco</span>
              </div>
            </button>
          )}
        </div>

        {/* Workspaces Section */}
        {!isCollapsed && (
          <div className="pt-1">
            <div className="flex items-center justify-between px-2.5 pb-1">
              <div className="text-[10px] font-medium tracking-wider text-zinc-500 uppercase flex items-center gap-1.5">
                <IconBriefcase size={14} />
                <span>Workspaces</span>
              </div>
              <button
                type="button"
                onClick={() => setIsWorkspaceModalOpen(true)}
                className="p-1 hover:bg-zinc-850 rounded text-zinc-400 hover:text-zinc-200 cursor-pointer"
                title="Gerenciar Workspaces"
              >
                <IconPlus size={14} />
              </button>
            </div>

            <div className="space-y-0.5">
              {workspaces.length === 0 ? (
                <div className="px-2.5 py-1 text-[11px] text-zinc-500">
                  Nenhum workspace.
                </div>
              ) : (
                workspaces.map(ws => {
                  const isSelected = selectedWorkspaceId === ws.id;
                  return (
                    <div
                      key={ws.id}
                      onClick={() => {
                        if (selectedWorkspaceId === ws.id) {
                          setSelectedWorkspaceId(null);
                        } else {
                          setSelectedWorkspaceId(ws.id);
                          setSelectedTagId(null);
                        }
                      }}
                      className={`flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-zinc-850 text-zinc-100 font-medium'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                      }`}
                      title={`Workspace: ${ws.name}`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <IconBriefcase size={15} className="text-zinc-400 shrink-0" />
                        <span className="truncate">{ws.name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500">
                        {ws.project_ids.length}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tags Section */}
        {!isCollapsed && (
          <div className="pt-1">
            <div className="flex items-center justify-between px-2.5 pb-1">
              <div className="text-[10px] font-medium tracking-wider text-zinc-500 uppercase flex items-center gap-1.5">
                <IconTag size={14} />
                <span>Tags</span>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingTag(prev => !prev)}
                className="p-1 hover:bg-zinc-850 rounded text-zinc-400 hover:text-zinc-200 cursor-pointer"
                title="Criar Tag"
              >
                <IconPlus size={14} />
              </button>
            </div>

            {isAddingTag && (
              <form onSubmit={handleCreateTag} className="p-2 mb-1 bg-zinc-900 rounded-lg space-y-2">
                <input
                  type="text"
                  value={newTagName}
                  onChange={e => setNewTagName(e.target.value)}
                  placeholder="Nome da tag..."
                  autoFocus
                  className="w-full px-2.5 py-1.5 bg-zinc-950 rounded text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none"
                />
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsAddingTag(false)}
                    className="px-2 py-1 text-[11px] text-zinc-400 hover:text-zinc-200 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-2.5 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 rounded text-[11px] font-medium cursor-pointer"
                  >
                    Salvar
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-0.5">
              {tags.length === 0 ? (
                <div className="px-2.5 py-1 text-[11px] text-zinc-500">
                  Nenhuma tag.
                </div>
              ) : (
                tags.map(tag => {
                  const isSelected = selectedTagId === tag.id;
                  return (
                    <div
                      key={tag.id}
                      className={`group flex items-center justify-between px-2.5 py-2 rounded-lg text-xs transition-colors ${
                        isSelected
                          ? 'bg-zinc-850 text-zinc-100 font-medium'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (selectedTagId === tag.id) {
                            setSelectedTagId(null);
                          } else {
                            setSelectedTagId(tag.id);
                            setSelectedWorkspaceId(null);
                          }
                        }}
                        className="flex items-center gap-2 flex-1 text-left truncate cursor-pointer"
                        title={`Filtrar pela tag #${tag.name}`}
                      >
                        <span className="text-zinc-400 font-mono">#</span>
                        <span className="truncate">{tag.name}</span>
                      </button>
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          deleteTag(tag.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-zinc-200 p-0.5 cursor-pointer"
                        title="Excluir Tag"
                      >
                        <IconTrash size={13} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Footer Area: Expand/Collapse Button above Settings */}
      <div className="p-2 bg-zinc-950 space-y-1">
        {/* Expand / Collapse Button */}
        {isCollapsed ? (
          <Tooltip content="Expandir barra lateral" position="right" className="w-full">
            <button
              type="button"
              onClick={() => setIsCollapsed(false)}
              className="w-10 h-10 flex items-center justify-center mx-auto hover:bg-zinc-900 hover:text-zinc-100 rounded-lg transition-colors text-zinc-400 cursor-pointer"
            >
              <IconLayoutSidebarLeftExpand size={18} />
            </button>
          </Tooltip>
        ) : (
          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 hover:bg-zinc-900 hover:text-zinc-100 rounded-lg transition-colors text-zinc-400 text-xs cursor-pointer"
          >
            <IconLayoutSidebarLeftCollapse size={18} />
            <span>Recolher Barra</span>
          </button>
        )}

        {/* Settings Button */}
        {isCollapsed ? (
          <Tooltip content="Configurações" position="right" className="w-full">
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="w-10 h-10 flex items-center justify-center mx-auto hover:bg-zinc-900 hover:text-zinc-100 rounded-lg transition-colors text-zinc-400 cursor-pointer"
            >
              <IconSettings size={18} />
            </button>
          </Tooltip>
        ) : (
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 hover:bg-zinc-900 hover:text-zinc-100 rounded-lg transition-colors text-zinc-400 text-xs cursor-pointer"
          >
            <IconSettings size={18} />
            <span>Configurações</span>
          </button>
        )}
      </div>
    </aside>
  );
};
