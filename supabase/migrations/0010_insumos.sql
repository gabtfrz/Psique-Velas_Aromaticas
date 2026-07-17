-- 0010_insumos.sql
-- Cria a tabela `public.insumos`: matérias-primas (cera, fragrância, pavio,
-- recipiente, corante, outros) usadas nas receitas de produção das velas.
-- Base do módulo de precificação/receita (custo de produção calculado a
-- partir do consumo de insumos por produto).

-- ============================================================
-- 1) Tabela `public.insumos`.
-- PK inteira sequencial (mesmo padrão de 0003_ids_sequenciais.sql).
-- ============================================================
create table public.insumos (
  id              int generated always as identity (minvalue 1 maxvalue 999999) primary key,
  nome            text not null,
  categoria       text not null check (categoria in ('cera', 'fragrancia', 'pavio', 'recipiente', 'corante', 'outro')),
  unidade_medida  text not null check (unidade_medida in ('ml', 'g', 'un', 'cm', 'm')),
  preco_unitario  numeric(12,4) not null check (preco_unitario >= 0),
  fornecedor      text,
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now(),
  constraint insumos_id_max check (id between 1 and 999999)
);

comment on table public.insumos is
  'Matérias-primas usadas nas receitas de produção das velas (base do cálculo de custo/precificação).';
comment on column public.insumos.categoria is
  'Classificação do insumo: cera, fragrancia, pavio, recipiente, corante ou outro.';
comment on column public.insumos.unidade_medida is
  'Unidade de medida do insumo: ml, g, un, cm ou m.';
comment on column public.insumos.preco_unitario is
  'Preço pago por 1 unidade de unidade_medida do insumo (ex.: preço por grama de cera).';
comment on column public.insumos.fornecedor is
  'Nome do fornecedor do insumo (opcional).';

-- ============================================================
-- 2) RLS: só quem está na allowlist `public.gestoras` (via eh_gestora())
-- acessa. Ver supabase/CONVENCOES_RLS.md.
-- ============================================================
alter table public.insumos enable row level security;

create policy gestora_acesso_total on public.insumos
  for all using (public.eh_gestora()) with check (public.eh_gestora());

-- ============================================================
-- 3) Trigger de auditoria (mesmo padrão de 0005_auditoria.sql): toda alteração
-- em insumos fica registrada em public.logs_auditoria via registrar_log().
-- `drop trigger if exists` torna a migration idempotente.
-- ============================================================
drop trigger if exists trigger_auditoria on public.insumos;
create trigger trigger_auditoria
  after insert or update or delete on public.insumos
  for each row execute function public.registrar_log();
