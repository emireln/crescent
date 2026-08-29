# Crescent — Gerenciador Local de Projetos

O **Crescent** é um aplicativo desktop nativo para Windows projetado para desenvolvedores gerenciarem, rastrearem e organizarem todos os seus projetos de código locais com máxima produtividade, velocidade e inteligência.

- **100% Offline & Privacidade Total:** Sem nuvem, sem login, sem telemetria. Todos os dados permanecem salvos no seu computador.
- **Design System Monocromático Soft Dark:** Estética sólida, nítida e refinada em tons de cinza escuro charcoal (`#121215`, `#1a1a20`), preto e branco (sem glassmorphism, sem blur cansativo).
- **Stack Tecnológica:** Tauri v2 (Rust) + React 19 (TypeScript, Vite 7) + Tailwind CSS v4 + SQLite local (`rusqlite`) + `@tabler/icons-react`.
- **Criador:** Emir Lima Neto ([emirln.com](https://emirln.com) | GitHub: [@emireln](https://github.com/emireln) | Apoio: [buymeacoffee.com/emireln](https://buymeacoffee.com/emireln)).

---

## Origem do Projeto & Desenvolvimento

A ideia do Crescent nasceu da minha própria necessidade e dificuldade de administrar dezenas de projetos de código espalhados pelo computador. Eu utilizei este projeto para criar a solução definitiva para o meu fluxo de trabalho diário e para **testar e ampliar os meus conhecimentos práticos** em Rust, Tauri v2, SQLite local de alto desempenho, RAG local e engenharia de software moderna.

O desenvolvimento do aplicativo contou com o auxílio de um **Agente de IA (modelo: 0x Alpha)** em regime de pair programming técnico e automação de código.

---

## Funcionalidades Principais

- **Descoberta & Varredura Automática:** Detecção recursiva multi-nível de repositórios e projetos (Rust, Node/TypeScript, React, Next.js, Vue, Python, FastAPI, Go, .NET, Java, PHP, Flutter, Docker).
- **Crescent AI Assistant (Multi-LLM Gateway):** Chat contextual com inteligência artificial (`Ctrl + J`) integrado a Ollama local (auto-detecção de modelos instalados) e provedores em nuvem (Gemini, OpenAI, DeepSeek, Claude) com memória contínua e RAG de alta densidade técnica.
- **Busca Global de Código nos Repositórios (`Ctrl + Shift + F`):** Motor de busca textual ultrarrápido (Grep em Rust) através de todos os projetos cadastrados.
- **Port Sentinel & Finalizador de Processos:** Monitoramento de portas TCP ativas (`localhost:3000`, `5173`, etc.) com identificação do processo responsável e encerramento seguro (*kill*) com 1 clique.
- **Limpador de Disco & Purga de Dependências:** Análise do espaço ocupado por `node_modules`, `target/`, `.venv`, `.next` e builds para liberação em lote de dezenas de gigabytes.
- **Metadados Git em Tempo Real:** Detecção da branch atual, modificações pendentes (*dirty*), commits à frente/atrás (*ahead/behind*), histórico recente e Heatmap de Produtividade dos últimos 90 dias.
- **Ações Rápidas em 1 Clique:** Abrir no Editor configurado (VS Code, Cursor, JetBrains, Zed), Abrir no Terminal (PowerShell, Windows Terminal, Git Bash, CMD) ou Revelar no Windows Explorer.
- **Anotações & Visualizador de Documentação:** Bloco de notas Markdown por projeto com preview ao vivo e renderizador de `README.md` integrado.
- **Gerenciador de `.env`:** Comparador de arquivos `.env` e `.env.example` com geração automática de chaves faltantes.
- **Gerador de Projetos por Templates:** Scaffolding instantâneo de projetos em Vite React/TS, Next.js, Tauri v2, FastAPI, Rust CLI e Go Gin.
- **Busca Rápida Global (`Ctrl + K`):** Command Palette com filtragem instantânea por nome, caminho, stack e tags.
- **Persistência Total:** Todas as preferências de visualização, ordenação, notas e histórico ficam salvas localmente no banco SQLite.

---

## Como Executar Localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) (versão 18+)
- [Rust & Cargo](https://rustup.rs/) (versão estável)

### Instalação e Desenvolvimento
```bash
# 1. Clonar o repositório
git clone https://github.com/emireln/crescent.git
cd crescent

# 2. Instalar dependências do frontend
npm install

# 3. Executar o aplicativo desktop com Tauri
npm run tauri dev
```

### Build de Produção
```bash
# Gerar instalador nativo para Windows (.exe / .msi)
npm run tauri build
```

---

## Documentação Completa (`docs/`)

Para detalhes aprofundados sobre a construção e o funcionamento interno do projeto, consulte a pasta [`docs/`](./docs):
- [**Visão Geral & Manifesto Pessoal**](./docs/README.md)
- [**Arquitetura do Backend Rust & SQLite**](./docs/ARQUITETURA.md)
- [**Design System Monocromático Estrito**](./docs/DESIGN_SYSTEM.md)
- [**Guia de Desenvolvimento & Versionamento**](./docs/GUIA_DESENVOLVIMENTO.md)

---

## Autor & Links

- **Website / Portfólio:** [emirln.com](https://emirln.com)
- **Apoiar no Buy Me a Coffee:** [buymeacoffee.com/emireln](https://buymeacoffee.com/emireln)
- **GitHub:** [@emireln](https://github.com/emireln)

---

## Licença
Distribuído sob a licença MIT. Consulte `LICENSE` para obter mais informações.
