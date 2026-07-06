import type { StatusPagamento, StatusEntrega, Venda } from '@/tipos'

// ─── Tipo de linha da tabela de histórico de vendas ───────────────────────────

export interface LinhaHistorico extends Record<string, unknown> {
  id: string
  data: string
  numeroPedido: string
  cliente: string
  quantidadeItens: number
  canal: string
  statusPagamento: StatusPagamento
  statusEntrega: StatusEntrega
  total: string
  _venda: Venda
}
