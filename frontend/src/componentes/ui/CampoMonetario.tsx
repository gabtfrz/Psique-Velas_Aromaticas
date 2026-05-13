import { useId } from 'react'

interface CampoMonetarioProps {
  rotulo: string
  nome: string
  valor?: number
  aoMudar?: (v: number) => void
  erro?: string
  desabilitado?: boolean
}

export function CampoMonetario({
  rotulo,
  nome,
  valor,
  aoMudar,
  erro,
  desabilitado = false,
}: CampoMonetarioProps) {
  const uid = useId()
  const idCampo = `campo-monetario-${uid}-${nome}`
  const idErro = `erro-monetario-${uid}-${nome}`

  const valorTexto = valor !== undefined ? String(valor) : ''

  return (
    <div className="flex flex-col gap-1 w-full">
      <label htmlFor={idCampo} className="text-sm font-medium font-corpo text-texto">
        {rotulo}
      </label>

      <div
        className={[
          'flex items-center rounded border bg-argila-card overflow-hidden',
          'focus-within:ring-2 focus-within:ring-musgo focus-within:ring-offset-1',
          'transition-colors duration-150',
        ].join(' ')}
        style={{ borderColor: erro ? 'var(--cor-perigo)' : 'var(--cor-argila-borda)' }}
      >
        <span
          className="px-3 py-2 text-sm font-corpo text-muted bg-argila border-r select-none whitespace-nowrap"
          style={{ borderColor: erro ? 'var(--cor-perigo)' : 'var(--cor-argila-borda)' }}
          aria-hidden="true"
        >
          R$
        </span>
        <input
          id={idCampo}
          name={nome}
          type="number"
          min={0}
          step={0.01}
          value={valorTexto}
          onChange={(e) => {
            const parsed = parseFloat(e.target.value)
            aoMudar?.(isNaN(parsed) ? 0 : parsed)
          }}
          disabled={desabilitado}
          aria-invalid={!!erro}
          aria-describedby={erro ? idErro : undefined}
          aria-label={`${rotulo} em reais`}
          className={[
            'flex-1 px-3 py-2 text-sm font-corpo text-texto bg-transparent',
            'focus:outline-none',
            'placeholder:text-muted',
            '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
            desabilitado ? 'opacity-50 cursor-not-allowed' : '',
          ]
            .filter(Boolean)
            .join(' ')}
        />
      </div>

      {erro && (
        <p id={idErro} role="alert" className="text-xs text-perigo font-corpo">
          {erro}
        </p>
      )}
    </div>
  )
}

export default CampoMonetario
