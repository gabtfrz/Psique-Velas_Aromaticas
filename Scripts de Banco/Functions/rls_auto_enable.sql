/* ============================================================
   Função (de event trigger): RLS_AUTO_ENABLE() -> event_trigger
   Rede de segurança de infraestrutura: sempre que uma tabela nova é
   criada no schema public, habilita RLS nela automaticamente
   (garante que nenhuma tabela nasça exposta por esquecimento).

   Disparada pelo event trigger `ensure_rls` (ddl_command_end) —
   ver Triggers/ensure_rls.sql.

   Observação: habilitar RLS apenas fecha o acesso; cada tabela ainda
   precisa das suas policies (ver Policies/) para liberar o acesso da
   gestora. SECURITY DEFINER + search_path pg_catalog.
   ============================================================ */
create or replace function public.rls_auto_enable()
returns event_trigger
language plpgsql
security definer
set search_path to 'pg_catalog'
as $$
declare
  cmd record;
begin
  for cmd in
    select *
    from pg_event_trigger_ddl_commands()
    where command_tag in ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      and object_type in ('table', 'partitioned table')
  loop
    if cmd.schema_name is not null
       and cmd.schema_name in ('public')
       and cmd.schema_name not in ('pg_catalog', 'information_schema')
       and cmd.schema_name not like 'pg_toast%'
       and cmd.schema_name not like 'pg_temp%' then
      begin
        execute format('alter table if exists %s enable row level security', cmd.object_identity);
        raise log 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      exception
        when others then
          raise log 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      end;
    else
      raise log 'rls_auto_enable: skip % (schema de sistema ou fora da lista: %.)', cmd.object_identity, cmd.schema_name;
    end if;
  end loop;
end;
$$;
