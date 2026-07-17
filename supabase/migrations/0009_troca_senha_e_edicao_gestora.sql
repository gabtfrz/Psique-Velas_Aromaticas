-- 0009_troca_senha_e_edicao_gestora.sql
-- Três recursos ligados ao cadastro de gestoras:
--   1) Troca de senha obrigatória no primeiro login (senha provisória do master).
--   2) Leitura das gestoras COM o CPF decifrado (só master) — evita expor o
--      `cpf_cifrado` (bytea) no select, que chega ao front como Buffer.
--   3) Edição do cadastro de uma gestora (nome/telefone/CPF) — só master.

-- ============================================================
-- 1) Flag de senha provisória.
-- Toda gestora nova nasce com deve_trocar_senha = true (default). No primeiro
-- login o front obriga a troca e chama `marcar_senha_trocada()`. O master já
-- definiu a própria senha, então não precisa trocar.
-- ============================================================
alter table public.gestoras
  add column if not exists deve_trocar_senha boolean not null default true;

update public.gestoras set deve_trocar_senha = false where papel = 'master';

-- A própria gestora zera o flag DEPOIS de trocar a senha (auth.updateUser no
-- front). SECURITY DEFINER para poder gravar em gestoras (que não tem policy de
-- UPDATE); só mexe na PRÓPRIA linha (usuario_id = auth.uid()).
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

revoke execute on function public.marcar_senha_trocada() from public, anon;
grant  execute on function public.marcar_senha_trocada() to authenticated;

-- ============================================================
-- 2) Listagem das gestoras com CPF decifrado — SÓ master.
-- Nunca devolve o bytea; devolve o CPF em texto. Roda como owner (SECURITY
-- DEFINER), então consegue chamar decifrar_cpf/cifrar_cpf mesmo que o papel
-- authenticated não tenha EXECUTE direto nelas (0006).
-- ============================================================
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
           public.decifrar_cpf(g.cpf_cifrado) as cpf,
           g.deve_trocar_senha, g.criado_em
    from public.gestoras g
    order by g.id;
end;
$$;

revoke execute on function public.listar_gestoras() from public, anon;
grant  execute on function public.listar_gestoras() to authenticated;

-- ============================================================
-- 3) Edição do cadastro de uma gestora (nome/telefone/CPF) — SÓ master.
-- Re-cifra o CPF ao gravar. Papel e e-mail NÃO são editáveis aqui (e-mail é a
-- identidade de login em auth.users; papel fica de fora para evitar
-- auto-rebaixamento acidental do master).
-- ============================================================
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
     set nome        = p_nome,
         telefone    = p_telefone,
         cpf_cifrado = public.cifrar_cpf(p_cpf)
   where id = p_id;

  if not found then
    raise exception 'gestora % nao encontrada', p_id;
  end if;
end;
$$;

revoke execute on function public.atualizar_gestora(int, text, text, text) from public, anon;
grant  execute on function public.atualizar_gestora(int, text, text, text) to authenticated;
