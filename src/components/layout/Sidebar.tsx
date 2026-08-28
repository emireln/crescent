import React, { useState } from 'react';
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
} from '@tabler/icons-react';
import { useProjects } from '../../context/ProjectContext';
import { FilterCategory } from '../../types';

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

  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#a1a1aa');

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

  const navItems: {
    id: FilterCategory;
    label: string;
    icon: React.ReactNode;
    count: number;
  }[] = [
    {
      id: 'all',
      label: 'Todos os Projetos',
      icon: <IconFolders size={16} />,
      count: stats.total,
    },
    {
      id: 'favorites',
      label: 'Favoritos & Fixados',
      icon: <IconStar size={16} />,
      count: stats.favorites,
    },
    {
      id: 'active',
      label: 'Ativos',
      icon: <IconPlayerPlay size={16} />,
      count: stats.active,
    },
    {
      id: 'on_hold',
      label: 'Em Espera',
      icon: <IconPlayerPause size={16} />,
      count: stats.onHold,
    },
    {
      id: 'completed',
      label: 'Concluídos',
      icon: <IconCircleCheck size={16} />,
      count: stats.completed,
    },
    {
      id: 'archived',
      label: 'Arquivados',
      icon: <IconArchive size={16} />,
      count: stats.archived,
    },
  ];

  return (
    <aside className="w-60 bg-zinc-950 border-r border-zinc-800 flex flex-col h-full shrink-0 select-none">
      {/* Top Action Buttons */}
      <div className="p-3 space-y-1.5 border-b border-zinc-800">
        <button
          type="button"
          onClick={() => setIsNewProjectOpen(true)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-zinc-100 hover:bg-white text-zinc-950 rounded font-semibold text-xs transition-colors shadow-sm"
        >
          <IconFolderPlus size={16} />
          <span>Novo Projeto</span>
        </button>

        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="flex items-center justify-center gap-1.5 px-2 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-200 rounded text-[11px] transition-colors font-medium"
            title="Escanear diretórios (Ctrl + F)"
          >
            <IconScan size={14} className="text-zinc-400" />
            <span>Escanear</span>
          </button>

          <button
            type="button"
            onClick={() => setIsCodeSearchOpen(true)}
            className="flex items-center justify-center gap-1.5 px-2 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-200 rounded text-[11px] transition-colors font-medium"
            title="Buscar código em todos os projetos (Ctrl + Shift + F)"
          >
            <IconCode size={14} className="text-zinc-400" />
            <span>Buscar Código</span>
          </button>
        </div>
      </div>

      {/* Main Navigation List */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-5 custom-scrollbar">
        {/* Navigation Categories */}
        <div>
          <div className="px-2 pb-1.5 text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">
            Navegação
          </div>
          <div className="space-y-0.5">
            {navItems.map(item => {
              const isSelected = selectedCategory === item.id && selectedTagId === null && selectedWorkspaceId === null;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(item.id);
                    setSelectedTagId(null);
                    setSelectedWorkspaceId(null);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors ${
                    isSelected
                      ? 'bg-zinc-850 text-zinc-50 font-semibold border border-zinc-700'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={isSelected ? 'text-zinc-100' : 'text-zinc-500'}>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>
                  <span
                    className={`text-[11px] px-1.5 py-0.2 rounded font-mono ${
                      isSelected ? 'bg-zinc-800 text-zinc-100' : 'bg-zinc-900 text-zinc-500'
                    }`}
                  >
                    {item.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Workspaces Section */}
        <div>
          <div className="flex items-center justify-between px-2 pb-1.5">
            <div className="text-[11px] font-semibold tracking-wider text-zinc-500 uppercase flex items-center gap-1.5">
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
            {workspaces.map(ws => {
              const isSelected = selectedWorkspaceId === ws.id;
              return (
                <button
                  key={ws.id}
                  type="button"
                  onClick={() => {
                    if (selectedWorkspaceId === ws.id) {
                      setSelectedWorkspaceId(null);
                    } else {
                      setSelectedWorkspaceId(ws.id);
                      setSelectedTagId(null);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors ${
                    isSelected
                      ? 'bg-zinc-850 text-zinc-100 font-semibold border border-zinc-700'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
                  }`}
                >
                  <span className="truncate">{ws.name}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-500">
                    {ws.project_ids.length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tracking Highlights */}
        <div>
          <div className="px-2 pb-1.5 text-[11px] font-semibold tracking-wider text-zinc-500 uppercase">
            Rastreamento
          </div>
          <div className="space-y-0.5">
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('dirty');
                setSelectedTagId(null);
                setSelectedWorkspaceId(null);
              }}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors ${
                selectedCategory === 'dirty' && selectedTagId === null && selectedWorkspaceId === null
                  ? 'bg-zinc-850 text-zinc-100 font-semibold border border-zinc-700'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2">
                <IconGitPullRequest size={16} className="text-zinc-400" />
                <span>Git Modificado</span>
              </div>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded font-mono ${
                  selectedCategory === 'dirty'
                    ? 'bg-zinc-800 text-zinc-100 border border-zinc-700'
                    : 'bg-zinc-900 text-zinc-500'
                }`}
              >
                {stats.dirty}
              </span>
            </button>

            {stats.missing > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('missing');
                  setSelectedTagId(null);
                  setSelectedWorkspaceId(null);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors ${
                  selectedCategory === 'missing' && selectedTagId === null && selectedWorkspaceId === null
                    ? 'bg-zinc-850 text-zinc-100 font-semibold border border-zinc-700'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2">
                  <IconAlertTriangle size={16} className="text-zinc-400" />
                  <span>Pastas Ausentes</span>
                </div>
                <span className="text-[11px] px-1.5 py-0.2 rounded font-mono bg-zinc-800 text-zinc-100 border border-zinc-700">
                  {stats.missing}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsAiChatOpen(true)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs text-zinc-300 hover:text-zinc-100 hover:bg-zinc-900 transition-colors border border-transparent font-medium"
            >
              <div className="flex items-center gap-2">
                <IconBrain size={16} className="text-zinc-200" />
                <span>Crescent AI (Chat)</span>
              </div>
              <kbd className="text-[10px] font-mono text-zinc-400 bg-zinc-850 px-1 py-0.2 rounded border border-zinc-800">Ctrl+J</kbd>
            </button>

            <button
              type="button"
              onClick={() => setIsDiskCleanerOpen(true)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-colors border border-transparent"
            >
              <div className="flex items-center gap-2">
                <IconDatabase size={16} className="text-zinc-400" />
                <span>Limpador de Disco</span>
              </div>
            </button>
          </div>
        </div>

        {/* Tags Section */}
        <div>
          <div className="flex items-center justify-between px-2 pb-1.5">
            <div className="text-[11px] font-semibold tracking-wider text-zinc-500 uppercase flex items-center gap-1.5">
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

          {/* Inline Add Tag Form */}
          {isAddingTag && (
            <form onSubmit={handleCreateTag} className="p-2 mb-2 bg-zinc-900 border border-zinc-800 rounded space-y-2">
              <input
                type="text"
                value={newTagName}
                onChange={e => setNewTagName(e.target.value)}
                placeholder="Nome da tag..."
                autoFocus
                className="w-full px-2 py-1 bg-zinc-950 border border-zinc-800 rounded text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {['#ffffff', '#d4d4d8', '#a1a1aa', '#71717a', '#52525b', '#3f3f46'].map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewTagColor(color)}
                      className={`w-3.5 h-3.5 rounded-full transition-transform ${
                        newTagColor === color ? 'scale-125 ring-2 ring-zinc-300' : 'opacity-60 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingTag(false)}
                    className="px-2 py-0.5 text-[11px] text-zinc-400 hover:text-zinc-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-2 py-0.5 bg-zinc-100 hover:bg-white text-zinc-950 rounded text-[11px] font-semibold"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="space-y-0.5">
            {tags.map(tag => {
              const isSelected = selectedTagId === tag.id;
              return (
                <div
                  key={tag.id}
                  className={`group flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors ${
                    isSelected
                      ? 'bg-zinc-850 text-zinc-100 font-semibold border border-zinc-700'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 border border-transparent'
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
                  >
                    <span className="text-zinc-500 font-mono">#</span>
                    <span className="truncate">{tag.name}</span>
                  </button>
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      deleteTag(tag.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-zinc-200 p-0.5"
                    title="Excluir Tag"
                  >
                    <IconTrash size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Footer / Settings */}
      <div className="p-3 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between text-xs text-zinc-500">
        <div className="flex items-center gap-1.5" title="100% Offline e local">
          <IconShieldLock size={14} className="text-zinc-400" />
          <span className="text-[11px] font-medium text-zinc-400">100% Offline</span>
        </div>

        <button
          type="button"
          onClick={() => setIsSettingsOpen(true)}
          className="flex items-center gap-1 p-1 hover:bg-zinc-850 hover:text-zinc-200 rounded transition-colors text-zinc-400"
          title="Configurações do Crescent"
        >
          <IconSettings size={15} />
        </button>
      </div>
    </aside>
  );
};
