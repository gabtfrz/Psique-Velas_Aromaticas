-- 0001_schema_base.sql
-- Schema base do sistema de gestão da Psiquê Velas Aromáticas.
-- Tabelas espelham os tipos de domínio em frontend/src/tipos/index.ts.
-- Toda tabela tem RLS habilitada + policy `gestora_acesso_total` (acesso só com sessão autenticada).

-- ============================================================
-- Tabela: produtos
-- ============================================================
create table if not exists public.produtos (
  id                    uuid primary key default gen_random_uuid(),
  nome                  text not null,
  intencao              text not null,
  tipo_cera             text not null check (tipo_cera in ('vegetal-soja', 'vegetal-coco', 'mista')),
  granulometria         text not null check (granulometria in ('fina', 'media', 'grossa')),
  gramagem              numeric not null,
  notas_aromaticas      jsonb not null,
  percentual_fragrancia numeric not null,
  tipo_pavio            text not null check (tipo_pavio in ('algodao', 'madeira', 'duplo')),
  cor_cera              text not null,
  recipiente            text not null,
  tempo_queima          numeric not null,
  custo_producao        numeric not null default 0,
  preco_venda           numeric not null default 0,
  margem                numeric not null default 0,
  markup                numeric not null default 0,
  categoria             text not null check (categoria in ('para-rituais', 'para-presentes', 'colecao-especial', 'uso-diario')),
  tags                  text[] not null default '{}',
  estoque_atual         integer not null default 0,
  estoque_minimo        integer not null default 0,
  descricao_curta       text not null default '',
  historia_vela         text not null default '',
  ativo                 boolean not null default true,
  criado_em             timestamptz not null default now(),
  atualizado_em         timestamptz not null default now()
);

-- ============================================================
-- Tabela: clientes
-- ============================================================
create table if not exists public.clientes (
  id                     uuid primary key default gen_random_uuid(),
  nome_completo          text not null,
  cpf                    text,
  data_nascimento        date,
  email                  text not null,
  whatsapp               text not null,
  canal_origem           text not null check (canal_origem in ('instagram', 'indicacao', 'site', 'feira', 'whatsapp', 'outro')),
  endereco               jsonb not null,
  observacoes_internas   text,
  criado_em              timestamptz not null default now()
);

-- ============================================================
-- Tabela: vendas
-- ============================================================
create table if not exists public.vendas (
  id                uuid primary key default gen_random_uuid(),
  numero_pedido     text not null,
  cliente_id        uuid references public.clientes(id) on delete set null,
  desconto          numeric not null default 0,
  total             numeric not null default 0,
  canal_venda       text not null check (canal_venda in ('site', 'instagram', 'whatsapp', 'presencial', 'marketplace')),
  forma_pagamento   text not null check (forma_pagamento in ('pix', 'cartao-credito', 'cartao-debito', 'dinheiro', 'boleto')),
  status_pagamento  text not null check (status_pagamento in ('pago', 'pendente')),
  tipo_entrega      text not null check (tipo_entrega in ('retirada', 'correios', 'motoboy')),
  status_entrega    text not null check (status_entrega in ('aguardando', 'em-producao', 'enviado', 'entregue')),
  observacoes       text,
  criado_em         timestamptz not null default now()
);

-- ============================================================
-- Tabela: itens_venda
-- ============================================================
create table if not exists public.itens_venda (
  id              uuid primary key default gen_random_uuid(),
  venda_id        uuid not null references public.vendas(id) on delete cascade,
  produto_id      uuid references public.produtos(id) on delete set null,
  nome_produto    text not null,
  quantidade      integer not null,
  preco_unitario  numeric not null,
  subtotal        numeric not null
);

-- ============================================================
-- Row Level Security + policies
-- Padrão: acesso total apenas com sessão autenticada (auth.uid() não nulo).
-- ============================================================
alter table public.produtos    enable row level security;
alter table public.clientes    enable row level security;
alter table public.vendas      enable row level security;
alter table public.itens_venda enable row level security;

create policy gestora_acesso_total on public.produtos
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

create policy gestora_acesso_total on public.clientes
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

create policy gestora_acesso_total on public.vendas
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

create policy gestora_acesso_total on public.itens_venda
  for all using (auth.uid() is not null) with check (auth.uid() is not null);
