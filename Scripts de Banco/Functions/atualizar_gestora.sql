/* ============================================================
   Função: ATUALIZAR_GESTORA(p_id, p_nome, p_telefone, p_cpf) -> void
   Edita nome/telefone/CPF de uma gestora existente. Papel e e-mail
   NÃO são editáveis aqui (e-mail é a identidade de login; papel
   fica de fora para evitar auto-rebaixamento acidental do master).
   CPF gravado em texto puro (11 dígitos).

   Só o papel master pode executar (checagem eh_master() no corpo).

   SECURITY DEFINER + search_path vazio: roda como dona (UPDATE em
   gestoras mesmo sem policy de UPDATE). EXECUTE liberado a
   authenticated (a checagem eh_master() é a barreira real).
   ============================================================ */
create or replace function public.atualizar_gestora(
  p_id       int,
  p_nome     text,
  p_telefone text,
  p_cpf      text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.eh_master() then
    raise exception 'apenas o papel master pode editar gestoras';
  end if;

  update public.gestoras
     set nome     = p_nome,
         telefone = p_telefone,
         cpf      = p_cpf
   where id = p_id;

  if not found then
    raise exception 'gestora % nao encontrada', p_id;
  end if;
end;
$$;

/* Superfície RPC: fechada para anon; liberada a authenticated. */
revoke execute on function public.atualizar_gestora(int, text, text, text) from public, anon;
grant  execute on function public.atualizar_gestora(int, text, text, text) to authenticated;
