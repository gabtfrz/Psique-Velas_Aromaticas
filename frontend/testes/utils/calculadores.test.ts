import { describe, it, expect } from 'vitest'
import { calcularPrecoUnitario } from '@/utils/calculadores'

describe('calcularPrecoUnitario', () => {
  it('caso válido: pote de cera 1000 g por R$ 50,00 resulta em R$ 0,05/g', () => {
    expect(calcularPrecoUnitario(50, 1000)).toBeCloseTo(0.05, 4)
  })

  it('caso de borda: quantidade 0 não gera Infinity/NaN — retorna 0', () => {
    expect(calcularPrecoUnitario(50, 0)).toBe(0)
  })

  it('caso de borda: quantidade negativa retorna 0', () => {
    expect(calcularPrecoUnitario(50, -10)).toBe(0)
  })

  it('caso de borda: quantidade NaN retorna 0', () => {
    expect(calcularPrecoUnitario(50, NaN)).toBe(0)
  })
})
