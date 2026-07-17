/* ============================================================
   Tabela: ITENS_VENDA
   Itens (linhas) de cada venda. nome_produto/preco_unitario são
   "congelados" no momento da venda (histórico), mesmo que o
   produto mude ou seja removido depois.
   ============================================================ */
create table itens_venda(
  id              int generated always as identity (minvalue 1 maxvalue 999999) not null,
  venda_id        integer not null,
  produto_id      integer,
  nome_produto    text    not null,
  quantidade      integer not null,
  preco_unitario  numeric not null,
  subtotal        numeric not null
);

/* Chave primária */
alter table itens_venda
add constraint pk_itens_venda
primary key(id);

/* Chaves estrangeiras */
alter table itens_venda
add constraint fk_itens_venda_venda_id
foreign key(venda_id)
references vendas(id)
on delete cascade;

alter table itens_venda
add constraint fk_itens_venda_produto_id
foreign key(produto_id)
references produtos(id)
on delete set null;

/* Checagens */
alter table itens_venda
add constraint ck_itens_venda_id_max
check(id between 1 and 999999);

/* Índices
   Índice único da PK (itens_venda_pkey) automático. Sem índices secundários. */

/* Segurança: RLS habilitada; policy gestora_acesso_total (eh_gestora()).
   Auditoria via trigger_auditoria. */
