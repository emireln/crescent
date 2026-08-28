export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface ProjectScript {
  id: string;
  project_id: string;
  name: string;
  command: string;
}

export interface ProjectPort {
  id: string;
  project_id: string;
  port: number;
  description: string;
}

export interface GitCommitSummary {
  hash: string;
  short_hash: string;
  message: string;
  author: string;
  relative_time: string;
  timestamp: number;
}

export interface GitInfo {
  is_repo: boolean;
  branch: string | null;
  dirty: boolean;
  modified_count: number;
  last_commit: string | null;
  ahead: number;
  behind: number;
  recent_commits: GitCommitSummary[];
}

export interface HeatmapDay {
  date: string;
  count: number;
}

export interface Workspace {
  id: string;
  name: string;
  description: string;
  project_ids: string[];
  created_at: number;
}

export interface PortStatusInfo {
  port: number;
  is_active: boolean;
  pid: number | null;
  process_name: string | null;
}

export interface CleanableItem {
  category: string;
  relative_path: string;
  full_path: string;
  size_bytes: number;
}

export interface ProjectCleanableInfo {
  project_id: string;
  project_name: string;
  project_path: string;
  items: CleanableItem[];
  total_cleanable_bytes: number;
}

export interface CleanResult {
  success: boolean;
  bytes_freed: number;
  cleaned_count: number;
  errors: string[];
}

export interface ProjectSearchTarget {
  id: string;
  name: string;
  path: string;
}

export interface CodeSearchResult {
  project_id: string;
  project_name: string;
  file_path: string;
  relative_path: string;
  line_number: number;
  line_content: string;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  primary_tech: string;
  tech_stack: string[];
  command_preview: string;
}

export interface EnvFileInfo {
  has_env: boolean;
  has_example: boolean;
  has_local: boolean;
  example_keys: string[];
  env_keys: string[];
  missing_keys: string[];
  env_example_content: string | null;
}

export interface Project {
  id: string;
  name: string;
  path: string;
  description: string;
  tech_stack: string[];
  primary_tech: string;
  status: 'active' | 'on_hold' | 'completed' | 'archived';
  is_favorite: boolean;
  is_pinned: boolean;
  notes: string;
  readme_cache: string | null;
  last_modified: number;
  size_bytes: number;
  git_branch: string | null;
  git_dirty: boolean;
  exists_on_disk: boolean;
  tags: Tag[];
  scripts: ProjectScript[];
  ports: ProjectPort[];
  created_at: number;
  updated_at: number;
}

export interface DiscoveredProject {
  name: string;
  path: string;
  primary_tech: string;
  tech_stack: string[];
  last_modified: number;
  size_bytes: number;
  git: GitInfo;
  has_readme: boolean;
  is_existing: boolean;
}

export interface ScanOptions {
  root_path: string;
  max_depth: number;
  ignore_patterns: string[];
}

export interface CreateProjectInput {
  name: string;
  path: string;
  description?: string;
  tech_stack: string[];
  primary_tech: string;
  status?: string;
  is_favorite?: boolean;
  is_pinned?: boolean;
  notes?: string;
  tag_ids?: string[];
  ports?: number[];
  scripts?: [string, string][];
}

export interface UpdateProjectInput {
  id: string;
  name: string;
  path: string;
  description: string;
  tech_stack: string[];
  primary_tech: string;
  status: string;
  is_favorite: boolean;
  is_pinned: boolean;
  notes: string;
  tag_ids: string[];
}

export interface AppSettings {
  default_editor: string;
  custom_editor_path: string;
  default_terminal: string;
  custom_terminal_path: string;
  scan_depth: string;
  scan_ignore: string;
}

export interface ScriptExecutionResult {
  success: boolean;
  exit_code: number | null;
  stdout: string;
  stderr: string;
}

export type ViewMode = 'grid' | 'list';
export type FilterCategory = 'all' | 'favorites' | 'active' | 'on_hold' | 'completed' | 'archived' | 'missing' | 'dirty';
export type SortOption = 'last_modified' | 'name' | 'size' | 'status';

export type AiProvider = 'ollama' | 'gemini' | 'openai' | 'deepseek' | 'claude';

export interface AiModelInfo {
  id: string;
  name: string;
  provider: AiProvider;
  context_window: string;
  description: string;
  is_reasoning?: boolean;
}

export interface AiConversation {
  id: string;
  title: string;
  project_id?: string | null;
  provider: AiProvider;
  model: string;
  created_at: number;
  updated_at: number;
}

export interface AiMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  provider: AiProvider;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  created_at: number;
}

export const PRESET_AI_MODELS: AiModelInfo[] = [
  // Google Gemini
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'gemini',
    context_window: '2M tokens',
    description: 'Modelo topo de linha do Google para raciocínio profundo e análise massiva de repositórios.',
    is_reasoning: true,
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'gemini',
    context_window: '1M tokens',
    description: 'Ultra-rápido, excelente custo-benefício e alta inteligência para programação diária.',
  },
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    provider: 'gemini',
    context_window: '1M tokens',
    description: 'Velocidade extrema e respostas quase instantâneas.',
  },

  // OpenAI
  {
    id: 'gpt-4.5-preview',
    name: 'GPT-4.5 Preview',
    provider: 'openai',
    context_window: '128k tokens',
    description: 'Novo carro-chefe da OpenAI com conhecimento avançado e intuição de software.',
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    context_window: '128k tokens',
    description: 'Modelo omni balanceado, de alta velocidade e raciocínio sólido.',
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    context_window: '128k tokens',
    description: 'Econômico e ultrarrápido para tarefas rápidas de código.',
  },
  {
    id: 'o3-mini',
    name: 'o3-mini',
    provider: 'openai',
    context_window: '200k tokens',
    description: 'Raciocínio lógico avançado para arquiteturas de software e depuração complexa.',
    is_reasoning: true,
  },
  {
    id: 'o1',
    name: 'o1 (Reasoning)',
    provider: 'openai',
    context_window: '200k tokens',
    description: 'Modelo de raciocínio profundo para refatoração e algoritmos difíceis.',
    is_reasoning: true,
  },

  // DeepSeek
  {
    id: 'deepseek-chat',
    name: 'DeepSeek-V3 (Chat)',
    provider: 'deepseek',
    context_window: '64k tokens',
    description: 'Líder em custo-eficiência com inteligência equiparável aos melhores modelos globais.',
  },
  {
    id: 'deepseek-reasoner',
    name: 'DeepSeek-R1 (Reasoner)',
    provider: 'deepseek',
    context_window: '64k tokens',
    description: 'Cadeia de pensamento aberta e raciocínio matemático/lógico de classe mundial.',
    is_reasoning: true,
  },

  // Anthropic Claude
  {
    id: 'claude-3-7-sonnet-20250219',
    name: 'Claude 3.7 Sonnet',
    provider: 'claude',
    context_window: '200k tokens',
    description: 'O modelo híbrido definitivo para engenharia de software e raciocínio programático.',
    is_reasoning: true,
  },
  {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    provider: 'claude',
    context_window: '200k tokens',
    description: 'Respostas ultrarrápidas com excelente precisão de código.',
  },
  {
    id: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    provider: 'claude',
    context_window: '200k tokens',
    description: 'Excelente para análises extensas de arquitetura e redação técnica.',
  },

  // Ollama (Local)
  {
    id: 'llama3.3:70b',
    name: 'Llama 3.3 (70B)',
    provider: 'ollama',
    context_window: '128k tokens',
    description: 'Poderoso modelo open-weight da Meta rodando 100% offline no seu hardware.',
  },
  {
    id: 'llama3.2:latest',
    name: 'Llama 3.2',
    provider: 'ollama',
    context_window: '128k tokens',
    description: 'Modelo local leve e veloz para execução local com baixo consumo de VRAM/RAM.',
  },
  {
    id: 'qwen2.5-coder:latest',
    name: 'Qwen 2.5 Coder',
    provider: 'ollama',
    context_window: '32k tokens',
    description: 'Especialista local em geração, correção e documentação de código em dezenas de linguagens.',
  },
  {
    id: 'deepseek-r1:latest',
    name: 'DeepSeek R1 (Local)',
    provider: 'ollama',
    context_window: '64k tokens',
    description: 'Raciocínio profundo destilado rodando de forma 100% privada e offline via Ollama.',
    is_reasoning: true,
  },
  {
    id: 'mistral:latest',
    name: 'Mistral 7B',
    provider: 'ollama',
    context_window: '32k tokens',
    description: 'Modelo local compacto, clássico e rápido.',
  },
];

