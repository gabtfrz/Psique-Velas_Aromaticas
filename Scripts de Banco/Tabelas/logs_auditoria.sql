/* ============================================================
   Tabela: LOGS_AUDITORIA
   Trilha de auditoria: uma linha por INSERT/UPDATE/DELETE em cada
   tabela de negócio, gravada automaticamente por registrar_log().
   Só o papel master lê. CPF nunca entra no log (removido do JSON).
   ============================================================ */
create table logs_auditoria(
  id            int generated always as identity (minvalue 1 maxvalue 999999) not null,
  usuario_id    uuid,
  papel         text,
  acao          text        not null,
  tabela        text        not null,
  registro_id   integer,
  dados_antes   jsonb,
  dados_depois  jsonb,
  criado_em     timestamptz not null default now()
);

/* Chave primária */
alter table logs_auditoria
add constraint pk_logs_auditoria
primary key(id);

/* Chaves estrangeiras */
alter table logs_auditoria
add constraint fk_logs_auditoria_usuario_id
foreign key(usuario_id)
references auth.users(id)
on delete set null;

/* Checagens */
alter table logs_auditoria
add constraint ck_logs_auditoria_id_max
check(id between 1 and 999999);

/* ACAO
   INSERT / UPDATE / DELETE */
alter table logs_auditoria
add constraint ck_logs_auditoria_acao
check(acao in('INSERT', 'UPDATE', 'DELETE'));

/* Colunas
   usuario_id/papel : autor da ação (null quando roda sem sessão, ex.: service_role).
   registro_id      : id da linha afetada (coalesce(NEW.id, OLD.id)).
   dados_antes      : to_jsonb(OLD) em UPDATE/DELETE; null em INSERT.
   dados_depois     : to_jsonb(NEW) em INSERT/UPDATE; null em DELETE. */

/* Índices
   Índice único da PK (logs_auditoria_pkey) automático. Sem índices secundários. */

/* Segurança: RLS habilitada; policy master_le_logs_auditoria (SELECT, só master).
   Sem policy de INSERT: os registros só entram pela trigger registrar_log()
   (SECURITY DEFINER, dona da tabela, isenta de RLS). Esta tabela NÃO tem
   trigger_auditoria (não se audita o próprio log). */
