import { createClient } from '@supabase/supabase-js'

// Cliente Supabase único da aplicação.
// As variáveis vêm do ambiente do Vite (frontend/.env). NUNCA usar a service_role key aqui.
const urlSupabase = import.meta.env.VITE_SUPABASE_URL
const chaveAnonima = import.meta.env.VITE_SUPABASE_ANON_KEY

// Falha explícita (não silenciosa) quando o ambiente não está configurado.
if (!urlSupabase || !chaveAnonima) {
  throw new Error(
    'Configuração da Supabase ausente: defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo frontend/.env (veja .env.example).'
  )
}

export const supabase = createClient(urlSupabase, chaveAnonima)
