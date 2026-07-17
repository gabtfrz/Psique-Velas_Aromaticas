# Plano — Módulo de Insumos, Receita da Vela e Precificação por Custo Real

> **Melhoria solicitada (2026-07-12):** precificar a partir dos insumos — no cadastro da vela a
> gestora escolhe os insumos e a quantidade de cada um, e o sistema **calcula o custo
> automaticamente**; sobre esse custo ela aplica um **percentual de margem de lucro** para chegar ao
> preço. O custo deve considerar o consumo real por unidade de medida (ml de fragrância, grama de
> cera, unidade de pavio/recipiente, metro/cm de pavio em rolo). Além disso, cada vela tem um
> **percentual fixo de custos extras** (água, energia, deslocamento) somado ao custo de produção —
> ex.: custo de R$ 20 + 10% fixo = R$ 22.

## Decisões travadas (respostas do cliente — 2026-07-12)

| Tema | Decisão |
|------|---------|
| Escopo | **Módulo completo**: CRUD de insumos (nome, unidade de medida, preço unitário) + montagem da receita por vela + custo automático. É o "Módulo de Insumos / Produção" já previsto no `SPEC.md`. |
| Percentual de custos extras | **Por produto**, definido no cadastro da vela (cada vela tem o seu — ex.: vela A = 10%, vela B = 15%). |
| Custo de produção manual | **Calculado com edição manual**: o sistema calcula da receita + % extra e preenche o custo, mas a gestora pode sobrescrever o valor quando precisar. |
| Unidades de medida | **ml, g, un e metro/cm** (as quatro). |
| Atomicidade produto+receita | **RPC transacional** `registrar_produto_com_receita` (migration `0013`), no padrão do `registrar_venda` — nunca deixa produto "meio salvo". |

## Contexto atual (ponto de partida)

- **A matemática de preço já existe** em `utils/calculadores.ts`: `calcularMargem`, `calcularMarkup`,
  `calcularPrecoSugerido(custo, margemDesejada)`. O simulador da página `Precificacao.tsx` e o cálculo
  ao vivo no `ModalNovoProduto.tsx` já usam essas funções. **Nada disso muda de fórmula** — só passa a
  receber o custo de uma origem calculada em vez de digitada.
- **`custoProducao` é hoje um campo digitado à mão** (`CampoMonetario`) no `ModalNovoProduto.tsx`, sem
  qualquer conceito de insumo, receita ou rateio de custos.
- **Não existe** módulo/tabela/tipo de Insumo, nem receita, nem percentual de custos extras.
- Persistência já em Supabase: hooks (`useProdutos`) leem/gravam via `@supabase/supabase-js`; tradução
  camelCase↔snake_case isolada em `servicos/mapeadores.ts`; nomes de tabela em `constantes` (`TABELAS`).
- Convenções de banco (migrations 0003–0008): PK `int generated always as identity (minvalue 1 maxvalue
  999999)` + `check id between 1 and 999999`; **RLS obrigatória** com policy `public.eh_gestora()`.
  Última migration: `0008_registrar_venda.sql`. Próximas livres: **0009, 0010**.

## Modelo de domínio proposto

- **Insumo** (matéria-prima reutilizável): `id`, `nome`, `categoria` (`cera | fragrancia | pavio |
  recipiente | corante | outro`), `unidadeMedida` (`ml | g | un | cm | m`), `precoUnitario` (preço de 1
  unidade da `unidadeMedida`), `fornecedor?`, `criadoEm`, `atualizadoEm`.
- **ItemReceita** (uma linha da receita de uma vela): `insumoId`, `nomeInsumo`, `unidadeMedida`,
  `quantidade`, `subtotal` (= `quantidade × precoUnitario` do insumo).
- **Produto** ganha: `percentualCustosExtras: number` (%) e `receita: ItemReceita[]`. O
  `custoProducao` continua sendo a fonte de verdade de margem/markup (como hoje), mas passa a ser
  **preenchido pelo cálculo** `custoInsumos × (1 + percentualCustosExtras/100)`, com override manual.
- **Cálculo (funções puras em `utils/calculadores.ts`, conforme CLAUDE.md — lógica no front):**
  - `calcularCustoInsumos(receita, insumos) = Σ (quantidade × precoUnitario)`
  - `calcularCustoComExtras(custoInsumos, percentualExtras) = custoInsumos × (1 + percentualExtras/100)`

---

## Sprint 1 — Banco: insumos, receita e percentual de custos extras

### Fase 1.1 — Migration da tabela `insumos`
> Dependências: nenhuma.
> Paralelismo: não — a Fase 1.2 (FK de receita) depende desta tabela existir.

**Task 1.1.1 — Migration `0009_insumos.sql`**
- Agent: `engenheiro-banco-supabase`
- Input: convenções de `supabase/migrations/0003_ids_sequenciais.sql` e `0004_gestoras_papeis.sql`
  (padrão de PK identity + RLS `eh_gestora()`); `SPEC.md` (categorias de matéria-prima).
- Output: `supabase/migrations/0009_insumos.sql` — cria `public.insumos` com `id int generated always as
  identity (minvalue 1 maxvalue 999999) primary key` + `check (id between 1 and 999999)`, `nome text not
  null`, `categoria text not null check (categoria in ('cera','fragrancia','pavio','recipiente',
  'corante','outro'))`, `unidade_medida text not null check (unidade_medida in ('ml','g','un','cm','m'))`,
  `preco_unitario numeric(12,4) not null check (preco_unitario >= 0)`, `fornecedor text`, `criado_em`,
  `atualizado_em`. Habilita RLS + policies CRUD `eh_gestora()` + `trigger_auditoria` (padrão 0005).
  Migration aplicada; Advisor/Security Lint sem alerta de tabela exposta.
  > **Nota de numeração:** aplicada como `0010_insumos.sql` (o número 0009 já estava ocupado por
  > `0009_troca_senha_e_edicao_gestora.sql`). As migrations seguintes deste plano são renumeradas:
  > receita → `0012` (0011 foi ocupado por `0011_cpf_gestora_texto.sql`), RPC → `0013`.
- Testes críticos:
  - [x] Válido: `insert` autenticado gera `id` sequencial (id=1) e o select devolve a linha com `preco_unitario` correto (0.0450). ✅ verificado no banco linkado.
  - [x] Erro: `insert` anônimo bloqueado por RLS (`42501`); `categoria`/`unidade_medida` fora do domínio e `preco_unitario < 0` rejeitados pelos checks (`23514`). ✅ verificado.

### Fase 1.2 — Receita da vela + percentual de custos extras
> Dependências: 1.1 (FK para `insumos`).
> Paralelismo: não — bloqueia o Sprint 2 (data layer do front).

**Task 1.2.1 — Migration `0012_receita_produtos.sql`**
- Agent: `engenheiro-banco-supabase`
- Input: schema de `produtos` (`0003_ids_sequenciais.sql`), `insumos` da 1.1 (`0010_insumos.sql`).
- Output: `supabase/migrations/0012_receita_produtos.sql` — (a) `alter table public.produtos add column
  percentual_custos_extras numeric(6,2) not null default 0 check (percentual_custos_extras >= 0)`; (b)
  cria `public.produto_insumos` (`id` identity 1–999999, `produto_id int not null references
  produtos(id) on delete cascade`, `insumo_id int not null references insumos(id) on delete restrict`,
  `quantidade numeric(12,4) not null check (quantidade > 0)`, `unique (produto_id, insumo_id)`,
  `criado_em`). RLS + policies `eh_gestora()` + `trigger_auditoria` (padrão 0005) em `produto_insumos`.
  `on delete restrict` em `insumo_id` impede apagar insumo em uso. Migration aplicada; Advisor sem alerta.
  > **Nota de numeração:** aplicada como `0012_receita_produtos.sql` (0011 foi ocupado
  > concorrentemente por `0011_cpf_gestora_texto.sql`). A RPC do plano passa a ser `0013`.
- Testes críticos:
  - [x] Válido: `insert` em `produto_insumos` cria a linha (id=1); select por `produto_id` devolve a receita; `percentual_custos_extras` persiste `10.00`; insert/update/delete geram log de auditoria. ✅ verificado.
  - [x] Erro: `delete` de insumo em uso bloqueado (`23503`); `quantidade <= 0` e `percentual_custos_extras < 0` rejeitados (`23514`); insumo duplicado viola unique (`23505`); insert anônimo bloqueado por RLS (`42501`). ✅ verificado.

---

## Sprint 2 — Domínio no front: tipos, cálculo, mapeadores e hooks

### Fase 2.1 — Tipos, constantes, cálculo puro e validação
> Dependências: 1.2 (schema final conhecido).
> Paralelismo: sim — pode começar em paralelo com 2.2 assim que os tipos forem definidos.

**Task 2.1.1 — Tipos + constantes + `calculadores` + `validadores` de insumo/receita**
- Agent: `engenheiro-frontend-psique`
- Input: `frontend/src/tipos/index.ts`, `frontend/src/utils/calculadores.ts`,
  `frontend/src/utils/validadores.ts`, `frontend/src/constantes/index.ts` (`TABELAS`).
- Output:
  - `tipos/index.ts`: `UnidadeMedida`, `CategoriaInsumo`, `Insumo`, `ItemReceita`; estende `Produto` com
    `percentualCustosExtras: number` e `receita: ItemReceita[]`.
  - `constantes/index.ts`: `TABELAS.INSUMOS = 'insumos'`, `TABELAS.PRODUTO_INSUMOS = 'produto_insumos'`;
    listas de opções de unidade/categoria (evita literais mágicos na UI).
  - `utils/calculadores.ts`: `calcularCustoInsumos(receita, insumos)` e
    `calcularCustoComExtras(custoInsumos, percentualExtras)` (funções puras, PT-BR).
  - `utils/validadores.ts`: `schemaInsumo` (Zod) e estende `schemaProduto` com
    `percentualCustosExtras` e `receita`.
- Testes críticos:
  - [x] Válido: `calcularCustoInsumos` soma corretamente (ex.: 50 g × R$0,05 + 10 ml × R$0,80 = R$10,50); `calcularCustoComExtras(20, 10) === 22`.
  - [x] Erro: `schemaInsumo` rejeita `precoUnitario` negativo e `unidadeMedida` inválida; `calcularCustoInsumos` com receita vazia retorna `0` (sem `NaN`).

### Fase 2.2 — Mapeadores e hook `useInsumos`
> Dependências: 1.1, 2.1 (tipos).
> Paralelismo: sim — independente de 2.3 até o custo automático.

**Task 2.2.1 — `mapeadores` de insumo/receita + hook `useInsumos`**
- Agent: `engenheiro-frontend-psique`
- Input: `frontend/src/servicos/mapeadores.ts`, `frontend/src/hooks/useProdutos.ts` (padrão de hook),
  `frontend/src/servicos/supabase.ts`, skill `migrar-hook-supabase`.
- Output:
  - `servicos/mapeadores.ts`: `LinhaInsumo` + `linhaParaInsumo`/`insumoParaLinha`; `LinhaProdutoInsumo` +
    `linhaParaItemReceita` (join com `insumos` para trazer `nome`/`unidade`/`preço`).
  - `hooks/useInsumos.ts`: CRUD (`adicionarInsumo`, `editarInsumo`, `removerInsumo`, `buscarInsumoPorId`),
    lista carregada da Supabase, tratamento de erro (toast) — mesma arquitetura de `useProdutos`.
  - `hooks/index.ts`: exporta `useInsumos`.
- Testes críticos:
  - [x] Válido: `adicionarInsumo` persiste e o novo insumo aparece na lista; `editarInsumo` atualiza o `precoUnitario`.
  - [x] Erro: `removerInsumo` de um insumo em uso rejeita (erro do `on delete restrict`) e a UI recebe erro tratado; `adicionarInsumo` inválido (schema) não chama a Supabase.

### Fase 2.3 — `useProdutos` com receita e custo automático
> Dependências: 1.2, 2.1, 2.2.
> Paralelismo: não — é a integração central do custo.

**Task 2.3.1 — Persistência da receita em `useProdutos` (via RPC transacional)**
- Agent: `engenheiro-frontend-psique`
- Input: `frontend/src/hooks/useProdutos.ts`, mapeadores da 2.2, calculadores da 2.1.
- Output: `useProdutos` passa a carregar/gravar a `receita` (`produto_insumos`) junto do produto
  (`adicionarProduto`/`editarProduto`/`duplicarProduto` gravam produto + linhas da receita
  atomicamente via **RPC `registrar_produto_com_receita`**, migration `0013`; a leitura traz a receita
  aninhada via join). margem/markup seguem derivados de `custoProducao`/`precoVenda` como hoje.
  > **Decisão de arquitetura (formalizada 2026-07-13):** o **cálculo automático** do custo
  > (`calcularCustoComExtras(calcularCustoInsumos(receita, insumos), percentualCustosExtras)`) vive na
  > **camada de UI (Task 3.2.1)**, não no hook. Motivo: a decisão do cliente é "custo calculado **com
  > edição manual**" — se o hook recalculasse ao salvar, sobrescreveria o override manual da gestora.
  > O `useProdutos` persiste o `custoProducao` **como recebido**. O teste do cálculo automático pertence
  > à Task 3.2.1.
- Testes críticos:
  - [x] Válido: salvar um produto com receita de 2 insumos chama a RPC com `p_itens` (insumo_id/quantidade) e `p_produto` (incl. `percentual_custos_extras`/`custo_producao`) corretos; o produto retorna à lista com a receita. ✅
  - [x] Erro (atomicidade + edição): RPC com FK inválida rejeita sem deixar produto "meio salvo" (rollback no banco, estado local intacto); `schemaProduto` inválido não chama a RPC; editar removendo um insumo da receita reflete `p_itens` sem aquele item. ✅

---

## Sprint 3 — Interface: módulo Insumos e cadastro por receita

### Fase 3.1 — Página Insumos + modal de cadastro + navegação
> Dependências: 2.2.
> Paralelismo: sim — independente da Fase 3.2.

**Task 3.1.1 — Página `Insumos` + `ModalNovoInsumo` + item na `BarraLateral`**
- Agent: `engenheiro-frontend-psique`
- Input: `frontend/src/paginas/Produtos.tsx` (padrão de página CRUD),
  `frontend/src/componentes/compartilhados/ModalNovoProduto.tsx` (padrão de modal),
  `frontend/src/componentes/layout/BarraLateral.tsx`, `frontend/src/App.tsx` (rotas), `useInsumos`.
- Output: `paginas/Insumos.tsx` (tabela com `TabelaDados`, busca/filtro por categoria, `EstadoVazio`);
  `componentes/compartilhados/ModalNovoInsumo.tsx` (React Hook Form + Zod, campos nome/categoria/unidade/
  preço unitário/fornecedor); rota em `App.tsx`; item "Insumos" na `BarraLateral`. Usa apenas tokens da
  marca e componentes próprios (sem branco puro/azul, sem lib de UI).
- Testes críticos:
  - [x] Válido: cadastrar um insumo pelo modal o exibe na tabela; filtrar por categoria mostra só os daquela categoria. ✅
  - [x] Erro: submeter o modal com preço vazio/negativo mostra erro de validação e não fecha o modal. ✅

### Fase 3.2 — Receita e custo automático no cadastro da vela
> Dependências: 2.3, 3.1.
> Paralelismo: não — é o coração da melhoria.

**Task 3.2.1 — Seção "Receita e custo" no `ModalNovoProduto`**
- Agent: `engenheiro-frontend-psique`
- Input: `frontend/src/componentes/compartilhados/ModalNovoProduto.tsx`, `useInsumos`, calculadores da
  2.1, `CampoSelecao`/`CampoMonetario`/`Campo`.
- Output: nova seção no modal onde a gestora **adiciona insumos à receita** (seletor de insumo +
  quantidade na unidade do insumo), vê o **subtotal por linha** e o **custo dos insumos somado** em tempo
  real; um campo **"% de custos extras"** (por produto); o **Custo de produção é preenchido
  automaticamente** (`custo insumos + % extra`) e permanece **editável** (override manual, com indicação
  visual de que foi calculado); margem/markup continuam ao vivo. Sem funções inline em JSX de filhos;
  `useMemo`/`useCallback` conforme CLAUDE.md.
- Testes críticos:
  - [x] Válido: adicionar 2 insumos com quantidades preenche o custo de produção = soma dos subtotais × (1 + %extra); alterar a quantidade recalcula em tempo real.
  - [x] Erro: adicionar o mesmo insumo duas vezes é impedido (ou soma a quantidade); quantidade zero/negativa não entra na receita; remover todos os insumos zera o custo calculado sem quebrar margem/markup.

### Fase 3.3 — Simulador/Precificação lendo o custo real
> Dependências: 3.2.
> Paralelismo: sim — melhoria incremental, não bloqueia o fechamento.

**Task 3.3.1 — Precificação usa o custo calculado da receita**
- Agent: `engenheiro-frontend-psique`
- Input: `frontend/src/paginas/Precificacao.tsx`.
- Output: a coluna "Custo" da tabela já reflete o `custoProducao` calculado (sem mudança de fórmula); o
  **simulador** ganha a opção de **pré-carregar o custo de um produto** selecionado (em vez de digitar),
  reaproveitando `calcularPrecoSugerido`. Nenhuma nova lógica de cálculo inline — tudo via
  `utils/calculadores.ts`.
- Testes críticos:
  - [x] Válido: selecionar um produto no simulador carrega o custo calculado e o preço sugerido sai de `calcularPrecoSugerido(custo, margem)`.
  - [x] Erro: produto sem receita/custo (custo 0) exibe o estado "—" já existente sem quebrar o simulador.

---

## Sprint 4 — Ajustes pós-entrega (feedback da gestora — 2026-07-15)

> Feedback: (a) o cadastro de insumo devia calcular o preço unitário a partir da quantidade da
> embalagem + preço total (ex.: pote de cera com X g e custo total Y → unitário Y/X), com edição
> manual; (b) o campo Tags do cadastro de vela não aceita vírgula (só ponto); (c) na seção "Receita e
> custo", o campo de quantidade está desnivelado em relação ao dropdown de insumo e ao botão.
> Decisão travada: os campos da embalagem são **salvos** no insumo (persistidos).

### Fase 4.1 — Colunas de embalagem em `insumos`
> Dependências: 1.1 (tabela `insumos`).
> Paralelismo: sim — independente da Fase 4.3.

**Task 4.1.1 — Migration: `quantidade_embalagem` + `preco_embalagem` em `insumos`**
- Agent: `engenheiro-banco-supabase`
- Input: `supabase/migrations/0010_insumos.sql` (tabela atual).
- Output: nova migration (próximo número sequencial livre — verificar; provável `0014`) — `alter table
  public.insumos add column quantidade_embalagem numeric(12,4) check (quantidade_embalagem > 0)` e
  `add column preco_embalagem numeric(12,2) check (preco_embalagem >= 0)`, ambas **nullable** (insumos
  legados e cadastro direto por unitário continuam válidos). RLS/`trigger_auditoria` já existem na
  tabela — nada a recriar. Migration aplicada; Advisor sem alerta.
- Testes críticos:
  > **Numeração final:** aplicada como `0014_insumos_embalagem.sql`.
  - [x] Válido: `update`/`insert` autenticado grava `quantidade_embalagem`/`preco_embalagem`; deixar ambas nulas continua aceito. ✅
  - [x] Erro: `quantidade_embalagem <= 0` e `preco_embalagem < 0` rejeitados pelos checks (`23514`); insert anônimo bloqueado por RLS (`42501`). ✅

### Fase 4.2 — Calculadora de preço unitário no `ModalNovoInsumo`
> Dependências: 4.1.
> Paralelismo: não.

**Task 4.2.1 — Campos de embalagem + cálculo automático do unitário**
- Agent: `engenheiro-frontend-psique`
- Input: `ModalNovoInsumo.tsx`, `tipos/index.ts`, `validadores.ts`, `servicos/mapeadores.ts`, `useInsumos`.
- Output: `Insumo`/`schemaInsumo`/mapeadores ganham `quantidadeEmbalagem?`/`precoEmbalagem?`. No modal,
  dois campos novos ("Quantidade da embalagem" na unidade do insumo + "Preço total da embalagem") que
  **auto-preenchem o preço unitário** = `precoEmbalagem / quantidadeEmbalagem` (função pura em
  `utils/calculadores.ts`, ex.: `calcularPrecoUnitario`), mantendo o unitário **editável** (mesmo padrão
  de override do custo no cadastro de vela: flag de edição manual + só recalcula quando muda embalagem
  ou botão explícito). Divisão por zero/vazio não quebra (unitário fica 0/inalterado).
- Testes críticos:
  - [x] Válido: informar 1000 g e R$ 50,00 → preço unitário = R$ 0,05; editar o unitário à mão prevalece sobre o cálculo. ✅
  - [x] Erro/borda: quantidade da embalagem 0/vazia não gera divisão inválida (unitário não vira NaN/Infinity); salvar só com unitário (sem embalagem) continua válido. ✅

### Fase 4.3 — Correções de UI (tags + alinhamento)
> Dependências: nenhuma.
> Paralelismo: sim — independente das Fases 4.1/4.2.

**Task 4.3.1 — Bug do campo Tags (vírgula) + desalinhamento da seção Receita**
- Agent: `engenheiro-frontend-psique`
- Input: `frontend/src/componentes/compartilhados/ModalNovoProduto.tsx` (campo Tags),
  `frontend/src/componentes/compartilhados/SecaoReceita.tsx` (grid da linha de adicionar).
- Output: (a) o campo Tags passa a aceitar vírgula — usar um estado de texto próprio para o input (não
  reconstruir de `tags.join(', ')` a cada tecla, que engole a vírgula por causa do `filter(Boolean)`);
  quebrar em array na hora certa (blur/submit) preservando o que foi digitado. (b) alinhar o campo de
  quantidade com o dropdown de insumo e o botão na seção "Receita e custo" (rótulo em linha única e/ou
  ajuste do grid/`align-items`), sem quebrar o layout responsivo.
- Testes críticos:
  - [x] Válido: digitar "renovação, rituais, calma" no campo Tags resulta em 3 tags (vírgula funciona); editar uma vela existente carrega as tags corretamente.
  - [x] Erro/borda: vírgulas extras/espaços não geram tags vazias; o teste de layout (ou snapshot/estrutura) confirma que os três controles da linha de adicionar receita compartilham o alinhamento.

---

## Gate final da melhoria

- Build (`npm run build`) e suíte Vitest verdes (agent `qa-testes-psique`) em cada gate de fase.
- `@code-reviewer` ao final de cada task, antes de avançar de fase.
- Advisor/Security Lint da Supabase sem alertas nas tabelas novas (`insumos`, `produto_insumos`).
- Checklist do `SPEC.md` (linhas 171-173, módulo Insumos/Produção) marcável ao fim.
