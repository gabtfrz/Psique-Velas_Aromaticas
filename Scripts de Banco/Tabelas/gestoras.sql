/* ============================================================
   Tabela: GESTORAS
   Allowlist de usuárias autorizadas do backoffice + papel.
     master  = SYS admin: acesso ilimitado, cria/edita usuários.
     gestora = uso operacional; não cria usuários.
   usuario_id referencia a conta de login em auth.users (Supabase Auth).
   CPF em texto puro (só 11 dígitos, sem máscara).
   INSERT/UPDATE só via funções server-side (criar_gestora / atualizar_gestora);
   não há policy de escrita direta pela API.
   ============================================================ */
create table gestoras(
  id                 int generated always as identity (minvalue 1 maxvalue 999999) not null,
  usuario_id         uuid          not null,
  nome               text          not null,
  telefone           text          not null,
  cpf                varchar(11)   not null,
  papel              text          not null,
  email              text          not null,
  deve_trocar_senha  boolean       not null default true,
  criado_em          timestamptz   not null default now()
);

/* Chave primária */
alter table gestoras
add constraint pk_gestoras
primary key(id);

/* Únicos */
alter table gestoras
add constraint uk_gestoras_usuario_id
unique(usuario_id);

/* Chaves estrangeiras */
alter table gestoras
add constraint fk_gestoras_usuario_id
foreign key(usuario_id)
references auth.users(id)
on delete cascade;

/* Checagens */
alter table gestoras
add constraint ck_gestoras_id_max
check(id between 1 and 999999);

/* PAPEL
   master / gestora */
alter table gestoras
add constraint ck_gestoras_papel
check(papel in('master', 'gestora'));

/* CPF — exatamente 11 dígitos, sem máscara. */
alter table gestoras
add constraint ck_gestoras_cpf_formato
check(cpf ~ '^[0-9]{11}$');

/* Índices
   Índices únicos gestoras_pkey (id) e gestoras_usuario_id_key (usuario_id) automáticos. */

/* Segurança: RLS habilitada; policy gestora_le_proprio_registro (SELECT):
   a gestora lê o próprio registro; master lê todos. Sem policy de INSERT/UPDATE/DELETE
   (escrita só via criar_gestora/atualizar_gestora, SECURITY DEFINER). Auditoria via
   trigger_auditoria — a chave `cpf` é removida do JSON do log. */
