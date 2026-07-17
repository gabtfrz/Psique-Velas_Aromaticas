-- 0007_rpc_criar_gestora.sql
-- RPC `public.criar_gestora()` — insere uma nova linha em `public.gestoras`
-- cifrando o CPF DENTRO do banco (evita que o bytea cifrado trafegue pelo
-- PostgREST/aplicação; a Edge Function `criar-usuario` manda o CPF em texto
-- só nesta chamada RPC, sobre TLS, e nunca grava/loga o valor em claro).
--
-- Depende de:
--   - 0004_gestoras_papeis.sql (tabela `gestoras`, função `cifrar_cpf(text)`)
--   - 0006_grants_seguranca.sql (grants de `cifrar_cpf`)
--
-- Quem chama: SOMENTE a Edge Function `criar-usuario`, com o client
-- `service_role` (depois de já ter validado `eh_master()` no chamador
-- original e criado o Auth user). Nunca é chamada por `anon`/`authenticated`.

-- ============================================================
-- 1) Função `public.criar_gestora()`.
-- SECURITY DEFINER + search_path vazio: roda como dono da função, que tem
-- EXECUTE em `cifrar_cpf()` (restrito a service_role/owner desde a 0006) e
-- INSERT em `gestoras` (mesmo sem policy de INSERT — dono de tabela é isento
-- de RLS, igual ao padrão já usado em `registrar_log()`).
-- Retorna o `id` inteiro da gestora recém-criada.
-- ============================================================
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

  insert into public.gestoras (usuario_id, nome, telefone, cpf_cifrado, papel, email)
  values (p_usuario_id, p_nome, p_telefone, public.cifrar_cpf(p_cpf), p_papel, p_email)
  returning id into v_id;

  return v_id;
end;
$$;

comment on function public.criar_gestora(uuid, text, text, text, text, text) is
  'Insere uma nova gestora cifrando o CPF no banco (via cifrar_cpf). Só chamável por service_role — usada exclusivamente pela Edge Function criar-usuario, depois de validar eh_master() e criar o Auth user.';

-- ============================================================
-- 2) Superfície RPC: fecha para anon/authenticated, libera só para service_role.
-- Mesmo padrão de 0004/0006 para cifrar_cpf/decifrar_cpf: por padrão o Postgres
-- concede EXECUTE a PUBLIC em função nova, o que exporia a criação de gestoras
-- via `rpc/criar_gestora` a qualquer sessão autenticada. Revogamos de
-- public/anon/authenticated e concedemos só a service_role.
-- ============================================================
revoke execute on function public.criar_gestora(uuid, text, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.criar_gestora(uuid, text, text, text, text, text)
  to service_role;
