// Testes do hook useClientes — CRUD de clientes persistido na tabela `clientes` da Supabase.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useClientes } from '@/hooks/useClientes'
import { supabase } from '@/servicos/supabase'
import type { LinhaCliente } from '@/servicos/mapeadores'

vi.mock('@/servicos/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

// ─── Fixtures ────────────────────────────────────────────────────────────────

const linhaExistente: LinhaCliente = {
  id: 1,
  nome_completo: 'Fernanda Oliveira Rezende',
  cpf: null,
  data_nascimento: null,
  email: 'fernanda.rezende@gmail.com',
  whatsapp: '(62) 99234-5671',
  canal_origem: 'instagram',
  endereco: {
    cep: '74230-010',
    logradouro: 'Rua T-30',
    numero: '142',
    bairro: 'Setor Bueno',
    cidade: 'Goiânia',
    uf: 'GO',
  },
  observacoes_internas: null,
  criado_em: '2024-03-12T00:00:00.000Z',
}

const entradaNovoCliente = {
  nomeCompleto: 'Mariana Castilho Borges',
  cpf: undefined,
  dataNascimento: undefined,
  email: 'mari.borges@hotmail.com',
  whatsapp: '(62) 98765-4321',
  canalOrigem: 'indicacao' as const,
  endereco: {
    cep: '74210-090',
    logradouro: 'Rua 22',
    numero: '78',
    bairro: 'Setor Oeste',
    cidade: 'Goiânia',
    uf: 'GO',
  },
  observacoesInternas: undefined,
}

const linhaNovoClienteInserido: LinhaCliente = {
  id: 202,
  nome_completo: entradaNovoCliente.nomeCompleto,
  cpf: null,
  data_nascimento: null,
  email: entradaNovoCliente.email,
  whatsapp: entradaNovoCliente.whatsapp,
  canal_origem: entradaNovoCliente.canalOrigem,
  endereco: entradaNovoCliente.endereco,
  observacoes_internas: null,
  criado_em: '2026-01-01T00:00:00.000Z',
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

describe('useClientes sobre Supabase', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('caso válido: adicionarCliente persiste na tabela clientes e reflete no estado', async () => {
    const construtorCarga = criarConstrutorMock({ data: [], error: null })
    const construtorInsert = criarConstrutorMock({ data: linhaNovoClienteInserido, error: null })
    vi.mocked(supabase.from)
      .mockReturnValueOnce(construtorCarga as unknown as ReturnType<typeof supabase.from>)
      .mockReturnValueOnce(construtorInsert as unknown as ReturnType<typeof supabase.from>)

    const { result } = renderHook(() => useClientes())
    await waitFor(() => expect(result.current.clientes).toEqual([]))

    await act(async () => {
      await result.current.adicionarCliente(entradaNovoCliente)
    })

    expect(supabase.from).toHaveBeenCalledWith('clientes')
    expect(construtorInsert.insert).toHaveBeenCalledWith(
      expect.objectContaining({ nome_completo: 'Mariana Castilho Borges', email: entradaNovoCliente.email })
    )
    expect(
      result.current.clientes.some((c) => c.id === 202 && c.nomeCompleto === 'Mariana Castilho Borges')
    ).toBe(true)
  })

  it('caso válido: editarCliente persiste a alteração e reflete no estado', async () => {
    const construtorCarga = criarConstrutorMock({ data: [linhaExistente], error: null })
    const linhaAtualizada: LinhaCliente = { ...linhaExistente, whatsapp: '(62) 90000-0000' }
    const construtorUpdate = criarConstrutorMock({ data: linhaAtualizada, error: null })
    vi.mocked(supabase.from)
      .mockReturnValueOnce(construtorCarga as unknown as ReturnType<typeof supabase.from>)
      .mockReturnValueOnce(construtorUpdate as unknown as ReturnType<typeof supabase.from>)

    const { result } = renderHook(() => useClientes())
    await waitFor(() => expect(result.current.clientes).toHaveLength(1))

    const clienteOriginal = result.current.clientes[0]
    await act(async () => {
      await result.current.editarCliente({ ...clienteOriginal, whatsapp: '(62) 90000-0000' })
    })

    expect(construtorUpdate.eq).toHaveBeenCalledWith('id', 1)
    expect(result.current.clientes[0].whatsapp).toBe('(62) 90000-0000')
  })

  it('caso de erro: insert sem sessão (RLS) é bloqueado e tratado sem corromper o estado', async () => {
    const construtorCarga = criarConstrutorMock({ data: [], error: null })
    const construtorInsert = criarConstrutorMock({
      data: null,
      error: { message: 'new row violates row-level security policy' },
    })
    vi.mocked(supabase.from)
      .mockReturnValueOnce(construtorCarga as unknown as ReturnType<typeof supabase.from>)
      .mockReturnValueOnce(construtorInsert as unknown as ReturnType<typeof supabase.from>)

    const { result } = renderHook(() => useClientes())
    await waitFor(() => expect(result.current.clientes).toEqual([]))

    await expect(
      act(async () => {
        await result.current.adicionarCliente(entradaNovoCliente)
      })
    ).rejects.toBeTruthy()

    expect(result.current.clientes).toEqual([])
  })
})
