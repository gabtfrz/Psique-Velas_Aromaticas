/* ============================================================
   Event Trigger: ENSURE_RLS
   Dispara ao FIM de comandos DDL (ddl_command_end) e executa
   rls_auto_enable() (ver Functions/), que habilita RLS em qualquer
   tabela nova criada no schema public.

   Rede de segurança de infraestrutura: garante que nenhuma tabela
   nasça sem RLS por esquecimento. (Não substitui a criação das
   policies — ver Policies/.)
   ============================================================ */
create event trigger ensure_rls
  on ddl_command_end
  execute function public.rls_auto_enable();
