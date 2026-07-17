import { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Modal } from '@/componentes/ui/Modal'
import { Campo } from '@/componentes/ui/Campo'
import { CampoSelecao } from '@/componentes/ui/CampoSelecao'
import { CampoMonetario } from '@/componentes/ui/CampoMonetario'
import { CampoTexto } from '@/componentes/ui/CampoTexto'
import { Botao } from '@/componentes/ui/Botao'
import { SecaoReceita } from '@/componentes/compartilhados/SecaoReceita'
import { schemaProduto } from '@/utils/validadores'
import type { EntradaProduto } from '@/utils/validadores'
import {
  calcularMargem,
  calcularMarkup,
  calcularCustoInsumos,
  calcularCustoComExtras,
} from '@/utils/calculadores'
import { formatarPercentual } from '@/utils/formatadores'
import { LIMITE_DESCRICAO_CURTA, LIMITE_HISTORIA_VELA } from '@/constantes'
import { useInsumos } from '@/hooks/useInsumos'
import type { Produto, OpcaoSelecao, ItemReceita } from '@/tipos'

// ─── Opções de seleção ───────────────────────────────────────────────────────

const opcoesTipoCera: OpcaoSelecao[] = [
  { valor: 'vegetal-soja', rotulo: 'Vegetal de soja' },
  { valor: 'vegetal-coco', rotulo: 'Vegetal de coco' },
  { valor: 'mista', rotulo: 'Mista' },
]

const opcoesGranulometria: OpcaoSelecao[] = [
  { valor: 'fina', rotulo: 'Fina' },
  { valor: 'media', rotulo: 'Média' },
  { valor: 'grossa', rotulo: 'Grossa' },
]

const opcoesTipoPavio: OpcaoSelecao[] = [
  { valor: 'algodao', rotulo: 'Algodão' },
  { valor: 'madeira', rotulo: 'Madeira' },
  { valor: 'duplo', rotulo: 'Duplo' },
]

const opcoesCategoria: OpcaoSelecao[] = [
  { valor: 'para-rituais', rotulo: 'Para rituais' },
  { valor: 'para-presentes', rotulo: 'Para presentes' },
  { valor: 'colecao-especial', rotulo: 'Coleção especial' },
  { valor: 'uso-diario', rotulo: 'Uso diário' },
]

// ─── Conversores ─────────────────────────────────────────────────────────────

function produtoParaEntrada(p: Produto): EntradaProduto {
  return {
    nome: p.nome,
    intencao: p.intencao,
    tipoCera: p.tipoCera,
    granulometria: p.granulometria,
    gramagem: p.gramagem,
    notasAromaticas: {
      topo: p.notasAromaticas.topo,
      coracao: p.notasAromaticas.coracao,
      fundo: p.notasAromaticas.fundo,
    },
    percentualFragrancia: p.percentualFragrancia,
    tipoPavio: p.tipoPavio,
    corCera: p.corCera,
    recipiente: p.recipiente,
    tempoQueima: p.tempoQueima,
    custoProducao: p.custoProducao,
    precoVenda: p.precoVenda,
    categoria: p.categoria,
    tags: p.tags,
    estoqueAtual: p.estoqueAtual,
    estoqueMinimo: p.estoqueMinimo,
    descricaoCurta: p.descricaoCurta,
    historiaVela: p.historiaVela,
    percentualCustosExtras: p.percentualCustosExtras,
    receita: p.receita,
  }
}

const valoresIniciais: EntradaProduto = {
  nome: '',
  intencao: '',
  tipoCera: 'vegetal-soja',
  granulometria: 'fina',
  gramagem: 200,
  notasAromaticas: { topo: '', coracao: '', fundo: '' },
  percentualFragrancia: 8,
  tipoPavio: 'algodao',
  corCera: '#F5F0E8',
  recipiente: '',
  tempoQueima: 40,
  custoProducao: 0,
  precoVenda: 0,
  categoria: 'uso-diario',
  tags: [],
  estoqueAtual: 0,
  estoqueMinimo: 5,
  descricaoCurta: '',
  historiaVela: '',
  percentualCustosExtras: 0,
  receita: [],
}

// ─── Estilo de seção ─────────────────────────────────────────────────────────

const estiloTituloSecao: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--cor-musgo)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: 10,
  paddingBottom: 6,
  borderBottom: '1px solid var(--cor-argila-borda)',
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface PropsModalNovoProduto {
  aberto: boolean
  aoFechar: () => void
  aoSalvar: (dados: EntradaProduto) => void
  produtoParaEditar?: Produto
}

// ─── Componente ──────────────────────────────────────────────────────────────

export function ModalNovoProduto({
  aberto,
  aoFechar,
  aoSalvar,
  produtoParaEditar,
}: PropsModalNovoProduto) {
  const { insumosOrdenados } = useInsumos()

  // Fonte de verdade de "o custo foi editado à mão": enquanto for `false`, o custo de
  // produção é auto-preenchido a partir da receita + % de extras a cada mudança; quando
  // a gestora digita diretamente no campo, vira `true` e o cálculo automático para de
  // sobrescrever o valor (só "Recalcular da receita" volta a preenchê-lo).
  const [custoFoiEditadoManualmente, setCustoFoiEditadoManualmente] = useState(false)

  // Texto local do campo de tags: não é reconstruído do array `tags` a cada tecla, para
  // preservar exatamente o que a gestora está digitando (vírgulas e espaços em digitação).
  const [tagsTexto, setTagsTexto] = useState('')

  const {
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EntradaProduto>({
    resolver: zodResolver(schemaProduto) as Resolver<EntradaProduto>,
    defaultValues: valoresIniciais,
  })

  useEffect(() => {
    if (aberto) {
      reset(produtoParaEditar ? produtoParaEntrada(produtoParaEditar) : valoresIniciais)
      setCustoFoiEditadoManualmente(false)
      setTagsTexto((produtoParaEditar?.tags ?? valoresIniciais.tags).join(', '))
    }
  }, [aberto, produtoParaEditar, reset])

  const aoMudarTagsTexto = useCallback(
    (v: string) => {
      setTagsTexto(v)
      setValue('tags', v.split(',').map((t) => t.trim()).filter(Boolean), { shouldValidate: true })
    },
    [setValue]
  )

  const custoWatched = watch('custoProducao') ?? 0
  const precoWatched = watch('precoVenda') ?? 0
  const descricaoCurtaWatched = watch('descricaoCurta') ?? ''
  const historiaVelaWatched = watch('historiaVela') ?? ''
  const receitaWatched = watch('receita') ?? []
  const percentualCustosExtrasWatched = watch('percentualCustosExtras') ?? 0

  const margemCalculada = useMemo(
    () => calcularMargem(custoWatched, precoWatched),
    [custoWatched, precoWatched]
  )

  const markupCalculado = useMemo(
    () => calcularMarkup(custoWatched, precoWatched),
    [custoWatched, precoWatched]
  )

  const custoCalculadoDaReceita = useMemo(() => {
    const custoInsumos = calcularCustoInsumos(receitaWatched, insumosOrdenados)
    return calcularCustoComExtras(custoInsumos, percentualCustosExtrasWatched)
  }, [receitaWatched, insumosOrdenados, percentualCustosExtrasWatched])

  const aoMudarReceita = useCallback(
    (novaReceita: ItemReceita[]) => {
      setValue('receita', novaReceita, { shouldValidate: true })
      // Só recalcula automaticamente o custo enquanto a gestora não tiver assumido o
      // controle manual do campo — preserva o valor editado à mão.
      if (custoFoiEditadoManualmente) {
        return
      }
      const custoInsumos = calcularCustoInsumos(novaReceita, insumosOrdenados)
      setValue(
        'custoProducao',
        calcularCustoComExtras(custoInsumos, percentualCustosExtrasWatched),
        { shouldValidate: true }
      )
    },
    [setValue, insumosOrdenados, percentualCustosExtrasWatched, custoFoiEditadoManualmente]
  )

  const aoMudarPercentualCustosExtras = useCallback(
    (v: string) => {
      const percentual = Number(v)
      setValue('percentualCustosExtras', percentual, { shouldValidate: true })
      if (custoFoiEditadoManualmente) {
        return
      }
      const custoInsumos = calcularCustoInsumos(receitaWatched, insumosOrdenados)
      setValue('custoProducao', calcularCustoComExtras(custoInsumos, percentual), {
        shouldValidate: true,
      })
    },
    [setValue, receitaWatched, insumosOrdenados, custoFoiEditadoManualmente]
  )

  const aoMudarCustoProducao = useCallback(
    (v: number) => {
      setValue('custoProducao', v, { shouldValidate: true })
      setCustoFoiEditadoManualmente(true)
    },
    [setValue]
  )

  const aoRecalcularCusto = useCallback(() => {
    setValue('custoProducao', custoCalculadoDaReceita, { shouldValidate: true })
    setCustoFoiEditadoManualmente(false)
  }, [setValue, custoCalculadoDaReceita])

  function onSubmit(dados: EntradaProduto) {
    aoSalvar(dados)
  }

  const titulo = produtoParaEditar ? 'Editar vela' : 'Nova vela'

  return (
    <Modal aberto={aberto} aoFechar={aoFechar} titulo={titulo} largura="3xl">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Seção 1 — Informações básicas */}
          <section>
            <p style={estiloTituloSecao}>Informações básicas</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <Campo
                  rotulo="Nome da vela"
                  nome="nome"
                  valor={watch('nome')}
                  aoMudar={(v) => setValue('nome', v, { shouldValidate: true })}
                  erro={errors.nome?.message}
                  obrigatorio
                />
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <CampoTexto
                  rotulo="Intenção"
                  nome="intencao"
                  valor={watch('intencao')}
                  aoMudar={(v) => setValue('intencao', v, { shouldValidate: true })}
                  erro={errors.intencao?.message}
                  linhas={2}
                  placeholder="Para quem busca..."
                />
              </div>
              <CampoSelecao
                rotulo="Categoria"
                nome="categoria"
                opcoes={opcoesCategoria}
                valor={watch('categoria')}
                aoMudar={(v) => setValue('categoria', v as EntradaProduto['categoria'], { shouldValidate: true })}
                erro={errors.categoria?.message}
              />
              <Campo
                rotulo="Tags (separadas por vírgula)"
                nome="tags"
                valor={tagsTexto}
                aoMudar={aoMudarTagsTexto}
                erro={errors.tags?.message}
                placeholder="renovação, rituais..."
              />
            </div>
          </section>

          {/* Seção 2 — Técnico */}
          <section>
            <p style={estiloTituloSecao}>Técnico</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <CampoSelecao
                rotulo="Tipo de cera"
                nome="tipoCera"
                opcoes={opcoesTipoCera}
                valor={watch('tipoCera')}
                aoMudar={(v) => setValue('tipoCera', v as EntradaProduto['tipoCera'], { shouldValidate: true })}
                erro={errors.tipoCera?.message}
              />
              <CampoSelecao
                rotulo="Granulometria"
                nome="granulometria"
                opcoes={opcoesGranulometria}
                valor={watch('granulometria')}
                aoMudar={(v) => setValue('granulometria', v as EntradaProduto['granulometria'], { shouldValidate: true })}
                erro={errors.granulometria?.message}
              />
              <Campo
                rotulo="Gramagem (g)"
                nome="gramagem"
                tipo="number"
                valor={String(watch('gramagem') ?? '')}
                aoMudar={(v) => setValue('gramagem', Number(v), { shouldValidate: true })}
                erro={errors.gramagem?.message}
                obrigatorio
              />
              <Campo
                rotulo="Percentual de fragrância (%)"
                nome="percentualFragrancia"
                tipo="number"
                valor={String(watch('percentualFragrancia') ?? '')}
                aoMudar={(v) => setValue('percentualFragrancia', Number(v), { shouldValidate: true })}
                erro={errors.percentualFragrancia?.message}
              />
              <CampoSelecao
                rotulo="Tipo de pavio"
                nome="tipoPavio"
                opcoes={opcoesTipoPavio}
                valor={watch('tipoPavio')}
                aoMudar={(v) => setValue('tipoPavio', v as EntradaProduto['tipoPavio'], { shouldValidate: true })}
                erro={errors.tipoPavio?.message}
              />
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: 14,
                    fontWeight: 500,
                    color: 'var(--cor-texto)',
                    marginBottom: 4,
                  }}
                >
                  Cor da cera
                </label>
                <input
                  type="color"
                  value={watch('corCera')}
                  onChange={(e) => setValue('corCera', e.target.value, { shouldValidate: true })}
                  style={{
                    width: '100%',
                    height: 38,
                    borderRadius: 6,
                    border: '1px solid var(--cor-argila-borda)',
                    background: 'var(--cor-argila-card)',
                    cursor: 'pointer',
                    padding: '2px 4px',
                  }}
                />
                {errors.corCera && (
                  <p style={{ fontSize: 12, color: 'var(--cor-perigo)', marginTop: 4 }}>
                    {errors.corCera.message}
                  </p>
                )}
              </div>
              <Campo
                rotulo="Recipiente"
                nome="recipiente"
                valor={watch('recipiente')}
                aoMudar={(v) => setValue('recipiente', v, { shouldValidate: true })}
                erro={errors.recipiente?.message}
                placeholder="Pote de vidro âmbar 200ml"
              />
              <Campo
                rotulo="Tempo de queima (h)"
                nome="tempoQueima"
                tipo="number"
                valor={String(watch('tempoQueima') ?? '')}
                aoMudar={(v) => setValue('tempoQueima', Number(v), { shouldValidate: true })}
                erro={errors.tempoQueima?.message}
              />
            </div>
          </section>

          {/* Seção 3 — Notas aromáticas */}
          <section>
            <p style={estiloTituloSecao}>Notas aromáticas</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <Campo
                rotulo="Nota de topo"
                nome="notasAromaticas.topo"
                valor={watch('notasAromaticas.topo')}
                aoMudar={(v) => setValue('notasAromaticas.topo', v, { shouldValidate: true })}
                erro={errors.notasAromaticas?.topo?.message}
                placeholder="Alecrim"
                obrigatorio
              />
              <Campo
                rotulo="Nota de coração"
                nome="notasAromaticas.coracao"
                valor={watch('notasAromaticas.coracao')}
                aoMudar={(v) => setValue('notasAromaticas.coracao', v, { shouldValidate: true })}
                erro={errors.notasAromaticas?.coracao?.message}
                placeholder="Palo Santo"
                obrigatorio
              />
              <Campo
                rotulo="Nota de fundo"
                nome="notasAromaticas.fundo"
                valor={watch('notasAromaticas.fundo')}
                aoMudar={(v) => setValue('notasAromaticas.fundo', v, { shouldValidate: true })}
                erro={errors.notasAromaticas?.fundo?.message}
                placeholder="Baunilha"
                obrigatorio
              />
            </div>
          </section>

          {/* Seção 4 — Receita e custo */}
          <section>
            <p style={estiloTituloSecao}>Receita e custo</p>
            <SecaoReceita
              receita={receitaWatched}
              insumos={insumosOrdenados}
              aoMudarReceita={aoMudarReceita}
            />
          </section>

          {/* Seção 5 — Comercial */}
          <section>
            <p style={estiloTituloSecao}>Comercial</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, alignItems: 'start' }}>
              <Campo
                rotulo="Custos extras (%)"
                nome="percentualCustosExtras"
                tipo="number"
                valor={String(percentualCustosExtrasWatched)}
                aoMudar={aoMudarPercentualCustosExtras}
                erro={errors.percentualCustosExtras?.message}
              />
              <div>
                <CampoMonetario
                  rotulo="Custo de produção"
                  nome="custoProducao"
                  valor={custoWatched}
                  aoMudar={aoMudarCustoProducao}
                  erro={errors.custoProducao?.message}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--cor-muted)' }}>
                    {custoFoiEditadoManualmente ? 'valor editado manualmente' : 'calculado da receita'}
                  </p>
                  <button
                    type="button"
                    onClick={aoRecalcularCusto}
                    style={{
                      fontSize: 12,
                      color: 'var(--cor-musgo)',
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    Recalcular da receita
                  </button>
                </div>
              </div>
              <CampoMonetario
                rotulo="Preço de venda"
                nome="precoVenda"
                valor={precoWatched}
                aoMudar={(v) => setValue('precoVenda', v, { shouldValidate: true })}
                erro={errors.precoVenda?.message}
              />
              {/* Margem e markup calculados em tempo real */}
              <div
                style={{
                  gridColumn: '1 / -1',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                }}
              >
                <div
                  style={{
                    background: 'var(--cor-argila)',
                    border: '1px solid var(--cor-argila-borda)',
                    borderRadius: 6,
                    padding: '10px 14px',
                  }}
                >
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--cor-muted)' }}>Margem</p>
                  <p
                    style={{
                      margin: '4px 0 0',
                      fontSize: 18,
                      fontWeight: 600,
                      color: margemCalculada >= 65
                        ? 'var(--cor-musgo)'
                        : margemCalculada >= 50
                          ? '#6B4C00'
                          : 'var(--cor-perigo)',
                    }}
                  >
                    {formatarPercentual(margemCalculada)}
                  </p>
                </div>
                <div
                  style={{
                    background: 'var(--cor-argila)',
                    border: '1px solid var(--cor-argila-borda)',
                    borderRadius: 6,
                    padding: '10px 14px',
                  }}
                >
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--cor-muted)' }}>Markup</p>
                  <p
                    style={{
                      margin: '4px 0 0',
                      fontSize: 18,
                      fontWeight: 600,
                      color: 'var(--cor-texto)',
                    }}
                  >
                    {formatarPercentual(markupCalculado)}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Seção 5 — Estoque */}
          <section>
            <p style={estiloTituloSecao}>Estoque</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Campo
                rotulo="Estoque atual"
                nome="estoqueAtual"
                tipo="number"
                valor={String(watch('estoqueAtual') ?? '')}
                aoMudar={(v) => setValue('estoqueAtual', Number(v), { shouldValidate: true })}
                erro={errors.estoqueAtual?.message}
              />
              <Campo
                rotulo="Estoque mínimo para alerta"
                nome="estoqueMinimo"
                tipo="number"
                valor={String(watch('estoqueMinimo') ?? '')}
                aoMudar={(v) => setValue('estoqueMinimo', Number(v), { shouldValidate: true })}
                erro={errors.estoqueMinimo?.message}
              />
            </div>
          </section>

          {/* Seção 6 — Descrição */}
          <section>
            <p style={estiloTituloSecao}>Descrição</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Campo
                rotulo="Descrição curta"
                nome="descricaoCurta"
                valor={descricaoCurtaWatched}
                aoMudar={(v) => setValue('descricaoCurta', v, { shouldValidate: true })}
                erro={errors.descricaoCurta?.message}
                contador
                maxCaracteres={LIMITE_DESCRICAO_CURTA}
                placeholder="Uma vela para..."
                obrigatorio
              />
              <CampoTexto
                rotulo="História da vela"
                nome="historiaVela"
                valor={historiaVelaWatched}
                aoMudar={(v) => setValue('historiaVela', v, { shouldValidate: true })}
                erro={errors.historiaVela?.message}
                linhas={4}
                contador
                maxCaracteres={LIMITE_HISTORIA_VELA}
                placeholder="Nasceu do desejo de..."
              />
            </div>
          </section>

          {/* Ações */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8,
              paddingTop: 8,
              borderTop: '1px solid var(--cor-argila-borda)',
            }}
          >
            <Botao variante="secundario" aoClicar={aoFechar} tipo="button">
              Cancelar
            </Botao>
            <Botao variante="primario" tipo="submit" carregando={isSubmitting}>
              {produtoParaEditar ? 'Salvar alterações' : 'Cadastrar vela'}
            </Botao>
          </div>
        </div>
      </form>
    </Modal>
  )
}

export default ModalNovoProduto
