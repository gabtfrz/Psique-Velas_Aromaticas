/* ============================================================
   Função: LISTAR_GESTORAS() -> setof (...)
   Lista todas as gestoras COM o CPF (texto puro) para a tela de
   Usuários. Existe para centralizar a regra "só master lê a lista
   inteira" — a policy de gestoras deixa a gestora ver só a própria
   linha, então a listagem geral passa por aqui.

   Só o papel master pode executar (checagem eh_master() no corpo).

   SECURITY DEFINER + search_path vazio. EXECUTE liberado a
   authenticated (a checagem eh_master() é a barreira real).
   ============================================================ */
create or replace function public.listar_gestoras()
returns table (
  id                int,
  nome              text,
  papel             text,
  email             text,
  telefone          text,
  cpf               text,
  deve_trocar_senha boolean,
  criado_em         timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.eh_master() then
    raise exception 'apenas o papel master pode listar gestoras';
  end if;

  return query
    select g.id, g.nome, g.papel, g.email, g.telefone,
           g.cpf::text, g.deve_trocar_senha, g.criado_em
    from public.gestoras g
    order by g.id;
end;
$$;

/* Superfície RPC: fechada para anon; liberada a authenticated. */
revoke execute on function public.listar_gestoras() from public, anon;
grant  execute on function public.listar_gestoras() to authenticated;
