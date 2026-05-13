import { useId } from 'react'

interface AlternadorProps {
  rotulo: string
  ativo: boolean
  aoAlternar: (v: boolean) => void
  descricao?: string
}

export function Alternador({ rotulo, ativo, aoAlternar, descricao }: AlternadorProps) {
  const uid = useId()
  const idCampo = `alternador-${uid}`
  const idDescricao = descricao ? `desc-alternador-${uid}` : undefined

  return (
    <div className="flex items-start gap-3">
      <button
        id={idCampo}
        type="button"
        role="switch"
        aria-checked={ativo}
        aria-describedby={idDescricao}
        aria-label={rotulo}
        onClick={() => aoAlternar(!ativo)}
        style={{
          backgroundColor: ativo ? 'var(--cor-musgo)' : 'var(--cor-argila-borda)',
          transition: 'background-color 0.2s ease',
        }}
        className={[
          'relative inline-flex h-6 w-11 items-center rounded-full flex-shrink-0',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-musgo focus-visible:ring-offset-2',
          'cursor-pointer',
        ].join(' ')}
      >
        <span
          style={{
            transform: ativo ? 'translateX(1.375rem)' : 'translateX(0.125rem)',
            transition: 'transform 0.2s ease',
            backgroundColor: 'var(--cor-argila-card)',
          }}
          className="inline-block h-4 w-4 rounded-full shadow"
          aria-hidden="true"
        />
      </button>

      <div className="flex flex-col gap-0.5 min-w-0">
        <label
          htmlFor={idCampo}
          className="text-sm font-medium font-corpo text-texto cursor-pointer select-none"
          onClick={() => aoAlternar(!ativo)}
        >
          {rotulo}
        </label>
        {descricao && (
          <p id={idDescricao} className="text-xs font-corpo text-muted">
            {descricao}
          </p>
        )}
      </div>
    </div>
  )
}

export default Alternador
