import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/servicos/supabase'

interface ResultadoEntrada {
  sucesso: boolean
  erro?: string
}

// Estado e operações de autenticação da aplicação (Supabase Auth).
export function useAutenticacao() {
  const [sessao, setSessao] = useState<Session | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    // Recupera a sessão atual (se houver) ao montar.
    supabase.auth.getSession().then(({ data }) => {
      setSessao(data.session)
      setCarregando(false)
    })

    // Reage a login/logout/refresh de token em qualquer aba.
    const { data: assinatura } = supabase.auth.onAuthStateChange((_evento, novaSessao) => {
      setSessao(novaSessao)
      setCarregando(false)
    })

    return () => assinatura.subscription.unsubscribe()
  }, [])

  const entrar = useCallback(
    async (email: string, senha: string): Promise<ResultadoEntrada> => {
      const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
      if (error) {
        return { sucesso: false, erro: 'E-mail ou senha inválidos.' }
      }
      return { sucesso: true }
    },
    []
  )

  const sair = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  return { sessao, carregando, entrar, sair }
}
