import { useState } from 'react'
import { calcularArcoRosca } from '@/utils/svg'
import { formatarMoeda } from '@/utils/formatadores'

interface PropsGraficoRosca {
  dados: Array<{ rotulo: string; valor: number; cor?: string }>
  tamanho?: number
}

const CORES_PADRAO = ['#6B6B2A', '#8B7355', '#B8AFA5', '#D4CCC4', '#555520']
const RAIO_EXT = 80
const RAIO_INT = 50
const CX = 110
const CY = 110

export function GraficoRosca({ dados, tamanho = 220 }: PropsGraficoRosca) {
  const [setorHover, setSetorHover] = useState<number | null>(null)

  if (dados.length === 0) {
    return (
      <div
        style={{
          height: tamanho,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span style={{ color: 'var(--cor-muted)', fontSize: 14 }}>Sem dados para exibir</span>
      </div>
    )
  }

  const total = dados.reduce((acc, d) => acc + d.valor, 0)

  const textoCenter =
    setorHover !== null
      ? `${((dados[setorHover].valor / total) * 100).toFixed(1)}%`
      : formatarMoeda(total)

  const svgLargura = CX * 2 + 10

  let anguloAcumulado = -Math.PI / 2

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
      <svg
        viewBox={`0 0 ${svgLargura} ${tamanho}`}
        style={{ width: svgLargura, height: tamanho, flexShrink: 0 }}
      >
        {dados.length === 1 || (total > 0 && dados.filter((d) => d.valor > 0).length === 1) ? (
          // Círculo completo para item único
          <>
            <circle
              cx={CX}
              cy={CY}
              r={RAIO_EXT}
              fill={dados[0].cor ?? CORES_PADRAO[0]}
              onMouseEnter={() => setSetorHover(0)}
              onMouseLeave={() => setSetorHover(null)}
              style={{ cursor: 'default' }}
            />
            <circle cx={CX} cy={CY} r={RAIO_INT} fill="var(--cor-argila-card, #F0EBE3)" />
          </>
        ) : (
          dados.map((item, i) => {
            if (item.valor <= 0) return null
            const pct = item.valor / total
            const cor = item.cor ?? CORES_PADRAO[i % CORES_PADRAO.length]
            const anguloInicio = anguloAcumulado
            anguloAcumulado += pct * 2 * Math.PI
            const d = calcularArcoRosca(pct, anguloInicio, RAIO_EXT, RAIO_INT, CX, CY)
            return (
              <path
                key={i}
                d={d}
                fill={cor}
                opacity={setorHover !== null && setorHover !== i ? 0.7 : 1}
                onMouseEnter={() => setSetorHover(i)}
                onMouseLeave={() => setSetorHover(null)}
                style={{ cursor: 'default', transition: 'opacity 0.15s ease' }}
              />
            )
          })
        )}

        {/* Texto central */}
        <text
          x={CX}
          y={CY - 6}
          textAnchor="middle"
          fontSize={setorHover !== null ? 16 : 11}
          fill="var(--cor-muted)"
          fontFamily="inherit"
        >
          {setorHover !== null ? dados[setorHover].rotulo : 'Total'}
        </text>
        <text
          x={CX}
          y={CY + 12}
          textAnchor="middle"
          fontSize={setorHover !== null ? 13 : 12}
          fontWeight={600}
          fill="var(--cor-texto)"
          fontFamily="inherit"
        >
          {textoCenter}
        </text>
      </svg>

      {/* Legenda lateral */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {dados.map((item, i) => {
          const cor = item.cor ?? CORES_PADRAO[i % CORES_PADRAO.length]
          const pct = total > 0 ? ((item.valor / total) * 100).toFixed(1) : '0.0'
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'default',
                opacity: setorHover !== null && setorHover !== i ? 0.5 : 1,
                transition: 'opacity 0.15s ease',
              }}
              onMouseEnter={() => setSetorHover(i)}
              onMouseLeave={() => setSetorHover(null)}
            >
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 2,
                  background: cor,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: 12,
                  color: 'var(--cor-texto)',
                  fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.rotulo}
              </span>
              <span
                style={{
                  fontSize: 12,
                  color: 'var(--cor-muted)',
                  fontFamily: 'inherit',
                  marginLeft: 4,
                }}
              >
                {formatarMoeda(item.valor)} ({pct}%)
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default GraficoRosca
