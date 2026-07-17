-- 0012_receita_produtos.sql
-- Receita de insumos por produto: liga `public.produtos` a `public.insumos`
-- (0010_insumos.sql) via tabela de junção `produto_insumos`, e adiciona o
-- percentual fixo de custos extras usado no cálculo do custo de produção.

-- ============================================================
-- 1) `public.produtos.percentual_custos_extras`.
-- Percentual fixo (ex.: 10 = 10%) aplicado sobre o custo dos insumos da
-- receita para cobrir custos extras não rastreados por insumo (água, energia,
-- deslocamento). Soma ao custo dos insumos, compondo o custo de produção
-- (cálculo feito no frontend, em utils/, não no banco).
-- ============================================================
alter table public.produtos
  add column percentual_custos_extras numeric(6,2) not null default 0
    check (percentual_custos_extras >= 0);

comment on column public.produtos.percentual_custos_extras is
  'Percentual fixo de custos extras (água, energia, deslocamento etc.) somado ao custo dos insumos da receita para compor o custo de produção.';

-- ============================================================
-- 2) Tabela `public.produto_insumos`.
-- Uma linha por insumo usado na receita de um produto (vela), com a
-- quantidade consumida (na unidade_medida do insumo).
-- PK inteira sequencial (mesmo padrão do projeto).
-- ============================================================
create table public.produto_insumos (
  id          int generated always as identity (minvalue 1 maxvalue 999999) primary key,
  produto_id  int not null references public.produtos(id) on delete cascade,
  insumo_id   int not null references public.insumos(id) on delete restrict,
  quantidade  numeric(12,4) not null check (quantidade > 0),
  criado_em   timestamptz not null default now(),
  constraint produto_insumos_id_max check (id between 1 and 999999),
  unique (produto_id, insumo_id)
);

comment on table public.produto_insumos is
  'Receita de um produto: cada linha é um insumo e a quantidade consumida para produzir uma unidade do produto (vela). Base do cálculo automático de custo de produção.';
comment on column public.produto_insumos.produto_id is
  'Produto (vela) dono da receita. Ao apagar o produto, as linhas da receita são removidas (on delete cascade).';
comment on column public.produto_insumos.insumo_id is
  'Insumo consumido na receita. Não pode ser apagado enquanto estiver referenciado por alguma receita (on delete restrict).';
comment on column public.produto_insumos.quantidade is
  'Quantidade do insumo consumida por unidade produzida, na unidade_medida do insumo (ex.: 45 g de cera).';

-- ============================================================
-- 3) RLS: mesmo padrão de insumos/demais tabelas de negócio.
-- Ver supabase/CONVENCOES_RLS.md.
-- ============================================================
alter table public.produto_insumos enable row level security;

create policy gestora_acesso_total on public.produto_insumos
  for all using (public.eh_gestora()) with check (public.eh_gestora());

-- ============================================================
-- 4) Trigger de auditoria (mesmo padrão de 0005_auditoria.sql).
-- ============================================================
drop trigger if exists trigger_auditoria on public.produto_insumos;
create trigger trigger_auditoria
  after insert or update or delete on public.produto_insumos
  for each row execute function public.registrar_log();
