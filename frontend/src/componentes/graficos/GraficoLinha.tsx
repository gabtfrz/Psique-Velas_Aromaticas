import React, { useRef, useState } from 'react'
import { escalarValores } from '@/utils/svg'
import { formatarMoeda, formatarData } from '@/utils/formatadores'

interface PropsGraficoLinha {
  dados: Array<{ data: Date; valor: number }>
  altura?: number
  corLinha?: string
}

interface Tooltip {
  idxPonto: number
  x: number
  y: number
}

const MARGEM = { topo: 20, direita: 20, baixo: 40, esquerda: 60 }
const LINHAS_GRID = 5
const LARGURA_INTERNA = 600

export function GraficoLinha({
  dados,
  altura = 260,
  corLinha = '#6B6B2A',
}: PropsGraficoLinha) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [tooltip, setTooltip] = useState<Tooltip | null>(null)

  if (dados.length === 0) {
    return (
      <div
        style={{ height: altura, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <span style={{ color: 'var(--cor-muted)', fontSize: 14 }}>Sem dados para exibir</span>
      </div>
    )
  }

  const alturaInterna = altura - MARGEM.topo - MARGEM.baixo
  const larguraUtil = LARGURA_INTERNA - MARGEM.esquerda - MARGEM.direita

  const valores = dados.map((d) => d.valor)
  const max = Math.max(...valores)
  const min = Math.min(...valores)
  const intervalo = max - min || 1

  const escalados = escalarValores(valores, alturaInterna)
  const passoX = dados.length > 1 ? larguraUtil / (dados.length - 1) : 0

  const pontosLinha = escalados
    .map((v, i) => `${MARGEM.esquerda + i * passoX},${MARGEM.topo + alturaInterna - v}`)
    .join(' ')

  const primeiroX = MARGEM.esquerda
  const ultimoX = MARGEM.esquerda + larguraUtil
  const baseY = MARGEM.topo + alturaInterna

  const pontosPreencher = `${primeiroX},${baseY} ${pontosLinha} ${ultimoX},${baseY}`

  function handleMouseMove(e: React.MouseEvent<SVGSVGElement>) {
    const svg = svgRef.current
    if (!svg || dados.length === 0) return
    const rect = svg.getBoundingClientRect()
    const escalaX = LARGURA_INTERNA / rect.width
    const mouseX = (e.clientX - rect.left) * escalaX - MARGEM.esquerda
    const idx = Math.round(mouseX / (passoX || 1))
    const idxClamped = Math.max(0, Math.min(dados.length - 1, idx))
    const pxSvg = MARGEM.esquerda + idxClamped * passoX
    const pySvg = MARGEM.topo + alturaInterna - escalados[idxClamped]
    const tooltipX = (pxSvg / LARGURA_INTERNA) * rect.width
    const tooltipY = (pySvg / altura) * rect.height
    setTooltip({ idxPonto: idxClamped, x: tooltipX, y: tooltipY })
  }

  function handleMouseLeave() {
    setTooltip(null)
  }

  const ticksY = Array.from({ length: LINHAS_GRID }, (_, i) => {
    const frac = i / (LINHAS_GRID - 1)
    const val = min + frac * intervalo
    const y = MARGEM.topo + alturaInterna - frac * alturaInterna
    return { val, y }
  })

  const maxTicksX = 7
  const passoTickX = Math.max(1, Math.ceil(dados.length / maxTicksX))
  const ticksXFiltrados = dados
    .map((d, i) => ({
      label: d.data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      x: MARGEM.esquerda + i * passoX,
      idx: i,
    }))
    .filter(({ idx }) => idx % passoTickX === 0 || idx === dados.length - 1)

  const pontoTooltip =
    tooltip !== null
      ? {
          cx: MARGEM.esquerda + tooltip.idxPonto * passoX,
          cy: MARGEM.topo + alturaInterna - escalados[tooltip.idxPonto],
        }
      : null

  return (
    <div style={{ position: 'relative' }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${LARGURA_INTERNA} ${altura}`}
        style={{ width: '100%', height: altura, display: 'block' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Grid horizontal tracejado */}
        {ticksY.map(({ val, y }, i) => (
          <g key={i}>
            <line
              x1={MARGEM.esquerda}
              y1={y}
              x2={MARGEM.esquerda + larguraUtil}
              y2={y}
              stroke="var(--cor-argila-borda)"
              strokeDasharray="4 4"
              strokeWidth={1}
            />
            <text
              x={MARGEM.esquerda - 8}
              y={y + 4}
              textAnchor="end"
              fontSize={10}
              fill="var(--cor-muted)"
              fontFamily="inherit"
            >
              {formatarMoeda(val)}
            </text>
          </g>
        ))}

        {/* Eixo X — labels de data */}
        {ticksXFiltrados.map(({ label, x }, i) => (
          <text
            key={i}
            x={x}
            y={MARGEM.topo + alturaInterna + 20}
            textAnchor="middle"
            fontSize={10}
            fill="var(--cor-muted)"
            fontFamily="inherit"
          >
            {label}
          </text>
        ))}

        {/* Área preenchida */}
        <polygon
          points={pontosPreencher}
          fill={corLinha}
          fillOpacity={0.08}
        />

        {/* Linha */}
        <polyline
          points={pontosLinha}
          fill="none"
          stroke={corLinha}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Ponto de destaque no hover */}
        {pontoTooltip !== null && (
          <circle
            cx={pontoTooltip.cx}
            cy={pontoTooltip.cy}
            r={4}
            fill={corLinha}
            stroke="white"
            strokeWidth={2}
          />
        )}
      </svg>

      {tooltip !== null && (
        <div
          style={{
            position: 'absolute',
            left: tooltip.x + 12,
            top: Math.max(0, tooltip.y - 10),
            background: 'var(--cor-argila-card)',
            border: '1px solid var(--cor-argila-borda)',
            borderRadius: 6,
            padding: '6px 10px',
            fontSize: 12,
            color: 'var(--cor-texto)',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            zIndex: 10,
          }}
        >
          <div style={{ color: 'var(--cor-muted)', marginBottom: 2 }}>
            {formatarData(dados[tooltip.idxPonto].data)}
          </div>
          <div style={{ fontWeight: 600 }}>
            {formatarMoeda(dados[tooltip.idxPonto].valor)}
          </div>
        </div>
      )}
    </div>
  )
}

export default GraficoLinha
