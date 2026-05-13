import { useId } from 'react'

interface SeletorIntervaloProps {
  rotulo?: string
  dataInicio?: string
  dataFim?: string
  aoMudar: (inicio: string, fim: string) => void
}

export function SeletorIntervalo({
  rotulo,
  dataInicio = '',
  dataFim = '',
  aoMudar,
}: SeletorIntervaloProps) {
  const uid = useId()
  const idInicio = `intervalo-inicio-${uid}`
  const idFim = `intervalo-fim-${uid}`

  function handleInicio(v: string) {
    aoMudar(v, dataFim)
  }

  function handleFim(v: string) {
    aoMudar(dataInicio, v)
  }

  const estiloInput = [
    'px-3 py-2 rounded font-corpo text-sm bg-argila-card text-texto',
    'border border-argila-borda transition-colors duration-150',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-musgo focus-visible:ring-offset-1',
  ].join(' ')

  return (
    <fieldset className="flex flex-col gap-1 w-full border-none p-0 m-0">
      {rotulo && (
        <legend className="text-sm font-medium font-corpo text-texto mb-1">
          {rotulo}
        </legend>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex flex-col gap-0.5">
          <label htmlFor={idInicio} className="text-xs font-corpo text-muted">
            De
          </label>
          <input
            id={idInicio}
            type="date"
            value={dataInicio}
            max={dataFim || undefined}
            onChange={(e) => handleInicio(e.target.value)}
            className={estiloInput}
            aria-label="Data de início"
          />
        </div>

        <span
          className="text-sm font-corpo text-muted self-end pb-2"
          aria-hidden="true"
        >
          até
        </span>

        <div className="flex flex-col gap-0.5">
          <label htmlFor={idFim} className="text-xs font-corpo text-muted">
            Até
          </label>
          <input
            id={idFim}
            type="date"
            value={dataFim}
            min={dataInicio || undefined}
            onChange={(e) => handleFim(e.target.value)}
            className={estiloInput}
            aria-label="Data de fim"
          />
        </div>
      </div>
    </fieldset>
  )
}

export default SeletorIntervalo
