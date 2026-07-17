/* ============================================================
   Função: CRIAR_GESTORA(...) -> int  (id da gestora criada)
   Insere uma nova linha em gestoras (a tabela não tem policy de
   INSERT — a escrita só acontece por aqui). O CPF é gravado em
   texto puro (11 dígitos, sem máscara).

   Quem chama: SOMENTE a Edge Function `criar-usuario`, com o client
   service_role, depois de já validar eh_master() no chamador
   original e criar o usuário em auth.users.

   SECURITY DEFINER + search_path vazio: roda como dona (INSERT em
   gestoras mesmo sem policy). EXECUTE liberado só a service_role.
   ============================================================ */
create or replace function public.criar_gestora(
  p_usuario_id uuid,
  p_nome       text,
  p_telefone   text,
  p_cpf        text,
  p_email      text,
  p_papel      text default 'gestora'
)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id int;
begin
  if p_papel not in ('gestora', 'master') then
    raise exception 'papel invalido';
  end if;

  insert into public.gestoras (usuario_id, nome, telefone, cpf, papel, email)
  values (p_usuario_id, p_nome, p_telefone, p_cpf, p_papel, p_email)
  returning id into v_id;

  return v_id;
end;
$$;

/* Superfície RPC: fechada para public/anon/authenticated; só service_role. */
revoke execute on function public.criar_gestora(uuid, text, text, text, text, text)
  from public, anon, authenticated;
grant  execute on function public.criar_gestora(uuid, text, text, text, text, text)
  to service_role;
