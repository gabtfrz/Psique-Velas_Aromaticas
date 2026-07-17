-- 0003_ids_sequenciais.sql
-- Recria produtos, clientes, vendas e itens_venda trocando a PK de uuid para
-- inteiro sequencial (identity), limitado à faixa 1–999999. As tabelas só têm
-- dados mock até aqui, então dropar e recriar não causa perda real.
-- Mesmas colunas/checks/defaults do 0001_schema_base.sql; só mudam PK e FKs.

-- ============================================================
-- Drop na ordem correta de dependência (filhos antes dos pais).
-- ============================================================
drop table if exists public.itens_venda cascade;
drop table if exists public.vendas cascade;
drop table if exists public.clientes cascade;
drop table if exists public.produtos cascade;

-- ============================================================
-- Tabela: produtos
-- ============================================================
create table public.produtos (
  id                    int generated always as identity (minvalue 1 maxvalue 999999) primary key,
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
  atualizado_em         timestamptz not null default now(),
  constraint produtos_id_max check (id between 1 and 999999)
);

-- ============================================================
-- Tabela: clientes
-- ============================================================
create table public.clientes (
  id                     int generated always as identity (minvalue 1 maxvalue 999999) primary key,
  nome_completo          text not null,
  cpf                    text,
  data_nascimento        date,
  email                  text not null,
  whatsapp               text not null,
  canal_origem           text not null check (canal_origem in ('instagram', 'indicacao', 'site', 'feira', 'whatsapp', 'outro')),
  endereco               jsonb not null,
  observacoes_internas   text,
  criado_em              timestamptz not null default now(),
  constraint clientes_id_max check (id between 1 and 999999)
);

-- ============================================================
-- Tabela: vendas
-- ============================================================
create table public.vendas (
  id                int generated always as identity (minvalue 1 maxvalue 999999) primary key,
  numero_pedido     text not null,
  cliente_id        int references public.clientes(id) on delete set null,
  desconto          numeric not null default 0,
  total             numeric not null default 0,
  canal_venda       text not null check (canal_venda in ('site', 'instagram', 'whatsapp', 'presencial', 'marketplace')),
  forma_pagamento   text not null check (forma_pagamento in ('pix', 'cartao-credito', 'cartao-debito', 'dinheiro', 'boleto')),
  status_pagamento  text not null check (status_pagamento in ('pago', 'pendente')),
  tipo_entrega      text not null check (tipo_entrega in ('retirada', 'correios', 'motoboy')),
  status_entrega    text not null check (status_entrega in ('aguardando', 'em-producao', 'enviado', 'entregue')),
  observacoes       text,
  criado_em         timestamptz not null default now(),
  constraint vendas_id_max check (id between 1 and 999999)
);

-- ============================================================
-- Tabela: itens_venda
-- ============================================================
create table public.itens_venda (
  id              int generated always as identity (minvalue 1 maxvalue 999999) primary key,
  venda_id        int not null references public.vendas(id) on delete cascade,
  produto_id      int references public.produtos(id) on delete set null,
  nome_produto    text not null,
  quantidade      integer not null,
  preco_unitario  numeric not null,
  subtotal        numeric not null,
  constraint itens_venda_id_max check (id between 1 and 999999)
);

-- ============================================================
-- Row Level Security + policies
-- Padrão do projeto (CONVENCOES_RLS.md): acesso só para quem está na
-- allowlist `public.gestoras`, via `public.eh_gestora()` — nunca
-- `auth.uid() is not null`.
-- ============================================================
alter table public.produtos    enable row level security;
alter table public.clientes    enable row level security;
alter table public.vendas      enable row level security;
alter table public.itens_venda enable row level security;

create policy gestora_acesso_total on public.produtos
  for all using (public.eh_gestora()) with check (public.eh_gestora());

create policy gestora_acesso_total on public.clientes
  for all using (public.eh_gestora()) with check (public.eh_gestora());

create policy gestora_acesso_total on public.vendas
  for all using (public.eh_gestora()) with check (public.eh_gestora());

create policy gestora_acesso_total on public.itens_venda
  for all using (public.eh_gestora()) with check (public.eh_gestora());
