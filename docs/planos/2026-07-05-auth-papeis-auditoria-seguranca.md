# Plano — Papéis, Auditoria, Cadastro Seguro de Usuários e Migração para o Banco

> **Melhoria solicitada (2026-07-05):** botão de sair + saudação "Olá, {nome}" no canto superior
> direito; IDs sequenciais (1–999999) como PK em todas as tabelas; `gestoras` com nome, CPF e
> telefone obrigatórios; separação de papéis **master** (SYS admin, acesso ilimitado) x **gestora**
> (uso do sistema, sem criar usuários); cadastro de usuários só pelo master, dentro do sistema, via
> Edge Function segura; tabelas de log/auditoria (vendas, produtos, updates, alterações, cadastros);
> foco em segurança (TLS + RLS por papel + CPF cifrado no banco); remoção dos dados mock — tudo
> passa a ser manipulado via banco.

## Decisões travadas (respostas do cliente)

| Tema | Decisão |
|------|---------|
| Cadastro de usuários | Tela no sistema (só master) → **Supabase Edge Function** com `service_role` cria o Auth user + registro em `gestoras`. |
| Saudação | Exibe o **nome** cadastrado na tabela `gestoras`. |
| Criptografia | TLS nativo + RLS por papel + **CPF cifrado em repouso** (pgcrypto, chave no Supabase Vault). |
| IDs / tabelas | Recriar `produtos`, `clientes`, `vendas`, `itens_venda`, `gestoras` com **PK inteira `identity`, `check id between 1 and 999999`**. Mock removido. |

## Contexto atual (ponto de partida)

- Auth Supabase já funciona (`useAutenticacao`: `sessao`, `entrar`, `sair`); guarda de rota em `App.tsx`.
- `gestoras` é uma allowlist simples (PK `uuid` = `auth.users.id`, `email`, `criado_em`); RLS via `public.eh_gestora()` (SECURITY DEFINER, `search_path` vazio).
- Tabelas `produtos/clientes/vendas/itens_venda` existem com **PK `uuid`** e RLS `eh_gestora()`, mas **sem dados reais** (só mock).
- Hooks de domínio (`useProdutos`, `useClientes`, `useVendas`) ainda em **localStorage + `dadosMock.ts`**.
- Saudação e botão "Sair" **não existem** na UI (`Cabecalho.tsx` só recebe `titulo`/`subtitulo`).

## Modelo de papéis (regras de segurança)

- `gestoras.papel ∈ {'master','gestora'}`. `master` = você (acesso ilimitado, cria usuários). `gestora` = uso operacional, **não** cria usuários.
- Funções no banco: `public.eh_gestora()` (qualquer papel autorizado → acessa dados do negócio) e nova `public.eh_master()` (só master → cria/gere usuários e lê logs).
- Nenhuma criação de usuário pela API pública: a tela chama uma Edge Function que valida `eh_master()` **no servidor** antes de usar a `service_role`.
- `service_role key` só existe como secret da Edge Function — **nunca** no front nem no repositório.

---

## Sprint 1 — Fundação de dados e segurança (banco)

### Fase 1.1 — Reestruturação de schema: IDs sequenciais 1–999999
> Dependências: nenhuma (base de tudo).
> Paralelismo: não — bloqueia todas as fases seguintes.

**Task 1.1.1 — Migration de recriação de tabelas com PK inteira**
- Agent: `engenheiro-banco-supabase`
- Input: `supabase/migrations/0001_schema_base.sql`, `0002_rls_gestoras.sql`, `frontend/src/tipos/index.ts`.
- Output: `supabase/migrations/0003_ids_sequenciais.sql` — dropa e recria `produtos`, `clientes`, `vendas`, `itens_venda` (e ajusta FKs para inteiro) com `id int generated always as identity (minvalue 1 maxvalue 999999) primary key` + `check (id between 1 and 999999)`; reaplica RLS + policies `eh_gestora()` (via `CONVENCOES_RLS.md`). Migration aplicada; Advisor sem alerta de tabela exposta.
- Testes críticos:
  - [x] Válido: `insert` autenticado gera `id` sequencial começando em 1 e select retorna a linha. ✅ verificado no banco (ids 1,2).
  - [x] Erro: `insert` anônimo (anon key) é bloqueado por RLS; e forçar `id > 999999` é rejeitado pelo check/identity. ✅ REST anon SELECT `[]`/200 e INSERT `401`; teto → `23514`.

### Fase 1.2 — Papéis, gestoras completa e CPF cifrado
> Dependências: 1.1.
> Paralelismo: não (1.3 depende desta).

**Task 1.2.1 — `gestoras` com papel + nome/CPF/telefone obrigatórios e cifra de CPF**
- Agent: `engenheiro-banco-supabase`
- Input: `0002_rls_gestoras.sql`, `supabase/CONVENCOES_RLS.md`, decisão de criptografia.
- Output: `supabase/migrations/0004_gestoras_papeis.sql` — recria/estende `public.gestoras` com PK inteira 1–999999, `usuario_id uuid unique references auth.users(id)`, `nome text not null`, `telefone text not null`, `cpf_cifrado bytea not null`, `papel text not null check (papel in ('master','gestora'))`, `email`, `criado_em`. Habilita `pgcrypto`; chave simétrica no **Supabase Vault**; funções SECURITY DEFINER `cifrar_cpf(text)`/`decifrar_cpf(bytea)` (search_path vazio) que leem a chave do Vault. Cria `public.eh_master()`. Atualiza `eh_gestora()` para casar por `usuario_id`. Policies: gestora lê o próprio registro; master lê todos; **sem** policy de INSERT (só Edge Function). Bootstrap do usuário atual como `master`.
- Testes críticos:
  - [x] Válido: registro master criado; `decifrar_cpf(cpf_cifrado)` devolve o CPF original; `eh_master()` = true para o master e `eh_gestora()` = true. ✅ verificado (papel=master, cpf decifrado='00000000000').
  - [x] Erro: `insert` direto em `gestoras` bloqueado; `cpf_cifrado` é `bytea` cifrado; papel fora de `{master,gestora}` rejeitado. ✅ check `23514`; decifra bloqueada p/ não-master (`P0001`). Superfície RPC de cifra/decifra fechada (0006).

### Fase 1.3 — Auditoria (logs de operações)
> Dependências: 1.1, 1.2.
> Paralelismo: pode rodar em paralelo com a Fase 2 (Edge Function), pois ambas dependem só de 1.1/1.2.

**Task 1.3.1 — Tabela de auditoria + triggers em todas as tabelas de negócio**
- Agent: `engenheiro-banco-supabase`
- Input: schema resultante de 1.1/1.2.
- Output: `supabase/migrations/0005_auditoria.sql` — `public.logs_auditoria` (PK inteira 1–999999, `usuario_id`, `papel`, `acao text check in ('INSERT','UPDATE','DELETE')`, `tabela text`, `registro_id int`, `dados_antes jsonb`, `dados_depois jsonb`, `criado_em`). Função de trigger `registrar_log()` (SECURITY DEFINER) + triggers `after insert/update/delete` em `produtos`, `clientes`, `vendas`, `itens_venda`, `gestoras`. RLS: **só `eh_master()` lê**; inserts só via trigger. Nunca gravar CPF em claro no log (mascarar/omitir `cpf_cifrado`).
- Testes críticos:
  - [x] Válido: insert/update/delete numa tabela de negócio cria linha em `logs_auditoria` com `dados_antes`/`dados_depois` corretos e `usuario_id` do autor. ✅ verificado (INSERT/UPDATE/DELETE, autoria conferida).
  - [x] Erro: não-master recebe `[]` ao ler `logs_auditoria`; CPF não aparece em claro em nenhum log. ✅ RLS = 0 linhas p/ não-master; log de `gestoras` mascara `cpf_cifrado`.

---

## Sprint 2 — Cadastro seguro de usuários (server-side)

### Fase 2.1 — Edge Function de criação de usuário
> Dependências: 1.2 (papéis + `eh_master`).
> Paralelismo: pode rodar em paralelo com a Fase 1.3.

**Task 2.1.1 — Edge Function `criar-usuario` (só master, service_role no servidor)**
- Agent: `engenheiro-banco-supabase`
- Input: modelo de papéis, `gestoras` da 1.2, funções de cifra de CPF.
- Output: `supabase/functions/criar-usuario/index.ts` — recebe JWT do chamador, valida `eh_master()` no servidor; com `service_role` cria o Auth user (email/senha, Auto Confirm) e insere em `gestoras` (`nome`, `telefone`, `cpf` cifrado, `papel='gestora'` por padrão). Valida nome/CPF/telefone obrigatórios (rejeita CPF inválido). Retorna erro sem vazar detalhes internos. Secret `SERVICE_ROLE_KEY` só no ambiente da função. Deploy via `npx supabase functions deploy`.
- Testes críticos:
  - [ ] Válido: chamada autenticada como master com nome/CPF/telefone válidos cria o Auth user + registro em `gestoras` (CPF cifrado) e a nova gestora consegue logar. ⏳ função **deployada**; validação ao vivo pendente na tela Usuários (3.2), logado como master.
  - [x] Erro: chamada por gestora (não-master) ou sem JWT retorna 403 e **não** cria nada. ✅ verificado no deploy: sem JWT → `401` (gateway); anon/não-master → `403 "Acesso negado."`; GET → `405`; OPTIONS → `200` (CORS). Validação de CPF/campos → `400` (defesa no código).

---

## Sprint 3 — Frontend: sessão, saudação e gestão de usuários

### Fase 3.1 — Saudação + botão Sair + perfil da sessão
> Dependências: 1.2 (papel/nome no banco).
> Paralelismo: 3.1 e 3.2 sequenciais (3.2 usa o hook de perfil de 3.1); Sprint 4 pode começar em paralelo à 3.1.

**Task 3.1.1 — Hook de perfil + saudação "Olá, {nome}" e Sair no topo direito**
- Agent: `engenheiro-frontend-psique`
- Input: `useAutenticacao.ts`, `Cabecalho.tsx`, `App.tsx`, `BarraLateral.tsx`, primitivo `Botao`.
- Output: `frontend/src/hooks/usePerfil.ts` (busca `{ nome, papel }` da gestora logada via Supabase, com `useCallback`/`useMemo`); barra superior na `AreaInterna` (ou `Cabecalho`) exibindo **"Olá, {nome}"** + botão **Sair** (chama `sair()` e volta ao login) no canto superior direito, usando tokens da marca (sem branco puro/azul). Cálculo/derivação fora do JSX.
- Testes críticos:
  - [x] Válido: com sessão de gestora "Maria", renderiza "Olá, Maria" e o botão Sair; clicar em Sair chama `signOut` e redireciona a `/login`. ✅ `usePerfil.test.ts` + `BarraSuperior.test.tsx`.
  - [x] Erro: perfil ainda carregando/ausente não quebra a UI (estado de carregamento/fallback), sem exibir "Olá, undefined". ✅ coberto nos mesmos testes.

### Fase 3.2 — Tela de Usuários (só master)
> Dependências: 3.1 (perfil/papel) e 2.1 (Edge Function).
> Paralelismo: não.

**Task 3.2.1 — Página "Usuários" visível só ao master, chamando a Edge Function**
- Agent: `engenheiro-frontend-psique`
- Input: `usePerfil`, Edge Function `criar-usuario`, `App.tsx`/`BarraLateral.tsx`, primitivos de formulário (`Campo`, `CampoTexto`, `Botao`, `Modal`, `Toast`), Zod.
- Output: `frontend/src/paginas/Usuarios.tsx` + rota e item de menu **condicionados a `papel === 'master'`**; hook `useUsuarios.ts` que chama `supabase.functions.invoke('criar-usuario', …)`; formulário com validação Zod de nome/CPF/telefone/email/senha; lista das gestoras. Gestora não vê a rota nem o item de menu.
- Testes críticos:
  - [x] Válido: master preenche nome/CPF/telefone/email/senha válidos → invoca a função → toast de sucesso e novo usuário aparece na lista. ✅ `useUsuarios.test.ts` (invoke com body correto) + `Usuarios.test.tsx` (fluxo completo: toast + `listarGestoras` recarrega a lista).
  - [x] Erro: sessão de gestora não renderiza a rota/menu Usuários (redirect); formulário com CPF/telefone inválido bloqueia o envio com mensagem. ✅ `BarraLateral.test.tsx` (menu) + `App.test.tsx` (redirect da rota `/usuarios` → `/`) + `Usuarios.test.tsx` (Zod bloqueia CPF/telefone inválidos sem chamar a Edge Function).

---

## Sprint 4 — Migração mock → banco (remoção total de dados mockados)

### Fase 4.1 — Migrar hooks de catálogo
> Dependências: 1.1 (schema inteiro).
> Paralelismo: `useProdutos` e `useClientes` em paralelo (skill `/migrar-hook-supabase`).

**Task 4.1.1 — `useProdutos` → Supabase**
- Agent: `engenheiro-frontend-psique`
- Input: `useProdutos.ts`, `servicos/supabase.ts`, `calculadores.ts`, tabela `produtos` (id int).
- Output: `useProdutos` lê/grava na Supabase (assinatura pública preservada, cálculos em `utils/`), tipos com `id: number`. Remove uso de `produtosMock`.
- Testes críticos:
  - [x] Válido: adicionar/editar/remover produto persiste na tabela `produtos` e reflete no estado. ✅ `useProdutos.test.ts` (adicionar/editar/remover).
  - [x] Erro: falha de rede/RLS retorna erro tratado (toast) sem corromper o estado local. ✅ `useProdutos.test.ts` (insert com erro RLS rejeita e estado permanece `[]`).

**Task 4.1.2 — `useClientes` → Supabase**
- Agent: `engenheiro-frontend-psique`
- Input: `useClientes.ts`, tabela `clientes` (id int; CPF do cliente também cifrado, coerente com a decisão de segurança).
- Output: `useClientes` na Supabase (assinatura preservada). Remove `clientesMock`.
- Testes críticos:
  - [x] Válido: CRUD de cliente persiste na tabela `clientes`. ✅ `useClientes.test.ts` (adicionar/editar).
  - [x] Erro: insert sem sessão é bloqueado (RLS) e tratado na UI. ✅ `useClientes.test.ts` (insert com erro RLS rejeita e estado permanece `[]`).

### Fase 4.2 — Migrar vendas + baixa de estoque + limpeza do mock
> Dependências: 4.1 (produtos/clientes no banco).
> Paralelismo: não.

**Task 4.2.1 — `useVendas` → Supabase com baixa de estoque transacional**
- Agent: `engenheiro-frontend-psique`
- Input: `useVendas.ts`, tabelas `vendas`/`itens_venda`, `produtos`.
- Output: registro de venda grava `vendas` + `itens_venda` e **baixa o estoque** do produto (idealmente via função/transação no banco para atomicidade). Assinatura preservada.
- Testes críticos:
  - [x] Válido: registrar venda cria a venda + itens e decrementa `estoque_atual` do produto conforme a quantidade. ✅ RPC `registrar_venda` (banco) + `useVendas.test.ts` (frontend chama a RPC com o payload correto e reflete a nova venda).
  - [x] Erro: venda com quantidade maior que o estoque é rejeitada sem baixa parcial (transação revertida). ✅ RPC reverte no banco; `useVendas.test.ts` cobre o hook tratando o erro da RPC sem corromper o estado.

**Task 4.2.2 — Remover `dadosMock.ts` e referências**
- Agent: `engenheiro-frontend-psique`
- Input: `frontend/src/dados/dadosMock.ts`, hooks e páginas que ainda o importam.
- Output: arquivo mock removido; nenhum import remanescente; `npm run build`/typecheck limpos.
- Testes críticos:
  - [x] Válido: `grep` por `dadosMock`/`Mock` não retorna imports ativos; app roda só com dados do banco.
  - [x] Erro: build falha se sobrar referência ao mock (garantia por typecheck). ✅ `npm run build` verde após remoção.

---

## Sprint 5 — Gate final: segurança e revisão

### Fase 5.1 — Revisão e endurecimento final
> Dependências: todas as anteriores.
> Paralelismo: não.

**Task 5.1.1 — Gate de qualidade + Advisor + review**
- Agent: `qa-testes-psique` (gate) → `code-reviewer` (veredito)
- Input: todo o diff da melhoria.
- Output: suíte Vitest verde, `npm run build` limpo, Supabase Advisor/Security Lint sem alertas (RLS em todas as tabelas novas, funções com `search_path` vazio), confirmação de que `service_role`/chave de CPF não vazam para o front/repo. Checkboxes deste plano marcados.
- Testes críticos:
  - [x] Válido: gate (build + testes) passa e Advisor sem alertas críticos. ✅ build limpo, 39/39 testes, lint 0 erros; Advisor só com 7 warnings aceitos (helpers de RLS `eh_gestora`/`eh_master`, `rls_auto_enable` pré-existente, HIBP pago).
  - [x] Erro: qualquer BLOQUEANTE do review interrompe o fechamento até correção. ✅ 4 BLOQUEANTE (páginas chamando mutadores async sem await/try-catch → toast de sucesso falso) corrigidos antes do fechamento; re-gate verde.

---

## Ordem de execução recomendada

1. **1.1** (bloqueia tudo) → 2. **1.2** → 3. **1.3 ∥ 2.1** (paralelas) → 4. **3.1 ∥ 4.1** →
5. **3.2** (após 2.1+3.1) e **4.2** (após 4.1) → 6. **5.1** (gate final).

## Riscos / observações

- Recriar tabelas apaga o schema atual (aceito: só há mock). FKs mudam de `uuid`→`int` — os tipos do front (`id`) passam a `number`.
- Cifra de CPF exige chave no **Vault**; buscas por CPF passam a exigir função de (de)cifra — não dá para filtrar por CPF em claro no SQL comum.
- Edge Function adiciona um artefato server-side novo (deploy/secret) — primeiro uso de `supabase/functions/` no projeto.
- "Master" fica bootstrapado por SQL (a primeira conta não pode se autocriar pela função). Documentar em `CONVENCOES_RLS.md`.
