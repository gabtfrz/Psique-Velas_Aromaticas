-- 0005_auditoria.sql
-- Tabela de auditoria (`logs_auditoria`) + função de trigger `registrar_log()` +
-- triggers em todas as tabelas de negócio (produtos, clientes, vendas, itens_venda,
-- gestoras). Objetivo: toda alteração de dados fica registrada com autor, papel,
-- ação, tabela, linha afetada e o "antes/depois" em JSON — sem nunca gravar CPF
-- em claro no log.
--
-- Depende de:
--   - 0003_ids_sequenciais.sql (produtos/clientes/vendas/itens_venda com PK int)
--   - 0004_gestoras_papeis.sql (gestoras com papel; funções eh_gestora()/eh_master())

-- ============================================================
-- 1) Tabela `public.logs_auditoria`.
-- PK inteira sequencial 1–999999, no mesmo padrão das demais tabelas do projeto.
-- `usuario_id`/`papel` guardam quem fez a ação e com que papel no momento (podem
-- ser null quando a ação roda sem sessão, ex.: via service_role/Edge Function).
-- ============================================================
create table if not exists public.logs_auditoria (
  id           int generated always as identity (minvalue 1 maxvalue 999999) primary key,
  usuario_id   uuid references auth.users(id) on delete set null,
  papel        text,
  acao         text not null check (acao in ('INSERT', 'UPDATE', 'DELETE')),
  tabela       text not null,
  registro_id  int,
  dados_antes  jsonb,
  dados_depois jsonb,
  criado_em    timestamptz not null default now(),
  constraint logs_auditoria_id_max check (id between 1 and 999999)
);

comment on table public.logs_auditoria is
  'Log de auditoria: uma linha por INSERT/UPDATE/DELETE em cada tabela de negócio, gravada automaticamente pela trigger registrar_log(). Só o papel master lê esta tabela.';
comment on column public.logs_auditoria.usuario_id is
  'auth.uid() de quem executou a ação; pode ser null quando a operação roda sem sessão (ex.: service_role).';
comment on column public.logs_auditoria.papel is
  'Papel (master/gestora) do autor no momento da ação, lido de public.gestoras; pode ser null se o autor não estiver em gestoras.';
comment on column public.logs_auditoria.registro_id is
  'id da linha afetada na tabela de origem (coalesce(NEW.id, OLD.id)).';
comment on column public.logs_auditoria.dados_antes is
  'to_jsonb(OLD) em UPDATE/DELETE; null em INSERT. Para a tabela gestoras, a chave cpf_cifrado é removida antes de gravar.';
comment on column public.logs_auditoria.dados_depois is
  'to_jsonb(NEW) em INSERT/UPDATE; null em DELETE. Para a tabela gestoras, a chave cpf_cifrado é removida antes de gravar.';

-- ============================================================
-- 2) Função de trigger `public.registrar_log()`.
-- SECURITY DEFINER + search_path vazio: roda com o dono da função (mesmo dono
-- das tabelas, aplicado pela migration), que é isento de RLS por ser table
-- owner — por isso o INSERT em logs_auditoria funciona mesmo sem policy de
-- INSERT (ver seção 4).
--
-- Nunca grava CPF em claro: a única coluna sensível nas tabelas auditadas é
-- gestoras.cpf_cifrado, que já está cifrada (bytea); ainda assim, removemos a
-- chave do jsonb para a tabela gestoras, para não persistir o blob cifrado
-- dentro do log (nem ele nem o texto plano jamais entram em logs_auditoria).
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

  -- Nunca gravar cpf_cifrado no log da tabela gestoras.
  if TG_TABLE_NAME = 'gestoras' then
    if v_dados_antes is not null then
      v_dados_antes := v_dados_antes - 'cpf_cifrado';
    end if;
    if v_dados_depois is not null then
      v_dados_depois := v_dados_depois - 'cpf_cifrado';
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

comment on function public.registrar_log() is
  'Função de trigger (SECURITY DEFINER, search_path vazio) que grava em public.logs_auditoria uma linha por INSERT/UPDATE/DELETE. Remove cpf_cifrado do jsonb quando a tabela de origem é gestoras.';

-- ============================================================
-- 3) Triggers nas tabelas de negócio.
-- `drop trigger if exists` torna a migration idempotente (pode rodar de novo
-- sem duplicar trigger).
-- ============================================================
drop trigger if exists trigger_auditoria on public.produtos;
create trigger trigger_auditoria
  after insert or update or delete on public.produtos
  for each row execute function public.registrar_log();

drop trigger if exists trigger_auditoria on public.clientes;
create trigger trigger_auditoria
  after insert or update or delete on public.clientes
  for each row execute function public.registrar_log();

drop trigger if exists trigger_auditoria on public.vendas;
create trigger trigger_auditoria
  after insert or update or delete on public.vendas
  for each row execute function public.registrar_log();

drop trigger if exists trigger_auditoria on public.itens_venda;
create trigger trigger_auditoria
  after insert or update or delete on public.itens_venda
  for each row execute function public.registrar_log();

drop trigger if exists trigger_auditoria on public.gestoras;
create trigger trigger_auditoria
  after insert or update or delete on public.gestoras
  for each row execute function public.registrar_log();

-- ============================================================
-- 4) RLS de `logs_auditoria`.
-- Só o papel master pode ler (SELECT). Não existe policy de INSERT/UPDATE/DELETE
-- de propósito: os inserts só devem acontecer via registrar_log(), que roda
-- SECURITY DEFINER como dono da tabela — dono de tabela é isento de RLS por
-- padrão (a menos que FORCE ROW LEVEL SECURITY esteja ativo, o que não fazemos
-- aqui). Assim, nenhuma role via anon/authenticated key consegue inserir,
-- editar ou apagar log diretamente pela API; só a trigger grava.
-- ============================================================
alter table public.logs_auditoria enable row level security;

drop policy if exists master_le_logs_auditoria on public.logs_auditoria;

create policy master_le_logs_auditoria on public.logs_auditoria
  for select using (public.eh_master());
