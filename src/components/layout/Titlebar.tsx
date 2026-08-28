import React, { useState, useEffect } from 'react';
import {
  IconMinus,
  IconSquare,
  IconCopy,
  IconX,
  IconSearch,
  IconFolderPlus,
  IconScan,
} from '@tabler/icons-react';
import { useProjects } from '../../context/ProjectContext';
import { api } from '../../services/api';

export const Titlebar: React.FC = () => {
  const {
    projects,
    setIsCommandPaletteOpen,
    setIsNewProjectOpen,
    setIsScannerOpen,
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
      const max = await api.windowToggleMaximize();
      setIsMaximized(max);
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
      className="h-10 w-full bg-zinc-950 border-b border-zinc-800 flex items-center justify-between px-3 shrink-0 select-none z-50"
    >
      {/* Left: Brand / Logo */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 text-zinc-100 font-semibold tracking-wide text-sm">
          <img
            src="/crescent-logo.png"
            alt="Crescent"
            className="h-5 w-auto max-w-[20px] object-contain rounded shrink-0"
          />
          <span>Crescent</span>
        </div>

        <span className="text-zinc-800 text-xs">|</span>

        <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
          <span>{projects.length} {projects.length === 1 ? 'projeto' : 'projetos'}</span>
        </div>
      </div>

      {/* Center: Quick Search / Command Palette Bar */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsCommandPaletteOpen(true)}
          className="flex items-center justify-between gap-6 px-3 py-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded text-xs text-zinc-400 hover:text-zinc-200 transition-colors w-72 h-7"
        >
          <div className="flex items-center gap-2">
            <IconSearch size={13} className="text-zinc-500" />
            <span className="truncate">Buscar projetos, stacks, tags...</span>
          </div>
          <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-[10px] text-zinc-300 font-mono">
            Ctrl + K
          </kbd>
        </button>

        <button
          type="button"
          onClick={() => setIsNewProjectOpen(true)}
          title="Adicionar Projeto (Ctrl + N)"
          className="flex items-center gap-1 px-2.5 h-7 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded text-xs text-zinc-300 hover:text-zinc-100 transition-colors"
        >
          <IconFolderPlus size={14} className="text-zinc-400" />
          <span className="hidden sm:inline">Adicionar</span>
        </button>

        <button
          type="button"
          onClick={() => setIsScannerOpen(true)}
          title="Varredura de Diretórios (Ctrl + F)"
          className="flex items-center gap-1 px-2.5 h-7 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded text-xs text-zinc-300 hover:text-zinc-100 transition-colors"
        >
          <IconScan size={14} className="text-zinc-400" />
          <span className="hidden sm:inline">Escanear</span>
        </button>
      </div>

      {/* Right: Window Controls */}
      <div className="flex items-center h-full -mr-3" data-no-drag>
        <button
          type="button"
          onClick={handleMinimize}
          className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          title="Minimizar"
        >
          <IconMinus size={14} />
        </button>

        <button
          type="button"
          onClick={handleToggleMaximize}
          className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          title={isMaximized ? 'Restaurar' : 'Maximizar'}
        >
          {isMaximized ? <IconCopy size={13} /> : <IconSquare size={13} />}
        </button>

        <button
          type="button"
          onClick={handleClose}
          className="w-10 h-10 flex items-center justify-center text-zinc-400 hover:text-zinc-950 hover:bg-zinc-200 transition-colors"
          title="Fechar"
        >
          <IconX size={14} />
        </button>
      </div>
    </header>
  );
};
