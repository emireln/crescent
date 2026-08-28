# Crescent — Guia para Agentes e Desenvolvedores (AGENTS.md)

Este documento fornece a visão geral de arquitetura, padrões de código, convenções de design system e fluxos de desenvolvimento do **Crescent — Gerenciador Local de Projetos**.

---

## 1. Visão Geral do Projeto

O **Crescent** é um aplicativo desktop nativo para Windows projetado para alta produtividade, rastreamento e organização de projetos de código espalhados pelo computador.
- **100% Offline:** Sem nuvem, sem login, sem telemetria.
- **Idioma Padrão:** Português do Brasil (PT-BR).
- **Design System:** Estritamente monocromático (preto, branco e escala neutra de cinzas zinc), sólido, nítido e sem glassmorphism/blur.

---

## 2. Stack Tecnológica

| Camada | Tecnologia | Função |
|---|---|---|
| **Backend / Runtime** | [Tauri v2](https://v2.tauri.app/) (Rust) | Gerenciamento de janela sem moldura, IPC nativo, sistema de arquivos e scanner |
| **Persistência** | [SQLite (`rusqlite`)](https://crates.io/crates/rusqlite) | Banco de dados local em `%AppData%/Crescent/crescent.db` com migrações automáticas |
| **Frontend** | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) | Interface reativa e componentizada |
| **Bundler / Tooling** | [Vite 7](https://vite.dev/) | HMR ultrarrápido e build otimizado |
| **Estilização** | [Tailwind CSS v4](https://tailwindcss.com/) | Utilitários de CSS sob demanda |
| **Ícones** | [`@tabler/icons-react`](https://tabler.io/icons) | Pacote exclusivo de ícones (proibido o uso de `lucide-react`) |
| **Markdown** | `react-markdown` + `remark-gfm` | Renderizador nativo de anotações e arquivos `README.md` |

---

## 3. Diretrizes de Design & UI/UX (Monocromático Estrito)

Qualquer alteração na interface **deve obedecer estritamente às seguintes regras**:
1. **Paleta de Cores Monocromática:**
   - **Background:** `bg-zinc-950` / `#09090b` (preto sólido profundo).
   - **Superfícies & Painéis:** `bg-zinc-900` para cards/diálogos e `bg-zinc-850`/`bg-zinc-800` para hover e estados ativos.
   - **Bordas:** `border-zinc-800` e `border-zinc-700` nítidas de 1px.
   - **Texto:** `text-zinc-50` / `text-zinc-100` (alto contraste), `text-zinc-400` / `text-zinc-500` (secundário).
   - **Ações Primárias:** `bg-zinc-100 text-zinc-950 hover:bg-white` (branco sólido com texto preto).
   - **Badges e Tags:** `bg-zinc-850 border-zinc-700 text-zinc-200` (sem cores saturadas).
2. **Anti-Slop / Zero Blur:**
   - **Proibido:** Glassmorphism, `backdrop-blur`, gradientes coloridos e transparências artificiais.
   - Todas as superfícies devem ser sólidas e com contraste nítido.
3. **Titlebar Nativa Customizada:**
   - Janela sem moldura do Windows (`decorations: false`).
   - Arrastar janela via `data-tauri-drag-region`.
   - Botões de controle nativos integrados via IPC (`window_minimize`, `window_toggle_maximize`, `window_close`).

---

## 4. Estrutura de Diretórios

```
crescent/
├── .gitignore
├── AGENTS.md                    # Guia para agentes e desenvolvedores
├── README.md                    # Documentação do usuário
├── index.html                   # Entry point HTML com fontes Inter e JetBrains Mono
├── package.json                 # Dependências e scripts frontend
├── tsconfig.json                # Configuração TypeScript e aliases (@/*)
├── vite.config.ts               # Configuração Vite + Tailwind v4 + Tauri
├── src/                         # Frontend React + TypeScript
│   ├── main.tsx                 # Ponto de entrada React
│   ├── App.tsx                  # Dashboard principal e montagem dos módulos
│   ├── index.css                # Tokens base, scrollbars e markdown prose
│   ├── types/
│   │   └── index.ts             # Interfaces de Project, Tag, Script, Port, Settings
│   ├── services/
│   │   └── api.ts               # Camada de comunicação IPC Tauri + Fallbacks
│   ├── context/
│   │   └── ProjectContext.tsx   # Estado global reativo (filtros, busca, seleção)
│   ├── utils/
│   │   └── formatters.ts        # Formatadores de tamanho, datas relativas e badges
│   └── components/
│       ├── layout/
│       │   ├── Titlebar.tsx     # Barra de título nativa com controles e busca
│       │   └── Sidebar.tsx      # Navegação por categorias, tags e rastreamento
│       ├── projects/
│       │   ├── ProjectCard.tsx  # Cartão sólido de projeto com ações de 1 clique
│       │   ├── ProjectGrid.tsx  # Visualização em grade responsiva
│       │   ├── ProjectList.tsx  # Visualização tabular compacta
│       │   ├── ProjectDetailModal.tsx # Painel com Visão Geral, Notas, README, Portas e Scripts
│       │   └── NewProjectModal.tsx    # Cadastro manual com auto-detecção
│       ├── scanner/
│       │   └── ScannerModal.tsx # Varredura recursiva multi-nível e importação em lote
│       ├── command-palette/
│       │   └── CommandPalette.tsx # Busca global instantânea (Ctrl + K)
│       └── settings/
│           └── SettingsModal.tsx  # Preferências de editor, terminal e backup
└── src-tauri/                   # Backend Rust / Tauri v2
    ├── Cargo.toml               # Manifesto Rust (rusqlite, walkdir, uuid, chrono)
    ├── tauri.conf.json          # Configurações da janela Tauri (decorations: false)
    ├── capabilities/
    │   └── default.json         # Permissões do Tauri (core, opener, dialog)
    └── src/
        ├── main.rs              # Ponto de entrada da aplicação desktop
        ├── lib.rs               # Registro de handlers IPC e inicialização do DB
        ├── db.rs                # Camada SQLite, migrações e operações CRUD
        ├── scanner.rs           # Motor de varredura recursiva e detecção de stacks
        ├── git.rs               # Analisador de branches e status dirty
        ├── actions.rs           # Lançador de IDEs, terminais, explorer e scripts
        └── window.rs            # Comandos IPC de controle de janela
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
    notes TEXT DEFAULT '',          -- Markdown notes
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

## 6. Comandos e Validação de Código

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

## 7. Regras para Novos Agentes / Desenvolvedores

1. **Nunca adicione cores saturadas** (azul, verde, vermelho, roxo, âmbar) aos componentes de UI. Utilize a paleta neutra zinc e contraste preto/branco.
2. **Nunca substitua `@tabler/icons-react`** por `lucide-react` ou outros pacotes de ícones.
3. **Mantenha todos os textos em Português do Brasil (PT-BR)** na interface do usuário.
4. **Sempre valide com `cargo check` e `npm run build`** antes de finalizar qualquer alteração.
