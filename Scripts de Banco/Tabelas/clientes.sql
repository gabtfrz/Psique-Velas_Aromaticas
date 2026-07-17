/* ============================================================
   Tabela: CLIENTES
   Cadastro de clientes da marca. Referenciada por vendas.
   CPF em texto puro (opcional).
   ============================================================ */
create table clientes(
  id                    int generated always as identity (minvalue 1 maxvalue 999999) not null,
  nome_completo         text        not null,
  cpf                   text,
  data_nascimento       date,
  email                 text        not null,
  whatsapp              text        not null,
  canal_origem          text        not null,
  endereco              jsonb       not null,
  observacoes_internas  text,
  criado_em             timestamptz not null default now()
);

/* Chave primária */
alter table clientes
add constraint pk_clientes
primary key(id);

/* Checagens */
alter table clientes
add constraint ck_clientes_id_max
check(id between 1 and 999999);

/* CANAL_ORIGEM
   instagram / indicacao / site / feira / whatsapp / outro */
alter table clientes
add constraint ck_clientes_canal_origem
check(canal_origem in('instagram', 'indicacao', 'site', 'feira', 'whatsapp', 'outro'));

/* Índices
   Índice único da PK (clientes_pkey) automático. Sem índices secundários. */

/* Segurança: RLS habilitada; policy gestora_acesso_total (eh_gestora()).
   Auditoria via trigger_auditoria. */
