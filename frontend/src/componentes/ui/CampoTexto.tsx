import { useId } from 'react'

interface CampoTextoProps {
  rotulo: string
  nome: string
  valor?: string
  aoMudar?: (v: string) => void
  erro?: string
  linhas?: number
  contador?: boolean
  maxCaracteres?: number
  placeholder?: string
  desabilitado?: boolean
}

export function CampoTexto({
  rotulo,
  nome,
  valor = '',
  aoMudar,
  erro,
  linhas = 4,
  contador = false,
  maxCaracteres,
  placeholder,
  desabilitado = false,
}: CampoTextoProps) {
  const uid = useId()
  const idCampo = `textarea-${uid}-${nome}`
  const idErro = `erro-textarea-${uid}-${nome}`
  const comprimento = valor.length

  return (
    <div className="flex flex-col gap-1 w-full">
      <label htmlFor={idCampo} className="text-sm font-medium font-corpo text-texto">
        {rotulo}
      </label>

      <textarea
        id={idCampo}
        name={nome}
        value={valor}
        rows={linhas}
        onChange={(e) => aoMudar?.(e.target.value)}
        placeholder={placeholder}
        disabled={desabilitado}
        maxLength={maxCaracteres}
        aria-invalid={!!erro}
        aria-describedby={erro ? idErro : undefined}
        style={{ borderColor: erro ? 'var(--cor-perigo)' : 'var(--cor-argila-borda)' }}
        className={[
          'w-full px-3 py-2 rounded font-corpo text-sm bg-argila-card text-texto',
          'border transition-colors duration-150 resize-y',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-musgo focus-visible:ring-offset-1',
          'placeholder:text-muted',
          desabilitado ? 'opacity-50 cursor-not-allowed' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      />

      <div className="flex justify-between items-start min-h-[1.25rem]">
        {erro ? (
          <p id={idErro} role="alert" className="text-xs text-perigo font-corpo">
            {erro}
          </p>
        ) : (
          <span />
        )}
        {contador && (
          <span
            className="text-xs text-muted font-corpo ml-auto"
            aria-live="polite"
            aria-label={`${comprimento} caracteres${maxCaracteres ? ` de ${maxCaracteres}` : ''}`}
          >
            {comprimento}
            {maxCaracteres ? `/${maxCaracteres}` : ''}
          </span>
        )}
      </div>
    </div>
  )
}

export default CampoTexto
