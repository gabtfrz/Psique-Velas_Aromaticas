/* ============================================================
   Tabela: PRODUTOS
   Catálogo de velas. Alimenta vendas, precificação e estoque.
   Custo de produção pode ser calculado a partir da receita de
   insumos (ver tabela produto_insumos + percentual_custos_extras).
   ============================================================ */
create table produtos(
  id                        int generated always as identity (minvalue 1 maxvalue 999999) not null,
  nome                      text     not null,
  intencao                  text     not null,
  tipo_cera                 text     not null,
  granulometria             text     not null,
  gramagem                  numeric  not null,
  notas_aromaticas          jsonb    not null,
  percentual_fragrancia     numeric  not null,
  tipo_pavio                text     not null,
  cor_cera                  text     not null,
  recipiente                text     not null,
  tempo_queima              numeric  not null,
  custo_producao            numeric  not null default 0,
  percentual_custos_extras  numeric  not null default 0,
  preco_venda               numeric  not null default 0,
  margem                    numeric  not null default 0,
  markup                    numeric  not null default 0,
  categoria                 text     not null,
  tags                      text[]   not null default '{}',
  estoque_atual             integer  not null default 0,
  estoque_minimo            integer  not null default 0,
  descricao_curta           text     not null default '',
  historia_vela             text     not null default '',
  ativo                     boolean  not null default true,
  criado_em                 timestamptz not null default now(),
  atualizado_em             timestamptz not null default now()
);

/* Chave primária */
alter table produtos
add constraint pk_produtos
primary key(id);

/* Checagens */
alter table produtos
add constraint ck_produtos_id_max
check(id between 1 and 999999);

/* TIPO_CERA
   vegetal-soja / vegetal-coco / mista */
alter table produtos
add constraint ck_produtos_tipo_cera
check(tipo_cera in('vegetal-soja', 'vegetal-coco', 'mista'));

/* GRANULOMETRIA
   fina / media / grossa */
alter table produtos
add constraint ck_produtos_granulometria
check(granulometria in('fina', 'media', 'grossa'));

/* TIPO_PAVIO
   algodao / madeira / duplo */
alter table produtos
add constraint ck_produtos_tipo_pavio
check(tipo_pavio in('algodao', 'madeira', 'duplo'));

/* CATEGORIA
   para-rituais / para-presentes / colecao-especial / uso-diario */
alter table produtos
add constraint ck_produtos_categoria
check(categoria in('para-rituais', 'para-presentes', 'colecao-especial', 'uso-diario'));

/* PERCENTUAL_CUSTOS_EXTRAS — nunca negativo (usado no cálculo de custo). */
alter table produtos
add constraint ck_produtos_percentual_custos_extras
check(percentual_custos_extras >= 0);

/* Índices
   Índice único da PK (produtos_pkey) é criado automaticamente.
   Sem índices secundários no momento. */

/* Segurança: RLS habilitada; acesso via policy gestora_acesso_total (eh_gestora()).
   Ver Policies/rls_policies.sql. Auditoria via trigger_auditoria. */
