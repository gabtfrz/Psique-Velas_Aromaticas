import type { ItemVenda, Venda, CanalVenda, StatusPagamento } from '@/tipos'

// ─── Filtros aceitos por filtrarVendas ────────────────────────────────────────

export interface FiltrosVenda {
  dataInicio?: string
  dataFim?: string
  canal?: CanalVenda | string
  statusPagamento?: StatusPagamento | string
}

// ─── Funções puras de domínio de vendas ──────────────────────────────────────

/** Multiplica quantidade por preço unitário e retorna o subtotal do item. */
export function calcularSubtotalItem(quantidade: number, precoUnitario: number): number {
  return quantidade * precoUnitario
}

/** Soma as quantidades de todos os itens do carrinho. */
export function contarItensCarrinho(itens: ItemVenda[]): number {
  return itens.reduce((acumulador, item) => acumulador + item.quantidade, 0)
}

/**
 * Filtra a lista de vendas pelos critérios informados.
 * - dataInicio: início do período (00:00:00.000)
 * - dataFim: fim do período (23:59:59.999)
 * - canal: canal de venda exato
 * - statusPagamento: status de pagamento exato
 * Sem ordenação — a página é responsável por ordenar o resultado.
 */
export function filtrarVendas(vendas: Venda[], filtros: FiltrosVenda): Venda[] {
  return vendas.filter((venda) => {
    const data = new Date(venda.criadoEm)

    if (filtros.dataInicio) {
      const inicio = new Date(`${filtros.dataInicio}T00:00:00`)
      if (data < inicio) return false
    }

    if (filtros.dataFim) {
      const fim = new Date(`${filtros.dataFim}T23:59:59.999`)
      if (data > fim) return false
    }

    if (filtros.canal && venda.canalVenda !== filtros.canal) return false
    if (filtros.statusPagamento && venda.statusPagamento !== filtros.statusPagamento) return false

    return true
  })
}
