import { Icone } from '@/componentes/ui/Icone'
import { Esqueleto } from '@/componentes/ui/Esqueleto'
import type { NomeIcone } from '@/componentes/ui/Icone'

interface PropsCartaoKpi {
  titulo: string
  valor: string
  variacao?: number
  nomeIcone: NomeIcone
  carregando?: boolean
}

export function CartaoKpi({
  titulo,
  valor,
  variacao,
  nomeIcone,
  carregando = false,
}: PropsCartaoKpi) {
  const positivo = variacao !== undefined && variacao >= 0

  return (
    <div
      style={{
        background: 'var(--cor-argila-card)',
        border: '1px solid var(--cor-argila-borda)',
        borderRadius: 8,
        padding: '20px 24px',
        position: 'relative',
        minWidth: 0,
      }}
    >
      {/* Ícone no canto superior direito */}
      <div style={{ position: 'absolute', top: 16, right: 16 }}>
        <Icone nome={nomeIcone} tamanho={20} cor="var(--cor-musgo)" />
      </div>

      {carregando ? (
        <div style={{ paddingRight: 32 }}>
          <Esqueleto variante="texto" linhas={2} />
        </div>
      ) : (
        <>
          {/* Título */}
          <p
            style={{
              fontFamily: 'var(--font-corpo, inherit)',
              fontSize: 13,
              color: 'var(--cor-muted)',
              margin: '0 0 8px 0',
              paddingRight: 32,
            }}
          >
            {titulo}
          </p>

          {/* Valor */}
          <p
            style={{
              fontFamily: 'var(--font-display, inherit)',
              fontSize: 28,
              fontWeight: 600,
              color: 'var(--cor-texto)',
              margin: '0 0 8px 0',
              lineHeight: 1.1,
            }}
          >
            {valor}
          </p>

          {/* Variação */}
          {variacao !== undefined && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 12,
                fontWeight: 500,
                color: positivo ? '#4A7C59' : 'var(--cor-perigo)',
                background: positivo ? 'rgba(74,124,89,0.08)' : 'rgba(139,74,58,0.08)',
                borderRadius: 4,
                padding: '2px 6px',
              }}
            >
              <Icone
                nome={positivo ? 'seta-cima' : 'seta-baixo'}
                tamanho={12}
                cor={positivo ? '#4A7C59' : 'var(--cor-perigo)'}
              />
              {positivo ? '+' : ''}
              {variacao.toFixed(1)}%
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default CartaoKpi
