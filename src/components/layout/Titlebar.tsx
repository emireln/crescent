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

export const Titlebar: React.FC = () => {
  const {
    projects,
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
      className="h-10 w-full bg-zinc-950 border-b border-zinc-800/80 flex items-center justify-between px-3 shrink-0 select-none z-50"
    >
      {/* Left: Brand / Logo */}
      <div className="flex items-center gap-2.5">
        <div className="flex items-center gap-2 text-zinc-100 font-semibold tracking-tight text-xs">
          <img
            src="/crescent-logo.png"
            alt="Crescent"
            className="h-4 w-auto max-w-[18px] object-contain rounded shrink-0"
          />
          <span>Crescent</span>
        </div>

        <span className="text-zinc-700 text-xs font-light">/</span>

        <span className="text-[11px] text-zinc-400 font-mono">
          {projects.length} {projects.length === 1 ? 'projeto' : 'projetos'}
        </span>
      </div>

      {/* Center: Search & Quick Actions */}
      <div className="flex items-center gap-1.5">
        {/* Command Palette Button */}
        <button
          type="button"
          onClick={() => setIsCommandPaletteOpen(true)}
          title="Buscar projetos e comandos (Ctrl + K)"
          className="group flex items-center justify-between gap-4 px-2.5 h-7 bg-zinc-900/70 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 rounded-md text-xs text-zinc-400 hover:text-zinc-200 transition-all w-56 sm:w-64 lg:w-72"
        >
          <div className="flex items-center gap-2 min-w-0">
            <IconSearch size={13} className="text-zinc-500 group-hover:text-zinc-300 transition-colors shrink-0" />
            <span className="truncate text-[11px]">Buscar projetos, tags...</span>
          </div>
          <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700/70 rounded text-[10px] text-zinc-300 font-mono shrink-0">
            Ctrl K
          </kbd>
        </button>

        {/* Action Buttons */}
        <button
          type="button"
          onClick={() => setIsNewProjectOpen(true)}
          title="Novo Projeto (Ctrl + N)"
          className="flex items-center gap-1 px-2 h-7 bg-transparent hover:bg-zinc-850 text-zinc-400 hover:text-zinc-100 rounded-md text-xs transition-colors"
        >
          <IconPlus size={14} className="text-zinc-400" />
          <span className="hidden md:inline text-[11px] font-medium">Novo</span>
        </button>

        <button
          type="button"
          onClick={() => setIsScannerOpen(true)}
          title="Escanear Pastas (Ctrl + F)"
          className="flex items-center gap-1 px-2 h-7 bg-transparent hover:bg-zinc-850 text-zinc-400 hover:text-zinc-100 rounded-md text-xs transition-colors"
        >
          <IconScan size={14} className="text-zinc-400" />
          <span className="hidden md:inline text-[11px] font-medium">Escanear</span>
        </button>

        <button
          type="button"
          onClick={() => setIsAiChatOpen(true)}
          title="Crescent AI Assistant (Ctrl + J)"
          className="flex items-center gap-1 px-2 h-7 bg-transparent hover:bg-zinc-850 text-zinc-300 hover:text-white rounded-md text-xs transition-colors"
        >
          <IconBrain size={14} className="text-zinc-300" />
          <span className="hidden md:inline text-[11px] font-medium">IA</span>
        </button>
      </div>

      {/* Right Area: Minimalist Creator Links + Native Window Controls */}
      <div className="flex items-center gap-1">
        {/* Clean Icon-Only Links with Tooltips */}
        <div className="flex items-center gap-0.5 mr-1" data-no-drag>
          <button
            type="button"
            onClick={() => api.openUrl('https://emirln.com')}
            title="Portfolio (emirln.com)"
            className="p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-850 rounded-md transition-colors"
          >
            <IconWorld size={14} />
          </button>

          <button
            type="button"
            onClick={() => api.openUrl('https://buymeacoffee.com/emireln')}
            title="Apoiar o projeto (Buy Me a Coffee)"
            className="p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-850 rounded-md transition-colors"
          >
            <IconCoffee size={14} />
          </button>

          <button
            type="button"
            onClick={() => api.openUrl('https://github.com/emireln')}
            title="GitHub (@emireln)"
            className="p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-850 rounded-md transition-colors"
          >
            <IconBrandGithub size={14} />
          </button>
        </div>

        {/* Native Window Controls */}
        <div className="flex items-center h-full -mr-3" data-no-drag>
          <button
            type="button"
            onClick={handleMinimize}
            className="w-9 h-10 flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 transition-colors"
            title="Minimizar"
          >
            <IconMinus size={13} />
          </button>

          <button
            type="button"
            onClick={handleToggleMaximize}
            className="w-9 h-10 flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 transition-colors"
            title={isMaximized ? 'Restaurar' : 'Maximizar'}
          >
            {isMaximized ? <IconCopy size={12} /> : <IconSquare size={12} />}
          </button>

          <button
            type="button"
            onClick={handleClose}
            className="w-9 h-10 flex items-center justify-center text-zinc-400 hover:text-zinc-950 hover:bg-zinc-200 transition-colors"
            title="Fechar"
          >
            <IconX size={13} />
          </button>
        </div>
      </div>
    </header>
  );
};
