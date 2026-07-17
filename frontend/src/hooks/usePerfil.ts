import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/servicos/supabase'
import { TABELAS } from '@/constantes'
import type { PapelGestora } from '@/tipos'

// Reexportado para compatibilidade com quem já importava o tipo a partir daqui.
export type { PapelGestora }

interface PerfilGestora {
  nome?: string
  papel?: PapelGestora
  deveTrocarSenha: boolean
  carregando: boolean
  recarregarPerfil: () => Promise<void>
}

interface ResultadoPerfil {
  nome?: string
  papel?: PapelGestora
  deveTrocarSenha: boolean
}

// Perfil vazio (sem sessão ou falha na consulta) — reaproveitado para nunca montar o
// objeto de resultado de forma síncrona dentro do effect (ver comentário abaixo).
const PERFIL_VAZIO: ResultadoPerfil = { nome: undefined, papel: undefined, deveTrocarSenha: false }

// Busca o perfil (nome/papel/deveTrocarSenha) da gestora logada na tabela `gestoras`, a
// partir da sessão autenticada atual. Sem sessão, resolve o perfil vazio sem consultar o
// banco. Falha na consulta é tratada sem quebrar o hook — nome/papel ficam indefinidos.
export function usePerfil(sessao: Session | null): PerfilGestora {
  const [nome, setNome] = useState<string | undefined>(undefined)
  const [papel, setPapel] = useState<PapelGestora | undefined>(undefined)
  const [deveTrocarSenha, setDeveTrocarSenha] = useState(false)
  const [carregando, setCarregando] = useState(true)

  const buscarPerfil = useCallback(async (idUsuario: string): Promise<ResultadoPerfil> => {
    const { data, error } = await supabase
      .from(TABELAS.GESTORAS)
      .select('nome, papel, deve_trocar_senha')
      .eq('usuario_id', idUsuario)
      .single()

    if (error || !data) {
      return PERFIL_VAZIO
    }
    return {
      nome: data.nome as string,
      papel: data.papel as PapelGestora,
      deveTrocarSenha: Boolean(data.deve_trocar_senha),
    }
  }, [])

  const aplicarResultado = useCallback((perfil: ResultadoPerfil) => {
    setNome(perfil.nome)
    setPapel(perfil.papel)
    setDeveTrocarSenha(perfil.deveTrocarSenha)
  }, [])

  // Reagimos só à IDENTIDADE do usuário (id), não ao objeto Session inteiro:
  // o `onAuthStateChange` cria uma nova Session a cada TOKEN_REFRESHED (~1x/h),
  // o que dispararia um refetch desnecessário do perfil se dependêssemos dela.
  const idUsuario = sessao?.user.id

  useEffect(() => {
    let cancelado = false

    // O setState só ocorre dentro do `.then()`, nunca síncrono no corpo do effect —
    // sem sessão, resolvemos o perfil vazio da mesma forma (sempre assíncrona), sem
    // consultar o banco.
    const resultado = idUsuario ? buscarPerfil(idUsuario) : Promise.resolve(PERFIL_VAZIO)

    resultado.then((perfil) => {
      if (cancelado) return
      aplicarResultado(perfil)
      setCarregando(false)
    })

    return () => {
      cancelado = true
    }
  }, [idUsuario, buscarPerfil, aplicarResultado])

  // Reconsulta o perfil manualmente (fora de um effect) — usado após a gestora trocar a
  // senha no primeiro login, para desbloquear o app sem depender de um novo evento de auth.
  const recarregarPerfil = useCallback(async () => {
    if (!idUsuario) return
    const perfil = await buscarPerfil(idUsuario)
    aplicarResultado(perfil)
  }, [idUsuario, buscarPerfil, aplicarResultado])

  return { nome, papel, deveTrocarSenha, carregando, recarregarPerfil }
}
