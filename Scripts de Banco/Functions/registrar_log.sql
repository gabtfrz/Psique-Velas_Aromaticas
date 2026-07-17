/* ============================================================
   Função (de trigger): REGISTRAR_LOG() -> trigger
   Grava uma linha em logs_auditoria a cada INSERT/UPDATE/DELETE nas
   tabelas de negócio. Preenche autor (auth.uid), papel, ação, tabela,
   id do registro e o antes/depois em JSON.

   Para a tabela gestoras, remove a chave `cpf` do JSON — o CPF nunca
   entra no log.

   SECURITY DEFINER + search_path vazio: roda como dona (mesma dona das
   tabelas), isenta de RLS por ser table owner — por isso o INSERT em
   logs_auditoria funciona sem policy de INSERT.

   Usada pela trigger `trigger_auditoria` (ver Triggers/).
   ============================================================ */
create or replace function public.registrar_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_registro_id  int;
  v_dados_antes  jsonb;
  v_dados_depois jsonb;
  v_papel        text;
begin
  if TG_OP = 'DELETE' then
    v_registro_id := OLD.id;
    v_dados_antes := to_jsonb(OLD);
  elsif TG_OP = 'UPDATE' then
    v_registro_id  := coalesce(NEW.id, OLD.id);
    v_dados_antes  := to_jsonb(OLD);
    v_dados_depois := to_jsonb(NEW);
  else -- INSERT
    v_registro_id  := NEW.id;
    v_dados_depois := to_jsonb(NEW);
  end if;

  -- Não gravar o CPF no log da tabela gestoras.
  if TG_TABLE_NAME = 'gestoras' then
    if v_dados_antes is not null then
      v_dados_antes := v_dados_antes - 'cpf';
    end if;
    if v_dados_depois is not null then
      v_dados_depois := v_dados_depois - 'cpf';
    end if;
  end if;

  select g.papel into v_papel
  from public.gestoras g
  where g.usuario_id = auth.uid();

  insert into public.logs_auditoria
    (usuario_id, papel, acao, tabela, registro_id, dados_antes, dados_depois)
  values
    (auth.uid(), v_papel, TG_OP, TG_TABLE_NAME, v_registro_id, v_dados_antes, v_dados_depois);

  if TG_OP = 'DELETE' then
    return OLD;
  end if;

  return NEW;
end;
$$;

/* Função de trigger: não precisa de EXECUTE para o role que dispara o
   INSERT/UPDATE/DELETE; revogada de public/anon/authenticated. */
revoke execute on function public.registrar_log() from public, anon, authenticated;
