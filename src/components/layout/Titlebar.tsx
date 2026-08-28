import React, { useState, useEffect } from 'react';
import {
  IconMinus,
  IconSquare,
  IconCopy,
  IconX,
  IconSearch,
  IconPlus,
  IconScan,
  IconWorld,
  IconCoffee,
  IconBrandGithub,
  IconBrain,
} from '@tabler/icons-react';
import { useProjects } from '../../context/ProjectContext';
import { api } from '../../services/api';
import { Tooltip } from '../common/Tooltip';

export const Titlebar: React.FC = () => {
  const {
    setIsCommandPaletteOpen,
    setIsNewProjectOpen,
    setIsScannerOpen,
    setIsAiChatOpen,
  } = useProjects();

  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const checkMaximized = async () => {
      try {
        const max = await api.windowIsMaximized();
        setIsMaximized(max);
      } catch {
        // Fallback in browser
      }
    };
    checkMaximized();
  }, []);

  const handleMinimize = async () => {
    try {
      await api.windowMinimize();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleMaximize = async () => {
    try {
      await api.windowToggleMaximize();
    } catch (e) {
      console.error(e);
    }
  };

  const handleClose = async () => {
    try {
      await api.windowClose();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <header
      data-tauri-drag-region
      className="relative z-50 h-11 w-full bg-zinc-950 flex items-center justify-between px-3.5 shrink-0 select-none"
    >
      {/* Left: Brand / Logo only */}
      <div className="flex items-center gap-2.5">
        <img
          src="/crescent-logo.png"
          alt="Crescent Logo"
          className="w-5 h-5 object-contain shrink-0 rounded"
        />
        <span className="font-semibold text-zinc-100 text-sm tracking-tight">Crescent</span>
      </div>

      {/* Center: Search & Quick Actions */}
      <div className="flex items-center gap-2">
        {/* Command Palette Capsule */}
        <Tooltip content="Buscar projetos, tags e comandos" shortcut="Ctrl K" position="bottom">
          <button
            type="button"
            onClick={() => setIsCommandPaletteOpen(true)}
            className="group flex items-center justify-between gap-6 px-3 h-8 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-xs text-zinc-400 hover:text-zinc-200 transition-colors w-60 sm:w-72 lg:w-80 cursor-pointer"
          >
            <div className="flex items-center gap-2 min-w-0">
              <IconSearch size={14} className="text-zinc-400 group-hover:text-zinc-200 transition-colors shrink-0" />
              <span className="truncate text-xs">Buscar projetos, tags...</span>
            </div>
            <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-[10px] text-zinc-300 font-mono shrink-0">
              Ctrl K
            </kbd>
          </button>
        </Tooltip>

        {/* Action Buttons */}
        <Tooltip content="Adicionar novo projeto" shortcut="Ctrl N" position="bottom">
          <button
            type="button"
            onClick={() => setIsNewProjectOpen(true)}
            className="flex items-center gap-1.5 px-2.5 h-8 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100 rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            <IconPlus size={14} className="text-zinc-400" />
            <span className="hidden sm:inline">Novo</span>
          </button>
        </Tooltip>

        <Tooltip content="Varredura de pastas no computador" shortcut="Ctrl F" position="bottom">
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="flex items-center gap-1.5 px-2.5 h-8 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100 rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            <IconScan size={14} className="text-zinc-400" />
            <span className="hidden sm:inline">Escanear</span>
          </button>
        </Tooltip>

        <Tooltip content="Crescent AI Assistant" shortcut="Ctrl J" position="bottom">
          <button
            type="button"
            onClick={() => setIsAiChatOpen(true)}
            className="flex items-center gap-1.5 px-2.5 h-8 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 hover:text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            <IconBrain size={14} className="text-zinc-300" />
            <span className="hidden sm:inline">IA</span>
          </button>
        </Tooltip>
      </div>

      {/* Right Area: Creator Links with Custom Tooltips + Window Controls */}
      <div className="flex items-center gap-1.5">
        {/* Creator Portfolio & Support Links */}
        <div className="flex items-center gap-1 mr-1" data-no-drag>
          <Tooltip content="Portfolio (emirln.com)" position="bottom">
            <button
              type="button"
              onClick={() => api.openUrl('https://emirln.com')}
              className="w-8 h-8 flex items-center justify-center bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 rounded-lg transition-colors cursor-pointer"
            >
              <IconWorld size={15} />
            </button>
          </Tooltip>

          <Tooltip content="Apoiar o projeto (Buy Me a Coffee)" position="bottom">
            <button
              type="button"
              onClick={() => api.openUrl('https://buymeacoffee.com/emireln')}
              className="w-8 h-8 flex items-center justify-center bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 rounded-lg transition-colors cursor-pointer"
            >
              <IconCoffee size={15} />
            </button>
          </Tooltip>

          <Tooltip content="GitHub (@emireln)" position="bottom">
            <button
              type="button"
              onClick={() => api.openUrl('https://github.com/emireln')}
              className="w-8 h-8 flex items-center justify-center bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 rounded-lg transition-colors cursor-pointer"
            >
              <IconBrandGithub size={15} />
            </button>
          </Tooltip>
        </div>

        {/* Window Controls */}
        <div className="flex items-center h-11 -mr-3.5" data-no-drag>
          <button
            type="button"
            onClick={handleMinimize}
            className="w-11 h-11 flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-850 transition-colors cursor-pointer"
            title="Minimizar"
          >
            <IconMinus size={14} />
          </button>

          <button
            type="button"
            onClick={handleToggleMaximize}
            className="w-11 h-11 flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-850 transition-colors cursor-pointer"
            title={isMaximized ? 'Restaurar' : 'Maximizar'}
          >
            {isMaximized ? <IconCopy size={13} /> : <IconSquare size={13} />}
          </button>

          <button
            type="button"
            onClick={handleClose}
            className="w-11 h-11 flex items-center justify-center text-zinc-400 hover:text-zinc-950 hover:bg-zinc-200 transition-colors cursor-pointer"
            title="Fechar"
          >
            <IconX size={14} />
          </button>
        </div>
      </div>
    </header>
  );
};
