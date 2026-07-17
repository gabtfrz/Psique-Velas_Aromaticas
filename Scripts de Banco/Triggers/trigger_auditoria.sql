/* ============================================================
   Trigger: TRIGGER_AUDITORIA
   Trigger de LINHA que chama registrar_log() (ver Functions/) após
   cada INSERT/UPDATE/DELETE, gravando a trilha em logs_auditoria.

   Existe, idêntica, nas 7 tabelas de negócio:
     produtos, clientes, vendas, itens_venda, gestoras,
     insumos, produto_insumos.

   A tabela logs_auditoria NÃO tem esta trigger (não se audita o log).
   `drop trigger if exists` antes de criar torna idempotente.
   ============================================================ */

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

drop trigger if exists trigger_auditoria on public.insumos;
create trigger trigger_auditoria
  after insert or update or delete on public.insumos
  for each row execute function public.registrar_log();

drop trigger if exists trigger_auditoria on public.produto_insumos;
create trigger trigger_auditoria
  after insert or update or delete on public.produto_insumos
  for each row execute function public.registrar_log();
