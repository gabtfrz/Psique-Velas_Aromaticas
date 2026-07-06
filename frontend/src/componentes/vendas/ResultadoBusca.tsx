import { useCallback } from 'react'
import type React from 'react'
import { formatarMoeda } from '@/utils/formatadores'
import type { Produto } from '@/tipos'

export interface PropsResultadoBusca {
  produto: Produto
  aoAdicionarAoCarrinho: (produto: Produto) => void
}

export function ResultadoBusca({ produto, aoAdicionarAoCarrinho }: PropsResultadoBusca) {
  const handleAdicionar = useCallback(
    () => aoAdicionarAoCarrinho(produto),
    [aoAdicionarAoCarrinho, produto]
  )

  const handleMouseEnter = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = 'var(--cor-argila)'
  }, [])

  const handleMouseLeave = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = 'none'
  }, [])

  return (
    <button
      type="button"
      onClick={handleAdicionar}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        background: 'none',
        border: 'none',
        borderBottom: '1px solid var(--cor-argila-borda)',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background 0.1s ease',
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--cor-texto)' }}>
          {produto.nome}
        </p>
        <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--cor-muted)' }}>
          {produto.gramagem}g · Estoque: {produto.estoqueAtual}
        </p>
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--cor-musgo)', marginLeft: 8 }}>
        {formatarMoeda(produto.precoVenda)}
      </span>
    </button>
  )
}
