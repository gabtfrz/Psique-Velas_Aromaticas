// Testes da tela de troca de senha obrigatória no primeiro login — bloqueia o app até a
// gestora trocar a senha provisória; validação Zod no cliente antes de chamar o Auth.
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import TrocarSenha from '@/paginas/TrocarSenha'
import { supabase } from '@/servicos/supabase'

vi.mock('@/servicos/supabase', () => ({
  supabase: {
    auth: { updateUser: vi.fn() },
    rpc: vi.fn(),
  },
}))

function preencher(rotulo: RegExp | string, valor: string) {
  fireEvent.change(screen.getByLabelText(rotulo, { exact: false }), { target: { value: valor } })
}

describe('TrocarSenha', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('caso válido: senha válida chama updateUser + marcar_senha_trocada e dispara aoTrocarSenha', async () => {
    vi.mocked(supabase.auth.updateUser).mockResolvedValue({ data: {}, error: null } as never)
    vi.mocked(supabase.rpc).mockResolvedValue({ data: null, error: null } as never)
    const aoTrocarSenha = vi.fn()

    render(<TrocarSenha aoTrocarSenha={aoTrocarSenha} />)

    preencher('Nova senha', 'senha-nova-123')
    preencher('Confirmar senha', 'senha-nova-123')
    fireEvent.click(screen.getByRole('button', { name: /trocar senha/i }))

    await waitFor(() =>
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({ password: 'senha-nova-123' })
    )
    expect(supabase.rpc).toHaveBeenCalledWith('marcar_senha_trocada')
    await waitFor(() => expect(aoTrocarSenha).toHaveBeenCalled())
  })

  it('caso de erro: senhas diferentes bloqueiam o envio sem chamar updateUser', async () => {
    const aoTrocarSenha = vi.fn()
    render(<TrocarSenha aoTrocarSenha={aoTrocarSenha} />)

    preencher('Nova senha', 'senha-nova-123')
    preencher('Confirmar senha', 'outra-senha-456')
    fireEvent.click(screen.getByRole('button', { name: /trocar senha/i }))

    await screen.findByText(/as senhas não coincidem/i)
    expect(supabase.auth.updateUser).not.toHaveBeenCalled()
    expect(aoTrocarSenha).not.toHaveBeenCalled()
  })

  it('caso de erro: senha menor que o mínimo bloqueia o envio sem chamar updateUser', async () => {
    const aoTrocarSenha = vi.fn()
    render(<TrocarSenha aoTrocarSenha={aoTrocarSenha} />)

    preencher('Nova senha', '123')
    preencher('Confirmar senha', '123')
    fireEvent.click(screen.getByRole('button', { name: /trocar senha/i }))

    await screen.findByText(/pelo menos 6 caracteres/i)
    expect(supabase.auth.updateUser).not.toHaveBeenCalled()
    expect(aoTrocarSenha).not.toHaveBeenCalled()
  })

  it('caso de erro: falha do Auth (ex.: sem complexidade) exibe toast e não quebra', async () => {
    vi.mocked(supabase.auth.updateUser).mockResolvedValue({
      data: null,
      error: { message: 'A senha deve conter letra maiúscula, minúscula e número.' },
    } as never)
    const aoTrocarSenha = vi.fn()

    render(<TrocarSenha aoTrocarSenha={aoTrocarSenha} />)

    preencher('Nova senha', 'senha-nova-123')
    preencher('Confirmar senha', 'senha-nova-123')
    fireEvent.click(screen.getByRole('button', { name: /trocar senha/i }))

    expect(
      await screen.findByText(/senha deve conter letra maiúscula, minúscula e número/i)
    ).toBeInTheDocument()
    expect(supabase.rpc).not.toHaveBeenCalled()
    expect(aoTrocarSenha).not.toHaveBeenCalled()
  })
})
