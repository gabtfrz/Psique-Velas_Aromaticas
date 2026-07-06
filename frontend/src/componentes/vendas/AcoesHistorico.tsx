import { useCallback } from 'react'
import type { Venda } from '@/tipos'

export interface PropsAcoesHistorico {
  venda: Venda
  aoVerDetalhes: (venda: Venda) => void
  aoEditarStatus: (venda: Venda) => void
}

export function AcoesHistorico({ venda, aoVerDetalhes, aoEditarStatus }: PropsAcoesHistorico) {
  const handleDetalhes = useCallback(() => aoVerDetalhes(venda), [aoVerDetalhes, venda])
  const handleEditar = useCallback(() => aoEditarStatus(venda), [aoEditarStatus, venda])

  return (
    <div style={{ display: 'flex', gap: 4 }}>
      <button
        type="button"
        onClick={handleDetalhes}
        title="Ver detalhes"
        style={{
          background: 'none',
          border: '1px solid var(--cor-argila-borda)',
          borderRadius: 4,
          cursor: 'pointer',
          padding: '3px 8px',
          fontSize: 12,
          color: 'var(--cor-texto)',
          fontFamily: 'inherit',
        }}
      >
        Detalhes
      </button>
      <button
        type="button"
        onClick={handleEditar}
        title="Editar status"
        style={{
          background: 'none',
          border: '1px solid var(--cor-argila-borda)',
          borderRadius: 4,
          cursor: 'pointer',
          padding: '3px 8px',
          fontSize: 12,
          color: 'var(--cor-texto)',
          fontFamily: 'inherit',
        }}
      >
        Status
      </button>
    </div>
  )
}
