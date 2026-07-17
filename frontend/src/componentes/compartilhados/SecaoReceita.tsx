import { useCallback, useId, useMemo, useState } from 'react'
import { CampoSelecao } from '@/componentes/ui/CampoSelecao'
import { Campo } from '@/componentes/ui/Campo'
import { Botao } from '@/componentes/ui/Botao'
import { calcularCustoInsumos } from '@/utils/calculadores'
import { formatarMoeda } from '@/utils/formatadores'
import { QUANTIDADE_MINIMA_ITEM_RECEITA } from '@/constantes'
import type { Insumo, ItemReceita, OpcaoSelecao } from '@/tipos'

interface PropsSecaoReceita {
  receita: ItemReceita[]
  insumos: Insumo[]
  aoMudarReceita: (receita: ItemReceita[]) => void
}

// Seção do ModalNovoProduto onde a gestora monta a receita de insumos da vela — cada
// linha vira um ItemReceita e o custo dos insumos é recalculado ao vivo (useMemo).
export function SecaoReceita({ receita, insumos, aoMudarReceita }: PropsSecaoReceita) {
  const uid = useId()
  const [insumoSelecionadoId, setInsumoSelecionadoId] = useState('')
  const [quantidadeNova, setQuantidadeNova] = useState('')
  const [aviso, setAviso] = useState('')

  const opcoesInsumo: OpcaoSelecao[] = useMemo(
    () => insumos.map((i) => ({ valor: String(i.id), rotulo: `${i.nome} (${i.unidadeMedida})` })),
    [insumos]
  )

  const insumoSelecionado = useMemo(
    () => insumos.find((i) => String(i.id) === insumoSelecionadoId),
    [insumos, insumoSelecionadoId]
  )

  const custoInsumos = useMemo(() => calcularCustoInsumos(receita, insumos), [receita, insumos])

  const aoAdicionarInsumo = useCallback(() => {
    setAviso('')
    const quantidade = Number(quantidadeNova)

    if (!insumoSelecionado) {
      return
    }
    if (!quantidadeNova || quantidade < QUANTIDADE_MINIMA_ITEM_RECEITA) {
      return
    }
    if (receita.some((item) => item.insumoId === insumoSelecionado.id)) {
      setAviso(`${insumoSelecionado.nome} já está na receita.`)
      return
    }

    const novoItem: ItemReceita = {
      insumoId: insumoSelecionado.id,
      nomeInsumo: insumoSelecionado.nome,
      unidadeMedida: insumoSelecionado.unidadeMedida,
      quantidade,
      subtotal: quantidade * insumoSelecionado.precoUnitario,
    }

    aoMudarReceita([...receita, novoItem])
    setQuantidadeNova('')
  }, [insumoSelecionado, quantidadeNova, receita, aoMudarReceita])

  const aoMudarQuantidadeLinha = useCallback(
    (insumoId: number, novaQuantidade: number) => {
      // Mesma regra de `aoAdicionarInsumo`: quantidade abaixo do mínimo é ignorada
      // (não deixa a linha existente ir a zero/negativo por um valor inválido digitado).
      if (!Number.isFinite(novaQuantidade) || novaQuantidade < QUANTIDADE_MINIMA_ITEM_RECEITA) {
        return
      }
      setAviso('')
      const insumo = insumos.find((i) => i.id === insumoId)
      aoMudarReceita(
        receita.map((item) =>
          item.insumoId === insumoId
            ? { ...item, quantidade: novaQuantidade, subtotal: novaQuantidade * (insumo?.precoUnitario ?? 0) }
            : item
        )
      )
    },
    [receita, insumos, aoMudarReceita]
  )

  const aoRemoverLinha = useCallback(
    (insumoId: number) => {
      setAviso('')
      aoMudarReceita(receita.filter((item) => item.insumoId !== insumoId))
    },
    [receita, aoMudarReceita]
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: 12, alignItems: 'end' }}>
        <CampoSelecao
          rotulo="Insumo"
          nome="insumoSelecionado"
          opcoes={opcoesInsumo}
          valor={insumoSelecionadoId}
          aoMudar={setInsumoSelecionadoId}
          placeholder="Selecione um insumo"
        />
        <Campo
          rotulo="Quantidade"
          nome="quantidadeNova"
          tipo="number"
          valor={quantidadeNova}
          aoMudar={setQuantidadeNova}
          placeholder={insumoSelecionado ? `Em ${insumoSelecionado.unidadeMedida}` : 'Qtde.'}
        />
        <Botao variante="secundario" tipo="button" aoClicar={aoAdicionarInsumo}>
          Adicionar insumo à receita
        </Botao>
      </div>

      {aviso && (
        <p role="alert" style={{ fontSize: 12, color: 'var(--cor-perigo)', margin: 0 }}>
          {aviso}
        </p>
      )}

      {receita.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--cor-muted)', margin: 0 }}>
          Nenhum insumo adicionado à receita.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {receita.map((item) => (
            <div
              key={item.insumoId}
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr auto',
                gap: 12,
                alignItems: 'center',
                background: 'var(--cor-argila)',
                border: '1px solid var(--cor-argila-borda)',
                borderRadius: 6,
                padding: '8px 12px',
              }}
            >
              <span style={{ fontSize: 14, color: 'var(--cor-texto)' }}>{item.nomeInsumo}</span>
              <label htmlFor={`${uid}-qtd-${item.insumoId}`} className="sr-only">
                {`Quantidade de ${item.nomeInsumo} na receita`}
              </label>
              <input
                id={`${uid}-qtd-${item.insumoId}`}
                aria-label={`Quantidade de ${item.nomeInsumo} na receita`}
                type="number"
                min={QUANTIDADE_MINIMA_ITEM_RECEITA}
                step={0.01}
                value={item.quantidade}
                onChange={(e) => aoMudarQuantidadeLinha(item.insumoId, Number(e.target.value))}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  borderRadius: 4,
                  border: '1px solid var(--cor-argila-borda)',
                  background: 'var(--cor-argila-card)',
                  color: 'var(--cor-texto)',
                  fontSize: 13,
                }}
              />
              <span style={{ fontSize: 13, color: 'var(--cor-muted)' }}>{formatarMoeda(item.subtotal)}</span>
              <Botao
                variante="ghost"
                tamanho="sm"
                tipo="button"
                aoClicar={() => aoRemoverLinha(item.insumoId)}
              >
                <span aria-hidden="true">×</span>
                <span className="sr-only">{`Remover ${item.nomeInsumo} da receita`}</span>
              </Botao>
            </div>
          ))}
        </div>
      )}

      <div
        style={{
          background: 'var(--cor-argila)',
          border: '1px solid var(--cor-argila-borda)',
          borderRadius: 6,
          padding: '10px 14px',
          width: 'fit-content',
        }}
      >
        <p style={{ margin: 0, fontSize: 12, color: 'var(--cor-muted)' }}>Custo dos insumos</p>
        <p style={{ margin: '4px 0 0', fontSize: 16, fontWeight: 600, color: 'var(--cor-texto)' }}>
          {formatarMoeda(custoInsumos)}
        </p>
      </div>
    </div>
  )
}

export default SecaoReceita
