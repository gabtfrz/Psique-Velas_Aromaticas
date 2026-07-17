-- 0010_cpf_gestora_texto.sql
-- Decisão do cliente: o CPF da gestora deixa de ser cifrado (bytea) e passa a
-- ser um `varchar(11)` em TEXTO PURO, sempre sem máscara (só os 11 dígitos).
-- Contratos das RPCs (criar_gestora/atualizar_gestora/listar_gestoras) NÃO mudam
-- — continuam recebendo/retornando `cpf` em texto —, então o frontend não muda.
--
-- Depende de: 0004 (gestoras), 0005 (registrar_log), 0007/0009 (RPCs), 0006 (grants).

-- ============================================================
-- 1) Nova coluna de texto + backfill decifrando o valor atual.
-- O backfill roda como postgres (owner), lendo a chave direto do Vault — não
-- passa por decifrar_cpf() (que exige eh_master() e aqui não há sessão).
-- ============================================================
alter table public.gestoras add column if not exists cpf varchar(11);

update public.gestoras g
   set cpf = extensions.pgp_sym_decrypt(
     g.cpf_cifrado,
     (select decrypted_secret from vault.decrypted_secrets where name = 'chave_cpf')
   )
 where g.cpf is null and g.cpf_cifrado is not null;

-- ============================================================
-- 2) Restrições: obrigatório e exatamente 11 dígitos (sem máscara).
-- ============================================================
alter table public.gestoras alter column cpf set not null;
alter table public.gestoras
  add constraint gestoras_cpf_formato check (cpf ~ '^[0-9]{11}$');

comment on column public.gestoras.cpf is
  'CPF em texto puro, só os 11 dígitos (sem máscara). Decisão do cliente: não é mais cifrado.';

-- ============================================================
-- 3) Reescreve as RPCs para usar o CPF em texto (sem cifrar/decifrar).
-- Assinaturas idênticas às versões anteriores (0007/0009) — o front não muda.
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

  insert into public.gestoras (usuario_id, nome, telefone, cpf, papel, email)
  values (p_usuario_id, p_nome, p_telefone, p_cpf, p_papel, p_email)
  returning id into v_id;

  return v_id;
end;
$$;

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

-- ============================================================
-- 4) Auditoria: como o CPF agora é texto puro, mascaramos a chave `cpf` (em vez
-- de `cpf_cifrado`) no jsonb do log da tabela gestoras — mantém o CPF fora do
-- log de auditoria mesmo em texto puro.
-- ============================================================
create or replace function public.registrar_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_registro_id  int;
  v_dados_antes  jsonb;
  v_dados_depois jsonb;
  v_papel        text;
begin
  if TG_OP = 'DELETE' then
    v_registro_id := OLD.id;
    v_dados_antes := to_jsonb(OLD);
  elsif TG_OP = 'UPDATE' then
    v_registro_id  := coalesce(NEW.id, OLD.id);
    v_dados_antes  := to_jsonb(OLD);
    v_dados_depois := to_jsonb(NEW);
  else -- INSERT
    v_registro_id  := NEW.id;
    v_dados_depois := to_jsonb(NEW);
  end if;

  -- Não gravar o CPF no log da tabela gestoras.
  if TG_TABLE_NAME = 'gestoras' then
    if v_dados_antes is not null then
      v_dados_antes := v_dados_antes - 'cpf';
    end if;
    if v_dados_depois is not null then
      v_dados_depois := v_dados_depois - 'cpf';
    end if;
  end if;

  select g.papel into v_papel
  from public.gestoras g
  where g.usuario_id = auth.uid();

  insert into public.logs_auditoria
    (usuario_id, papel, acao, tabela, registro_id, dados_antes, dados_depois)
  values
    (auth.uid(), v_papel, TG_OP, TG_TABLE_NAME, v_registro_id, v_dados_antes, v_dados_depois);

  if TG_OP = 'DELETE' then
    return OLD;
  end if;

  return NEW;
end;
$$;

-- ============================================================
-- 5) Remove a coluna cifrada e as funções de cifra, agora sem uso.
-- (A chave `chave_cpf` no Vault fica órfã/inofensiva; pode ser removida à mão
--  na dashboard se desejado.)
-- ============================================================
alter table public.gestoras drop column if exists cpf_cifrado;
drop function if exists public.cifrar_cpf(text);
drop function if exists public.decifrar_cpf(bytea);
