import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/servicos/supabase'
import { schemaCliente } from '@/utils/validadores'
import { TABELAS } from '@/constantes'
import { linhaParaCliente, clienteParaLinha, type LinhaCliente } from '@/servicos/mapeadores'
import type { Cliente } from '@/tipos'

type EntradaNovoCliente = Omit<Cliente, 'id' | 'criadoEm'>
type EntradaEdicaoCliente = Omit<Cliente, 'criadoEm'>

// Converte a data de nascimento (Date | undefined) para o formato de string esperado
// pelo schemaCliente na validação, sem alterar o formato persistido pelos mapeadores.
function paraValidacao(entrada: EntradaNovoCliente | EntradaEdicaoCliente) {
  return {
    ...entrada,
    dataNascimento: entrada.dataNascimento
      ? new Date(entrada.dataNascimento).toISOString().slice(0, 10)
      : undefined,
  }
}

// Hook de domínio de clientes — lê e grava na tabela `clientes` da Supabase.
export function useClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([])

  // Carrega os clientes da Supabase na inicialização.
  useEffect(() => {
    let ativo = true
    supabase
      .from(TABELAS.CLIENTES)
      .select('*')
      .then(({ data, error }) => {
        if (!ativo || error || !data) return
        setClientes((data as LinhaCliente[]).map(linhaParaCliente))
      })
    return () => {
      ativo = false
    }
  }, [])

  const adicionarCliente = useCallback(async (entrada: EntradaNovoCliente) => {
    schemaCliente.parse(paraValidacao(entrada))
    const linha = clienteParaLinha(entrada)

    const { data, error } = await supabase
      .from(TABELAS.CLIENTES)
      .insert(linha)
      .select()
      .single()

    if (error || !data) {
      throw error ?? new Error('Não foi possível cadastrar a cliente.')
    }

    const novoCliente = linhaParaCliente(data as LinhaCliente)
    setClientes((atuais) => [...atuais, novoCliente])
    return novoCliente
  }, [])

  const editarCliente = useCallback(async (entrada: EntradaEdicaoCliente) => {
    schemaCliente.parse(paraValidacao(entrada))
    const linha = clienteParaLinha(entrada)

    const { data, error } = await supabase
      .from(TABELAS.CLIENTES)
      .update(linha)
      .eq('id', entrada.id)
      .select()
      .single()

    if (error || !data) {
      throw error ?? new Error('Não foi possível salvar as alterações da cliente.')
    }

    const clienteAtualizado = linhaParaCliente(data as LinhaCliente)
    setClientes((atuais) => atuais.map((c) => (c.id === entrada.id ? clienteAtualizado : c)))
  }, [])

  const buscarClientePorId = useCallback(
    (id: number) => clientes.find((c) => c.id === id),
    [clientes]
  )

  return {
    clientes,
    adicionarCliente,
    editarCliente,
    buscarClientePorId,
  }
}
