import { useCallback, useMemo } from 'react'
import { useArmazenamentoLocal } from './useArmazenamentoLocal'
import { vendasMock } from '@/dados/dadosMock'
import {
  calcularFaturamentoPeriodo,
  calcularTicketMedio,
  calcularTotalVenda,
} from '@/utils/calculadores'
import { gerarId, gerarNumeroPedido } from '@/utils/geradores'
import { CHAVES_STORAGE } from '@/constantes'
import type { Venda, StatusEntrega, StatusPagamento, CanalVenda, FaturamentoDiario } from '@/tipos'
import { useProdutos } from './useProdutos'

type EntradaVenda = Omit<Venda, 'id' | 'numeroPedido' | 'total' | 'criadoEm'>

export function useVendas() {
  const [vendas, setVendas] = useArmazenamentoLocal<Venda[]>(
    CHAVES_STORAGE.VENDAS,
    vendasMock
  )
  const { editarProduto, buscarProdutoPorId } = useProdutos()

  const registrarVenda = useCallback(
    (entrada: EntradaVenda) => {
      const total = calcularTotalVenda(entrada.itens, entrada.desconto)
      const novaVenda: Venda = {
        ...entrada,
        id: gerarId(),
        numeroPedido: gerarNumeroPedido(),
        total,
        criadoEm: new Date(),
      }

      entrada.itens.forEach((item) => {
        const produto = buscarProdutoPorId(item.produtoId)
        if (produto) {
          editarProduto({
            ...produto,
            estoqueAtual: Math.max(0, produto.estoqueAtual - item.quantidade),
          })
        }
      })

      setVendas([...vendas, novaVenda])
      return novaVenda
    },
    [vendas, setVendas, buscarProdutoPorId, editarProduto]
  )

  const atualizarStatusVenda = useCallback(
    (
      id: string,
      atualizacoes: Partial<{
        statusEntrega: StatusEntrega
        statusPagamento: StatusPagamento
      }>
    ) => {
      setVendas(vendas.map((v) => (v.id === id ? { ...v, ...atualizacoes } : v)))
    },
    [vendas, setVendas]
  )

  const calcularFaturamentoPeriodoHook = useCallback(
    (inicio: Date, fim: Date) => calcularFaturamentoPeriodo(vendas, inicio, fim),
    [vendas]
  )

  const calcularTicketMedioHook = useCallback(
    () => calcularTicketMedio(vendas),
    [vendas]
  )

  const agruparVendasPorCanal = useCallback((): Record<CanalVenda, number> => {
    const resultado = {} as Record<CanalVenda, number>
    vendas.forEach((v) => {
      resultado[v.canalVenda] = (resultado[v.canalVenda] ?? 0) + v.total
    })
    return resultado
  }, [vendas])

  const agruparFaturamentoPorDia = useCallback((): FaturamentoDiario[] => {
    const mapa = new Map<string, number>()
    vendas.forEach((v) => {
      const chave = new Date(v.criadoEm).toISOString().slice(0, 10)
      mapa.set(chave, (mapa.get(chave) ?? 0) + v.total)
    })
    return Array.from(mapa.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([data, valor]) => ({ data: new Date(data), valor }))
  }, [vendas])

  const vendasDoMes = useMemo(() => {
    const agora = new Date()
    const inicio = new Date(agora.getFullYear(), agora.getMonth(), 1)
    const fim = new Date(agora.getFullYear(), agora.getMonth() + 1, 0)
    return vendas.filter((v) => {
      const d = new Date(v.criadoEm)
      return d >= inicio && d <= fim
    })
  }, [vendas])

  return {
    vendas,
    vendasDoMes,
    registrarVenda,
    atualizarStatusVenda,
    calcularFaturamentoPeriodo: calcularFaturamentoPeriodoHook,
    calcularTicketMedio: calcularTicketMedioHook,
    agruparVendasPorCanal,
    agruparFaturamentoPorDia,
  }
}
