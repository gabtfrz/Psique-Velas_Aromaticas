import Botao from '@/componentes/ui/Botao'

interface PropsBarraSuperior {
  nome?: string
  carregando: boolean
  sair: () => void
}

// Barra superior da área interna: saudação "Olá, {nome}" (perfil da gestora logada) + Sair,
// alinhados ao canto superior direito. Recebe nome/carregando via prop — o perfil (usePerfil)
// é buscado uma única vez em AreaInterna e compartilhado com a BarraLateral (gating por papel).
export default function BarraSuperior({ nome, carregando, sair }: PropsBarraSuperior) {
  // Enquanto carrega ou sem nome resolvido, mostra um placeholder discreto — nunca "Olá, undefined".
  const textoSaudacao = !carregando && nome ? `Olá, ${nome}` : 'Olá,'

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 16,
        padding: '12px 24px',
        borderBottom: '1px solid var(--cor-argila-borda)',
        background: 'var(--cor-argila-card)',
      }}
    >
      <span
        style={{
          fontFamily: '"DM Sans", sans-serif',
          fontSize: '0.875rem',
          color: 'var(--cor-texto)',
        }}
        aria-live="polite"
      >
        {textoSaudacao}
      </span>
      <Botao variante="ghost" tamanho="sm" aoClicar={sair}>
        Sair
      </Botao>
    </div>
  )
}
