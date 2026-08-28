# Guia de Desenvolvimento e Manutenção

Neste documento, eu reuni todos os comandos, rotinas de teste, boas práticas e mecanismos de versionamento do **Crescent**.

---

## 1. Configuração do Ambiente Local

### Pré-requisitos
- **Node.js:** Versão 18 ou superior.
- **Rust & Cargo:** Versão estável (instalado via `rustup`).
- **Build Tools do C++ / Windows SDK:** Necessário pelo compilador `MSVC` do Rust no Windows.

### Instalação de Dependências
```bash
# Instalar dependências do frontend React / TypeScript
npm install
```

---

## 2. Comandos de Execução

### Modo Desenvolvimento:
```bash
# Executar a aplicação desktop completa com Tauri v2 (Hot-Reload de Frontend + Backend)
npm run tauri dev

# Executar apenas o frontend web no navegador (com dados mockados do api.ts)
npm run dev
```

---

## 3. Validação e Testes de Código

Eu defini regras rigorosas de validação que devem ser executadas antes de cada commit:

```bash
# 1. Validar tipagem TypeScript e compilação do bundle frontend
npm run build

# 2. Validar tipos e sintaxe do backend em Rust
cargo check --manifest-path src-tauri/Cargo.toml

# 3. Executar testes unitários do motor de scanner e detecção de stacks
cargo test --manifest-path src-tauri/Cargo.toml
```

---

## 4. Sistema de Versionamento Automático (*Auto Bump Version*)

Para manter o versionamento sincronizado entre o ecossistema Node e Rust, eu criei o script [`scripts/bump-version.js`](../scripts/bump-version.js).

### Como funciona:
Ao executar o bump, o script atualiza o número de versão `patch` (ex: `0.1.0` -> `0.1.1` -> `0.1.2`) simultaneamente em:
1. `package.json`
2. `src-tauri/tauri.conf.json`
3. `src-tauri/Cargo.toml`

### Comandos de Bump:
```bash
# Incrementar versão de patch manualmente
npm run bump
```

### Git Pre-Commit Hook:
O repositório inclui um hook em `.git/hooks/pre-commit` que dispara automaticamente o `node scripts/bump-version.js` a cada commit realizado, garantindo que todo commit e push tenha a versão devidamente rastreada e incrementada.

---

## 5. Build de Produção e Instalador Nativo

Para gerar o executável final otimizado e o instalador para Windows (`.exe` / `.msi`):

```bash
npm run tauri build
```

Os binários compilados serão gerados na pasta:
`src-tauri/target/release/bundle/msi/` e `src-tauri/target/release/bundle/nsis/`.
