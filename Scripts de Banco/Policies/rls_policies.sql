/* ============================================================
   Policies de RLS (Row Level Security)
   A segurança do sistema mora no banco: a anon key é pública e o
   cliente nunca é confiável. Toda tabela tem RLS habilitada e o
   acesso é decidido pelas funções eh_gestora() / eh_master().

   Resumo:
     - Tabelas de negócio (produtos, clientes, vendas, itens_venda,
       insumos, produto_insumos): acesso TOTAL para quem está na
       allowlist de gestoras (qualquer papel) — policy gestora_acesso_total.
     - gestoras: a gestora lê só a PRÓPRIA linha; o master lê todas.
       Sem policy de escrita (INSERT/UPDATE/DELETE só via funções
       criar_gestora / atualizar_gestora / marcar_senha_trocada).
     - logs_auditoria: só o master LÊ; ninguém escreve pela API
       (só a trigger registrar_log grava).
   ============================================================ */

/* ------------------------------------------------------------
   Habilitação de RLS (todas as tabelas)
   Obs.: o event trigger ensure_rls já habilita RLS em tabela nova
   automaticamente; mantemos explícito aqui para documentação.
   ------------------------------------------------------------ */
alter table public.produtos        enable row level security;
alter table public.clientes        enable row level security;
alter table public.vendas          enable row level security;
alter table public.itens_venda     enable row level security;
alter table public.gestoras        enable row level security;
alter table public.logs_auditoria  enable row level security;
alter table public.insumos         enable row level security;
alter table public.produto_insumos enable row level security;

/* ------------------------------------------------------------
   Tabelas de negócio: acesso total só para gestoras (qualquer papel).
   FOR ALL cobre SELECT/INSERT/UPDATE/DELETE (using + with check).
   ------------------------------------------------------------ */
create policy gestora_acesso_total on public.produtos
  for all using (public.eh_gestora()) with check (public.eh_gestora());

create policy gestora_acesso_total on public.clientes
  for all using (public.eh_gestora()) with check (public.eh_gestora());

create policy gestora_acesso_total on public.vendas
  for all using (public.eh_gestora()) with check (public.eh_gestora());

create policy gestora_acesso_total on public.itens_venda
  for all using (public.eh_gestora()) with check (public.eh_gestora());

create policy gestora_acesso_total on public.insumos
  for all using (public.eh_gestora()) with check (public.eh_gestora());

create policy gestora_acesso_total on public.produto_insumos
  for all using (public.eh_gestora()) with check (public.eh_gestora());

/* ------------------------------------------------------------
   gestoras: leitura da própria linha (ou tudo, se master).
   Sem policy de INSERT/UPDATE/DELETE de propósito — escrita só pelas
   funções SECURITY DEFINER (criar_gestora/atualizar_gestora/
   marcar_senha_trocada), impedindo autopromoção a master pela API.
   ------------------------------------------------------------ */
create policy gestora_le_proprio_registro on public.gestoras
  for select using (usuario_id = auth.uid() or public.eh_master());

/* ------------------------------------------------------------
   logs_auditoria: só o master lê. Sem policy de INSERT — os registros
   só entram pela trigger registrar_log() (dona da tabela, isenta de RLS).
   ------------------------------------------------------------ */
create policy master_le_logs_auditoria on public.logs_auditoria
  for select using (public.eh_master());
