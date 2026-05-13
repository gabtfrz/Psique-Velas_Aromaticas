import { useId } from 'react'

interface OpcaoSelecao {
  valor: string
  rotulo: string
}

interface CampoSelecaoProps {
  rotulo: string
  nome: string
  opcoes: OpcaoSelecao[]
  valor?: string
  aoMudar?: (v: string) => void
  erro?: string
  placeholder?: string
  desabilitado?: boolean
}

// Seta SVG codificada como data-URI para background-image
const setaSVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23B8AFA5' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`

export function CampoSelecao({
  rotulo,
  nome,
  opcoes,
  valor = '',
  aoMudar,
  erro,
  placeholder,
  desabilitado = false,
}: CampoSelecaoProps) {
  const uid = useId()
  const idCampo = `selecao-${uid}-${nome}`
  const idErro = `erro-selecao-${uid}-${nome}`

  return (
    <div className="flex flex-col gap-1 w-full">
      <label htmlFor={idCampo} className="text-sm font-medium font-corpo text-texto">
        {rotulo}
      </label>

      <select
        id={idCampo}
        name={nome}
        value={valor}
        onChange={(e) => aoMudar?.(e.target.value)}
        disabled={desabilitado}
        aria-invalid={!!erro}
        aria-describedby={erro ? idErro : undefined}
        style={{
          borderColor: erro ? 'var(--cor-perigo)' : 'var(--cor-argila-borda)',
          backgroundImage: setaSVG,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.75rem center',
          backgroundSize: '16px 16px',
          appearance: 'none',
          WebkitAppearance: 'none',
        }}
        className={[
          'w-full px-3 py-2 pr-10 rounded font-corpo text-sm',
          'bg-argila-card text-texto border',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-musgo focus-visible:ring-offset-1',
          'transition-colors duration-150',
          desabilitado ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {placeholder && (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        )}
        {opcoes.map((op) => (
          <option key={op.valor} value={op.valor}>
            {op.rotulo}
          </option>
        ))}
      </select>

      {erro && (
        <p id={idErro} role="alert" className="text-xs text-perigo font-corpo">
          {erro}
        </p>
      )}
    </div>
  )
}

export default CampoSelecao
