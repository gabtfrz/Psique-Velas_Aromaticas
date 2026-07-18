import { useId } from 'react'

interface CampoProps {
  rotulo: string
  nome: string
  tipo?: string
  valor?: string
  aoMudar?: (v: string) => void
  erro?: string
  placeholder?: string
  contador?: boolean
  maxCaracteres?: number
  desabilitado?: boolean
  obrigatorio?: boolean
}

export function Campo({
  rotulo,
  nome,
  tipo = 'text',
  valor = '',
  aoMudar,
  erro,
  placeholder,
  contador = false,
  maxCaracteres,
  desabilitado = false,
  obrigatorio = false,
}: CampoProps) {
  const uid = useId()
  const idCampo = `campo-${uid}-${nome}`
  const idErro = `erro-${uid}-${nome}`
  const comprimento = valor.length

  return (
    <div className="flex flex-col gap-1 w-full">
      <label
        htmlFor={idCampo}
        className="text-sm font-medium font-corpo text-texto"
      >
        {rotulo}
        {obrigatorio && (
          <span className="text-perigo ml-1" aria-hidden="true">
            *
          </span>
        )}
      </label>

      <input
        id={idCampo}
        name={nome}
        type={tipo}
        value={valor}
        onChange={(e) => aoMudar?.(e.target.value)}
        placeholder={placeholder}
        disabled={desabilitado}
        required={obrigatorio}
        maxLength={maxCaracteres}
        aria-invalid={!!erro}
        aria-describedby={erro ? idErro : undefined}
        aria-required={obrigatorio}
        style={{ borderColor: erro ? 'var(--cor-perigo)' : 'var(--cor-argila-borda)' }}
        className={[
          'w-full px-3 py-2 rounded font-corpo text-sm bg-argila-card text-texto',
          'border transition-colors duration-150',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-musgo focus-visible:ring-offset-1',
          'placeholder:text-muted',
          desabilitado ? 'opacity-50 cursor-not-allowed bg-argila' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      />

      {/* Rodapé (erro/contador) renderizado só quando há conteúdo — igual ao
          CampoSelecao — para não reservar espaço vazio que desalinha o campo em
          layouts lado a lado (ex.: seção Receita e custo). */}
      {(erro || contador) && (
        <div className="flex justify-between items-start">
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
      )}
    </div>
  )
}

export default Campo
