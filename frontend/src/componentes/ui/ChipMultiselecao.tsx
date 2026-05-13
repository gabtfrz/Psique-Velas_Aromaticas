interface OpcaoChip {
  valor: string
  rotulo: string
}

interface ChipMultiselecaoProps {
  rotulo: string
  opcoes: OpcaoChip[]
  selecionados: string[]
  aoMudar: (v: string[]) => void
}

export function ChipMultiselecao({
  rotulo,
  opcoes,
  selecionados,
  aoMudar,
}: ChipMultiselecaoProps) {
  function alternarChip(valor: string) {
    if (selecionados.includes(valor)) {
      aoMudar(selecionados.filter((v) => v !== valor))
    } else {
      aoMudar([...selecionados, valor])
    }
  }

  return (
    <fieldset className="flex flex-col gap-2 w-full border-none p-0 m-0">
      <legend className="text-sm font-medium font-corpo text-texto mb-1">
        {rotulo}
      </legend>
      <div className="flex flex-wrap gap-2" role="group" aria-label={rotulo}>
        {opcoes.map((op) => {
          const selecionado = selecionados.includes(op.valor)
          return (
            <button
              key={op.valor}
              type="button"
              role="checkbox"
              aria-checked={selecionado}
              onClick={() => alternarChip(op.valor)}
              style={
                selecionado
                  ? {
                      backgroundColor: 'var(--cor-musgo)',
                      color: 'var(--cor-argila-card)',
                      borderColor: 'var(--cor-musgo)',
                    }
                  : {
                      backgroundColor: 'var(--cor-argila-card)',
                      color: 'var(--cor-texto)',
                      borderColor: 'var(--cor-argila-borda)',
                    }
              }
              className={[
                'px-3 py-1 rounded-full text-xs font-corpo font-medium border',
                'transition-colors duration-150 cursor-pointer',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-musgo focus-visible:ring-offset-1',
              ].join(' ')}
            >
              {op.rotulo}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}

export default ChipMultiselecao
