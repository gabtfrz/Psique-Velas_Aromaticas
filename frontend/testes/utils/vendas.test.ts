import { describe, it, expect } from 'vitest'
import {
  calcularSubtotalItem,
  contarItensCarrinho,
  filtrarVendas,
} from '@/utils/vendas'
import type { ItemVenda, Venda } from '@/tipos'

function criarItemVenda(parcial: Partial<ItemVenda> & { quantidade: number; precoUnitario: number }): ItemVenda {
  return {
    produtoId: 'prod-001',
    nomeProduto: 'Vela Lavanda',
    subtotal: parcial.quantidade * parcial.precoUnitario,
    ...parcial,
  }
}

function criarVenda(parcial: Partial<Venda> & { id: string }): Venda {
  return {
    id: parcial.id,
    numeroPedido: `PED-${parcial.id}`,
    itens: [],
    desconto: 0,
    total: 100,
    canalVenda: 'site',
    formaPagamento: 'pix',
    statusPagamento: 'pago',
    tipoEntrega: 'correios',
    statusEntrega: 'entregue',
    criadoEm: new Date('2024-06-15T12:00:00'),
    ...parcial,
  }
}

describe('calcularSubtotalItem', () => {
  it('caso válido: multiplica quantidade por preço unitário corretamente', () => {
    expect(calcularSubtotalItem(3, 20)).toBe(60)
  })
  it('caso limite: quantidade zero resulta em subtotal zero', () => {
    expect(calcularSubtotalItem(0, 20)).toBe(0)
  })
})

describe('contarItensCarrinho', () => {
  it('caso válido: soma as quantidades de todos os itens do carrinho', () => {
    const itens: ItemVenda[] = [
      criarItemVenda({ quantidade: 2, precoUnitario: 20 }),
      criarItemVenda({ quantidade: 3, precoUnitario: 35 }),
    ]
    expect(contarItensCarrinho(itens)).toBe(5)
  })
  it('caso de erro: carrinho vazio retorna zero', () => {
    expect(contarItensCarrinho([])).toBe(0)
  })
})

describe('filtrarVendas', () => {
  const vendas: Venda[] = [
    criarVenda({ id: 'v1', criadoEm: new Date('2024-06-01T12:00:00'), canalVenda: 'site',      statusPagamento: 'pago'     }),
    criarVenda({ id: 'v2', criadoEm: new Date('2024-06-20T12:00:00'), canalVenda: 'instagram', statusPagamento: 'pendente' }),
    criarVenda({ id: 'v3', criadoEm: new Date('2024-07-05T12:00:00'), canalVenda: 'site',      statusPagamento: 'pago'     }),
  ]
  it('caso válido: retorna apenas vendas dentro do período informado', () => {
    const resultado = filtrarVendas(vendas, { dataInicio: '2024-06-01', dataFim: '2024-06-30' })
    expect(resultado).toHaveLength(2)
    expect(resultado.map(v => v.id)).toEqual(expect.arrayContaining(['v1', 'v2']))
  })
  it('caso válido: retorna apenas vendas do canal informado', () => {
    const resultado = filtrarVendas(vendas, { canal: 'instagram' })
    expect(resultado).toHaveLength(1)
    expect(resultado[0].id).toBe('v2')
  })
  it('caso válido: retorna apenas vendas com o status de pagamento informado', () => {
    const resultado = filtrarVendas(vendas, { statusPagamento: 'pendente' })
    expect(resultado).toHaveLength(1)
    expect(resultado[0].id).toBe('v2')
  })
  it('caso de erro: lista de vendas vazia retorna array vazio independente dos filtros', () => {
    const resultado = filtrarVendas([], { dataInicio: '2024-01-01', canal: 'site' })
    expect(resultado).toEqual([])
  })
  it('caso de erro: filtro sem correspondência retorna array vazio', () => {
    const resultado = filtrarVendas(vendas, { canal: 'marketplace' })
    expect(resultado).toEqual([])
  })
})
