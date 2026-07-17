-- 0006_grants_seguranca.sql
-- Fecha a superfície RPC das funções SECURITY DEFINER sensíveis.
-- Contexto: a Supabase concede EXECUTE DIRETO a `anon`/`authenticated` em toda
-- função nova do schema public (via alter default privileges), então o
-- `revoke ... from public` do 0004 não removeu esses grants diretos. Aqui
-- revogamos explicitamente dos roles do cliente.
--
-- Mantidas executáveis por anon/authenticated de propósito (NÃO revogar):
--   public.eh_gestora() e public.eh_master() — são chamadas DENTRO das policies
--   RLS; o role que faz a query precisa de EXECUTE ou o RLS falha com
--   "permission denied for function". É o padrão de helper de RLS da Supabase.

-- ============================================================
-- cifrar_cpf / decifrar_cpf: cifra e decifra de CPF são operações server-side.
-- O front NUNCA cifra nem decifra CPF direto — quem faz é a Edge Function de
-- cadastro (service_role). Decifrar em claro fica restrito ao service_role
-- (e ao owner); o eh_master() no corpo de decifrar_cpf permanece como defesa
-- em profundidade. Nenhuma das duas é usada em policy, então revogar é seguro.
-- ============================================================
revoke execute on function public.cifrar_cpf(text)    from anon, authenticated;
revoke execute on function public.decifrar_cpf(bytea) from anon, authenticated;
grant  execute on function public.cifrar_cpf(text)    to service_role;
grant  execute on function public.decifrar_cpf(bytea) to service_role;

-- ============================================================
-- registrar_log(): é função de TRIGGER. Triggers disparam sem exigir EXECUTE do
-- role que fez o INSERT/UPDATE/DELETE, então ninguém precisa de EXECUTE direto.
-- Revogamos de todos para tirar a exposição via rpc/registrar_log.
-- ============================================================
revoke execute on function public.registrar_log() from public, anon, authenticated;
