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
  IconShieldLock,
  IconBriefcase,
  IconDatabase,
  IconCode,
  IconBrain,
  IconChevronLeft,
  IconChevronRight,
} from '@tabler/icons-react';
import { useProjects } from '../../context/ProjectContext';
import { FilterCategory } from '../../types';
import { Tooltip } from '../common/Tooltip';

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

  useEffect(() => {
    try {
      localStorage.setItem('crescent_sidebar_collapsed', isCollapsed ? 'true' : 'false');
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
    { id: 'all', label: 'Todos os Projetos', icon: <IconFolders size={16} />, count: stats.total },
    { id: 'favorites', label: 'Favoritos & Fixados', icon: <IconStar size={16} />, count: stats.favorites },
    { id: 'active', label: 'Ativos', icon: <IconPlayerPlay size={16} />, count: stats.active },
    { id: 'on_hold', label: 'Em Espera', icon: <IconPlayerPause size={16} />, count: stats.onHold },
    { id: 'completed', label: 'Concluídos', icon: <IconCircleCheck size={16} />, count: stats.completed },
    { id: 'archived', label: 'Arquivados', icon: <IconArchive size={16} />, count: stats.archived },
    { id: 'dirty', label: 'Git Pendente', icon: <IconGitPullRequest size={16} />, count: stats.dirty },
  ];

  return (
    <aside
      className={`h-[calc(100vh-2.75rem)] bg-zinc-950 border-r border-zinc-850 flex flex-col justify-between select-none shrink-0 transition-all duration-150 ${
        isCollapsed ? 'w-14' : 'w-60'
      }`}
    >
      {/* Top Header & Actions */}
      <div className="p-2.5 flex items-center justify-between border-b border-zinc-900">
        {!isCollapsed && (
          <div className="flex items-center gap-1.5 flex-1 pr-1">
            <button
              type="button"
              onClick={() => setIsNewProjectOpen(true)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 rounded-md text-xs font-medium transition-colors shadow-sm cursor-pointer"
            >
              <IconFolderPlus size={15} />
              <span>Novo Projeto</span>
            </button>

            <Tooltip content="Escanear Pastas" shortcut="Ctrl F" position="bottom">
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="p-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100 border border-zinc-800 hover:border-zinc-700 rounded-md transition-colors cursor-pointer"
              >
                <IconScan size={15} />
              </button>
            </Tooltip>
          </div>
        )}

        {/* Toggle Collapse Button */}
        <Tooltip content={isCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'} position="right">
          <button
            type="button"
            onClick={() => setIsCollapsed(prev => !prev)}
            className={`p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 rounded-md transition-colors cursor-pointer ${
              isCollapsed ? 'mx-auto' : ''
            }`}
          >
            {isCollapsed ? <IconChevronRight size={16} /> : <IconChevronLeft size={16} />}
          </button>
        </Tooltip>
      </div>

      {/* Main Navigation Area */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3 custom-scrollbar">
        {/* Categories Section */}
        <div className="space-y-0.5">
          {!isCollapsed && (
            <div className="px-2.5 pb-1 text-[10px] font-medium tracking-wider text-zinc-400 uppercase">
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
                className={`w-full flex items-center justify-between rounded-md text-xs transition-colors cursor-pointer ${
                  isCollapsed ? 'p-2 justify-center' : 'px-2.5 py-1.5'
                } ${
                  isSelected
                    ? 'bg-zinc-850 text-zinc-100 font-medium'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={isSelected ? 'text-zinc-100' : 'text-zinc-400'}>{cat.icon}</span>
                  {!isCollapsed && <span className="truncate">{cat.label}</span>}
                </div>

                {!isCollapsed && (
                  <span className={`text-[11px] font-mono ${isSelected ? 'text-zinc-300 font-medium' : 'text-zinc-400'}`}>
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
                  className={`w-full flex items-center justify-center p-2 rounded-md text-xs transition-colors ${
                    selectedCategory === 'missing' && selectedTagId === null && selectedWorkspaceId === null
                      ? 'bg-zinc-850 text-zinc-100 font-medium'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                  }`}
                >
                  <IconAlertTriangle size={16} className="text-zinc-400" />
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
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                  selectedCategory === 'missing' && selectedTagId === null && selectedWorkspaceId === null
                    ? 'bg-zinc-850 text-zinc-100 font-medium'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <IconAlertTriangle size={16} className="text-zinc-400" />
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
            <div className="px-2.5 pb-1 text-[10px] font-medium tracking-wider text-zinc-400 uppercase">
              Ferramentas
            </div>
          )}

          {/* Crescent AI Button */}
          {isCollapsed ? (
            <Tooltip content="Crescent AI Assistant" shortcut="Ctrl J" position="right" className="w-full">
              <button
                type="button"
                onClick={() => setIsAiChatOpen(true)}
                className="w-full flex items-center justify-center p-2 rounded-md text-xs text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors"
              >
                <IconBrain size={16} className="text-zinc-200" />
              </button>
            </Tooltip>
          ) : (
            <button
              type="button"
              onClick={() => setIsAiChatOpen(true)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <IconBrain size={16} className="text-zinc-200" />
                <span>Crescent AI</span>
              </div>
              <kbd className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-1.5 py-0.2 rounded border border-zinc-800">
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
                className="w-full flex items-center justify-center p-2 rounded-md text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
              >
                <IconCode size={16} className="text-zinc-400" />
              </button>
            </Tooltip>
          ) : (
            <button
              type="button"
              onClick={() => setIsCodeSearchOpen(true)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <IconCode size={16} className="text-zinc-400" />
                <span>Busca de Código</span>
              </div>
              <kbd className="text-[10px] font-mono text-zinc-400 bg-zinc-900 px-1 py-0.2 rounded border border-zinc-800">
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
                className="w-full flex items-center justify-center p-2 rounded-md text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors"
              >
                <IconDatabase size={16} className="text-zinc-400" />
              </button>
            </Tooltip>
          ) : (
            <button
              type="button"
              onClick={() => setIsDiskCleanerOpen(true)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <IconDatabase size={16} className="text-zinc-400" />
                <span>Limpador de Disco</span>
              </div>
            </button>
          )}
        </div>

        {/* Workspaces Section */}
        {!isCollapsed && (
          <div className="pt-1">
            <div className="flex items-center justify-between px-2.5 pb-1">
              <div className="text-[10px] font-medium tracking-wider text-zinc-400 uppercase flex items-center gap-1.5">
                <IconBriefcase size={13} />
                <span>Workspaces</span>
              </div>
              <button
                type="button"
                onClick={() => setIsWorkspaceModalOpen(true)}
                className="p-0.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200"
                title="Gerenciar Workspaces"
              >
                <IconPlus size={14} />
              </button>
            </div>

            <div className="space-y-0.5">
              {workspaces.length === 0 ? (
                <div className="px-2.5 py-1 text-[11px] text-zinc-400">
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
                      className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-zinc-850 text-zinc-100 font-medium'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
                      }`}
                      title={`Workspace: ${ws.name}`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <IconBriefcase size={14} className="text-zinc-400 shrink-0" />
                        <span className="truncate">{ws.name}</span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400">
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
              <div className="text-[10px] font-medium tracking-wider text-zinc-400 uppercase flex items-center gap-1.5">
                <IconTag size={13} />
                <span>Tags</span>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingTag(prev => !prev)}
                className="p-0.5 hover:bg-zinc-800 rounded text-zinc-400 hover:text-zinc-200"
                title="Criar Tag"
              >
                <IconPlus size={14} />
              </button>
            </div>

            {isAddingTag && (
              <form onSubmit={handleCreateTag} className="p-2 mb-1 bg-zinc-900 border border-zinc-800 rounded-md space-y-2">
                <input
                  type="text"
                  value={newTagName}
                  onChange={e => setNewTagName(e.target.value)}
                  placeholder="Nome da tag..."
                  autoFocus
                  className="w-full px-2 py-1 bg-zinc-950 border border-zinc-800 rounded text-xs text-zinc-200 placeholder-zinc-400 focus:outline-none focus:border-zinc-700"
                />
                <div className="flex items-center justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingTag(false)}
                    className="px-2 py-0.5 text-[11px] text-zinc-400 hover:text-zinc-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-2 py-0.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 rounded text-[11px] font-medium"
                  >
                    Salvar
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-0.5">
              {tags.length === 0 ? (
                <div className="px-2.5 py-1 text-[11px] text-zinc-400">
                  Nenhuma tag.
                </div>
              ) : (
                tags.map(tag => {
                  const isSelected = selectedTagId === tag.id;
                  return (
                    <div
                      key={tag.id}
                      className={`group flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors ${
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
                        className="flex items-center gap-2 flex-1 text-left truncate"
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
                        className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-zinc-200 p-0.5"
                        title="Excluir Tag"
                      >
                        <IconTrash size={12} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Footer */}
      <div className={`p-2 border-t border-zinc-900 bg-zinc-950 flex items-center justify-between text-xs text-zinc-400 ${
        isCollapsed ? 'flex-col gap-2' : ''
      }`}>
        {!isCollapsed ? (
          <div className="flex items-center gap-1.5 px-1" title="100% Offline e local">
            <IconShieldLock size={14} className="text-zinc-400" />
            <span className="text-[11px] font-medium text-zinc-400">100% Offline</span>
          </div>
        ) : null}

        {isCollapsed ? (
          <Tooltip content="Configurações" position="right" className="w-full">
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="w-full flex items-center justify-center p-2 hover:bg-zinc-900 hover:text-zinc-200 rounded-md transition-colors text-zinc-400 cursor-pointer"
            >
              <IconSettings size={16} />
            </button>
          </Tooltip>
        ) : (
          <Tooltip content="Configurações (Editor, Terminal, IA, Backup)" position="top">
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-1 p-1.5 hover:bg-zinc-900 hover:text-zinc-200 rounded-md transition-colors text-zinc-400 cursor-pointer"
            >
              <IconSettings size={16} />
            </button>
          </Tooltip>
        )}
      </div>
    </aside>
  );
};
