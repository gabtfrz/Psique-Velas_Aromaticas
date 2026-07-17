// Testes do modal de edição de uma gestora — nome, telefone e CPF editáveis; e-mail
// somente leitura (é a identidade de login); sem campo de senha.
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react'
import { ModalEditarUsuario } from '@/componentes/compartilhados/ModalEditarUsuario'
import type { Gestora } from '@/tipos'

const gestora: Gestora = {
  id: 1,
  nome: 'Ana Master',
  papel: 'master',
  email: 'ana@psique.com',
  telefone: '(11) 99999-0000',
  cpf: '111.444.777-35',
  deveTrocarSenha: false,
  criadoEm: new Date('2026-01-01'),
}

describe('ModalEditarUsuario', () => {
  it('caso válido: prefill dos dados e salva com o payload editado', async () => {
    const aoSalvar = vi.fn()
    const aoFechar = vi.fn()

    render(
      <ModalEditarUsuario
        aberto
        gestora={gestora}
        aoFechar={aoFechar}
        aoSalvar={aoSalvar}
      />
    )

    const dialog = screen.getByRole('dialog')

    expect(within(dialog).getByLabelText(/nome completo/i, { exact: false })).toHaveValue(
      'Ana Master'
    )
    expect(within(dialog).getByLabelText(/^cpf/i, { exact: false })).toHaveValue(
      '111.444.777-35'
    )
    expect(within(dialog).getByLabelText(/telefone/i, { exact: false })).toHaveValue(
      '(11) 99999-0000'
    )
    expect(within(dialog).getByLabelText(/e-mail/i, { exact: false })).toHaveValue(
      'ana@psique.com'
    )
    expect(within(dialog).getByLabelText(/e-mail/i, { exact: false })).toBeDisabled()
    expect(within(dialog).queryByLabelText(/senha/i)).not.toBeInTheDocument()

    fireEvent.change(within(dialog).getByLabelText(/nome completo/i, { exact: false }), {
      target: { value: 'Ana Editada' },
    })
    fireEvent.click(within(dialog).getByRole('button', { name: /salvar/i }))

    await waitFor(() =>
      expect(aoSalvar).toHaveBeenCalledWith(1, {
        nome: 'Ana Editada',
        cpf: '111.444.777-35',
        telefone: '(11) 99999-0000',
      })
    )
  })

  it('caso de erro: CPF inválido bloqueia o envio e não chama aoSalvar', async () => {
    const aoSalvar = vi.fn()
    const aoFechar = vi.fn()

    render(
      <ModalEditarUsuario
        aberto
        gestora={gestora}
        aoFechar={aoFechar}
        aoSalvar={aoSalvar}
      />
    )

    const dialog = screen.getByRole('dialog')

    fireEvent.change(within(dialog).getByLabelText(/^cpf/i, { exact: false }), {
      target: { value: '111.111.111-11' },
    })
    fireEvent.click(within(dialog).getByRole('button', { name: /salvar/i }))

    await within(dialog).findByText(/cpf inválido/i)
    expect(aoSalvar).not.toHaveBeenCalled()
  })
})
