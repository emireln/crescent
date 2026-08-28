# Crescent — Gerenciador Local de Projetos

O **Crescent** é um aplicativo desktop nativo para Windows projetado para desenvolvedores gerenciarem, rastrearem e organizarem todos os seus projetos de código locais com máxima produtividade e velocidade.

- **100% Offline:** Sem nuvem, sem login, sem telemetria.
- **Design System Monocromático:** Estética sólida e minimalista em tons de preto, branco e cinzas neutros zinc (sem glassmorphism, sem blur).
- **Stack Tecnológica:** Tauri v2 (Rust) + React 19 (TypeScript, Vite) + Tailwind CSS + SQLite local (`rusqlite`) + `@tabler/icons-react`.

---

## Funcionalidades

- **Descoberta & Varredura Automática:** Detecção recursiva de repositórios e projetos (Rust, Node/TypeScript, React, Next, Vue, Python, FastAPI, Go, .NET, Java, PHP, Flutter, Docker).
- **Análise de Metadados em Tempo Real:** Detecção da branch atual do Git, status de modificações pendentes (*dirty*), tamanho no disco e data da última modificação.
- **Ações Rápidas em 1 Clique:** Abrir no Editor configurado (VS Code, Cursor, JetBrains, Zed), Abrir no Terminal (PowerShell, Windows Terminal, Git Bash, CMD) ou Revelar no Windows Explorer.
- **Anotações & Visualizador de Documentação:** Bloco de notas Markdown local por projeto com preview ao vivo e renderizador de `README.md` integrado.
- **Rastreador de Portas Locais:** Registro e lançamento rápido de portas (`localhost:3000`, `5173`, etc.) no navegador.
- **Scripts Rápidos:** Execução de comandos como `npm run dev` e `cargo run` com console de saída integrado.
- **Busca Rápida Global (`Ctrl + K`):** Command Palette com filtragem instantânea por nome, caminho, stack e tags.
- **Tratamento Inteligente de Pastas Ausentes:** Alerta visual imediato caso um projeto tenha sido movido ou deletado, com opção de 1 clique para localizar novo caminho ou remover.

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
- [**Guia de Desenvolvimento & Versionamento**](./docs/GUIA_DESENVOLVIMENTO.md)
- [**Design System Monocromático Estrito**](./docs/DESIGN_SYSTEM.md)

---

## Autor & Links

- **Website / Portfólio:** [emirln.com](https://emirln.com)
- **Apoiar no Buy Me a Coffee:** [buymeacoffee.com/emireln](https://buymeacoffee.com/emireln)
- **GitHub:** [@emireln](https://github.com/emireln)

---

## Licença
Distribuído sob a licença MIT. Consulte `LICENSE` para obter mais informações.
