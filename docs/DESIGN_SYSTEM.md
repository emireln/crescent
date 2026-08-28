# Design System Monocromático Estrito (Anti-Slop & Soft Dark)

Neste documento, eu apresento a filosofia visual, a paleta de cores e os padrões de interface do **Crescent**.

---

## 1. Filosofia de Design: Anti-Slop, Zero Blur & Conforto Visual

Como desenvolvedor, eu priorizo interfaces que não cansem a vista, que tenham contraste nítido e que não utilizem modismos visuais que prejudicam a performance ou a legibilidade.

### Regras Fundamentais:
1. **100% Monocromático Neutro:** Nenhuma cor saturada (azul, verde, vermelho, amarelo, roxo). Todas as distinções visuais são feitas através de contraste de tons da escala neutra Zinc/Charcoal, superfícies sólidas e hierarquia tipográfica.
2. **Paleta Soft Dark Gray (Charcoal):** Fundo principal em cinza escuro aveludado (`#121215`) em vez de preto absoluto (#000000), garantindo conforto visual prolongado em ambientes escuros sem causar fadiga ocular.
3. **Zero Glassmorphism / Zero Backdrop-Blur:** Todas as superfícies são 100% sólidas. Isso garante renderização ultrarrápida a altas taxas de quadros (120Hz+) e nitidez cirúrgica no texto.
4. **Padrão de Botões Planos (Borderless Flat):** Botões sólidos sem contornos brancos ou bordas pesadas que alteram sutilmente de tom apenas no hover.
5. **Dropdowns Customizados (`CustomSelect`):** Menus flutuantes estilizados com busca instantânea integrada para filtros longos de stacks e opções.

---

## 2. Paleta de Tokens (Tailwind CSS v4 / Zinc Soft Scale)

| Uso na Interface | Classe Tailwind | Hexadecimal / Descrição |
|---|---|---|
| **Fundo Principal (Background)** | `bg-zinc-950` | `#121215` (Cinza escuro charcoal suave) |
| **Superfícies de Cards e Painéis** | `bg-zinc-900` | `#1a1a20` (Cinza escuro para superfícies elevadas) |
| **Hover e Estados Ativos** | `bg-zinc-850` / `bg-zinc-800` | `#24242c` / `#2e2e38` |
| **Bordas e Divisores Sutis** | `border-zinc-800` / `border-zinc-700` | `#2e2e38` / `#464656` |
| **Texto Primário (Títulos & Destaques)** | `text-zinc-100` | `#f2f2f7` (Alto contraste suave) |
| **Texto Secundário & Metadados** | `text-zinc-400` / `text-zinc-500` | `#a5a5b8` / `#828296` |
| **Ações Primárias (Botões de Destaque)** | `bg-zinc-100 text-zinc-950 hover:bg-zinc-200` | Branco suave sólido com texto preto |
| **Badges, Tags e Stacks** | `bg-zinc-850 text-zinc-200` | Fundo sólido escuro com texto claro |

---

## 3. Tipografia

- **Fonte Principal (UI & Textos):** `Inter` — Fonte sem serifa moderna, balanceada e legível.
- **Fonte Monospaçada (Caminhos, Portas, Git & Código):** `JetBrains Mono` — Para manter alinhamento perfeito de caracteres em caminhos de arquivos e comandos de terminal.

---

## 4. Titlebar Nativa Customizada

A janela do Crescent é configurada com `decorations: false` no `tauri.conf.json`. A barra superior (`Titlebar.tsx`) implementa:
- Região de arraste nativa com atributo `data-tauri-drag-region`.
- Logo oficial do Crescent e nome do produto.
- Campo de busca global rápida (`Ctrl + K`).
- Links para o portfólio (`emirln.com`), apoio (`Buy Me a Coffee`) e perfil do criador no GitHub (`@emireln`).
- Botões nativos de minimizar, maximizar/restaurar e fechar com chamadas IPC diretas para o Tauri.

---

## 5. Sidebar Colapsável

A barra lateral (`Sidebar.tsx`) suporta alternância fluida entre o modo expandido (`w-64`) e o modo compacto (`w-14`):
- Botão de expandir/recolher localizado no rodapé inferior, acima de Configurações.
- Tooltips instantâneas para navegação no modo compacto.
- Estado colapsado persistido no banco SQLite local.
