import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/servicos/supabase'
import {
  calcularFaturamentoPeriodo,
  calcularTicketMedio,
  calcularTotalVenda,
} from '@/utils/calculadores'
import { gerarNumeroPedido } from '@/utils/geradores'
import { schemaVenda } from '@/utils/validadores'
import { RPC_REGISTRAR_VENDA, TABELAS } from '@/constantes'
import {
  linhaParaVenda,
  vendaParaPayloadRpc,
  type LinhaVendaComItens,
} from '@/servicos/mapeadores'
import type { Venda, StatusEntrega, StatusPagamento, CanalVenda, FaturamentoDiario } from '@/tipos'

type EntradaVenda = Omit<Venda, 'id' | 'numeroPedido' | 'total' | 'criadoEm'>

// Colunas da tabela `vendas` com os itens (`itens_venda`) já aninhados via join.
const SELECAO_VENDA_COM_ITENS = '*, itens_venda(*)'

// Hook de domínio de vendas — lê o histórico da Supabase (com itens) e registra
// novas vendas via a RPC transacional `registrar_venda`, que insere venda + itens
// e baixa o estoque dos produtos atomicamente (sem baixa manual no cliente).
export function useVendas() {
  const [vendas, setVendas] = useState<Venda[]>([])

  // Carrega o histórico de vendas (com itens) da Supabase na inicialização.
  useEffect(() => {
    let ativo = true
    supabase
      .from(TABELAS.VENDAS)
      .select(SELECAO_VENDA_COM_ITENS)
      .then(({ data, error }) => {
        if (!ativo || error || !data) return
        setVendas((data as LinhaVendaComItens[]).map(linhaParaVenda))
      })
    return () => {
      ativo = false
    }
  }, [])

  const registrarVenda = useCallback(async (entrada: EntradaVenda) => {
    schemaVenda.parse(entrada)
    const total = calcularTotalVenda(entrada.itens, entrada.desconto)
    const numeroPedido = gerarNumeroPedido()
    const { p_venda, p_itens } = vendaParaPayloadRpc(
      { ...entrada, numeroPedido },
      total
    )

    const { data: novoId, error } = await supabase.rpc(RPC_REGISTRAR_VENDA, {
      p_venda,
      p_itens,
    })

    if (error || !novoId) {
      throw error ?? new Error('Não foi possível registrar a venda: estoque insuficiente.')
    }

    const novaVenda: Venda = {
      ...entrada,
      id: novoId as number,
      numeroPedido,
      total,
      criadoEm: new Date(),
    }

    setVendas((atuais) => [...atuais, novaVenda])
    return novaVenda
  }, [])

  const atualizarStatusVenda = useCallback(
    async (
      id: number,
      atualizacoes: Partial<{
        statusEntrega: StatusEntrega
        statusPagamento: StatusPagamento
      }>
    ) => {
      const linhaAtualizacoes: Record<string, StatusEntrega | StatusPagamento> = {}
      if (atualizacoes.statusEntrega) {
        linhaAtualizacoes.status_entrega = atualizacoes.statusEntrega
      }
      if (atualizacoes.statusPagamento) {
        linhaAtualizacoes.status_pagamento = atualizacoes.statusPagamento
      }

      const { error } = await supabase
        .from(TABELAS.VENDAS)
        .update(linhaAtualizacoes)
        .eq('id', id)

      if (error) {
        throw error
      }

      setVendas((atuais) => atuais.map((v) => (v.id === id ? { ...v, ...atualizacoes } : v)))
    },
    []
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
