import { useCallback } from 'react'
import { Icone } from '@/componentes/ui/Icone'
import { formatarMoeda } from '@/utils/formatadores'
import type { ItemVenda } from '@/tipos'

export interface PropsItemCarrinho {
  item: ItemVenda
  aoAumentarQtd: (produtoId: string) => void
  aoDiminuirQtd: (produtoId: string) => void
  aoRemover: (produtoId: string) => void
}

export function ItemCarrinho({ item, aoAumentarQtd, aoDiminuirQtd, aoRemover }: PropsItemCarrinho) {
  const handleAumentar = useCallback(
    () => aoAumentarQtd(item.produtoId),
    [aoAumentarQtd, item.produtoId]
  )
  const handleDiminuir = useCallback(
    () => aoDiminuirQtd(item.produtoId),
    [aoDiminuirQtd, item.produtoId]
  )
  const handleRemover = useCallback(
    () => aoRemover(item.produtoId),
    [aoRemover, item.produtoId]
  )

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 0',
        borderBottom: '1px solid var(--cor-argila-borda)',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--cor-texto)' }}>
          {item.nomeProduto}
        </p>
        <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--cor-muted)' }}>
          {formatarMoeda(item.precoUnitario)} un.
        </p>
      </div>

      {/* Controles de quantidade */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button
          type="button"
          onClick={handleDiminuir}
          disabled={item.quantidade <= 1}
          style={{
            width: 24,
            height: 24,
            borderRadius: 4,
            border: '1px solid var(--cor-argila-borda)',
            background: 'var(--cor-argila)',
            cursor: item.quantidade <= 1 ? 'not-allowed' : 'pointer',
            opacity: item.quantidade <= 1 ? 0.4 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            color: 'var(--cor-texto)',
            lineHeight: 1,
          }}
        >
          −
        </button>
        <span style={{ fontSize: 13, fontWeight: 600, minWidth: 20, textAlign: 'center', color: 'var(--cor-texto)' }}>
          {item.quantidade}
        </span>
        <button
          type="button"
          onClick={handleAumentar}
          style={{
            width: 24,
            height: 24,
            borderRadius: 4,
            border: '1px solid var(--cor-argila-borda)',
            background: 'var(--cor-argila)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            color: 'var(--cor-texto)',
            lineHeight: 1,
          }}
        >
          +
        </button>
      </div>

      {/* Subtotal */}
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--cor-texto)', minWidth: 72, textAlign: 'right' }}>
        {formatarMoeda(item.subtotal)}
      </span>

      {/* Remover */}
      <button
        type="button"
        onClick={handleRemover}
        title="Remover"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 4,
          color: 'var(--cor-perigo)',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Icone nome="fechar" tamanho={14} />
      </button>
    </div>
  )
}
