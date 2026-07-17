// Testes do hook usePerfil — busca o perfil (nome/papel) da gestora logada na tabela `gestoras`.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import type { Session } from '@supabase/supabase-js'
import { usePerfil } from '@/hooks/usePerfil'
import { supabase } from '@/servicos/supabase'

vi.mock('@/servicos/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

function criarSessaoFalsa(idUsuario: string): Session {
  return { user: { id: idUsuario } } as unknown as Session
}

// Monta a cadeia `.from().select().eq().single()` do supabase-js com o resultado desejado.
function mockarRetornoGestoras(resultado: { data: unknown; error: unknown }) {
  const single = vi.fn().mockResolvedValue(resultado)
  const eq = vi.fn().mockReturnValue({ single })
  const select = vi.fn().mockReturnValue({ eq })
  vi.mocked(supabase.from).mockReturnValue({ select } as unknown as ReturnType<typeof supabase.from>)
  return { select, eq, single }
}

describe('usePerfil', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('caso válido: retorna nome e papel da gestora logada após a busca', async () => {
    mockarRetornoGestoras({
      data: { nome: 'Maria', papel: 'gestora', deve_trocar_senha: false },
      error: null,
    })
    const sessao = criarSessaoFalsa('usuario-1')

    const { result } = renderHook(() => usePerfil(sessao))

    expect(result.current.carregando).toBe(true)

    await waitFor(() => expect(result.current.carregando).toBe(false))

    expect(result.current.nome).toBe('Maria')
    expect(result.current.papel).toBe('gestora')
    expect(result.current.deveTrocarSenha).toBe(false)
    expect(supabase.from).toHaveBeenCalledWith('gestoras')
  })

  it('caso válido: expõe deveTrocarSenha=true quando a gestora ainda não trocou a senha', async () => {
    mockarRetornoGestoras({
      data: { nome: 'Beatriz', papel: 'gestora', deve_trocar_senha: true },
      error: null,
    })
    const sessao = criarSessaoFalsa('usuario-3')

    const { result } = renderHook(() => usePerfil(sessao))

    await waitFor(() => expect(result.current.carregando).toBe(false))

    expect(result.current.deveTrocarSenha).toBe(true)
  })

  it('caso válido: recarregarPerfil reconsulta o perfil e atualiza deveTrocarSenha', async () => {
    const { single } = mockarRetornoGestoras({
      data: { nome: 'Beatriz', papel: 'gestora', deve_trocar_senha: true },
      error: null,
    })
    const sessao = criarSessaoFalsa('usuario-4')

    const { result } = renderHook(() => usePerfil(sessao))
    await waitFor(() => expect(result.current.carregando).toBe(false))
    expect(result.current.deveTrocarSenha).toBe(true)

    single.mockResolvedValue({
      data: { nome: 'Beatriz', papel: 'gestora', deve_trocar_senha: false },
      error: null,
    })

    await act(async () => {
      await result.current.recarregarPerfil()
    })

    expect(result.current.deveTrocarSenha).toBe(false)
  })

  it('caso de erro: sem sessão ativa não consulta o banco e não retorna nome', async () => {
    const { result } = renderHook(() => usePerfil(null))

    await waitFor(() => expect(result.current.carregando).toBe(false))

    expect(result.current.nome).toBeUndefined()
    expect(result.current.papel).toBeUndefined()
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('caso de erro: falha na consulta não quebra o hook e mantém nome indefinido', async () => {
    mockarRetornoGestoras({ data: null, error: { message: 'falha de rede' } })
    const sessao = criarSessaoFalsa('usuario-2')

    const { result } = renderHook(() => usePerfil(sessao))

    await waitFor(() => expect(result.current.carregando).toBe(false))

    expect(result.current.nome).toBeUndefined()
    expect(result.current.papel).toBeUndefined()
  })
})
