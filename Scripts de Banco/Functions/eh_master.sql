/* ============================================================
   Função: EH_MASTER() -> boolean
   Verdadeiro só quando o usuário logado é do papel `master`.
   Usada para: ler todas as gestoras, ler logs_auditoria, decidir
   quem lista/edita usuários e autorizar a criação de gestoras.

   SECURITY DEFINER + search_path vazio + STABLE (mesmo padrão de
   eh_gestora).
   ============================================================ */
create or replace function public.eh_master()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.gestoras g
    where g.usuario_id = auth.uid() and g.papel = 'master'
  );
$$;

/* Executável por anon/authenticated de propósito: é chamada dentro de
   policies RLS (gestoras, logs_auditoria), então precisa de EXECUTE. */
