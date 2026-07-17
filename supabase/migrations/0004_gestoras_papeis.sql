-- 0004_gestoras_papeis.sql
-- Estende `public.gestoras` de allowlist simples para o modelo de papéis
-- (master x gestora) com dados pessoais obrigatórios (nome/telefone) e CPF
-- cifrado em repouso (pgcrypto + chave guardada no Supabase Vault).
--
-- master  = acesso ilimitado, único papel que pode decifrar CPF e (futuramente,
--           via Edge Function) criar novos usuários.
-- gestora = uso operacional do sistema; mesmo acesso aos dados de negócio, mas
--           não decifra CPF de ninguém e não cria usuários.

-- ============================================================
-- 1) Extensão de cifra (pgcrypto) e schema padrão da Supabase para extensões.
-- ============================================================
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

-- ============================================================
-- 2) Chave simétrica de cifra do CPF, guardada no Supabase Vault.
-- Idempotente: só gera/guarda uma nova chave se o segredo `chave_cpf` ainda
-- não existir (rodar a migration de novo não troca a chave e não invalida
-- CPFs já cifrados). A chave NUNCA aparece em texto no código do front nem
-- no repositório — só é lida de dentro das funções SECURITY DEFINER abaixo.
-- ============================================================
do $$
declare
  ja_existe_chave boolean;
  chave_gerada    text;
begin
  select exists (
    select 1 from vault.secrets where name = 'chave_cpf'
  ) into ja_existe_chave;

  if not ja_existe_chave then
    chave_gerada := encode(extensions.gen_random_bytes(32), 'hex');

    perform vault.create_secret(
      chave_gerada,
      'chave_cpf',
      'Chave simetrica (pgp_sym_encrypt/decrypt) usada para cifrar/decifrar o CPF das gestoras. Gerada automaticamente pela migration 0004_gestoras_papeis.sql. Nunca deve ser exposta ao frontend ou versionada.'
    );
  end if;
end $$;

-- ============================================================
-- 3) Recria `public.gestoras` com o schema completo do papel.
-- A tabela muda de PK `uuid = auth.users.id` para PK inteira sequencial
-- (padrão do projeto desde 0003_ids_sequenciais.sql) + `usuario_id` como FK
-- única para auth.users. `cascade` remove policies/funções que dependam
-- diretamente da tabela (nenhuma outra tabela referencia `gestoras` por FK).
--
-- ATENÇÃO: esta migration é ONE-SHOT. Depois do primeiro deploy, `gestoras`
-- passa a conter dados REAIS (nome/telefone/CPF cifrado). NÃO reaplique este
-- arquivo nem rode `db reset` em produção — o `drop table` abaixo apagaria
-- todos os cadastros e CPFs cifrados já coletados.
-- ============================================================
drop table if exists public.gestoras cascade;

create table public.gestoras (
  id           int generated always as identity (minvalue 1 maxvalue 999999) primary key,
  usuario_id   uuid not null unique references auth.users(id) on delete cascade,
  nome         text not null,
  telefone     text not null,
  cpf_cifrado  bytea not null,
  papel        text not null check (papel in ('master', 'gestora')),
  email        text not null,
  criado_em    timestamptz not null default now(),
  constraint gestoras_id_max check (id between 1 and 999999)
);

comment on table public.gestoras is
  'Usuárias autorizadas do backoffice. papel master = acesso ilimitado e único que decifra CPF/cria usuários; papel gestora = uso operacional.';
comment on column public.gestoras.cpf_cifrado is
  'CPF cifrado em repouso com pgp_sym_encrypt (pgcrypto), chave lida do Supabase Vault (segredo chave_cpf). Nunca gravar/consultar CPF em claro.';

-- ============================================================
-- 4) Funções de cifra/decifra do CPF (SECURITY DEFINER, search_path vazio).
-- Rodam como dono da função para poder ler `vault.decrypted_secrets` e
-- `extensions.pgp_sym_*`, mesmo que o chamador não tenha acesso direto a eles.
-- ============================================================

-- Cifra um CPF em texto puro. Qualquer papel autorizado pode cifrar (é usado
-- no cadastro, antes de existir o registro em gestoras).
create or replace function public.cifrar_cpf(cpf text)
returns bytea
language plpgsql
security definer
set search_path = ''
as $$
declare
  chave text;
begin
  select decrypted_secret into chave
  from vault.decrypted_secrets
  where name = 'chave_cpf';

  if chave is null then
    raise exception 'chave de cifra do CPF (chave_cpf) nao encontrada no Vault';
  end if;

  return extensions.pgp_sym_encrypt(cpf, chave);
end;
$$;

comment on function public.cifrar_cpf(text) is
  'Cifra um CPF em texto puro usando pgp_sym_encrypt com a chave do Vault (chave_cpf). Retorna bytea para ser gravado em gestoras.cpf_cifrado.';

-- ============================================================
-- 5) `eh_gestora()` — qualquer papel autorizado (master ou gestora) acessa os
-- dados de negócio. Agora casa por `usuario_id`, não mais por `id`.
-- ============================================================
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

-- ============================================================
-- 6) `eh_master()` — só o papel master. Usada nas policies de leitura total
-- de gestoras, na decifra de CPF e (nas próximas fases) para autorizar
-- criação de usuários e leitura de logs de auditoria.
-- ============================================================
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

-- ============================================================
-- 7) Decifra de CPF — só o papel master pode decifrar (usa eh_master()).
-- Depende de eh_master() já existir (definida acima).
-- ============================================================
create or replace function public.decifrar_cpf(dado bytea)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  chave text;
begin
  if not public.eh_master() then
    raise exception 'apenas o papel master pode decifrar CPF';
  end if;

  select decrypted_secret into chave
  from vault.decrypted_secrets
  where name = 'chave_cpf';

  if chave is null then
    raise exception 'chave de cifra do CPF (chave_cpf) nao encontrada no Vault';
  end if;

  return extensions.pgp_sym_decrypt(dado, chave);
end;
$$;

comment on function public.decifrar_cpf(bytea) is
  'Decifra gestoras.cpf_cifrado usando a chave do Vault (chave_cpf). Bloqueada para quem não é master (raise exception).';

-- ============================================================
-- 7b) Superfície RPC mínima das funções sensíveis de CPF.
-- Por padrão o Postgres concede EXECUTE a PUBLIC em toda função nova, o que as
-- expõe via PostgREST (rpc/...). Fechamos isso:
--  - cifrar_cpf: NUNCA é chamada pelo cliente (o front não cifra). Só o cadastro
--    server-side (Edge Function/service_role) e o bootstrap (owner) a usam.
--  - decifrar_cpf: fica disponível ao papel autenticado, mas o corpo já exige
--    eh_master() — a policy de autorização mora dentro da função.
-- eh_gestora()/eh_master() NÃO são revogadas: são usadas dentro das policies
-- RLS e o papel autenticado precisa de EXECUTE para as policies avaliarem.
-- ============================================================
revoke execute on function public.cifrar_cpf(text)    from public;
grant  execute on function public.cifrar_cpf(text)    to service_role;
revoke execute on function public.decifrar_cpf(bytea) from public;
grant  execute on function public.decifrar_cpf(bytea) to authenticated, service_role;

-- ============================================================
-- 8) RLS de `gestoras`.
-- Só SELECT: gestora lê o próprio registro; master lê todos.
-- Sem policy de INSERT/UPDATE/DELETE de propósito — cadastro e edição de
-- gestoras só acontecem via Edge Function com service_role (que ignora RLS),
-- nunca pela anon/authenticated key. Isso impede que uma gestora se
-- autopromova a master ou edite CPF/papel de outra pessoa direto pela API.
-- ============================================================
alter table public.gestoras enable row level security;

drop policy if exists gestora_le_gestoras on public.gestoras;
drop policy if exists gestora_le_proprio_registro on public.gestoras;

create policy gestora_le_proprio_registro on public.gestoras
  for select using (usuario_id = auth.uid() or public.eh_master());

-- ============================================================
-- 9) Bootstrap do MASTER: promove SOMENTE a conta do SYS admin a `papel=master`.
-- NUNCA promover todo auth.users — qualquer outra conta (ex.: a gestora de teste)
-- viraria master e poderia decifrar CPF/criar usuários. O master é a única conta
-- que não pode se autocriar pela Edge Function, então é semeada aqui por SQL.
-- Dados pessoais são PLACEHOLDER (telefone '000000000', CPF '00000000000'
-- cifrado); o master atualiza nome/telefone/CPF reais depois (Fase 3.2 do plano).
-- Idempotente via on conflict (usuario_id).
-- ============================================================
insert into public.gestoras (usuario_id, nome, telefone, cpf_cifrado, papel, email)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'name', u.email),
  '000000000',
  public.cifrar_cpf('00000000000'),
  'master',
  u.email
from auth.users u
where u.email = 'ferrazgabriel248@gmail.com'
on conflict (usuario_id) do nothing;
