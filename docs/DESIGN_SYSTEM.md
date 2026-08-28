# Design System Monocromático Estrito (Anti-Slop)

Neste documento, eu apresento a filosofia visual, a paleta de cores e os padrões de interface do **Crescent**.

---

## 1. Filosofia de Design: Anti-Slop & Zero Blur

Como desenvolvedor, eu priorizo interfaces que não cansem a vista, que tenham contraste nítido e que não utilizem modismos visuais que prejudicam a performance ou a legibilidade.

### Regras Fundamentais:
1. **100% Monocromático:** Nenhuma cor saturada (azul, verde, vermelho, amarelo, roxo). Todas as distinções visuais são feitas através de contraste de tons da escala Zinc, bordas sólidas de 1px e hierarquia tipográfica.
2. **Zero Glassmorphism / Zero Backdrop-Blur:** Todas as superfícies são 100% sólidas. Isso garante renderização ultrarrápida a altas taxas de quadros (120Hz+) e nitidez cirúrgica no texto.
3. **Alto Contraste:** Textos primários em branco fosco de alto contraste (`text-zinc-50` / `text-zinc-100`) sobre superfícies pretas sólidas (`bg-zinc-950` / `#09090b`).

---

## 2. Paleta de Tokens (Tailwind CSS v4 / Zinc Scale)

| Uso na Interface | Classe Tailwind | Hexadecimal / Descrição |
|---|---|---|
| **Fundo Principal (Background)** | `bg-zinc-950` | `#09090b` (Preto profundo sólido) |
| **Superfícies de Cards e Painéis** | `bg-zinc-900` | `#18181b` (Cinza escuro sólido) |
| **Hover e Estados Ativos** | `bg-zinc-850` / `bg-zinc-800` | `#202024` / `#27272a` |
| **Bordas e Divisores Nítidos** | `border-zinc-800` / `border-zinc-700` | `#27272a` / `#3f3f46` |
| **Texto Primário (Títulos & Destaques)** | `text-zinc-50` / `text-zinc-100` | `#fafafa` / `#f4f4f5` |
| **Texto Secundário & Metadados** | `text-zinc-400` / `text-zinc-500` | `#a1a1aa` / `#71717a` |
| **Ações Primárias (Botões de Destaque)** | `bg-zinc-100 text-zinc-950 hover:bg-white` | Branco sólido com texto preto |
| **Badges, Tags e Stacks** | `bg-zinc-850 border-zinc-700 text-zinc-200` | Fundo sólido escuro com borda e texto claro |

---

## 3. Tipografia

- **Fonte Principal (UI & Textos):** `Inter` — Fonte sem serifa moderna, balanceada e legível.
- **Fonte Monospaçada (Caminhos, Portas, Git & Código):** `JetBrains Mono` — Para manter alinhamento perfeito de caracteres em caminhos de arquivos e comandos de terminal.

---

## 4. Titlebar Nativa Customizada

A janela do Crescent é configurada com `decorations: false` no `tauri.conf.json`. A barra superior de 40px (`Titlebar.tsx`) implementa:
- Região de arraste nativa com atributo `data-tauri-drag-region`.
- Logo oficial do Crescent ([`crescent-logo.png`](../public/crescent-logo.png)).
- Campo de busca global rápida (`Ctrl + K`).
- Links para o portfólio (`emirln.com`), apoio (`Buy Me a Coffee`) e perfil do criador no GitHub (`@emireln`).
- Botões nativos de minimizar, maximizar/restaurar e fechar com chamadas IPC diretas para o Tauri.
