import React, { useState } from 'react'
import { Icone } from '@/componentes/ui/Icone'
import { Esqueleto } from '@/componentes/ui/Esqueleto'

interface ColunaTabelaDados<T> {
  chave: string
  titulo: string
  ordenavel?: boolean
  renderizar?: (item: T) => React.ReactNode
}

interface PropsTabelaDados<T> {
  colunas: ColunaTabelaDados<T>[]
  dados: T[]
  chaveUnica: keyof T
  itensPorPagina?: number
  carregando?: boolean
  mensagemVazia?: string
}

type DirecaoOrdem = 'asc' | 'desc'

export function TabelaDados<T extends Record<string, unknown>>({
  colunas,
  dados,
  chaveUnica,
  itensPorPagina = 10,
  carregando = false,
  mensagemVazia = 'Nenhum registro encontrado.',
}: PropsTabelaDados<T>) {
  const [colunaOrdem, setColunaOrdem] = useState<string | null>(null)
  const [direcao, setDirecao] = useState<DirecaoOrdem>('asc')
  const [paginaAtual, setPaginaAtual] = useState(1)

  function alterarOrdem(chave: string) {
    if (colunaOrdem === chave) {
      setDirecao((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setColunaOrdem(chave)
      setDirecao('asc')
    }
    setPaginaAtual(1)
  }

  const dadosOrdenados = [...dados].sort((a, b) => {
    if (!colunaOrdem) return 0
    const va = a[colunaOrdem]
    const vb = b[colunaOrdem]
    if (va === undefined || vb === undefined) return 0
    if (typeof va === 'number' && typeof vb === 'number') {
      return direcao === 'asc' ? va - vb : vb - va
    }
    const sa = String(va)
    const sb = String(vb)
    return direcao === 'asc' ? sa.localeCompare(sb) : sb.localeCompare(sa)
  })

  const totalPaginas = Math.max(1, Math.ceil(dadosOrdenados.length / itensPorPagina))
  const paginaSegura = Math.min(paginaAtual, totalPaginas)
  const inicio = (paginaSegura - 1) * itensPorPagina
  const dadosPagina = dadosOrdenados.slice(inicio, inicio + itensPorPagina)

  const estiloTh: React.CSSProperties = {
    padding: '10px 14px',
    textAlign: 'left',
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--cor-muted)',
    background: 'var(--cor-argila-card)',
    borderBottom: '1px solid var(--cor-argila-borda)',
    whiteSpace: 'nowrap',
    position: 'sticky',
    top: 0,
    zIndex: 1,
  }

  const estiloTd: React.CSSProperties = {
    padding: '10px 14px',
    fontSize: 13,
    color: 'var(--cor-texto)',
    borderBottom: '1px solid var(--cor-argila-borda)',
    verticalAlign: 'middle',
  }

  if (carregando) {
    return <Esqueleto variante="tabela" linhas={itensPorPagina > 5 ? 5 : itensPorPagina} />
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto' }}>
          <thead>
            <tr>
              {colunas.map((col) => (
                <th key={col.chave} style={estiloTh}>
                  {col.ordenavel ? (
                    <button
                      onClick={() => alterarOrdem(col.chave)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        fontSize: 'inherit',
                        fontWeight: 'inherit',
                        color: colunaOrdem === col.chave ? 'var(--cor-musgo)' : 'inherit',
                        fontFamily: 'inherit',
                      }}
                    >
                      {col.titulo}
                      <Icone
                        nome={
                          colunaOrdem === col.chave && direcao === 'desc'
                            ? 'seta-baixo'
                            : 'seta-cima'
                        }
                        tamanho={12}
                        cor={colunaOrdem === col.chave ? 'var(--cor-musgo)' : 'var(--cor-argila-borda)'}
                      />
                    </button>
                  ) : (
                    col.titulo
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dadosPagina.length === 0 ? (
              <tr>
                <td
                  colSpan={colunas.length}
                  style={{
                    ...estiloTd,
                    textAlign: 'center',
                    color: 'var(--cor-muted)',
                    padding: '32px 14px',
                  }}
                >
                  {mensagemVazia}
                </td>
              </tr>
            ) : (
              dadosPagina.map((item, rowIdx) => (
                <tr
                  key={String(item[chaveUnica])}
                  style={{
                    background:
                      rowIdx % 2 === 0
                        ? 'transparent'
                        : 'rgba(240,235,227,0.35)',
                    transition: 'background 0.1s ease',
                  }}
                  onMouseEnter={(e) => {
                    ;(e.currentTarget as HTMLTableRowElement).style.background =
                      'var(--cor-argila-card)'
                  }}
                  onMouseLeave={(e) => {
                    ;(e.currentTarget as HTMLTableRowElement).style.background =
                      rowIdx % 2 === 0 ? 'transparent' : 'rgba(240,235,227,0.35)'
                  }}
                >
                  {colunas.map((col) => (
                    <td key={col.chave} style={estiloTd}>
                      {col.renderizar
                        ? col.renderizar(item)
                        : String(item[col.chave] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {totalPaginas > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 12,
            padding: '10px 14px',
            borderTop: '1px solid var(--cor-argila-borda)',
            background: 'var(--cor-argila-card)',
          }}
        >
          <button
            onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
            disabled={paginaSegura === 1}
            style={{
              background: 'none',
              border: '1px solid var(--cor-argila-borda)',
              borderRadius: 4,
              padding: '4px 10px',
              fontSize: 12,
              cursor: paginaSegura === 1 ? 'not-allowed' : 'pointer',
              opacity: paginaSegura === 1 ? 0.4 : 1,
              color: 'var(--cor-texto)',
              fontFamily: 'inherit',
            }}
          >
            Anterior
          </button>

          <span style={{ fontSize: 12, color: 'var(--cor-muted)' }}>
            Página {paginaSegura} de {totalPaginas}
          </span>

          <button
            onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
            disabled={paginaSegura === totalPaginas}
            style={{
              background: 'none',
              border: '1px solid var(--cor-argila-borda)',
              borderRadius: 4,
              padding: '4px 10px',
              fontSize: 12,
              cursor: paginaSegura === totalPaginas ? 'not-allowed' : 'pointer',
              opacity: paginaSegura === totalPaginas ? 0.4 : 1,
              color: 'var(--cor-texto)',
              fontFamily: 'inherit',
            }}
          >
            Próximo
          </button>
        </div>
      )}
    </div>
  )
}

export default TabelaDados
