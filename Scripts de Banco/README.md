# Scripts de Banco — Psiquê Velas Aromáticas

Documentação do banco de dados (Supabase / PostgreSQL) organizada por tipo de objeto,
seguindo o padrão de documentação da casa (colunas alinhadas, seções de chave
primária / estrangeiras / checagens / índices, comentários em bloco explicando os
valores codificados, e `create or replace` para funções/triggers).

> Estes arquivos são **documentação de referência** do esquema atual — refletem o
> estado real do banco (introspeccionado do projeto Supabase `hywixoynkckyitditrta`).
> A criação/alteração de fato é feita pelas migrations versionadas em
> `supabase/migrations/`. Aqui a leitura é organizada por objeto, não por migration.

## Estrutura

| Pasta | Conteúdo |
|-------|----------|
| `Tabelas/` | Uma tabela por arquivo (colunas, PK, FKs, checagens, únicos, índices). |
| `Functions/` | Uma função por arquivo (SQL/PLpgSQL), com segurança (SECURITY DEFINER/INVOKER) e grants. |
| `Triggers/` | Trigger de auditoria (linha) + event trigger de RLS automática. |
| `Policies/` | Habilitação de RLS + policies por tabela (regras de acesso por papel). |
| `Views/` | (Nenhuma view no momento — ver README da pasta.) |
| `Procedures/` | (PostgreSQL usa funções; ver README da pasta.) |

## Convenções adotadas

- **Identificadores**: `snake_case` em PT-BR (padrão do projeto, `CLAUDE.md`).
- **Nomes de constraints (documentação)**: `pk_<tabela>`, `fk_<tabela>_<coluna>`,
  `uk_<tabela>_<coluna>`, `ck_<tabela>_<detalhe>`, `idx_<tabela>_<coluna>`.
  (No banco vivo, constraints auto-geradas aparecem com o nome padrão do Postgres,
  ex.: `produtos_pkey`; aqui usamos o nome do padrão de documentação.)
- **PK**: toda tabela usa `id int generated always as identity (minvalue 1 maxvalue 999999)`
  + checagem redundante `id between 1 and 999999` (teto de 6 dígitos, decisão do produto).
- **Segurança**: toda tabela tem RLS habilitada; o acesso é decidido pelas funções
  `public.eh_gestora()` / `public.eh_master()` (ver `Functions/` e `Policies/`).
- **Auditoria**: toda tabela de negócio dispara `public.registrar_log()` em
  INSERT/UPDATE/DELETE (ver `Triggers/`).

## Objetos documentados

- **Tabelas (8):** produtos, clientes, vendas, itens_venda, gestoras, logs_auditoria, insumos, produto_insumos.
- **Functions (9):** eh_gestora, eh_master, criar_gestora, atualizar_gestora, listar_gestoras, marcar_senha_trocada, registrar_log, registrar_venda, rls_auto_enable.
- **Triggers (2 tipos):** `trigger_auditoria` (nas 7 tabelas de negócio) e event trigger `ensure_rls`.
- **Policies (8):** `gestora_acesso_total`, `gestora_le_proprio_registro`, `master_le_logs_auditoria`.
- **Views:** nenhuma. **Procedures:** nenhuma (usa-se funções).
