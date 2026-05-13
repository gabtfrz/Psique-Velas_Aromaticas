import type { ItemVenda, Produto, Venda } from '@/tipos'
import { MARGEM_ALERTA_BAIXA, MARGEM_ALERTA_MEDIA } from '@/constantes'

export function calcularMargem(custo: number, preco: number): number {
  if (preco === 0) return 0
  return ((preco - custo) / preco) * 100
}

export function calcularMarkup(custo: number, preco: number): number {
  if (custo === 0) return 0
  return ((preco - custo) / custo) * 100
}

export function calcularPrecoSugerido(custo: number, margemDesejada: number): number {
  if (margemDesejada >= 100) return 0
  return custo / (1 - margemDesejada / 100)
}

export function calcularTotalVenda(itens: ItemVenda[], desconto: number): number {
  const subtotal = itens.reduce((acc, item) => acc + item.subtotal, 0)
  return Math.max(0, subtotal - desconto)
}

export function calcularTicketMedio(vendas: Venda[]): number {
  if (vendas.length === 0) return 0
  const total = vendas.reduce((acc, v) => acc + v.total, 0)
  return total / vendas.length
}

export function calcularFaturamentoPeriodo(vendas: Venda[], inicio: Date, fim: Date): number {
  return vendas
    .filter((v) => {
      const data = new Date(v.criadoEm)
      return data >= inicio && data <= fim
    })
    .reduce((acc, v) => acc + v.total, 0)
}

export function calcularMargemMedia(produtos: Produto[]): number {
  const ativos = produtos.filter((p) => p.ativo)
  if (ativos.length === 0) return 0
  const soma = ativos.reduce((acc, p) => acc + p.margem, 0)
  return soma / ativos.length
}

export function estaAbaixoEstoqueMinimo(produto: Produto): boolean {
  return produto.estoqueAtual <= produto.estoqueMinimo
}

export function classificarMargem(margem: number): 'baixa' | 'media' | 'boa' {
  if (margem < MARGEM_ALERTA_BAIXA) return 'baixa'
  if (margem < MARGEM_ALERTA_MEDIA) return 'media'
  return 'boa'
}

// Testes manuais:
// calcularMargem(18, 68) → 73.5%   ✓  ((68-18)/68)*100
// calcularMarkup(18, 68) → 277.8%  ✓  ((68-18)/18)*100
// calcularPrecoSugerido(18, 73.5) → 68.0  ✓  18/(1-0.735)
// calcularTotalVenda([{subtotal:170},{subtotal:55}], 0) → 225  ✓
