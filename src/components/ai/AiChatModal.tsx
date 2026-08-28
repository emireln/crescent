import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  IconX,
  IconPlus,
  IconSend,
  IconTrash,
  IconSparkles,
  IconCopy,
  IconCheck,
  IconFolder,
  IconChevronDown,
  IconBrain,
} from '@tabler/icons-react';
import { useProjects } from '../../context/ProjectContext';
import { api } from '../../services/api';
import { AiConversation, AiMessage, AiModelInfo, AiProvider, PRESET_AI_MODELS } from '../../types';
import { ProviderIcon } from './ProviderIcons';
import { formatRelativeTime } from '../../utils/formatters';

export const AiChatModal: React.FC = () => {
  const {
    isAiChatOpen,
    setIsAiChatOpen,
    projects,
    aiActiveProjectId,
    setAiActiveProjectId,
  } = useProjects();

  const [conversations, setConversations] = useState<AiConversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<AiConversation | null>(null);
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const [availableModels, setAvailableModels] = useState<AiModelInfo[]>(PRESET_AI_MODELS);
  const [selectedProvider, setSelectedProvider] = useState<AiProvider>('ollama');
  const [selectedModel, setSelectedModel] = useState<string>('qwen2.5-coder:latest');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load conversations when opened or when active project filter changes
  useEffect(() => {
    if (isAiChatOpen) {
      loadConversations();
      detectOllamaModels();
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isAiChatOpen, aiActiveProjectId]);

  // Load messages when active conversation changes
  useEffect(() => {
    if (activeConversation) {
      setSelectedProvider(activeConversation.provider);
      setSelectedModel(activeConversation.model);
      api.getAiMessages(activeConversation.id)
        .then(setMessages)
        .catch(console.error);
    } else {
      setMessages([]);
    }
  }, [activeConversation]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  const loadConversations = async () => {
    try {
      const convs = await api.getAiConversations(aiActiveProjectId);
      setConversations(convs);
      if (convs.length > 0 && !activeConversation) {
        setActiveConversation(convs[0]);
      }
    } catch (err) {
      console.error('Erro ao carregar conversas de IA:', err);
    }
  };

  const detectOllamaModels = async () => {
    try {
      const ollamaNames = await api.getOllamaModels();
      if (ollamaNames && ollamaNames.length > 0) {
        const dynamicOllamaModels: AiModelInfo[] = ollamaNames.map(name => ({
          id: name,
          name: `${name} (Instalado)`,
          provider: 'ollama',
          context_window: '32k - 128k',
          description: 'Modelo local instalado e pronto para execução 100% offline.',
        }));

        setAvailableModels(prev => {
          const others = prev.filter(m => m.provider !== 'ollama');
          return [...dynamicOllamaModels, ...others];
        });

        // Auto select first installed model if currently on ollama
        if (selectedProvider === 'ollama' && !ollamaNames.includes(selectedModel)) {
          setSelectedModel(ollamaNames[0]);
        }
      }
    } catch (err) {
      // Ollama offline, keep preset models
    }
  };

  if (!isAiChatOpen) return null;

  const handleStartNewChat = async () => {
    try {
      const newConv = await api.createAiConversation(
        'Nova Conversa',
        aiActiveProjectId,
        selectedProvider,
        selectedModel
      );
      setConversations(prev => [newConv, ...prev]);
      setActiveConversation(newConv);
      setMessages([]);
    } catch (err) {
      console.error('Erro ao criar nova conversa:', err);
    }
  };

  const handleDeleteConversation = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await api.deleteAiConversation(id);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeConversation?.id === id) {
        const remaining = conversations.filter(c => c.id !== id);
        setActiveConversation(remaining.length > 0 ? remaining[0] : null);
      }
    } catch (err) {
      console.error('Erro ao excluir conversa:', err);
    }
  };

  const handleModelChange = async (modelInfo: AiModelInfo) => {
    setSelectedProvider(modelInfo.provider);
    setSelectedModel(modelInfo.id);
    setIsModelDropdownOpen(false);

    if (activeConversation) {
      try {
        await api.updateAiConversationModel(activeConversation.id, modelInfo.provider, modelInfo.id);
        setActiveConversation(prev => prev ? { ...prev, provider: modelInfo.provider, model: modelInfo.id } : null);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSendMessage = async () => {
    const text = inputValue.trim();
    if (!text || sending) return;

    let targetConv = activeConversation;
    if (!targetConv) {
      try {
        const created = await api.createAiConversation(
          text.slice(0, 32) + (text.length > 32 ? '...' : ''),
          aiActiveProjectId,
          selectedProvider,
          selectedModel
        );
        setConversations(prev => [created, ...prev]);
        setActiveConversation(created);
        targetConv = created;
      } catch (err) {
        console.error(err);
        return;
      }
    }

    const optimisticUserMsg: AiMessage = {
      id: Math.random().toString(),
      conversation_id: targetConv.id,
      role: 'user',
      content: text,
      provider: selectedProvider,
      model: selectedModel,
      prompt_tokens: 0,
      completion_tokens: 0,
      created_at: Date.now() / 1000,
    };

    setMessages(prev => [...prev, optimisticUserMsg]);
    setInputValue('');
    setSending(true);

    try {
      const assistantMsg = await api.sendAiChatMessage(
        targetConv.id,
        text,
        selectedProvider,
        selectedModel,
        aiActiveProjectId
      );
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: AiMessage = {
        id: Math.random().toString(),
        conversation_id: targetConv.id,
        role: 'assistant',
        content: `❌ **Erro ao conectar com ${selectedProvider.toUpperCase()}:**\n${err?.message || err}\n\n*Dica: Verifique se sua chave de API ou se o Ollama está ativo nas Configurações.*`,
        provider: selectedProvider,
        model: selectedModel,
        prompt_tokens: 0,
        completion_tokens: 0,
        created_at: Date.now() / 1000,
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setSending(false);
      loadConversations();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyToClipboard = (text: string, msgId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(msgId);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const currentProject = projects.find(p => p.id === aiActiveProjectId);
  const currentModelInfo = availableModels.find(m => m.id === selectedModel) || {
    id: selectedModel,
    name: selectedModel,
    provider: selectedProvider,
    context_window: 'Auto',
    description: '',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 select-none animate-in fade-in duration-150"
      onClick={() => setIsAiChatOpen(false)}
    >
      <div
        className="bg-zinc-950 border border-zinc-800 rounded-lg w-full max-w-5xl h-[85vh] shadow-2xl flex overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Left Sidebar: Conversations & Scopes */}
        <div className="w-64 border-r border-zinc-800 bg-zinc-900/40 flex flex-col justify-between shrink-0">
          <div>
            {/* Sidebar Header */}
            <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
                <IconBrain size={16} className="text-zinc-100" />
                <span>Crescent AI</span>
              </div>
              <button
                type="button"
                onClick={handleStartNewChat}
                className="flex items-center gap-1 px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded text-[11px] border border-zinc-700 font-medium transition-colors"
                title="Nova conversa"
              >
                <IconPlus size={13} />
                <span>Novo Chat</span>
              </button>
            </div>

            {/* Scope Selector */}
            <div className="p-2.5 border-b border-zinc-800 bg-zinc-950/40">
              <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mb-1.5">
                Escopo de Contexto RAG
              </label>
              <select
                value={aiActiveProjectId || ''}
                onChange={e => setAiActiveProjectId(e.target.value || null)}
                className="w-full px-2 py-1.5 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-200 focus:outline-none focus:border-zinc-600 cursor-pointer"
              >
                <option value="">Todos os Projetos ({projects.length})</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.primary_tech})
                  </option>
                ))}
              </select>
            </div>

            {/* Conversation List */}
            <div className="p-2 space-y-1 overflow-y-auto max-h-[calc(85vh-200px)] custom-scrollbar">
              <div className="px-2 py-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                Conversas Salvas
              </div>

              {conversations.length === 0 ? (
                <div className="p-4 text-center text-xs text-zinc-600 italic">
                  Nenhuma conversa registrada.
                </div>
              ) : (
                conversations.map(conv => {
                  const isSelected = activeConversation?.id === conv.id;
                  return (
                    <div
                      key={conv.id}
                      onClick={() => setActiveConversation(conv)}
                      className={`group flex items-center justify-between px-2.5 py-2 rounded text-xs transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 font-medium'
                          : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <ProviderIcon provider={conv.provider} size={14} className="shrink-0 text-zinc-400" />
                        <span className="truncate">{conv.title}</span>
                      </div>

                      <button
                        type="button"
                        onClick={e => handleDeleteConversation(e, conv.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-zinc-200 rounded transition-opacity"
                        title="Excluir conversa"
                      >
                        <IconTrash size={13} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Sidebar Footer Info */}
          <div className="p-3 border-t border-zinc-800 text-[11px] text-zinc-500 space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
              <span>Memória SQLite Ativa</span>
            </div>
            <div>Atalho rápido: <kbd className="font-mono text-zinc-400 bg-zinc-850 px-1 py-0.5 rounded border border-zinc-800">Ctrl + J</kbd></div>
          </div>
        </div>

        {/* Right Main Chat Container */}
        <div className="flex-1 flex flex-col bg-zinc-950 overflow-hidden">
          {/* Chat Header: Model Switcher & Status */}
          <div className="p-3.5 border-b border-zinc-800 flex items-center justify-between gap-3 bg-zinc-950">
            {/* Dynamic Model Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsModelDropdownOpen(prev => !prev)}
                className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-100 rounded-lg border border-zinc-800 hover:border-zinc-700 text-xs font-semibold transition-colors"
              >
                <ProviderIcon provider={selectedProvider} size={15} />
                <span>{currentModelInfo.name}</span>
                <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700">
                  {currentModelInfo.context_window}
                </span>
                <IconChevronDown size={14} className="text-zinc-500" />
              </button>

              {/* Dropdown Menu */}
              {isModelDropdownOpen && (
                <div className="absolute left-0 mt-2 w-80 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl z-50 p-2 space-y-1 max-h-96 overflow-y-auto custom-scrollbar">
                  <div className="px-2 py-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                    Trocar Modelo Instantaneamente
                  </div>

                  {(['ollama', 'gemini', 'openai', 'deepseek', 'claude'] as AiProvider[]).map(p => {
                    const providerModels = availableModels.filter(m => m.provider === p);
                    if (providerModels.length === 0) return null;

                    return (
                      <div key={p} className="space-y-1 pt-1">
                        <div className="px-2 py-1 text-[10px] text-zinc-400 uppercase font-semibold flex items-center gap-1.5 border-t border-zinc-800 first:border-0">
                          <ProviderIcon provider={p} size={12} />
                          <span>{p.toUpperCase()}</span>
                        </div>
                        {providerModels.map(m => {
                          const isSelected = selectedModel === m.id && selectedProvider === m.provider;
                          return (
                            <div
                              key={m.id}
                              onClick={() => handleModelChange(m)}
                              className={`flex items-center justify-between p-2 rounded cursor-pointer transition-colors ${
                                isSelected
                                  ? 'bg-zinc-800 text-zinc-100 font-semibold'
                                  : 'text-zinc-300 hover:bg-zinc-850'
                              }`}
                            >
                              <div className="min-w-0 pr-2">
                                <div className="text-xs flex items-center gap-1.5">
                                  <span className="truncate">{m.name}</span>
                                  {m.is_reasoning && (
                                    <span className="text-[9px] px-1 py-0.2 rounded bg-zinc-700 text-zinc-200">
                                      Raciocínio
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-zinc-500 truncate">{m.description}</p>
                              </div>
                              <span className="text-[10px] font-mono text-zinc-500 shrink-0">
                                {m.context_window}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Context Info & Close Button */}
            <div className="flex items-center gap-3">
              {currentProject ? (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-300">
                  <IconFolder size={13} className="text-zinc-400" />
                  <span>Projeto: <strong>{currentProject.name}</strong></span>
                </div>
              ) : (
                <div className="text-xs text-zinc-500 font-mono">
                  Contexto Global ({projects.length} repositórios)
                </div>
              )}

              <button
                type="button"
                onClick={() => setIsAiChatOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded hover:bg-zinc-850 transition-colors"
              >
                <IconX size={18} />
              </button>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 custom-scrollbar">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4 py-12">
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-100">
                  <IconSparkles size={28} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-zinc-100">Como posso ajudar nos seus projetos?</h3>
                  <p className="text-xs text-zinc-400">
                    O Crescent AI possui acesso contextual completo às suas linguagens, portas, anotações e arquivos de manifesto locais.
                  </p>
                </div>

                {/* Quick Prompts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full pt-2">
                  {[
                    'Explicar arquitetura deste projeto',
                    'Gerar script de build para produção',
                    'Auditar portas e processos abertos',
                    'Sugerir melhorias de performance',
                  ].map(prompt => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => {
                        setInputValue(prompt);
                        setTimeout(() => handleSendMessage(), 50);
                      }}
                      className="p-2.5 text-left bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded text-xs text-zinc-300 hover:text-zinc-100 transition-colors"
                    >
                      {prompt} →
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map(msg => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-mono px-1">
                      {isUser ? (
                        <span>Você</span>
                      ) : (
                        <div className="flex items-center gap-1 text-zinc-400">
                          <ProviderIcon provider={msg.provider} size={12} />
                          <span>{msg.model}</span>
                          {msg.prompt_tokens > 0 && (
                            <span>• {msg.prompt_tokens + msg.completion_tokens} tokens</span>
                          )}
                        </div>
                      )}
                      <span>• {formatRelativeTime(msg.created_at)}</span>
                    </div>

                    <div
                      className={`relative group max-w-[85%] rounded-lg p-3.5 text-xs leading-relaxed ${
                        isUser
                          ? 'bg-zinc-850 text-zinc-100 border border-zinc-700'
                          : 'bg-zinc-900 text-zinc-200 border border-zinc-800'
                      }`}
                    >
                      {isUser ? (
                        <p className="whitespace-pre-wrap font-sans">{msg.content}</p>
                      ) : (
                        <div className="prose-crescent">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                        </div>
                      )}

                      {!isUser && (
                        <button
                          type="button"
                          onClick={() => copyToClipboard(msg.content, msg.id)}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 bg-zinc-800 text-zinc-400 hover:text-zinc-100 rounded border border-zinc-700 transition-opacity"
                          title="Copiar resposta"
                        >
                          {copiedMsgId === msg.id ? <IconCheck size={13} /> : <IconCopy size={13} />}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {sending && (
              <div className="flex items-center gap-2 p-3 bg-zinc-900 border border-zinc-800 rounded-lg w-48 text-xs text-zinc-400 animate-pulse">
                <ProviderIcon provider={selectedProvider} size={15} />
                <span>{selectedModel} pensando...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <div className="p-4 border-t border-zinc-800 bg-zinc-950">
            <div className="flex items-end gap-2 bg-zinc-900 border border-zinc-800 rounded-lg p-2 focus-within:border-zinc-600 transition-colors">
              <textarea
                ref={inputRef}
                rows={2}
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Pergunte algo ao Crescent AI via ${currentModelInfo.name}... (Enter para enviar)`}
                className="flex-1 bg-transparent text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none resize-none custom-scrollbar"
              />
              <button
                type="button"
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || sending}
                className="p-2 bg-zinc-100 hover:bg-white disabled:opacity-40 text-zinc-950 rounded-md transition-colors shrink-0 font-semibold"
                title="Enviar Mensagem"
              >
                <IconSend size={15} />
              </button>
            </div>
            <div className="flex items-center justify-between pt-2 text-[10px] text-zinc-500 font-mono">
              <span>Shift + Enter para nova linha</span>
              <span>RAG: Indexação de alta densidade ativada</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
