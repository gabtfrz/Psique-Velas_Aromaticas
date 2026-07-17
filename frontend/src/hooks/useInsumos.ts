import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/servicos/supabase'
import { schemaInsumo } from '@/utils/validadores'
import { TABELAS } from '@/constantes'
import { linhaParaInsumo, insumoParaLinha, type LinhaInsumo } from '@/servicos/mapeadores'
import type { Insumo } from '@/tipos'

type EntradaNovoInsumo = Omit<Insumo, 'id' | 'criadoEm' | 'atualizadoEm'>
type EntradaEdicaoInsumo = Omit<Insumo, 'criadoEm' | 'atualizadoEm'>

// Hook de domínio de insumos — lê e grava na tabela `insumos` da Supabase.
export function useInsumos() {
  const [insumos, setInsumos] = useState<Insumo[]>([])

  // Carrega os insumos da Supabase na inicialização.
  useEffect(() => {
    let ativo = true
    supabase
      .from(TABELAS.INSUMOS)
      .select('*')
      .then(({ data, error }) => {
        if (!ativo || error || !data) return
        setInsumos((data as LinhaInsumo[]).map(linhaParaInsumo))
      })
    return () => {
      ativo = false
    }
  }, [])

  const adicionarInsumo = useCallback(async (entrada: EntradaNovoInsumo) => {
    schemaInsumo.parse(entrada)
    const linha = insumoParaLinha(entrada)

    const { data, error } = await supabase
      .from(TABELAS.INSUMOS)
      .insert(linha)
      .select()
      .single()

    if (error || !data) {
      throw error ?? new Error('Não foi possível cadastrar o insumo.')
    }

    const novoInsumo = linhaParaInsumo(data as LinhaInsumo)
    setInsumos((atuais) => [...atuais, novoInsumo])
    return novoInsumo
  }, [])

  const editarInsumo = useCallback(async (entrada: EntradaEdicaoInsumo) => {
    schemaInsumo.parse(entrada)
    const linha = insumoParaLinha(entrada)

    const { data, error } = await supabase
      .from(TABELAS.INSUMOS)
      .update({ ...linha, atualizado_em: new Date().toISOString() })
      .eq('id', entrada.id)
      .select()
      .single()

    if (error || !data) {
      throw error ?? new Error('Não foi possível salvar as alterações do insumo.')
    }

    const insumoAtualizado = linhaParaInsumo(data as LinhaInsumo)
    setInsumos((atuais) => atuais.map((i) => (i.id === entrada.id ? insumoAtualizado : i)))
  }, [])

  const removerInsumo = useCallback(async (id: number) => {
    const { error } = await supabase.from(TABELAS.INSUMOS).delete().eq('id', id)
    if (error) {
      throw error
    }
    setInsumos((atuais) => atuais.filter((i) => i.id !== id))
  }, [])

  const buscarInsumoPorId = useCallback(
    (id: number) => insumos.find((i) => i.id === id),
    [insumos]
  )

  const insumosOrdenados = useMemo(
    () => [...insumos].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')),
    [insumos]
  )

  return {
    insumos,
    insumosOrdenados,
    adicionarInsumo,
    editarInsumo,
    removerInsumo,
    buscarInsumoPorId,
  }
}
