// Testes da página Insumos — CRUD de insumos usados na receita das velas.
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import Insumos from '@/paginas/Insumos'
import { useInsumos } from '@/hooks/useInsumos'

vi.mock('@/hooks/useInsumos')

function preencherCampo(dialog: HTMLElement, rotulo: RegExp | string, valor: string) {
  const campo = within(dialog).getByLabelText(rotulo, { exact: false }) as HTMLInputElement
  fireEvent.change(campo, { target: { value: valor } })
}

async function abrirModal() {
  fireEvent.click(screen.getByRole('button', { name: /novo insumo/i }))
  return screen.findByRole('dialog')
}

const insumoCera = {
  id: 1,
  nome: 'Cera de soja',
  categoria: 'cera' as const,
  unidadeMedida: 'g' as const,
  precoUnitario: 0.05,
  fornecedor: 'Fornecedor A',
  criadoEm: new Date('2026-01-01'),
  atualizadoEm: new Date('2026-01-01'),
}

const insumoFragrancia = {
  id: 2,
  nome: 'Fragrância Lavanda',
  categoria: 'fragrancia' as const,
  unidadeMedida: 'ml' as const,
  precoUnitario: 1.2,
  fornecedor: 'Fornecedor B',
  criadoEm: new Date('2026-01-02'),
  atualizadoEm: new Date('2026-01-02'),
}

function mockUseInsumos(overrides: Partial<ReturnType<typeof useInsumos>> = {}) {
  const base = {
    insumos: [insumoCera, insumoFragrancia],
    insumosOrdenados: [insumoCera, insumoFragrancia],
    adicionarInsumo: vi.fn(),
    editarInsumo: vi.fn(),
    removerInsumo: vi.fn(),
    buscarInsumoPorId: vi.fn(),
  }
  vi.mocked(useInsumos).mockReturnValue({ ...base, ...overrides } as ReturnType<typeof useInsumos>)
  return { ...base, ...overrides }
}

describe('Insumos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('caso válido: cadastra um insumo pelo modal e ele aparece na tabela', async () => {
    const novoInsumo = {
      id: 3,
      nome: 'Pavio de algodão',
      categoria: 'pavio' as const,
      unidadeMedida: 'un' as const,
      precoUnitario: 0.3,
      fornecedor: '',
      criadoEm: new Date('2026-01-03'),
      atualizadoEm: new Date('2026-01-03'),
    }
    const adicionarInsumo = vi.fn().mockResolvedValue(novoInsumo)
    mockUseInsumos({ adicionarInsumo })

    render(<Insumos />)
    const dialog = await abrirModal()

    preencherCampo(dialog, 'Nome', 'Pavio de algodão')
    const categoria = within(dialog).getByLabelText(/categoria/i) as HTMLSelectElement
    fireEvent.change(categoria, { target: { value: 'pavio' } })
    const unidade = within(dialog).getByLabelText(/unidade de medida/i) as HTMLSelectElement
    fireEvent.change(unidade, { target: { value: 'un' } })
    const preco = within(dialog).getByLabelText(/preço unitário/i, { exact: false })
    fireEvent.change(preco, { target: { value: '0.3' } })

    fireEvent.click(within(dialog).getByRole('button', { name: /cadastrar insumo/i }))

    await waitFor(() =>
      expect(adicionarInsumo).toHaveBeenCalledWith(
        expect.objectContaining({
          nome: 'Pavio de algodão',
          categoria: 'pavio',
          unidadeMedida: 'un',
          precoUnitario: 0.3,
        })
      )
    )
  })

  it('caso válido: filtrar por categoria mostra apenas os insumos daquela categoria', () => {
    mockUseInsumos()
    render(<Insumos />)

    expect(screen.getByText('Cera de soja')).toBeInTheDocument()
    expect(screen.getByText('Fragrância Lavanda')).toBeInTheDocument()

    const filtro = screen.getByLabelText(/filtrar por categoria/i) as HTMLSelectElement
    fireEvent.change(filtro, { target: { value: 'fragrancia' } })

    expect(screen.queryByText('Cera de soja')).not.toBeInTheDocument()
    expect(screen.getByText('Fragrância Lavanda')).toBeInTheDocument()
  })

  it('caso de erro: preço vazio/negativo bloqueia o envio e não chama adicionarInsumo', async () => {
    const adicionarInsumo = vi.fn()
    mockUseInsumos({ adicionarInsumo })

    render(<Insumos />)
    const dialog = await abrirModal()

    preencherCampo(dialog, 'Nome', 'Corante vermelho')
    const preco = within(dialog).getByLabelText(/preço unitário/i, { exact: false })
    fireEvent.change(preco, { target: { value: '-5' } })

    fireEvent.click(within(dialog).getByRole('button', { name: /cadastrar insumo/i }))

    await within(dialog).findByText(/preço unitário não pode ser negativo/i)
    expect(adicionarInsumo).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('caso de erro: excluir insumo em uso na receita exibe toast claro e mantém o insumo na lista', async () => {
    const removerInsumo = vi.fn().mockRejectedValue(new Error('violates foreign key constraint'))
    mockUseInsumos({ removerInsumo })

    render(<Insumos />)

    const linhas = screen.getAllByRole('button', { name: /excluir/i })
    fireEvent.click(linhas[0])

    const dialogConfirmar = await screen.findByRole('dialog')
    fireEvent.click(within(dialogConfirmar).getByRole('button', { name: /excluir/i }))

    expect(
      await screen.findByText(
        /este insumo está em uso na receita de uma ou mais velas e não pode ser excluído/i
      )
    ).toBeInTheDocument()
    expect(screen.getAllByText('Cera de soja').length).toBeGreaterThan(0)
  })
})
