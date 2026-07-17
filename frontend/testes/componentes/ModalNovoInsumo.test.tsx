// Testes do ModalNovoInsumo — cálculo automático do preço unitário a partir da
// embalagem (quantidade total + preço total), com override manual preservado.
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { ModalNovoInsumo } from '@/componentes/compartilhados/ModalNovoInsumo'

async function abrirModal(aoSalvar = vi.fn()) {
  render(<ModalNovoInsumo aberto aoFechar={vi.fn()} aoSalvar={aoSalvar} />)
  return screen.findByRole('dialog')
}

function preencherCamposObrigatorios(dialog: HTMLElement) {
  fireEvent.change(within(dialog).getByLabelText(/^nome/i), { target: { value: 'Cera de soja' } })
}

describe('ModalNovoInsumo — cálculo do preço unitário pela embalagem', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('caso válido: quantidade 1000 e preço 50,00 calculam o preço unitário 0,05, editável e recalculável', async () => {
    const dialog = await abrirModal()

    const campoQuantidade = within(dialog).getByLabelText(/qtde\.? embalagem/i) as HTMLInputElement
    const campoPrecoEmbalagem = within(dialog).getByLabelText(/preço total da embalagem/i) as HTMLInputElement
    const campoUnitario = within(dialog).getByLabelText(/preço unitário/i) as HTMLInputElement

    fireEvent.change(campoQuantidade, { target: { value: '1000' } })
    fireEvent.change(campoPrecoEmbalagem, { target: { value: '50' } })

    expect(Number(campoUnitario.value)).toBeCloseTo(0.05, 4)

    // Edição manual do unitário prevalece
    fireEvent.change(campoUnitario, { target: { value: '0.06' } })
    expect(Number(campoUnitario.value)).toBeCloseTo(0.06, 4)

    fireEvent.change(campoQuantidade, { target: { value: '2000' } })
    expect(Number(campoUnitario.value)).toBeCloseTo(0.06, 4)

    // Recalcular da embalagem volta ao valor calculado (50 / 2000 = 0,025)
    fireEvent.click(within(dialog).getByRole('button', { name: /recalcular da embalagem/i }))
    expect(Number(campoUnitario.value)).toBeCloseTo(0.025, 4)
  })

  it('caso de borda: quantidade da embalagem 0/vazia não gera NaN/Infinity no preço unitário', async () => {
    const dialog = await abrirModal()

    const campoPrecoEmbalagem = within(dialog).getByLabelText(/preço total da embalagem/i) as HTMLInputElement
    const campoUnitario = within(dialog).getByLabelText(/preço unitário/i) as HTMLInputElement

    fireEvent.change(campoPrecoEmbalagem, { target: { value: '50' } })

    expect(campoUnitario.value === '' || Number(campoUnitario.value) === 0).toBe(true)
    expect(Number.isFinite(Number(campoUnitario.value) || 0)).toBe(true)
  })

  it('caso válido: submeter só com preço unitário (sem embalagem) é válido e chama aoSalvar', async () => {
    const aoSalvar = vi.fn()
    const dialog = await abrirModal(aoSalvar)

    preencherCamposObrigatorios(dialog)
    const campoUnitario = within(dialog).getByLabelText(/preço unitário/i) as HTMLInputElement
    fireEvent.change(campoUnitario, { target: { value: '0.08' } })

    fireEvent.click(within(dialog).getByRole('button', { name: /cadastrar insumo/i }))

    await vi.waitFor(() => {
      expect(aoSalvar).toHaveBeenCalledWith(
        expect.objectContaining({ precoUnitario: 0.08 })
      )
    })
  })
})
