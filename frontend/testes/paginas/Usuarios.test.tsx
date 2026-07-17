// Testes da página Usuários — cadastro de novas gestoras (só master) via a Edge Function
// `criar-usuario`, com validação Zod no cliente antes do envio.
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import Usuarios from '@/paginas/Usuarios'
import { useUsuarios } from '@/hooks/useUsuarios'

vi.mock('@/hooks/useUsuarios')

// `exact: false` porque campos obrigatórios têm um "*" (aria-hidden) concatenado ao
// texto do rótulo — o nome acessível do label não é exatamente igual ao rótulo visível.
function preencherCampo(dialog: HTMLElement, rotulo: string, valor: string) {
  const campo = within(dialog).getByLabelText(rotulo, { exact: false }) as HTMLInputElement
  fireEvent.change(campo, { target: { value: valor } })
}

// O rótulo "Cadastrar gestora" também aparece no estado vazio da lista — o botão de
// envio do formulário precisa ser buscado dentro do modal para não haver ambiguidade.
async function abrirModal() {
  fireEvent.click(screen.getByRole('button', { name: /nova gestora/i }))
  return screen.findByRole('dialog')
}

const gestoraExistente = {
  id: 1,
  nome: 'Ana Master',
  papel: 'master' as const,
  email: 'ana@psique.com',
  telefone: '(11) 99999-0000',
  cpf: '111.444.777-35',
  deveTrocarSenha: false,
  criadoEm: new Date('2026-01-01'),
}

describe('Usuarios', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('caso válido: exibe o CPF em texto formatado na lista (não [object Object]/Buffer)', () => {
    vi.mocked(useUsuarios).mockReturnValue({
      gestoras: [gestoraExistente],
      carregando: false,
      listarGestoras: vi.fn(),
      criarUsuario: vi.fn(),
      editarUsuario: vi.fn(),
    })

    render(<Usuarios />)

    expect(screen.getByText('111.444.777-35')).toBeInTheDocument()
    expect(screen.queryByText('[object Object]')).not.toBeInTheDocument()
  })

  it('caso válido: botão Editar abre o modal preenchido e salva via editarUsuario', async () => {
    // A própria `editarUsuario` (no hook real) recarrega a lista após salvar — aqui,
    // com o hook mockado, validamos apenas que a página delega a ela com o payload certo.
    const editarUsuario = vi.fn().mockResolvedValue({ sucesso: true })
    vi.mocked(useUsuarios).mockReturnValue({
      gestoras: [gestoraExistente],
      carregando: false,
      listarGestoras: vi.fn(),
      criarUsuario: vi.fn(),
      editarUsuario,
    })

    render(<Usuarios />)

    fireEvent.click(screen.getByRole('button', { name: /editar/i }))
    const dialog = await screen.findByRole('dialog')

    fireEvent.change(within(dialog).getByLabelText(/nome completo/i, { exact: false }), {
      target: { value: 'Ana Editada' },
    })
    fireEvent.click(within(dialog).getByRole('button', { name: /salvar/i }))

    await waitFor(() =>
      expect(editarUsuario).toHaveBeenCalledWith(1, {
        nome: 'Ana Editada',
        cpf: '111.444.777-35',
        telefone: '(11) 99999-0000',
      })
    )
    expect(await screen.findByText('Gestora atualizada com sucesso.')).toBeInTheDocument()
  })

  it('caso de erro: falha ao editar exibe toast sem corromper a lista', async () => {
    const editarUsuario = vi.fn().mockResolvedValue({ sucesso: false, erro: 'CPF inválido.' })
    vi.mocked(useUsuarios).mockReturnValue({
      gestoras: [gestoraExistente],
      carregando: false,
      listarGestoras: vi.fn(),
      criarUsuario: vi.fn(),
      editarUsuario,
    })

    render(<Usuarios />)

    fireEvent.click(screen.getByRole('button', { name: /editar/i }))
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByRole('button', { name: /salvar/i }))

    expect(await screen.findByText('CPF inválido.')).toBeInTheDocument()
    expect(screen.getByText('111.444.777-35')).toBeInTheDocument()
  })

  it('caso válido: cadastra a gestora com dados válidos, exibe toast e recarrega a lista', async () => {
    const criarUsuario = vi.fn().mockResolvedValue({ sucesso: true })
    const listarGestoras = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useUsuarios).mockReturnValue({
      gestoras: [],
      carregando: false,
      listarGestoras,
      criarUsuario,
      editarUsuario: vi.fn(),
    })

    render(<Usuarios />)
    const dialog = await abrirModal()

    preencherCampo(dialog, 'Nome completo', 'Beatriz Gestora')
    preencherCampo(dialog, 'CPF', '111.444.777-35')
    preencherCampo(dialog, 'Telefone', '(11) 98888-1234')
    preencherCampo(dialog, 'E-mail', 'beatriz@psique.com')
    preencherCampo(dialog, 'Senha provisória', 'senha-super-segura')

    fireEvent.click(within(dialog).getByRole('button', { name: /cadastrar gestora/i }))

    await waitFor(() =>
      expect(criarUsuario).toHaveBeenCalledWith({
        nome: 'Beatriz Gestora',
        cpf: '111.444.777-35',
        telefone: '(11) 98888-1234',
        email: 'beatriz@psique.com',
        senha: 'senha-super-segura',
      })
    )

    await waitFor(() => expect(listarGestoras).toHaveBeenCalled())
    expect(await screen.findByText('Gestora cadastrada com sucesso.')).toBeInTheDocument()
  })

  it('caso de erro: CPF inválido bloqueia o envio e não chama a Edge Function', async () => {
    const criarUsuario = vi.fn()
    const listarGestoras = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useUsuarios).mockReturnValue({
      gestoras: [],
      carregando: false,
      listarGestoras,
      criarUsuario,
      editarUsuario: vi.fn(),
    })

    render(<Usuarios />)
    const dialog = await abrirModal()

    preencherCampo(dialog, 'Nome completo', 'Beatriz Gestora')
    preencherCampo(dialog, 'CPF', '111.111.111-11')
    preencherCampo(dialog, 'Telefone', '')
    preencherCampo(dialog, 'E-mail', 'beatriz@psique.com')
    preencherCampo(dialog, 'Senha provisória', 'senha-super-segura')

    fireEvent.click(within(dialog).getByRole('button', { name: /cadastrar gestora/i }))

    await within(dialog).findByText(/cpf inválido/i)
    expect(await within(dialog).findByText(/informe o telefone com ddd/i)).toBeInTheDocument()
    expect(criarUsuario).not.toHaveBeenCalled()
  })

  it('caso de erro: falha retornada pela Edge Function exibe toast com a mensagem', async () => {
    const criarUsuario = vi.fn().mockResolvedValue({ sucesso: false, erro: 'E-mail já cadastrado.' })
    const listarGestoras = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useUsuarios).mockReturnValue({
      gestoras: [],
      carregando: false,
      listarGestoras,
      criarUsuario,
      editarUsuario: vi.fn(),
    })

    render(<Usuarios />)
    const dialog = await abrirModal()

    preencherCampo(dialog, 'Nome completo', 'Beatriz Gestora')
    preencherCampo(dialog, 'CPF', '111.444.777-35')
    preencherCampo(dialog, 'Telefone', '(11) 98888-1234')
    preencherCampo(dialog, 'E-mail', 'beatriz@psique.com')
    preencherCampo(dialog, 'Senha provisória', 'senha-super-segura')

    fireEvent.click(within(dialog).getByRole('button', { name: /cadastrar gestora/i }))

    expect(await screen.findByText('E-mail já cadastrado.')).toBeInTheDocument()
    expect(listarGestoras).not.toHaveBeenCalled()
  })
})
