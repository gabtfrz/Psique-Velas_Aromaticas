// Testes da BarraLateral — o item de menu "Usuários" só aparece para o papel master.
import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import BarraLateral from '@/componentes/layout/BarraLateral'

function renderizar(papel?: 'master' | 'gestora') {
  return render(
    <MemoryRouter>
      <BarraLateral papel={papel} />
    </MemoryRouter>
  )
}

describe('BarraLateral', () => {
  it('caso válido: papel master vê o item de menu Usuários', () => {
    renderizar('master')

    expect(screen.getAllByRole('link', { name: 'Usuários' }).length).toBeGreaterThan(0)
  })

  it('caso de erro: papel gestora não vê o item de menu Usuários', () => {
    renderizar('gestora')

    expect(screen.queryAllByRole('link', { name: 'Usuários' })).toHaveLength(0)
  })

  it('caso de erro: papel ainda indefinido (perfil carregando) não vê o item de menu Usuários', () => {
    renderizar(undefined)

    expect(screen.queryAllByRole('link', { name: 'Usuários' })).toHaveLength(0)
  })
})
