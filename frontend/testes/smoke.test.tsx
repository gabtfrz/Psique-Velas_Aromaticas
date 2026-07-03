// Smoke test — equivalente frontend a "o servidor sobe":
// verifica que a aplicação monta sem lançar erro. Sem lógica de negócio.
import React from 'react'
import { render } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from '../src/App'

describe('smoke — inicialização da aplicação', () => {
  it('monta o App sem lançar erro', () => {
    const { container } = render(<App />)
    expect(container).toBeTruthy()
    expect(document.body).toBeInTheDocument()
  })
})
