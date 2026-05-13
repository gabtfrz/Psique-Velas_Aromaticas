type VarianteEsqueleto = 'texto' | 'cartao' | 'tabela'

interface EsqueletoProps {
  variante?: VarianteEsqueleto
  linhas?: number
  altura?: number
  largura?: string
}

const SHIMMER_KEYFRAMES = `
@keyframes shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
`

const shimmerStyle: React.CSSProperties = {
  backgroundImage:
    'linear-gradient(90deg, var(--cor-argila-borda) 0px, var(--cor-argila-card) 80px, var(--cor-argila-borda) 160px)',
  backgroundSize: '800px 100%',
  animation: 'shimmer 1.6s infinite linear',
  borderRadius: 4,
}

import React from 'react'

function LinhaTexto({ larguraPct }: { larguraPct: number }) {
  return (
    <div
      style={{
        ...shimmerStyle,
        height: 14,
        width: `${larguraPct}%`,
        marginBottom: 8,
      }}
      aria-hidden="true"
    />
  )
}

export function Esqueleto({
  variante = 'texto',
  linhas = 3,
  altura = 120,
  largura = '100%',
}: EsqueletoProps) {
  return (
    <>
      <style>{SHIMMER_KEYFRAMES}</style>

      {variante === 'texto' && (
        <div style={{ width: largura }} aria-busy="true" aria-label="Carregando...">
          {Array.from({ length: linhas }).map((_, i) => (
            <LinhaTexto
              key={i}
              larguraPct={i === linhas - 1 ? 60 : 100}
            />
          ))}
        </div>
      )}

      {variante === 'cartao' && (
        <div
          style={{
            ...shimmerStyle,
            height: altura,
            width: largura,
            borderRadius: 8,
          }}
          aria-busy="true"
          aria-label="Carregando..."
        />
      )}

      {variante === 'tabela' && (
        <div style={{ width: largura }} aria-busy="true" aria-label="Carregando tabela...">
          {/* Cabeçalho */}
          <div
            style={{
              ...shimmerStyle,
              height: 36,
              marginBottom: 2,
              borderRadius: '4px 4px 0 0',
            }}
          />
          {/* Linhas */}
          {Array.from({ length: linhas }).map((_, i) => (
            <div
              key={i}
              style={{
                ...shimmerStyle,
                height: 44,
                marginBottom: 2,
                borderRadius: 0,
                opacity: 1 - i * 0.08,
              }}
            />
          ))}
        </div>
      )}
    </>
  )
}

export default Esqueleto
