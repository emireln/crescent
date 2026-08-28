# Crescent — Guia para Agentes e Desenvolvedores (AGENTS.md)

Este documento fornece a visão geral de arquitetura, padrões de código, convenções de design system e fluxos de desenvolvimento do **Crescent — Gerenciador Local de Projetos**.

---

## 1. Visão Geral do Projeto

O **Crescent** é um aplicativo desktop nativo para Windows projetado para alta produtividade, rastreamento e organização de projetos de código espalhados pelo computador.
- **100% Offline:** Sem nuvem obrigatória, sem login, sem telemetria.
- **Idioma Padrão:** Português do Brasil (PT-BR).
- **Design System:** Estritamente monocromático (preto, branco e escala neutra de cinzas zinc), sólido, nítido e sem glassmorphism/blur.
- **Criador e Mantenedor:** Emir Lima Neto ([emirln.com](https://emirln.com) | GitHub: [@emireln](https://github.com/emireln) | Apoio: [buymeacoffee.com/emireln](https://buymeacoffee.com/emireln)).

---

## 2. Stack Tecnológica

| Camada | Tecnologia | Função |
|---|---|---|
| **Backend / Runtime** | [Tauri v2](https://v2.tauri.app/) (Rust) | Gerenciamento de janela sem moldura, IPC nativo, sistema de arquivos, rede local e processos |
| **Persistência** | [SQLite (`rusqlite`)](https://crates.io/crates/rusqlite) | Banco de dados local em `%AppData%/Crescent/crescent.db` com WAL e migrações automáticas |
| **Frontend** | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) | Interface reativa, modular e componentizada |
| **Bundler / Tooling** | [Vite 7](https://vite.dev/) | HMR ultrarrápido e build otimizado |
| **Estilização** | [Tailwind CSS v4](https://tailwindcss.com/) | Utilitários de CSS sob demanda com tema monocromático |
| **Ícones** | [`@tabler/icons-react`](https://tabler.io/icons) + SVGs Oficiais | Pacote exclusivo de ícones da interface (proibido o uso de `lucide-react`) |
| **Markdown** | `react-markdown` + `remark-gfm` | Renderizador nativo de anotações e arquivos `README.md` |
| **Rede HTTP / IA** | `reqwest` (Rust) | Gateway de comunicação com Ollama local e provedores LLM em nuvem |

---

## 3. Diretrizes de Design & UI/UX (Monocromático Estrito)

Qualquer alteração na interface **deve obedecer estritamente às seguintes regras**:
1. **Paleta de Cores Monocromática (Cinza Escuro / Charcoal Soft Dark):**
   - **Background Principal:** `bg-zinc-950` / `#121215` (cinza escuro suave e confortável para os olhos, sem preto absoluto).
   - **Superfícies & Painéis:** `bg-zinc-900` / `#1a1a20` para cards, diálogos e inputs.
   - **Hover & Estados Ativos:** `bg-zinc-850` / `#24242c` e `bg-zinc-800` / `#2e2e38`.
   - **Texto:** `text-zinc-100` / `#f2f2f7` (alto contraste suave), `text-zinc-400` / `#a5a5b8` (secundário).
   - **Ações Primárias:** `bg-zinc-100 text-zinc-950 hover:bg-zinc-200` (sólido claro).
   - **Badges e Tags:** `bg-zinc-850 text-zinc-200` (sem cores saturadas).
2. **Anti-Slop / Zero Blur:**
   - **Proibido:** Glassmorphism, `backdrop-blur`, gradientes coloridos e transparências artificiais.
   - Todas as superfícies devem ser sólidas e com contraste nítido.
3. **Titlebar Nativa Customizada:**
   - Janela sem moldura do Windows (`decorations: false`).
   - Arrastar janela via `data-tauri-drag-region`.
   - Botões de controle nativos integrados via IPC (`window_minimize`, `window_toggle_maximize`, `window_close`).
4. **Sidebar Colapsável:**
   - Suporte a modo normal (`w-64`) e modo compacto minimalista (`w-14` / 56px) com estado salvo em `localStorage`.

---

## 4. Estrutura de Diretórios Atualizada

```
crescent/
├── .gitignore
├── AGENTS.md                    # Guia para agentes e desenvolvedores
├── README.md                    # Apresentação do projeto e manual rápido
├── index.html                   # Entry point HTML com fontes Inter e JetBrains Mono
├── package.json                 # Dependências e scripts frontend
├── tsconfig.json                # Configuração TypeScript e aliases (@/*)
├── vite.config.ts               # Configuração Vite + Tailwind v4 + Tauri
├── scripts/
│   └── bump-version.js          # Script automático de auto-incremento de versão no commit
├── docs/                        # Documentação técnica aprofundada
│   ├── README.md                # Visão geral, motivação e manifesto
│   ├── ARQUITETURA.md           # Arquitetura de Rust, SQLite, IPC e Multi-LLM Gateway
│   ├── DESIGN_SYSTEM.md         # Padrões visuais, tokens e regras monocromáticas
│   └── GUIA_DESENVOLVIMENTO.md  # Instruções de setup, compilação e versionamento
├── src/                         # Frontend React 19 + TypeScript
│   ├── main.tsx                 # Ponto de entrada React
│   ├── App.tsx                  # Dashboard principal e montagem dos módulos
│   ├── index.css                # Tokens base, scrollbars e markdown prose
│   ├── types/
│   │   └── index.ts             # Interfaces (Project, Tag, Workspace, AI, Ports, Scripts)
│   ├── services/
│   │   └── api.ts               # Camada de comunicação IPC Tauri + Fallbacks web
│   ├── context/
│   │   └── ProjectContext.tsx   # Estado global reativo, filtros e atalhos globais
│   ├── utils/
│   │   └── formatters.ts        # Formatadores de tamanho, datas relativas e badges
│   └── components/
│       ├── common/
│       │   ├── CustomSelect.tsx # Dropdowns customizados com busca rápida e limite de 7 itens
│       │   └── Tooltip.tsx      # Tooltips flutuantes nítidas sem contornos brancos
│       ├── layout/
│       │   ├── Titlebar.tsx     # Barra de título nativa com busca e links
│       │   └── Sidebar.tsx      # Navegação por categorias, tags, workspaces e toggle collapse
│       ├── projects/
│       │   ├── ProjectCard.tsx  # Cartão sólido com ações rápidas de 1 clique
│       │   ├── ProjectGrid.tsx  # Grade responsiva de projetos
│       │   ├── ProjectList.tsx  # Visualização tabular compacta
│       │   ├── ProjectDetailModal.tsx # Detalhes (Visão Geral, Notas, README, Git, .env, Portas, Scripts, IA)
│       │   └── NewProjectModal.tsx    # Cadastro manual e gerador por templates
│       ├── scanner/
│       │   └── ScannerModal.tsx # Varredura recursiva multi-nível e importação em lote
│       ├── command-palette/
│       │   └── CommandPalette.tsx # Busca global instantânea (Ctrl + K)
│       ├── ai/
│       │   ├── AiChatModal.tsx  # Chatbot contextual (Ctrl + J) com troca em tempo real
│       │   └── ProviderIcons.tsx # Ícones vetoriais de Ollama, Gemini, OpenAI, DeepSeek, Claude
│       ├── cleaner/
│       │   └── DiskCleanerModal.tsx # Análise e purga de node_modules, target/, .venv, build
│       ├── code-search/
│       │   └── CodeSearchModal.tsx  # Busca global de código nos repositórios (Ctrl + Shift + F)
│       ├── workspaces/
│       │   └── WorkspaceModal.tsx   # Gerenciamento de grupos e abertura em lote
│       └── settings/
│           └── SettingsModal.tsx    # Preferências de editor, terminal, varredura, chaves de IA e backup
└── src-tauri/                   # Backend Rust / Tauri v2
    ├── Cargo.toml               # Manifesto Rust (rusqlite, reqwest, walkdir, uuid, chrono, etc.)
    ├── tauri.conf.json          # Configurações da janela Tauri (decorations: false)
    ├── capabilities/
    │   └── default.json         # Permissões do Tauri (core, opener, dialog)
    └── src/
        ├── main.rs              # Ponto de entrada desktop
        ├── lib.rs               # Registro central de todos os handlers IPC e inicialização do DB
        ├── db.rs                # Camada SQLite, migrações e operações CRUD completas
        ├── ai.rs                # Gateway Multi-LLM, RAG de alta densidade e detecção Ollama
        ├── scanner.rs           # Motor de varredura recursiva e detector amplo de linguagens/stacks
        ├── git.rs               # Rastreamento de branches, status dirty, ahead/behind e heatmap
        ├── port_sentinel.rs     # Monitoramento TCP ativo e encerramento forçado de processos (kill)
        ├── cleaner.rs           # Cálculo de tamanho de artefatos de build e purga segura em disco
        ├── code_search.rs       # Motor de pesquisa textual (Grep) através de múltiplos repositórios
        ├── scaffolder.rs        # Gerador instantâneo de projetos por templates
        ├── env_manager.rs       # Inspetor e gerador de arquivos .env a partir de .env.example
        ├── actions.rs           # Disparador de editores, terminais, explorer e executor de scripts
        ├── tray.rs              # Integração nativa com Windows System Tray
        └── window.rs            # Controles nativos de janela (minimizar, maximizar, fechar)
```

---

## 5. Banco de Dados SQLite (`src-tauri/src/db.rs`)

Localização padrão no Windows: `%AppData%/Crescent/crescent.db`.

```sql
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    path TEXT NOT NULL UNIQUE,
    description TEXT DEFAULT '',
    tech_stack TEXT NOT NULL,       -- JSON Array: ["Rust", "Tauri", "React"]
    primary_tech TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'on_hold', 'completed', 'archived'
    is_favorite INTEGER NOT NULL DEFAULT 0,
    is_pinned INTEGER NOT NULL DEFAULT 0,
    notes TEXT DEFAULT '',          -- Anotações em Markdown
    readme_cache TEXT,
    last_modified INTEGER NOT NULL,
    size_bytes INTEGER NOT NULL DEFAULT 0,
    git_branch TEXT,
    git_dirty INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    color TEXT NOT NULL DEFAULT '#a1a1aa'
);

CREATE TABLE IF NOT EXISTS project_tags (
    project_id TEXT NOT NULL,
    tag_id TEXT NOT NULL,
    PRIMARY KEY (project_id, tag_id),
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS workspaces (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT DEFAULT '',
    created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS workspace_projects (
    workspace_id TEXT NOT NULL,
    project_id TEXT NOT NULL,
    PRIMARY KEY (workspace_id, project_id),
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS ai_conversations (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    project_id TEXT,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS ai_messages (
    id TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL,
    role TEXT NOT NULL,             -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    prompt_tokens INTEGER NOT NULL DEFAULT 0,
    completion_tokens INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (conversation_id) REFERENCES ai_conversations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS project_scripts (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    name TEXT NOT NULL,
    command TEXT NOT NULL,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS project_ports (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    port INTEGER NOT NULL,
    description TEXT DEFAULT '',
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
```

---

## 6. Atalhos Globais de Teclado

| Atalho | Ação |
|---|---|
| **`Ctrl + K`** | Abrir Paleta de Comandos (busca global por projetos, tags e ações rápidas) |
| **`Ctrl + J`** | Abrir Crescent AI Assistant (chat global com LLMs) |
| **`Ctrl + N`** | Abrir modal de cadastro de novo projeto e gerador de templates |
| **`Ctrl + F`** | Abrir modal de varredura recursiva de pastas |
| **`Ctrl + Shift + F`** | Abrir modal de busca global de código (Grep em todos os repositórios) |
| **`Esc`** | Fechar qualquer modal ativo |

---

## 7. Comandos e Validação de Código

### Desenvolvimento:
```bash
# Executar frontend em modo desenvolvimento no navegador
npm run dev

# Executar aplicação completa com Tauri desktop
npm run tauri dev
```

### Validação e Testes:
```bash
# Validação de tipos TypeScript e build do frontend
npm run build

# Validação e checagem de tipos do backend Rust
cargo check --manifest-path src-tauri/Cargo.toml

# Execução dos testes unitários do backend Rust
cargo test --manifest-path src-tauri/Cargo.toml
```

### Build Final de Produção:
```bash
# Gerar instalador nativo para Windows (.exe / .msi)
npm run tauri build
```

---

## 8. Regras Obrigatórias para Agentes e Desenvolvedores

1. **Paleta Estritamente Monocromática:** Nunca adicione cores saturadas (azul, verde, vermelho, roxo, âmbar) aos componentes de UI. Utilize a paleta neutra zinc e contraste preto/branco sólido.
2. **Pacote de Ícones:** Utilize exclusivamente `@tabler/icons-react` e SVGs oficiais dos provedores. É terminantemente proibido o uso de `lucide-react`.
3. **Idioma:** Mantenha todos os textos da interface em Português do Brasil (PT-BR).
4. **Sem Emojis no Código:** Não utilize emojis em mensagens de interface ou documentação técnica para manter o padrão profissional e de engenharia limpa.
5. **Validação Obrigatória:** Sempre execute e valide com `cargo check` e `npm run build` antes de finalizar qualquer entrega.
