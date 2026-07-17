// Testes das funções puras de cálculo de custo a partir da receita de insumos.
import { describe, it, expect } from 'vitest'
import { calcularCustoInsumos, calcularCustoComExtras } from '@/utils/calculadores'
import type { Insumo, ItemReceita } from '@/tipos'

const insumoCera: Insumo = {
  id: 1,
  nome: 'Cera de soja',
  categoria: 'cera',
  unidadeMedida: 'g',
  precoUnitario: 0.05,
  criadoEm: new Date(),
  atualizadoEm: new Date(),
}

const insumoFragrancia: Insumo = {
  id: 2,
  nome: 'Fragrância lavanda',
  categoria: 'fragrancia',
  unidadeMedida: 'ml',
  precoUnitario: 0.8,
  criadoEm: new Date(),
  atualizadoEm: new Date(),
}

describe('calcularCustoInsumos', () => {
  it('soma o custo de cada item da receita casado por insumoId', () => {
    const receita: ItemReceita[] = [
      { insumoId: 1, nomeInsumo: 'Cera de soja', unidadeMedida: 'g', quantidade: 50, subtotal: 2.5 },
      {
        insumoId: 2,
        nomeInsumo: 'Fragrância lavanda',
        unidadeMedida: 'ml',
        quantidade: 10,
        subtotal: 8,
      },
    ]
    expect(calcularCustoInsumos(receita, [insumoCera, insumoFragrancia])).toBeCloseTo(10.5, 2)
  })

  it('retorna 0 para receita vazia', () => {
    expect(calcularCustoInsumos([], [insumoCera])).toBe(0)
  })

  it('não quebra e ignora item cujo insumoId não existe na lista de insumos', () => {
    const receita: ItemReceita[] = [
      {
        insumoId: 999,
        nomeInsumo: 'Insumo inexistente',
        unidadeMedida: 'un',
        quantidade: 5,
        subtotal: 0,
      },
    ]
    expect(calcularCustoInsumos(receita, [insumoCera])).toBe(0)
  })
})

describe('calcularCustoComExtras', () => {
  it('aplica o percentual de custos extras sobre o custo de insumos', () => {
    expect(calcularCustoComExtras(20, 10)).toBe(22)
  })

  it('mantém o custo original quando o percentual é 0', () => {
    expect(calcularCustoComExtras(20, 0)).toBe(20)
  })

  it('aplica percentual fracionário corretamente', () => {
    expect(calcularCustoComExtras(20, 7.5)).toBeCloseTo(21.5, 2)
  })
})
