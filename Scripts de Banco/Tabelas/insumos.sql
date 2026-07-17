/* ============================================================
   Tabela: INSUMOS
   Matérias-primas usadas na produção das velas (cera, fragrância,
   pavio, recipiente, etc.). Compõem a receita de cada produto via
   produto_insumos. (Módulo de insumos/precificação.)
   ============================================================ */
create table insumos(
  id              int generated always as identity (minvalue 1 maxvalue 999999) not null,
  nome            text        not null,
  categoria       text        not null,
  unidade_medida  text        not null,
  preco_unitario  numeric     not null,
  fornecedor      text,
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now()
);

/* Chave primária */
alter table insumos
add constraint pk_insumos
primary key(id);

/* Checagens */
alter table insumos
add constraint ck_insumos_id_max
check(id between 1 and 999999);

/* CATEGORIA
   cera / fragrancia / pavio / recipiente / corante / outro */
alter table insumos
add constraint ck_insumos_categoria
check(categoria in('cera', 'fragrancia', 'pavio', 'recipiente', 'corante', 'outro'));

/* UNIDADE_MEDIDA
   ml / g / un / cm / m */
alter table insumos
add constraint ck_insumos_unidade_medida
check(unidade_medida in('ml', 'g', 'un', 'cm', 'm'));

/* PRECO_UNITARIO — nunca negativo. */
alter table insumos
add constraint ck_insumos_preco_unitario
check(preco_unitario >= 0);

/* Índices
   Índice único da PK (insumos_pkey) automático. Sem índices secundários. */

/* Segurança: RLS habilitada; policy gestora_acesso_total (eh_gestora()).
   Auditoria via trigger_auditoria. */
