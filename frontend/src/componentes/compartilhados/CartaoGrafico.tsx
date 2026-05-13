import React from 'react'

interface PropsCartaoGrafico {
  titulo: string
  subtitulo?: string
  children: React.ReactNode
  acaoExtra?: React.ReactNode
}

export function CartaoGrafico({
  titulo,
  subtitulo,
  children,
  acaoExtra,
}: PropsCartaoGrafico) {
  return (
    <div
      style={{
        background: 'var(--cor-argila-card)',
        border: '1px solid var(--cor-argila-borda)',
        borderRadius: 8,
        padding: '20px 24px',
      }}
    >
      {/* Cabeçalho */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: subtitulo ? 4 : 16,
        }}
      >
        <h3
          style={{
            fontFamily: 'var(--font-display, inherit)',
            fontSize: 18,
            fontWeight: 600,
            color: 'var(--cor-texto)',
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          {titulo}
        </h3>
        {acaoExtra && <div style={{ flexShrink: 0 }}>{acaoExtra}</div>}
      </div>

      {subtitulo && (
        <p
          style={{
            fontSize: 13,
            color: 'var(--cor-muted)',
            margin: '0 0 16px 0',
          }}
        >
          {subtitulo}
        </p>
      )}

      {/* Conteúdo */}
      {children}
    </div>
  )
}

export default CartaoGrafico
