/* ============================================================
   Tabela: VENDAS
   Cabeçalho do pedido. Os itens ficam em itens_venda. O registro
   de uma venda + baixa de estoque é atômico via registrar_venda().
   ============================================================ */
create table vendas(
  id                int generated always as identity (minvalue 1 maxvalue 999999) not null,
  numero_pedido     text        not null,
  cliente_id        integer,
  desconto          numeric     not null default 0,
  total             numeric     not null default 0,
  canal_venda       text        not null,
  forma_pagamento   text        not null,
  status_pagamento  text        not null,
  tipo_entrega      text        not null,
  status_entrega    text        not null,
  observacoes       text,
  criado_em         timestamptz not null default now()
);

/* Chave primária */
alter table vendas
add constraint pk_vendas
primary key(id);

/* Chaves estrangeiras */
alter table vendas
add constraint fk_vendas_cliente_id
foreign key(cliente_id)
references clientes(id)
on delete set null;

/* Checagens */
alter table vendas
add constraint ck_vendas_id_max
check(id between 1 and 999999);

/* CANAL_VENDA
   site / instagram / whatsapp / presencial / marketplace */
alter table vendas
add constraint ck_vendas_canal_venda
check(canal_venda in('site', 'instagram', 'whatsapp', 'presencial', 'marketplace'));

/* FORMA_PAGAMENTO
   pix / cartao-credito / cartao-debito / dinheiro / boleto */
alter table vendas
add constraint ck_vendas_forma_pagamento
check(forma_pagamento in('pix', 'cartao-credito', 'cartao-debito', 'dinheiro', 'boleto'));

/* STATUS_PAGAMENTO
   pago / pendente */
alter table vendas
add constraint ck_vendas_status_pagamento
check(status_pagamento in('pago', 'pendente'));

/* TIPO_ENTREGA
   retirada / correios / motoboy */
alter table vendas
add constraint ck_vendas_tipo_entrega
check(tipo_entrega in('retirada', 'correios', 'motoboy'));

/* STATUS_ENTREGA
   aguardando / em-producao / enviado / entregue */
alter table vendas
add constraint ck_vendas_status_entrega
check(status_entrega in('aguardando', 'em-producao', 'enviado', 'entregue'));

/* Índices
   Índice único da PK (vendas_pkey) automático. Sem índices secundários. */

/* Segurança: RLS habilitada; policy gestora_acesso_total (eh_gestora()).
   Auditoria via trigger_auditoria. */
