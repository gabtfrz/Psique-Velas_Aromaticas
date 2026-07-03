# Melhoria — Limpeza de arquivos repetidos e mal posicionados

> Remover sobras de scaffold do Vite, assets órfãos e configuração duplicada, alinhando o
> repositório à estrutura de pastas e às convenções PT-BR do CLAUDE.md.

**Data:** 2026-07-02
**Solicitante:** usuário
**Decisões:** remover template + órfãos (`hero.png`, `public/icons.svg`); consolidar `.gitignore` no raiz.

---

## Sprint 1 — Faxina do repositório

### Fase 1 — Remoção de arquivos e consolidação de config

> Dependências: nenhuma.
> Paralelismo: Task 1.1 e 1.2 podem rodar em paralelo (não tocam nos mesmos arquivos); o gate roda depois de ambas.

#### Task 1.1 — Remover scaffold do Vite e assets órfãos

- **Agent:** `engenheiro-frontend-psique`
- **Input:**
  - `frontend/src/assets/react.svg` (logo template Vite, órfão)
  - `frontend/src/assets/vite.svg` (logo template Vite, órfão)
  - `frontend/src/assets/hero.png` (órfão — sem referência)
  - `frontend/public/icons.svg` (sprite morto — ícones são inline em `Icone.tsx`)
  - `frontend/README.md` (README genérico em inglês do template — duplica o `README.md` raiz)
- **Output:** arquivos acima removidos; pasta `frontend/src/assets/` removida se ficar vazia; nenhuma referência quebrada.
- **Testes críticos:**
  - [x] Caso válido: suíte de testes (`npm test`) passa (1/1); build tem falha **pré-existente** de tipos (`rolldown-vite`/`vitest` em `vite.config.ts`), fora do escopo desta limpeza.
  - [x] Caso de erro: grep não retorna nenhuma referência aos arquivos removidos em `frontend/src`/`index.html`.

#### Task 1.2 — Consolidar `.gitignore` no raiz

- **Agent:** `engenheiro-frontend-psique`
- **Input:** `frontend/.gitignore` (default Vite, redundante) e `.gitignore` raiz.
- **Output:** `frontend/.gitignore` removido; `.gitignore` raiz garantindo cobertura de tudo que o do frontend cobria (`.vscode/*`, `.idea`, `*.suo`, `*.ntvs*`, `*.njsproj`, `*.sln`, `*.sw?`), sem duplicar o que já existe.
- **Testes críticos:**
  - [x] Caso válido: `git check-ignore frontend/node_modules frontend/dist frontend/foo.local` retorna os três como ignorados.
  - [x] Caso de erro: docs/PLAN/README/testes **não** ficaram ignorados (regressão dos padrões amplos `*.md`/`docs/*`/`frontend/testes/*` corrigida após review).

### Gate de Fase 1

> Agent: `qa-testes-psique`. Roda `npm run build` e a suíte de testes (`frontend/testes/`); confirma
> ausência de referências quebradas antes de fechar a melhoria.

---

## Fechamento

- [x] Todas as tasks concluídas e revisadas pelo `@code-reviewer` (3 BLOQUEANTES do `.gitignore` corrigidos e reverificados).
- [x] Testes verdes (`npm test` 1/1). Build com falha pré-existente não relacionada (rolldown-vite/vitest).
- [x] Checkboxes dos testes críticos marcados.
