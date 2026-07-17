/* ============================================================
   Tabela: PRODUTO_INSUMOS
   Receita: liga um produto aos insumos que o compõem e a quantidade
   de cada um. Base para calcular o custo de produção do produto.
   Um par (produto, insumo) é único.
   ============================================================ */
create table produto_insumos(
  id          int generated always as identity (minvalue 1 maxvalue 999999) not null,
  produto_id  integer     not null,
  insumo_id   integer     not null,
  quantidade  numeric     not null,
  criado_em   timestamptz not null default now()
);

/* Chave primária */
alter table produto_insumos
add constraint pk_produto_insumos
primary key(id);

/* Únicos */
alter table produto_insumos
add constraint uk_produto_insumos_produto_insumo
unique(produto_id, insumo_id);

/* Chaves estrangeiras */
alter table produto_insumos
add constraint fk_produto_insumos_produto_id
foreign key(produto_id)
references produtos(id)
on delete cascade;

/* insumo com receita não pode ser apagado (RESTRICT) */
alter table produto_insumos
add constraint fk_produto_insumos_insumo_id
foreign key(insumo_id)
references insumos(id)
on delete restrict;

/* Checagens */
alter table produto_insumos
add constraint ck_produto_insumos_id_max
check(id between 1 and 999999);

/* QUANTIDADE — sempre positiva. */
alter table produto_insumos
add constraint ck_produto_insumos_quantidade
check(quantidade > 0);

/* Índices
   Índices únicos produto_insumos_pkey (id) e
   produto_insumos_produto_id_insumo_id_key (produto_id, insumo_id) automáticos. */

/* Segurança: RLS habilitada; policy gestora_acesso_total (eh_gestora()).
   Auditoria via trigger_auditoria. */
