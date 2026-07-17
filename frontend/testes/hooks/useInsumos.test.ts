// Testes do hook useInsumos — CRUD de insumos persistido na tabela `insumos` da Supabase.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useInsumos } from '@/hooks/useInsumos'
import { supabase } from '@/servicos/supabase'
import type { LinhaInsumo } from '@/servicos/mapeadores'

vi.mock('@/servicos/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

// ─── Fixtures ────────────────────────────────────────────────────────────────

const linhaExistente: LinhaInsumo = {
  id: 1,
  nome: 'Cera de soja',
  categoria: 'cera',
  unidade_medida: 'g',
  preco_unitario: 0.05,
  fornecedor: 'Fornecedor A',
  criado_em: '2024-01-15T00:00:00.000Z',
  atualizado_em: '2024-11-10T00:00:00.000Z',
}

const entradaNovoInsumo = {
  nome: 'Fragrância Baunilha',
  categoria: 'fragrancia' as const,
  unidadeMedida: 'ml' as const,
  precoUnitario: 0.8,
  fornecedor: 'Fornecedor B',
}

const entradaInsumoInvalido = {
  nome: '',
  categoria: 'fragrancia' as const,
  unidadeMedida: 'ml' as const,
  precoUnitario: -1,
  fornecedor: '',
}

const linhaNovoInsumoInserido: LinhaInsumo = {
  id: 101,
  nome: entradaNovoInsumo.nome,
  categoria: entradaNovoInsumo.categoria,
  unidade_medida: entradaNovoInsumo.unidadeMedida,
  preco_unitario: entradaNovoInsumo.precoUnitario,
  fornecedor: entradaNovoInsumo.fornecedor,
  criado_em: '2026-01-01T00:00:00.000Z',
  atualizado_em: '2026-01-01T00:00:00.000Z',
}

// ─── Construtor de mock para a cadeia do supabase-js (chainable + thenable) ──

type ResultadoMock = { data: unknown; error: unknown }

function criarConstrutorMock(resultado: ResultadoMock) {
  const construtor = {
    select: vi.fn(() => construtor),
    insert: vi.fn(() => construtor),
    update: vi.fn(() => construtor),
    delete: vi.fn(() => construtor),
    eq: vi.fn(() => construtor),
    single: vi.fn(() => Promise.resolve(resultado)),
    then: (aoResolver: (r: ResultadoMock) => unknown) =>
      Promise.resolve(resultado).then(aoResolver),
  }
  return construtor
}

describe('useInsumos sobre Supabase', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('caso válido: adicionarInsumo persiste na tabela insumos e reflete no estado', async () => {
    const construtorCarga = criarConstrutorMock({ data: [], error: null })
    const construtorInsert = criarConstrutorMock({ data: linhaNovoInsumoInserido, error: null })
    vi.mocked(supabase.from)
      .mockReturnValueOnce(construtorCarga as unknown as ReturnType<typeof supabase.from>)
      .mockReturnValueOnce(construtorInsert as unknown as ReturnType<typeof supabase.from>)

    const { result } = renderHook(() => useInsumos())
    await waitFor(() => expect(result.current.insumos).toEqual([]))

    await act(async () => {
      await result.current.adicionarInsumo(entradaNovoInsumo)
    })

    expect(supabase.from).toHaveBeenCalledWith('insumos')
    expect(construtorInsert.insert).toHaveBeenCalledWith(
      expect.objectContaining({ nome: 'Fragrância Baunilha', preco_unitario: 0.8 })
    )
    expect(
      result.current.insumos.some((i) => i.id === 101 && i.nome === 'Fragrância Baunilha')
    ).toBe(true)
  })

  it('caso válido: editarInsumo persiste a alteração do precoUnitario e reflete no estado', async () => {
    const construtorCarga = criarConstrutorMock({ data: [linhaExistente], error: null })
    const linhaAtualizada: LinhaInsumo = { ...linhaExistente, preco_unitario: 0.09 }
    const construtorUpdate = criarConstrutorMock({ data: linhaAtualizada, error: null })
    vi.mocked(supabase.from)
      .mockReturnValueOnce(construtorCarga as unknown as ReturnType<typeof supabase.from>)
      .mockReturnValueOnce(construtorUpdate as unknown as ReturnType<typeof supabase.from>)

    const { result } = renderHook(() => useInsumos())
    await waitFor(() => expect(result.current.insumos).toHaveLength(1))

    const insumoOriginal = result.current.insumos[0]
    await act(async () => {
      await result.current.editarInsumo({ ...insumoOriginal, precoUnitario: 0.09 })
    })

    expect(construtorUpdate.eq).toHaveBeenCalledWith('id', 1)
    expect(result.current.insumos[0].precoUnitario).toBe(0.09)
  })

  it('caso de erro: removerInsumo em uso é rejeitado e não altera o estado', async () => {
    const construtorCarga = criarConstrutorMock({ data: [linhaExistente], error: null })
    const construtorDelete = criarConstrutorMock({
      data: null,
      error: { code: '23503', message: 'violates foreign key constraint' },
    })
    vi.mocked(supabase.from)
      .mockReturnValueOnce(construtorCarga as unknown as ReturnType<typeof supabase.from>)
      .mockReturnValueOnce(construtorDelete as unknown as ReturnType<typeof supabase.from>)

    const { result } = renderHook(() => useInsumos())
    await waitFor(() => expect(result.current.insumos).toHaveLength(1))

    await expect(
      act(async () => {
        await result.current.removerInsumo(1)
      })
    ).rejects.toBeTruthy()

    expect(result.current.insumos).toHaveLength(1)
  })

  it('caso de erro: adicionarInsumo com dado inválido não chama a Supabase', async () => {
    const construtorCarga = criarConstrutorMock({ data: [], error: null })
    vi.mocked(supabase.from).mockReturnValueOnce(
      construtorCarga as unknown as ReturnType<typeof supabase.from>
    )

    const { result } = renderHook(() => useInsumos())
    await waitFor(() => expect(result.current.insumos).toEqual([]))

    vi.mocked(supabase.from).mockClear()

    await expect(
      act(async () => {
        await result.current.adicionarInsumo(entradaInsumoInvalido)
      })
    ).rejects.toBeTruthy()

    expect(supabase.from).not.toHaveBeenCalled()
    expect(result.current.insumos).toEqual([])
  })
})
