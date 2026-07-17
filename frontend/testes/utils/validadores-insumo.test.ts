// Testes do schema Zod de validação de insumo.
import { describe, it, expect } from 'vitest'
import { schemaInsumo } from '@/utils/validadores'

const insumoValido = {
  nome: 'Cera de soja',
  categoria: 'cera' as const,
  unidadeMedida: 'g' as const,
  precoUnitario: 0.05,
  fornecedor: 'Fornecedor XYZ',
}

describe('schemaInsumo', () => {
  it('valida um insumo com todos os campos corretos', () => {
    expect(schemaInsumo.safeParse(insumoValido).success).toBe(true)
  })

  it('valida um insumo sem o campo opcional fornecedor', () => {
    const { fornecedor, ...semFornecedor } = insumoValido
    expect(schemaInsumo.safeParse(semFornecedor).success).toBe(true)
  })

  it('rejeita precoUnitario negativo', () => {
    const resultado = schemaInsumo.safeParse({ ...insumoValido, precoUnitario: -1 })
    expect(resultado.success).toBe(false)
  })

  it('rejeita unidadeMedida fora do enum permitido', () => {
    const resultado = schemaInsumo.safeParse({ ...insumoValido, unidadeMedida: 'litro' })
    expect(resultado.success).toBe(false)
  })

  it('rejeita nome vazio', () => {
    const resultado = schemaInsumo.safeParse({ ...insumoValido, nome: '' })
    expect(resultado.success).toBe(false)
  })
})
