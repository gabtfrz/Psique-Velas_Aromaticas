import { useCallback, useEffect, useState } from 'react'
import { FunctionsHttpError } from '@supabase/supabase-js'
import { supabase } from '@/servicos/supabase'
import { FUNCAO_CRIAR_USUARIO, RPC_ATUALIZAR_GESTORA, RPC_LISTAR_GESTORAS } from '@/constantes'
import { linhaParaGestora, type LinhaGestora } from '@/servicos/mapeadores'
import type { EntradaUsuario, EntradaEditarUsuario } from '@/utils/validadores'
import type { Gestora } from '@/tipos'

const MENSAGEM_ERRO_GENERICA = 'Não foi possível cadastrar a gestora. Tente novamente.'
const MENSAGEM_ERRO_EDITAR_GENERICA = 'Não foi possível salvar as alterações. Tente novamente.'

interface RespostaCriarUsuario {
  ok: boolean
  id?: number
}

interface CorpoErroCriarUsuario {
  ok: false
  erro: string
}

interface ResultadoCriarUsuario {
  sucesso: boolean
  erro?: string
}

interface ResultadoEditarUsuario {
  sucesso: boolean
  erro?: string
}

// Extrai a mensagem PT-BR do corpo `{ ok: false, erro }` devolvido pela Edge Function
// `criar-usuario` em respostas 4xx/5xx, sem vazar detalhes internos da falha.
async function extrairMensagemErro(erro: unknown): Promise<string | undefined> {
  if (erro instanceof FunctionsHttpError && typeof erro.context?.json === 'function') {
    const corpo = (await erro.context.json().catch(() => null)) as CorpoErroCriarUsuario | null
    if (corpo && corpo.ok === false && typeof corpo.erro === 'string') {
      return corpo.erro
    }
  }
  return undefined
}

// Converte o resultado bruto da RPC `listar_gestoras` em `Gestora[]` — nunca lança,
// devolve lista vazia em caso de erro. Função pura (sem setState), reaproveitada pelo
// load inicial e por `listarGestoras` (refetch manual após criar/editar uma gestora).
function mapearGestoras(data: unknown, error: unknown): Gestora[] {
  if (error || !data) return []
  return (data as LinhaGestora[]).map(linhaParaGestora)
}

// Hook de domínio de usuários (gestoras) — lê as gestoras (com CPF já decifrado) e cria
// novas gestoras via a Edge Function `criar-usuario`, que valida o papel master e usa a
// service_role no servidor (nunca no cliente). Ambas as RPCs usadas aqui (`listar_gestoras`
// e `atualizar_gestora`) só são executáveis pelo papel master.
export function useUsuarios() {
  const [gestoras, setGestoras] = useState<Gestora[]>([])
  const [carregando, setCarregando] = useState(true)

  // Carrega a lista de gestoras na inicialização da tela (mesmo padrão de useProdutos:
  // o setState só ocorre dentro do `.then()`, nunca síncrono no corpo do effect).
  useEffect(() => {
    let ativo = true
    supabase
      .rpc(RPC_LISTAR_GESTORAS)
      .then(({ data, error }) => {
        if (!ativo) return
        setGestoras(mapearGestoras(data, error))
        setCarregando(false)
      })
    return () => {
      ativo = false
    }
  }, [])

  // Refetch manual (fora de um effect) — usado pela tela após criar/editar uma gestora.
  const listarGestoras = useCallback(async () => {
    setCarregando(true)
    const { data, error } = await supabase.rpc(RPC_LISTAR_GESTORAS)
    setGestoras(mapearGestoras(data, error))
    setCarregando(false)
  }, [])

  const criarUsuario = useCallback(
    async (entrada: EntradaUsuario): Promise<ResultadoCriarUsuario> => {
      // Persiste o CPF SEM máscara (só dígitos) — o campo do formulário chega mascarado.
      const corpo = { ...entrada, cpf: entrada.cpf.replace(/\D/g, '') }
      const { data, error } = await supabase.functions.invoke<RespostaCriarUsuario>(
        FUNCAO_CRIAR_USUARIO,
        { body: corpo }
      )

      if (error) {
        const mensagem = await extrairMensagemErro(error)
        return { sucesso: false, erro: mensagem ?? MENSAGEM_ERRO_GENERICA }
      }

      if (!data || data.ok !== true) {
        return { sucesso: false, erro: MENSAGEM_ERRO_GENERICA }
      }

      return { sucesso: true }
    },
    []
  )

  const editarUsuario = useCallback(
    async (id: number, dados: EntradaEditarUsuario): Promise<ResultadoEditarUsuario> => {
      const { error } = await supabase.rpc(RPC_ATUALIZAR_GESTORA, {
        p_id: id,
        p_nome: dados.nome,
        p_telefone: dados.telefone,
        // Persiste o CPF SEM máscara (só dígitos) — o campo do formulário chega mascarado.
        p_cpf: dados.cpf.replace(/\D/g, ''),
      })

      if (error) {
        return { sucesso: false, erro: error.message || MENSAGEM_ERRO_EDITAR_GENERICA }
      }

      await listarGestoras()
      return { sucesso: true }
    },
    [listarGestoras]
  )

  return { gestoras, carregando, listarGestoras, criarUsuario, editarUsuario }
}
