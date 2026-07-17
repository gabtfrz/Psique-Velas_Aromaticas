// Testes da BarraSuperior — saudação "Olá, {nome}" + botão Sair no topo da área interna.
// nome/carregando chegam via prop (perfil buscado uma única vez em AreaInterna).
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import BarraSuperior from '@/componentes/layout/BarraSuperior'

describe('BarraSuperior', () => {
  it('caso válido: exibe "Olá, {nome}" e o botão Sair aciona o logout ao clicar', () => {
    const sair = vi.fn()

    render(<BarraSuperior nome="Maria" carregando={false} sair={sair} />)

    expect(screen.getByText('Olá, Maria')).toBeInTheDocument()

    const botaoSair = screen.getByRole('button', { name: 'Sair' })
    fireEvent.click(botaoSair)

    expect(sair).toHaveBeenCalledTimes(1)
  })

  it('caso de erro: enquanto o perfil carrega, não exibe "Olá, undefined"', () => {
    render(<BarraSuperior nome={undefined} carregando sair={vi.fn()} />)

    expect(screen.queryByText('Olá, undefined')).not.toBeInTheDocument()
    expect(screen.queryByText(/Olá, Maria/)).not.toBeInTheDocument()
  })

  it('caso de erro: perfil vazio (sem carregar) não exibe "Olá, undefined" e mantém o Sair visível', () => {
    render(<BarraSuperior nome={undefined} carregando={false} sair={vi.fn()} />)

    expect(screen.queryByText('Olá, undefined')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sair' })).toBeInTheDocument()
  })
})
