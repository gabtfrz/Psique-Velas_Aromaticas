import type { Insumo, ItemReceita, ItemVenda, Produto, Venda } from '@/tipos'
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

// Custo de produção arredondado a no máximo 3 casas decimais — evita a cauda de
// ponto flutuante (ex.: 13.575000000000001) no valor exibido/persistido.
const CASAS_DECIMAIS_CUSTO = 3
const FATOR_ARREDONDAMENTO_CUSTO = 10 ** CASAS_DECIMAIS_CUSTO

function arredondarCusto(valor: number): number {
  return Math.round(valor * FATOR_ARREDONDAMENTO_CUSTO) / FATOR_ARREDONDAMENTO_CUSTO
}

// Soma o custo de cada item da receita (quantidade × preço unitário do insumo).
// Itens cujo insumoId não é encontrado na lista de insumos são ignorados (contribuem 0).
export function calcularCustoInsumos(receita: ItemReceita[], insumos: Insumo[]): number {
  const total = receita.reduce((acc, item) => {
    const insumo = insumos.find((i) => i.id === item.insumoId)
    if (!insumo) return acc
    return acc + item.quantidade * insumo.precoUnitario
  }, 0)
  return arredondarCusto(total)
}

// Aplica o percentual de custos extras (mão de obra, embalagem etc.) sobre o custo de insumos.
export function calcularCustoComExtras(custoInsumos: number, percentualExtras: number): number {
  return arredondarCusto(custoInsumos * (1 + percentualExtras / 100))
}

const CASAS_DECIMAIS_PRECO_UNITARIO = 4
const FATOR_ARREDONDAMENTO_PRECO_UNITARIO = 10 ** CASAS_DECIMAIS_PRECO_UNITARIO

// Calcula o preço unitário do insumo a partir do preço e da quantidade total da
// embalagem (ex.: pote de cera 1000 g por R$ 50 → R$ 0,05/g). Quantidade zero,
// negativa ou inválida (NaN) retorna 0 em vez de Infinity/NaN.
export function calcularPrecoUnitario(precoEmbalagem: number, quantidadeEmbalagem: number): number {
  if (!Number.isFinite(quantidadeEmbalagem) || quantidadeEmbalagem <= 0) return 0
  if (!Number.isFinite(precoEmbalagem)) return 0
  return Math.round((precoEmbalagem / quantidadeEmbalagem) * FATOR_ARREDONDAMENTO_PRECO_UNITARIO) / FATOR_ARREDONDAMENTO_PRECO_UNITARIO
}

// Testes manuais:
// calcularMargem(18, 68) → 73.5%   ✓  ((68-18)/68)*100
// calcularMarkup(18, 68) → 277.8%  ✓  ((68-18)/18)*100
// calcularPrecoSugerido(18, 73.5) → 68.0  ✓  18/(1-0.735)
// calcularTotalVenda([{subtotal:170},{subtotal:55}], 0) → 225  ✓
