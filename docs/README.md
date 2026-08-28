# Crescent — Documentação Oficial

Olá! Eu criei o **Crescent** para resolver um problema real que enfrentei diariamente como desenvolvedor: a desorganização e perda de contexto ao gerenciar dezenas de projetos e repositórios de código espalhados pelo computador.

Muitas vezes, ferramentas existentes exigem conexão com a nuvem, login obrigatório, consomem gigabytes de memória RAM ou utilizam interfaces poluídas e lentas. O Crescent foi construído do zero para ser o oposto: **100% offline, ultrarrápido, nativo para Windows e estritamente focado em produtividade.**

---

## 🧭 Índice da Documentação

- [**1. Visão Geral e Minha Motivação**](#1-visão-geral-e-minha-motivação)
- [**2. A Stack Tecnológica Escolhida**](#2-a-stack-tecnológica-escolhida)
- [**3. Funcionalidades Principais**](#3-funcionalidades-principais)
- [**4. Documentação Técnica Detalhada**](#4-documentação-técnica-detalhada)
  - [Arquitetura de Software & Backend (`ARQUITETURA.md`)](./ARQUITETURA.md)
  - [Guia de Desenvolvimento & Manutenção (`GUIA_DESENVOLVIMENTO.md`)](./GUIA_DESENVOLVIMENTO.md)
  - [Design System Monocromático Estrito (`DESIGN_SYSTEM.md`)](./DESIGN_SYSTEM.md)
- [**5. Links e Contato**](#5-links-e-contato)

---

## 1. Visão Geral e Minha Motivação

Eu precisava de um painel de controle central para o meu ambiente de desenvolvimento no Windows que me permitisse:
1. **Encontrar qualquer projeto em 1 segundo** através de uma paleta de comandos rápida (`Ctrl + K`).
2. **Abrir meu editor configurado (VS Code, Cursor, JetBrains, Zed) ou terminal** com um único clique na raiz correta do projeto.
3. **Identificar em tempo real quais repositórios têm alterações não commitadas (*dirty flag*)** e em qual branch Git estou trabalhando.
4. **Guardar anotações locais em Markdown** (comandos de setup, variáveis de ambiente de teste, notas de arquitetura) diretamente associadas a cada projeto.
5. **Rastrear portas locais** (ex: `:3000`, `:5173`, `:8080`) e abrir no navegador com facilidade.
6. **Detectar automaticamente todas as tecnologias e frameworks** sem precisar preencher cadastros manuais extensos.

---

## 2. A Stack Tecnológica Escolhida

Quando planejei o projeto, a escolha das tecnologias foi guiada por performance, confiabilidade e baixo consumo de recursos:

| Camada | Tecnologia | Por que escolhi? |
|---|---|---|
| **Backend Desktop** | **Tauri v2 (Rust)** | Permite criar um aplicativo nativo extremamente leve, com binário compacto, consumo mínimo de memória RAM, comunicação IPC segura e controle completo sobre janelas sem moldura (`frameless`) no Windows. |
| **Banco de Dados Local** | **SQLite (`rusqlite`)** | Armazenamento 100% offline em `%AppData%/Crescent/crescent.db`. Transações ACID, integridade referencial com chaves estrangeiras, migrações automáticas e suporte a backup em JSON. |
| **Frontend Reativo** | **React 19 + TypeScript** | Componentização modular, tipagem estática rigorosa e ecossistema moderno. |
| **Bundler & Tooling** | **Vite 7** | Hot Module Replacement (HMR) instantâneo durante o desenvolvimento e builds de produção otimizados. |
| **Estilização** | **Tailwind CSS v4** | Utilitários de CSS sem overhead, compilados sob demanda. |
| **Pacote de Ícones** | **`@tabler/icons-react`** | Ícones consistentes, nítidos e padronizados para todas as ações do sistema. |
| **Markdown** | **`react-markdown` + `remark-gfm`** | Visualização nativa de tabelas, blocos de código e anotações dos projetos e arquivos `README.md`. |

---

## 3. Funcionalidades Principais

- ⚡ **Varredura Recursiva Multi-Nível:** Motor inteligente que escaneia diretórios de código ignorando automaticamente pastas pesadas (`node_modules`, `target`, `.git`, `.venv`, etc.).
- 🔍 **Detecção Estilo GitHub Linguist:** Reconhecimento automático de manifestos e perfilamento linguístico de arquivos para Rust, TypeScript, JavaScript, Python, Go, C#/.NET, Java, Kotlin, PHP, Ruby, Dart, Swift, Zig, Lua, Solidity, Docker, Kubernetes, etc.
- 🎯 **Ações de 1 Clique:** Disparo direto de editores de código, terminais (PowerShell, Windows Terminal, Git Bash, CMD) e Windows Explorer.
- 📝 **Bloco de Notas Markdown & Leitor de README:** Editor com modo dividido (*split-view*) e visualizador do `README.md` original do projeto.
- 🌐 **Gerenciador de Portas & Scripts:** Lista de portas locais com botão para abrir `http://localhost:<porta>` e executor de scripts com console de saída integrado.
- 🛡️ **Tratamento de Pastas Ausentes:** Se um diretório for renomeado ou movido no disco, o Crescent destaca o item e oferece botão imediato para localizar o novo caminho.

---

## 4. Links e Contato

- 🌐 **Website / Portfólio:** [emirln.com](https://emirln.com)
- ☕ **Apoiar o Projeto:** [buymeacoffee.com/emireln](https://buymeacoffee.com/emireln)
- 🐙 **GitHub:** [github.com/emireln](https://github.com/emireln)
- 📦 **Repositório do Crescent:** [github.com/emireln/crescent](https://github.com/emireln/crescent)
