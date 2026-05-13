interface PropsCabecalho {
  titulo: string
  subtitulo?: string
}

export default function Cabecalho({ titulo, subtitulo }: PropsCabecalho) {
  return (
    <header
      style={{
        borderBottom: '1px solid var(--cor-argila-borda)',
        padding: '20px 24px 16px',
      }}
    >
      <h1
        style={{
          fontFamily: '"Cormorant Garamond", serif',
          fontSize: '1.5rem',
          fontWeight: 500,
          color: 'var(--cor-texto)',
          lineHeight: 1.2,
        }}
      >
        {titulo}
      </h1>
      {subtitulo && (
        <p
          style={{
            fontFamily: '"DM Sans", sans-serif',
            fontSize: '0.875rem',
            color: 'var(--cor-muted)',
            marginTop: 4,
            lineHeight: 1.4,
          }}
        >
          {subtitulo}
        </p>
      )}
    </header>
  )
}
