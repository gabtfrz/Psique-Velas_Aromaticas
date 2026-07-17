/* ============================================================
   Função: MARCAR_SENHA_TROCADA() -> void
   Zera a flag gestoras.deve_trocar_senha do PRÓPRIO usuário logado.
   Chamada pelo front no primeiro login, depois que a gestora troca
   a senha provisória (supabase.auth.updateUser) — desbloqueia o app.

   SECURITY DEFINER + search_path vazio: grava em gestoras (sem policy
   de UPDATE) mas só na linha do usuario_id = auth.uid(). EXECUTE
   liberado a authenticated.
   ============================================================ */
create or replace function public.marcar_senha_trocada()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.gestoras
     set deve_trocar_senha = false
   where usuario_id = auth.uid();
end;
$$;

/* Superfície RPC: fechada para anon; liberada a authenticated. */
revoke execute on function public.marcar_senha_trocada() from public, anon;
grant  execute on function public.marcar_senha_trocada() to authenticated;
