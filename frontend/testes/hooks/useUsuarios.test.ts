// Testes do hook useUsuarios — leitura das gestoras via RPC `listar_gestoras` (CPF já
// decifrado, só master), criação via Edge Function `criar-usuario` e edição via RPC
// `atualizar_gestora`.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { FunctionsHttpError } from '@supabase/supabase-js'
import { useUsuarios } from '@/hooks/useUsuarios'
import { supabase } from '@/servicos/supabase'
import type { LinhaGestora } from '@/servicos/mapeadores'
import type { EntradaUsuario } from '@/utils/validadores'

vi.mock('@/servicos/supabase', () => ({
  supabase: {
    rpc: vi.fn(),
    functions: { invoke: vi.fn() },
  },
}))

// ─── Fixtures ────────────────────────────────────────────────────────────────

const linhaGestoraExistente: LinhaGestora = {
  id: 1,
  nome: 'Ana Master',
  papel: 'master',
  email: 'ana@psique.com',
  telefone: '(11) 99999-0000',
  cpf: '111.444.777-35',
  deve_trocar_senha: false,
  criado_em: '2026-01-01T00:00:00.000Z',
}

const entradaValida: EntradaUsuario = {
  nome: 'Beatriz Gestora',
  cpf: '111.444.777-35',
  telefone: '(11) 98888-1234',
  email: 'beatriz@psique.com',
  senha: 'senha-super-segura',
}

describe('useUsuarios sobre Supabase', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('caso válido: lista gestoras via rpc listar_gestoras, com CPF em texto', async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: [linhaGestoraExistente],
      error: null,
    } as never)

    const { result } = renderHook(() => useUsuarios())

    await waitFor(() => expect(result.current.gestoras).toHaveLength(1))

    expect(supabase.rpc).toHaveBeenCalledWith('listar_gestoras')
    expect(result.current.gestoras[0]).toMatchObject({
      nome: 'Ana Master',
      papel: 'master',
      cpf: '111.444.777-35',
    })
    expect(typeof result.current.gestoras[0].cpf).toBe('string')
  })

  it('caso válido: criarUsuario invoca a Edge Function criar-usuario com o body correto', async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: [], error: null } as never)
    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
      data: { ok: true, id: 42 },
      error: null,
    } as never)

    const { result } = renderHook(() => useUsuarios())
    await waitFor(() => expect(result.current.gestoras).toEqual([]))

    let resultado: { sucesso: boolean; erro?: string } | undefined
    await act(async () => {
      resultado = await result.current.criarUsuario(entradaValida)
    })

    // O CPF é persistido SEM máscara (só dígitos), mesmo o campo chegando mascarado.
    expect(supabase.functions.invoke).toHaveBeenCalledWith('criar-usuario', {
      body: { ...entradaValida, cpf: '11144477735' },
    })
    expect(resultado).toEqual({ sucesso: true })
  })

  it('caso de erro: criarUsuario devolve a mensagem PT-BR do corpo de erro da Edge Function', async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: [], error: null } as never)
    const respostaErro = { ok: false, erro: 'CPF inválido.' }
    const erroHttp = new FunctionsHttpError({
      json: () => Promise.resolve(respostaErro),
    })
    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
      data: null,
      error: erroHttp,
    } as never)

    const { result } = renderHook(() => useUsuarios())
    await waitFor(() => expect(result.current.gestoras).toEqual([]))

    let resultado: { sucesso: boolean; erro?: string } | undefined
    await act(async () => {
      resultado = await result.current.criarUsuario(entradaValida)
    })

    expect(resultado).toEqual({ sucesso: false, erro: 'CPF inválido.' })
  })

  it('caso de erro: falha de rede na Edge Function é tratada com mensagem genérica', async () => {
    vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: [], error: null } as never)
    vi.mocked(supabase.functions.invoke).mockResolvedValueOnce({
      data: null,
      error: new Error('network error'),
    } as never)

    const { result } = renderHook(() => useUsuarios())
    await waitFor(() => expect(result.current.gestoras).toEqual([]))

    let resultado: { sucesso: boolean; erro?: string } | undefined
    await act(async () => {
      resultado = await result.current.criarUsuario(entradaValida)
    })

    expect(resultado?.sucesso).toBe(false)
    expect(resultado?.erro).toBeTruthy()
  })

  it('caso válido: editarUsuario invoca a RPC atualizar_gestora com o payload correto e recarrega a lista', async () => {
    vi.mocked(supabase.rpc)
      .mockResolvedValueOnce({ data: [], error: null } as never) // load inicial
      .mockResolvedValueOnce({ data: null, error: null } as never) // atualizar_gestora
      .mockResolvedValueOnce({ data: [linhaGestoraExistente], error: null } as never) // refetch

    const { result } = renderHook(() => useUsuarios())
    await waitFor(() => expect(result.current.gestoras).toEqual([]))

    let resultado: { sucesso: boolean; erro?: string } | undefined
    await act(async () => {
      resultado = await result.current.editarUsuario(1, {
        nome: 'Ana Editada',
        telefone: '(11) 90000-0000',
        cpf: '111.444.777-35',
      })
    })

    // O CPF é persistido SEM máscara (só dígitos), mesmo o campo chegando mascarado.
    expect(supabase.rpc).toHaveBeenCalledWith('atualizar_gestora', {
      p_id: 1,
      p_nome: 'Ana Editada',
      p_telefone: '(11) 90000-0000',
      p_cpf: '11144477735',
    })
    expect(resultado).toEqual({ sucesso: true })
  })

  it('caso de erro: editarUsuario trata erro da RPC sem corromper a lista', async () => {
    vi.mocked(supabase.rpc)
      .mockResolvedValueOnce({ data: [linhaGestoraExistente], error: null } as never) // load inicial
      .mockResolvedValueOnce({ data: null, error: { message: 'CPF inválido' } } as never) // atualizar_gestora

    const { result } = renderHook(() => useUsuarios())
    await waitFor(() => expect(result.current.gestoras).toHaveLength(1))

    let resultado: { sucesso: boolean; erro?: string } | undefined
    await act(async () => {
      resultado = await result.current.editarUsuario(1, {
        nome: 'Ana Editada',
        telefone: '(11) 90000-0000',
        cpf: '000.000.000-00',
      })
    })

    expect(resultado?.sucesso).toBe(false)
    expect(resultado?.erro).toBeTruthy()
    expect(result.current.gestoras).toHaveLength(1)
  })
})
