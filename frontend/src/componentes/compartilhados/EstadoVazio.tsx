import { Botao } from '@/componentes/ui/Botao'

interface PropsEstadoVazio {
  titulo: string
  subtitulo?: string
  textoBotao?: string
  aoClicarBotao?: () => void
}

function IlustracaoVela() {
  return (
    <svg
      width={80}
      height={80}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Chama */}
      <ellipse cx="40" cy="16" rx="5" ry="7" fill="var(--cor-argila-borda)" opacity={0.6} />
      <path
        d="M40 9 C38 12 35 14 36 18 C37 21 43 21 44 18 C45 14 42 12 40 9Z"
        fill="var(--cor-musgo)"
        opacity={0.4}
      />
      {/* Pavio */}
      <line x1="40" y1="22" x2="40" y2="26" stroke="var(--cor-muted)" strokeWidth="1.5" strokeLinecap="round" />
      {/* Corpo da vela */}
      <rect x="27" y="26" width="26" height="36" rx="4" fill="var(--cor-argila-borda)" />
      {/* Reflexo */}
      <rect x="30" y="30" width="5" height="26" rx="2" fill="white" opacity={0.25} />
      {/* Base */}
      <rect x="23" y="62" width="34" height="6" rx="3" fill="var(--cor-argila-borda)" opacity={0.7} />
      {/* Decoração */}
      <line x1="27" y1="44" x2="53" y2="44" stroke="white" strokeWidth="1" opacity={0.2} />
    </svg>
  )
}

export function EstadoVazio({
  titulo,
  subtitulo,
  textoBotao,
  aoClicarBotao,
}: PropsEstadoVazio) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        padding: '48px 24px',
        textAlign: 'center',
      }}
    >
      <IlustracaoVela />

      <h3
        style={{
          fontFamily: 'var(--font-display, inherit)',
          fontSize: 20,
          fontWeight: 600,
          color: 'var(--cor-texto)',
          margin: 0,
        }}
      >
        {titulo}
      </h3>

      {subtitulo && (
        <p
          style={{
            fontSize: 14,
            color: 'var(--cor-muted)',
            margin: 0,
            maxWidth: 320,
            lineHeight: 1.5,
          }}
        >
          {subtitulo}
        </p>
      )}

      {textoBotao && aoClicarBotao && (
        <div style={{ marginTop: 8 }}>
          <Botao variante="primario" aoClicar={aoClicarBotao}>
            {textoBotao}
          </Botao>
        </div>
      )}
    </div>
  )
}

export default EstadoVazio
