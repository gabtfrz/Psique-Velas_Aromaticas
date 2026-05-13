import React from 'react'

type VarianteBotao = 'primario' | 'secundario' | 'perigo' | 'ghost'
type TamanhoBotao = 'sm' | 'md' | 'lg'

interface BotaoProps {
  variante?: VarianteBotao
  carregando?: boolean
  tamanho?: TamanhoBotao
  tipo?: 'button' | 'submit'
  desabilitado?: boolean
  aoClicar?: () => void
  children: React.ReactNode
  larguraTotal?: boolean
}

const estilosVariante: Record<VarianteBotao, string> = {
  primario:
    'bg-musgo text-white hover:bg-musgo-escuro border border-transparent',
  secundario:
    'bg-argila-card text-texto border border-argila-borda hover:bg-argila',
  perigo:
    'bg-perigo text-white border border-transparent hover:opacity-90',
  ghost:
    'bg-transparent text-musgo border border-transparent hover:bg-argila-card',
}

const estilosTamanho: Record<TamanhoBotao, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

const Spinner = () => (
  <svg
    className="animate-spin h-4 w-4"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
    />
  </svg>
)

export function Botao({
  variante = 'primario',
  carregando = false,
  tamanho = 'md',
  tipo = 'button',
  desabilitado = false,
  aoClicar,
  children,
  larguraTotal = false,
}: BotaoProps) {
  const desabilitadoEfetivo = desabilitado || carregando

  return (
    <button
      type={tipo}
      onClick={aoClicar}
      disabled={desabilitadoEfetivo}
      aria-disabled={desabilitadoEfetivo}
      aria-busy={carregando}
      className={[
        'inline-flex items-center justify-center gap-2 rounded font-corpo font-medium transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
        'focus-visible:outline-musgo',
        estilosVariante[variante],
        estilosTamanho[tamanho],
        larguraTotal ? 'w-full' : '',
        desabilitadoEfetivo ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {carregando && <Spinner />}
      {children}
    </button>
  )
}

export default Botao
