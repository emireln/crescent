import React, { useState } from 'react';
import {
  IconX,
  IconSettings,
  IconCode,
  IconTerminal2,
  IconScan,
  IconDatabase,
  IconDownload,
  IconDeviceFloppy,
  IconCheck,
} from '@tabler/icons-react';
import { useProjects } from '../../context/ProjectContext';
import { api } from '../../services/api';

export const SettingsModal: React.FC = () => {
  const { isSettingsOpen, setIsSettingsOpen, settings, saveSetting } = useProjects();

  const [editor, setEditor] = useState(settings.default_editor);
  const [customEditorPath, setCustomEditorPath] = useState(settings.custom_editor_path);
  const [terminal, setTerminal] = useState(settings.default_terminal);
  const [customTerminalPath, setCustomTerminalPath] = useState(settings.custom_terminal_path);
  const [scanDepth, setScanDepth] = useState(settings.scan_depth);
  const [scanIgnore, setScanIgnore] = useState(settings.scan_ignore);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isSettingsOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveSetting('default_editor', editor);
    await saveSetting('custom_editor_path', customEditorPath);
    await saveSetting('default_terminal', terminal);
    await saveSetting('custom_terminal_path', customTerminalPath);
    await saveSetting('scan_depth', scanDepth);
    await saveSetting('scan_ignore', scanIgnore);

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setIsSettingsOpen(false);
    }, 800);
  };

  const handleExportBackup = async () => {
    try {
      const jsonStr = await api.exportDatabase();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `crescent_backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Erro ao exportar banco:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-zinc-100 font-semibold text-sm">
            <IconSettings size={18} className="text-zinc-400" />
            <span>Configurações do Crescent</span>
          </div>
          <button
            type="button"
            onClick={() => setIsSettingsOpen(false)}
            className="p-1 text-zinc-400 hover:text-white rounded"
          >
            <IconX size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Editor Settings */}
          <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
              <IconCode size={16} className="text-zinc-400" />
              <span>Editor de Código Padrão</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {[
                { id: 'code', label: 'VS Code' },
                { id: 'cursor', label: 'Cursor' },
                { id: 'zed', label: 'Zed' },
                { id: 'idea', label: 'IntelliJ IDEA' },
                { id: 'webstorm', label: 'WebStorm' },
                { id: 'pycharm', label: 'PyCharm' },
                { id: 'custom', label: 'Personalizado' },
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setEditor(opt.id)}
                  className={`px-3 py-1.5 rounded text-xs text-left border transition-colors ${
                    editor === opt.id
                      ? 'bg-zinc-800 text-zinc-100 border-zinc-600 font-semibold'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {editor === 'custom' && (
              <div className="pt-2">
                <label className="block text-[11px] text-zinc-400 mb-1">
                  Caminho do Executável do Editor
                </label>
                <input
                  type="text"
                  value={customEditorPath}
                  onChange={e => setCustomEditorPath(e.target.value)}
                  placeholder="C:\Program Files\MeuEditor\editor.exe"
                  className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 font-mono focus:outline-none focus:border-zinc-600"
                />
              </div>
            )}
          </div>

          {/* Terminal Settings */}
          <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
              <IconTerminal2 size={16} className="text-zinc-400" />
              <span>Terminal Padrão</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { id: 'powershell', label: 'PowerShell' },
                { id: 'wt', label: 'Windows Terminal' },
                { id: 'git-bash', label: 'Git Bash' },
                { id: 'cmd', label: 'Prompt (CMD)' },
                { id: 'custom', label: 'Personalizado' },
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setTerminal(opt.id)}
                  className={`px-3 py-1.5 rounded text-xs text-left border transition-colors ${
                    terminal === opt.id
                      ? 'bg-zinc-800 text-zinc-100 border-zinc-600 font-semibold'
                      : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {terminal === 'custom' && (
              <div className="pt-2">
                <label className="block text-[11px] text-zinc-400 mb-1">
                  Caminho do Executável do Terminal
                </label>
                <input
                  type="text"
                  value={customTerminalPath}
                  onChange={e => setCustomTerminalPath(e.target.value)}
                  placeholder="C:\Program Files\MeuTerminal\terminal.exe"
                  className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 font-mono focus:outline-none focus:border-zinc-600"
                />
              </div>
            )}
          </div>

          {/* Scanner Defaults */}
          <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
              <IconScan size={16} className="text-zinc-400" />
              <span>Opções Padrão de Varredura</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">
                  Profundidade Padrão de Pastas
                </label>
                <select
                  value={scanDepth}
                  onChange={e => setScanDepth(e.target.value)}
                  className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 focus:outline-none focus:border-zinc-600"
                >
                  <option value="2">2 níveis</option>
                  <option value="3">3 níveis</option>
                  <option value="4">4 níveis (recomendado)</option>
                  <option value="5">5 níveis</option>
                  <option value="6">6 níveis</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">
                  Diretórios Ignorados
                </label>
                <input
                  type="text"
                  value={scanIgnore}
                  onChange={e => setScanIgnore(e.target.value)}
                  className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 font-mono focus:outline-none focus:border-zinc-600"
                />
              </div>
            </div>
          </div>

          {/* Backup & Persistence */}
          <div className="p-3.5 bg-zinc-950 border border-zinc-800 rounded space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
                <IconDatabase size={16} className="text-zinc-400" />
                <span>Persistência & Backup</span>
              </div>
              <button
                type="button"
                onClick={handleExportBackup}
                className="flex items-center gap-1.5 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded text-xs font-medium transition-colors"
              >
                <IconDownload size={13} />
                <span>Exportar Backup JSON</span>
              </button>
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Todos os seus dados (projetos, tags, portas, scripts e anotações) são armazenados localmente no banco SQLite em <code>%AppData%/Crescent/crescent.db</code> sem nenhuma dependência de nuvem.
            </p>
          </div>

          {/* App Info */}
          <div className="p-3 bg-zinc-950 border border-zinc-800 rounded flex items-center justify-between text-xs text-zinc-400">
            <div className="flex items-center gap-2.5">
              <img src="/crescent-logo.png" alt="Crescent Logo" className="h-5 w-auto object-contain rounded shrink-0" />
              <span className="text-zinc-200 font-medium">Crescent — Gerenciador Local de Projetos v0.1.0</span>
            </div>
            <span className="text-[11px] text-zinc-500 font-mono">100% Offline (PT-BR)</span>
          </div>

          {/* Footer Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsSettingsOpen(false)}
              className="px-3 py-1.5 text-xs text-zinc-400 hover:text-zinc-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-1.5 bg-zinc-100 hover:bg-white text-zinc-950 rounded text-xs font-semibold shadow-sm transition-colors"
            >
              {savedSuccess ? (
                <>
                  <IconCheck size={15} />
                  <span>Salvo com sucesso!</span>
                </>
              ) : (
                <>
                  <IconDeviceFloppy size={15} />
                  <span>Salvar Configurações</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
