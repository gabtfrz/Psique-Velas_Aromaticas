import { useState } from 'react'
import { escalarValores } from '@/utils/svg'
import { formatarMoeda } from '@/utils/formatadores'

interface PropsGraficoBarra {
  dados: Array<{ rotulo: string; valor: number; cor?: string }>
  altura?: number
}

const MARGEM = { topo: 30, direita: 20, baixo: 50, esquerda: 20 }
const LARGURA_INTERNA = 600
const COR_PADRAO = '#6B6B2A'
const COR_HOVER = '#555520'

export function GraficoBarra({ dados, altura = 260 }: PropsGraficoBarra) {
  const [barraHover, setBarraHover] = useState<number | null>(null)

  if (dados.length === 0) {
    return (
      <div
        style={{
          height: altura,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ color: 'var(--cor-muted)', fontSize: 14 }}>Sem dados para exibir</span>
      </div>
    )
  }

  const alturaInterna = altura - MARGEM.topo - MARGEM.baixo
  const larguraUtil = LARGURA_INTERNA - MARGEM.esquerda - MARGEM.direita

  const valores = dados.map((d) => d.valor)
  const escalados = escalarValores(valores, alturaInterna)

  const totalBarras = dados.length
  const larguraBarra = larguraUtil / totalBarras * 0.6
  const passoX = larguraUtil / totalBarras

  return (
    <svg
      viewBox={`0 0 ${LARGURA_INTERNA} ${altura}`}
      style={{ width: '100%', height: altura, display: 'block' }}
    >
      {dados.map((item, i) => {
        const altBarra = escalados[i]
        const x = MARGEM.esquerda + i * passoX + (passoX - larguraBarra) / 2
        const y = MARGEM.topo + alturaInterna - altBarra
        const cor = barraHover === i
          ? COR_HOVER
          : (item.cor ?? COR_PADRAO)
        const centroX = x + larguraBarra / 2

        return (
          <g
            key={i}
            onMouseEnter={() => setBarraHover(i)}
            onMouseLeave={() => setBarraHover(null)}
            style={{ cursor: 'default' }}
          >
            {/* Barra */}
            <rect
              x={x}
              y={y}
              width={larguraBarra}
              height={altBarra}
              fill={cor}
              rx={3}
              style={{ transition: 'fill 0.15s ease' }}
            />

            {/* Label do valor acima */}
            <text
              x={centroX}
              y={y - 6}
              textAnchor="middle"
              fontSize={10}
              fill="var(--cor-texto)"
              fontFamily="inherit"
              fontWeight={600}
            >
              {formatarMoeda(item.valor)}
            </text>

            {/* Rótulo abaixo */}
            <text
              x={centroX}
              y={MARGEM.topo + alturaInterna + 18}
              textAnchor="middle"
              fontSize={11}
              fill="var(--cor-muted)"
              fontFamily="inherit"
            >
              {item.rotulo}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export default GraficoBarra
