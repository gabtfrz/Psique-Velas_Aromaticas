import { useId } from 'react'

interface SeletorCorProps {
  rotulo: string
  valor: string
  aoMudar: (v: string) => void
}

function hexValido(hex: string): boolean {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex)
}

export function SeletorCor({ rotulo, valor, aoMudar }: SeletorCorProps) {
  const uid = useId()
  const idCor = `cor-${uid}`
  const idHex = `hex-${uid}`

  function handleHexChange(hex: string) {
    aoMudar(hex)
  }

  function handleHexBlur(hex: string) {
    if (!hexValido(hex)) {
      aoMudar('#000000')
    }
  }

  const corPreview = hexValido(valor) ? valor : '#000000'

  return (
    <div className="flex flex-col gap-1 w-full">
      <span className="text-sm font-medium font-corpo text-texto">{rotulo}</span>

      <div className="flex items-center gap-3">
        {/* Preview da cor */}
        <div
          style={{
            backgroundColor: corPreview,
            width: 36,
            height: 36,
            borderRadius: '50%',
            border: '2px solid var(--cor-argila-borda)',
            flexShrink: 0,
          }}
          aria-hidden="true"
        />

        {/* Input nativo de cor */}
        <label htmlFor={idCor} className="sr-only">
          {rotulo} — seletor de cor
        </label>
        <input
          id={idCor}
          type="color"
          value={corPreview}
          onChange={(e) => aoMudar(e.target.value)}
          style={{ width: 36, height: 36, padding: 2, cursor: 'pointer' }}
          className={[
            'rounded border border-argila-borda bg-argila-card',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-musgo focus-visible:ring-offset-1',
          ].join(' ')}
          aria-label={`Escolher cor para ${rotulo}`}
        />

        {/* Input hex manual */}
        <label htmlFor={idHex} className="sr-only">
          {rotulo} — código hexadecimal
        </label>
        <input
          id={idHex}
          type="text"
          value={valor}
          onChange={(e) => handleHexChange(e.target.value)}
          onBlur={(e) => handleHexBlur(e.target.value)}
          maxLength={7}
          placeholder="#000000"
          aria-label={`Código hexadecimal para ${rotulo}`}
          style={{ borderColor: hexValido(valor) ? 'var(--cor-argila-borda)' : 'var(--cor-perigo)' }}
          className={[
            'w-28 px-3 py-2 rounded font-corpo text-sm bg-argila-card text-texto border',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-musgo focus-visible:ring-offset-1',
            'placeholder:text-muted uppercase',
          ].join(' ')}
        />
      </div>
    </div>
  )
}

export default SeletorCor
