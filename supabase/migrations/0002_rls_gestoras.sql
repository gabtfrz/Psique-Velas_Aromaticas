-- 0002_rls_gestoras.sql
-- Endurece a RLS: acesso não é mais "qualquer usuário autenticado", e sim
-- "usuário presente na allowlist de gestoras". Este vira o PADRÃO do projeto:
-- toda tabela nova deve usar `public.eh_gestora()` nas suas policies.

-- ============================================================
-- Allowlist de gestoras autorizadas.
-- Adicionar uma gestora é ação administrativa (via SQL/dashboard), nunca pela
-- API pública: a tabela tem RLS e não expõe policy de INSERT.
-- ============================================================
create table if not exists public.gestoras (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  criado_em  timestamptz not null default now()
);

alter table public.gestoras enable row level security;

-- ============================================================
-- Cadeado único do sistema: o usuário atual é uma gestora autorizada?
-- SECURITY DEFINER + search_path vazio: roda como dono da função e ignora a RLS
-- da tabela gestoras (evita recursão de policy) sem abrir brecha.
-- ============================================================
create or replace function public.eh_gestora()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.gestoras g where g.id = auth.uid()
  );
$$;

-- Uma gestora autenticada pode ler a lista de gestoras (para telas de admin futuras).
drop policy if exists gestora_le_gestoras on public.gestoras;
create policy gestora_le_gestoras on public.gestoras
  for select using (public.eh_gestora());

-- ============================================================
-- Substitui a policy antiga das tabelas de dados pelo novo padrão.
-- ============================================================
drop policy if exists gestora_acesso_total on public.produtos;
create policy gestora_acesso_total on public.produtos
  for all using (public.eh_gestora()) with check (public.eh_gestora());

drop policy if exists gestora_acesso_total on public.clientes;
create policy gestora_acesso_total on public.clientes
  for all using (public.eh_gestora()) with check (public.eh_gestora());

drop policy if exists gestora_acesso_total on public.vendas;
create policy gestora_acesso_total on public.vendas
  for all using (public.eh_gestora()) with check (public.eh_gestora());

drop policy if exists gestora_acesso_total on public.itens_venda;
create policy gestora_acesso_total on public.itens_venda
  for all using (public.eh_gestora()) with check (public.eh_gestora());

-- ============================================================
-- Bootstrap: promove os usuários já existentes no Auth a gestoras.
-- (No estado atual há apenas a conta da gestora criada na dashboard.)
-- Para adicionar novas gestoras depois, veja supabase/CONVENCOES_RLS.md.
-- ============================================================
insert into public.gestoras (id, email)
select id, email from auth.users
on conflict (id) do nothing;
