import { useCallback } from 'react'
import { useArmazenamentoLocal } from './useArmazenamentoLocal'
import { clientesMock } from '@/dados/dadosMock'
import { gerarId } from '@/utils/geradores'
import { CHAVES_STORAGE } from '@/constantes'
import type { Cliente } from '@/tipos'

type EntradaNovoCliente = Omit<Cliente, 'id' | 'criadoEm'>
type EntradaEdicaoCliente = Omit<Cliente, 'criadoEm'>

export function useClientes() {
  const [clientes, setClientes] = useArmazenamentoLocal<Cliente[]>(
    CHAVES_STORAGE.CLIENTES,
    clientesMock
  )

  const adicionarCliente = useCallback(
    (entrada: EntradaNovoCliente) => {
      const novoCliente: Cliente = {
        ...entrada,
        id: gerarId(),
        criadoEm: new Date(),
      }
      setClientes([...clientes, novoCliente])
      return novoCliente
    },
    [clientes, setClientes]
  )

  const editarCliente = useCallback(
    (entrada: EntradaEdicaoCliente) => {
      setClientes(
        clientes.map((c) =>
          c.id === entrada.id
            ? { ...entrada, criadoEm: c.criadoEm }
            : c
        )
      )
    },
    [clientes, setClientes]
  )

  const buscarClientePorId = useCallback(
    (id: string) => clientes.find((c) => c.id === id),
    [clientes]
  )

  return {
    clientes,
    adicionarCliente,
    editarCliente,
    buscarClientePorId,
  }
}
