// Testes de gating por papel da rota /usuarios — só o papel master acessa a tela de
// Usuários; qualquer outro papel é redirecionado ao Dashboard ("/").
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import type { Session } from '@supabase/supabase-js'
import App from '@/App'
import { useAutenticacao } from '@/hooks/useAutenticacao'
import { usePerfil } from '@/hooks/usePerfil'

vi.mock('@/hooks/useAutenticacao')
vi.mock('@/hooks/usePerfil')

// Mock genérico da cadeia do supabase-js — resolve sempre em lista vazia, o bastante
// para os hooks de domínio usados pelo Dashboard/BarraLateral/Usuários montarem sem erro.
vi.mock('@/servicos/supabase', () => {
  function criarConstrutorVazio(): Record<string, unknown> {
    const construtor: Record<string, unknown> = {
      select: vi.fn(() => construtor),
      eq: vi.fn(() => construtor),
      order: vi.fn(() => construtor),
      then: (resolver: (r: { data: unknown[]; error: null }) => unknown) =>
        Promise.resolve({ data: [], error: null }).then(resolver),
    }
    return construtor
  }

  return {
    supabase: {
      from: vi.fn(() => criarConstrutorVazio()),
      rpc: vi.fn(() => criarConstrutorVazio()),
      functions: { invoke: vi.fn() },
    },
  }
})

const sessaoFalsa = {} as Session

describe('App — gating por papel da rota /usuarios', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAutenticacao).mockReturnValue({
      sessao: sessaoFalsa,
      carregando: false,
      sair: vi.fn(),
      entrar: vi.fn(),
    })
  })

  it('caso de erro: sessão de gestora acessando /usuarios é redirecionada para "/"', async () => {
    vi.mocked(usePerfil).mockReturnValue({ nome: 'Ana', papel: 'gestora', carregando: false })
    window.history.pushState({}, '', '/usuarios')

    render(<App />)

    await waitFor(() => expect(window.location.pathname).toBe('/'))
  })

  it('caso válido: sessão de master acessando /usuarios permanece na tela de Usuários', async () => {
    vi.mocked(usePerfil).mockReturnValue({ nome: 'Bia', papel: 'master', carregando: false })
    window.history.pushState({}, '', '/usuarios')

    render(<App />)

    await waitFor(() => expect(window.location.pathname).toBe('/usuarios'))
    expect(await screen.findByRole('heading', { name: 'Usuários' })).toBeInTheDocument()
  })
})

describe('App — bloqueio de troca de senha obrigatória no primeiro login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAutenticacao).mockReturnValue({
      sessao: sessaoFalsa,
      carregando: false,
      sair: vi.fn(),
      entrar: vi.fn(),
    })
  })

  it('caso válido: deveTrocarSenha=true renderiza só a tela de troca, sem navegação', async () => {
    const recarregarPerfil = vi.fn()
    vi.mocked(usePerfil).mockReturnValue({
      nome: 'Bia',
      papel: 'gestora',
      deveTrocarSenha: true,
      carregando: false,
      recarregarPerfil,
    })

    render(<App />)

    expect(await screen.findByRole('heading', { name: /troque sua senha/i })).toBeInTheDocument()
    expect(screen.queryByLabelText('Barra lateral')).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Usuários' })).not.toBeInTheDocument()
  })

  it('caso válido: sem deveTrocarSenha, a área interna normal é exibida', async () => {
    vi.mocked(usePerfil).mockReturnValue({
      nome: 'Bia',
      papel: 'gestora',
      deveTrocarSenha: false,
      carregando: false,
      recarregarPerfil: vi.fn(),
    })

    render(<App />)

    expect(await screen.findByLabelText('Barra lateral')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /troque sua senha/i })).not.toBeInTheDocument()
  })
})
