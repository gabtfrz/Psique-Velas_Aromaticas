/* ============================================================
   Função: EH_GESTORA() -> boolean
   Cadeado de acesso do sistema: o usuário logado está na allowlist
   de gestoras (qualquer papel)? Usada nas policies RLS de todas as
   tabelas de negócio (gestora_acesso_total).

   SECURITY DEFINER + search_path vazio: roda como dona da função e
   ignora a RLS da tabela gestoras (evita recursão de policy) sem
   abrir brecha. STABLE.
   ============================================================ */
create or replace function public.eh_gestora()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.gestoras g where g.usuario_id = auth.uid()
  );
$$;

/* Executável por anon/authenticated de propósito: é chamada dentro das
   policies RLS, então o papel que faz a query precisa de EXECUTE. */
