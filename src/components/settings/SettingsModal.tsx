import React, { useState, useEffect } from 'react';
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
  IconBrain,
  IconEye,
  IconEyeOff,
  IconRefresh,
} from '@tabler/icons-react';
import { useProjects } from '../../context/ProjectContext';
import { api } from '../../services/api';
import { ProviderIcon } from '../ai/ProviderIcons';
import { EditorIcon } from '../common/EditorIcons';
import { CustomSelect } from '../common/CustomSelect';

export const SettingsModal: React.FC = () => {
  const { isSettingsOpen, setIsSettingsOpen, settings, saveSetting } = useProjects();

  const [editor, setEditor] = useState(settings.default_editor);
  const [customEditorPath, setCustomEditorPath] = useState(settings.custom_editor_path);
  const [terminal, setTerminal] = useState(settings.default_terminal);
  const [customTerminalPath, setCustomTerminalPath] = useState(settings.custom_terminal_path);
  const [scanDepth, setScanDepth] = useState(settings.scan_depth);
  const [scanIgnore, setScanIgnore] = useState(settings.scan_ignore);

  // AI Configuration States
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434');
  const [geminiKey, setGeminiKey] = useState('');
  const [openAiKey, setOpenAiKey] = useState('');
  const [deepSeekKey, setDeepSeekKey] = useState('');
  const [claudeKey, setClaudeKey] = useState('');
  const [highDensityMode, setHighDensityMode] = useState(true);

  // Show/hide API keys
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [ollamaTesting, setOllamaTesting] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isSettingsOpen) {
      setEditor(settings.default_editor);
      setCustomEditorPath(settings.custom_editor_path);
      setTerminal(settings.default_terminal);
      setCustomTerminalPath(settings.custom_terminal_path);
      setScanDepth(settings.scan_depth);
      setScanIgnore(settings.scan_ignore);

      // Load AI settings from SQLite
      api.getSettings().then(res => {
        const raw = res as unknown as Record<string, string>;
        if (raw.ai_ollama_url) setOllamaUrl(raw.ai_ollama_url);
        if (raw.ai_gemini_key) setGeminiKey(raw.ai_gemini_key);
        if (raw.ai_openai_key) setOpenAiKey(raw.ai_openai_key);
        if (raw.ai_deepseek_key) setDeepSeekKey(raw.ai_deepseek_key);
        if (raw.ai_claude_key) setClaudeKey(raw.ai_claude_key);
        if (raw.ai_high_density_mode) setHighDensityMode(raw.ai_high_density_mode !== 'false');
      }).catch(console.error);
    }
  }, [isSettingsOpen, settings]);

  if (!isSettingsOpen) return null;

  const toggleShowKey = (key: string) => {
    setShowKeys(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleTestOllama = async () => {
    setOllamaTesting(true);
    setOllamaStatus(null);
    try {
      const models = await api.getOllamaModels(ollamaUrl);
      if (models.length > 0) {
        setOllamaStatus(`Conectado com sucesso. ${models.length} modelo(s) detectado(s): ${models.slice(0, 3).join(', ')}...`);
      } else {
        setOllamaStatus('Conectado ao Ollama (nenhum modelo baixado ainda).');
      }
    } catch (err: any) {
      setOllamaStatus(`Falha ao conectar: ${err?.message || err}`);
    } finally {
      setOllamaTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveSetting('default_editor', editor);
    await saveSetting('custom_editor_path', customEditorPath);
    await saveSetting('default_terminal', terminal);
    await saveSetting('custom_terminal_path', customTerminalPath);
    await saveSetting('scan_depth', scanDepth);
    await saveSetting('scan_ignore', scanIgnore);

    // Save AI settings
    await saveSetting('ai_ollama_url', ollamaUrl);
    await saveSetting('ai_gemini_key', geminiKey);
    await saveSetting('ai_openai_key', openAiKey);
    await saveSetting('ai_deepseek_key', deepSeekKey);
    await saveSetting('ai_claude_key', claudeKey);
    await saveSetting('ai_high_density_mode', highDensityMode ? 'true' : 'false');

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
    <div className="fixed top-11 inset-x-0 bottom-0 z-40 flex items-center justify-center bg-black/75 p-4 select-none animate-in fade-in duration-150">
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
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
        <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          {/* AI Settings Section */}
          <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-100">
                <IconBrain size={16} className="text-zinc-100" />
                <span>Inteligência Artificial & Provedores (LLMs)</span>
              </div>
            </div>

            {/* High Density Token Optimizer Toggle */}
            <div className="flex items-center justify-between p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
              <div className="space-y-0.5">
                <div className="text-xs font-semibold text-zinc-200">Modo Alta Densidade (Otimizador de Tokens / Caveman)</div>
                <div className="text-[11px] text-zinc-400">
                  Comprime prompts, remove formalismos e gera respostas técnicas concisas com economia de até 60% em tokens.
                </div>
              </div>
              <input
                type="checkbox"
                checked={highDensityMode}
                onChange={e => setHighDensityMode(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-700 text-zinc-100 bg-zinc-900 focus:ring-0 cursor-pointer"
              />
            </div>

            {/* Ollama Local */}
            <div className="space-y-1.5 p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-200">
                  <ProviderIcon provider="ollama" size={14} />
                  <span>Ollama (Local / Offline)</span>
                </div>
                <button
                  type="button"
                  onClick={handleTestOllama}
                  disabled={ollamaTesting}
                  className="flex items-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 rounded-md text-[11px] font-medium transition-colors cursor-pointer"
                >
                  <IconRefresh size={12} className={ollamaTesting ? 'animate-spin' : ''} />
                  <span>{ollamaTesting ? 'Testando...' : 'Testar Conexão'}</span>
                </button>
              </div>
              <input
                type="text"
                value={ollamaUrl}
                onChange={e => setOllamaUrl(e.target.value)}
                placeholder="http://localhost:11434"
                className="w-full px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 font-mono focus:outline-none focus:border-zinc-600"
              />
              {ollamaStatus && (
                <p className="text-[11px] font-mono text-zinc-300 pt-1">{ollamaStatus}</p>
              )}
            </div>

            {/* Google Gemini */}
            <div className="space-y-1.5 p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
              <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-200">
                <ProviderIcon provider="gemini" size={14} />
                <span>Google Gemini API Key</span>
              </div>
              <div className="relative">
                <input
                  type={showKeys['gemini'] ? 'text' : 'password'}
                  value={geminiKey}
                  onChange={e => setGeminiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-3 py-1.5 pr-9 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 font-mono focus:outline-none focus:border-zinc-600"
                />
                <button
                  type="button"
                  onClick={() => toggleShowKey('gemini')}
                  className="absolute right-2 top-2 text-zinc-500 hover:text-zinc-300"
                >
                  {showKeys['gemini'] ? <IconEyeOff size={14} /> : <IconEye size={14} />}
                </button>
              </div>
            </div>

            {/* OpenAI */}
            <div className="space-y-1.5 p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
              <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-200">
                <ProviderIcon provider="openai" size={14} />
                <span>OpenAI API Key</span>
              </div>
              <div className="relative">
                <input
                  type={showKeys['openai'] ? 'text' : 'password'}
                  value={openAiKey}
                  onChange={e => setOpenAiKey(e.target.value)}
                  placeholder="sk-proj-..."
                  className="w-full px-3 py-1.5 pr-9 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 font-mono focus:outline-none focus:border-zinc-600"
                />
                <button
                  type="button"
                  onClick={() => toggleShowKey('openai')}
                  className="absolute right-2 top-2 text-zinc-500 hover:text-zinc-300"
                >
                  {showKeys['openai'] ? <IconEyeOff size={14} /> : <IconEye size={14} />}
                </button>
              </div>
            </div>

            {/* DeepSeek */}
            <div className="space-y-1.5 p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
              <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-200">
                <ProviderIcon provider="deepseek" size={14} />
                <span>DeepSeek API Key</span>
              </div>
              <div className="relative">
                <input
                  type={showKeys['deepseek'] ? 'text' : 'password'}
                  value={deepSeekKey}
                  onChange={e => setDeepSeekKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full px-3 py-1.5 pr-9 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 font-mono focus:outline-none focus:border-zinc-600"
                />
                <button
                  type="button"
                  onClick={() => toggleShowKey('deepseek')}
                  className="absolute right-2 top-2 text-zinc-500 hover:text-zinc-300"
                >
                  {showKeys['deepseek'] ? <IconEyeOff size={14} /> : <IconEye size={14} />}
                </button>
              </div>
            </div>

            {/* Anthropic Claude */}
            <div className="space-y-1.5 p-3 bg-zinc-950 border border-zinc-800 rounded-lg">
              <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-200">
                <ProviderIcon provider="claude" size={14} />
                <span>Anthropic Claude API Key</span>
              </div>
              <div className="relative">
                <input
                  type={showKeys['claude'] ? 'text' : 'password'}
                  value={claudeKey}
                  onChange={e => setClaudeKey(e.target.value)}
                  placeholder="sk-ant-api..."
                  className="w-full px-3 py-1.5 pr-9 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 font-mono focus:outline-none focus:border-zinc-600"
                />
                <button
                  type="button"
                  onClick={() => toggleShowKey('claude')}
                  className="absolute right-2 top-2 text-zinc-500 hover:text-zinc-300"
                >
                  {showKeys['claude'] ? <IconEyeOff size={14} /> : <IconEye size={14} />}
                </button>
              </div>
            </div>
          </div>

          {/* Editor Settings */}
          <div className="p-3.5 bg-zinc-900 border border-zinc-800 rounded space-y-3">
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
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs text-left transition-colors cursor-pointer ${
                    editor === opt.id
                      ? 'bg-zinc-800 text-zinc-100 font-medium'
                      : 'bg-zinc-950 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                  }`}
                >
                  <EditorIcon editor={opt.id} size={15} className={editor === opt.id ? 'text-zinc-100' : 'text-zinc-400'} />
                  <span>{opt.label}</span>
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
                  className="w-full px-3 py-1.5 bg-zinc-950 rounded text-xs text-zinc-200 font-mono focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Terminal Settings */}
          <div className="p-3.5 bg-zinc-900 rounded-lg space-y-3">
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
                  className={`px-3 py-1.5 rounded-md text-xs text-left transition-colors cursor-pointer ${
                    terminal === opt.id
                      ? 'bg-zinc-800 text-zinc-100 font-medium'
                      : 'bg-zinc-950 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
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
                  className="w-full px-3 py-1.5 bg-zinc-950 rounded text-xs text-zinc-200 font-mono focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Scanner Defaults */}
          <div className="p-3.5 bg-zinc-900 rounded-lg space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
              <IconScan size={16} className="text-zinc-400" />
              <span>Opções Padrão de Varredura</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">
                  Profundidade Padrão de Pastas
                </label>
                <CustomSelect
                  value={scanDepth}
                  onChange={v => setScanDepth(v)}
                  options={[
                    { value: '2', label: '2 níveis' },
                    { value: '3', label: '3 níveis' },
                    { value: '4', label: '4 níveis (recomendado)' },
                    { value: '5', label: '5 níveis' },
                    { value: '6', label: '6 níveis' },
                  ]}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">
                  Diretórios Ignorados
                </label>
                <input
                  type="text"
                  value={scanIgnore}
                  onChange={e => setScanIgnore(e.target.value)}
                  className="w-full px-3 py-1.5 bg-zinc-950 rounded text-xs text-zinc-200 font-mono focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Backup & Persistence */}
          <div className="p-3.5 bg-zinc-900 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
                <IconDatabase size={16} className="text-zinc-400" />
                <span>Persistência & Backup</span>
              </div>
              <button
                type="button"
                onClick={handleExportBackup}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-750 text-zinc-200 rounded-md text-xs font-medium transition-colors cursor-pointer"
              >
                <IconDownload size={13} />
                <span>Exportar Backup JSON</span>
              </button>
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Todos os seus dados (projetos, tags, conversas de IA, portas, scripts e anotações) são armazenados localmente no banco SQLite em <code>%AppData%/Crescent/crescent.db</code> sem nuvem obrigatória.
            </p>
          </div>

          {/* App Info */}
          <div className="p-3 bg-zinc-900 border border-zinc-800 rounded flex items-center justify-between text-xs text-zinc-400">
            <div className="flex items-center gap-2.5">
              <img src="/crescent-logo.png" alt="Crescent Logo" className="h-5 w-auto object-contain rounded shrink-0" />
              <span className="text-zinc-200 font-medium">Crescent — Gerenciador Local de Projetos v0.1.3</span>
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
              className="flex items-center gap-1.5 px-4 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-950 rounded text-xs font-medium shadow-sm transition-colors cursor-pointer"
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
