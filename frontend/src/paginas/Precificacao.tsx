import { useState, useMemo, useCallback } from 'react'
import { useProdutos } from '@/hooks/useProdutos'
import { useToast } from '@/hooks/useToast'
import { TabelaDados } from '@/componentes/compartilhados/TabelaDados'
import { EstadoVazio } from '@/componentes/compartilhados/EstadoVazio'
import { ToastContainer } from '@/componentes/ui/Toast'
import { Botao } from '@/componentes/ui/Botao'
import { CampoMonetario } from '@/componentes/ui/CampoMonetario'
import { Campo } from '@/componentes/ui/Campo'
import { CampoSelecao } from '@/componentes/ui/CampoSelecao'
import { Emblema } from '@/componentes/ui/Emblema'
import { Icone } from '@/componentes/ui/Icone'
import {
  calcularMargem,
  calcularMarkup,
  calcularPrecoSugerido,
  classificarMargem,
} from '@/utils/calculadores'
import { formatarMoeda, formatarPercentual, formatarGramagem } from '@/utils/formatadores'
import type { Produto } from '@/tipos'

// ---------------------------------------------------------------------------
// Tipos de linha da tabela
// ---------------------------------------------------------------------------
interface LinhaPrecificacao extends Record<string, unknown> {
  id: number
  nome: string
  gramagem: string
  custo: number
  precoVenda: number
  margem: number
  markup: number
  _produto: Produto
}

// ---------------------------------------------------------------------------
// Componente de edição inline por linha
// ---------------------------------------------------------------------------
interface CelulaEdicaoPrecoProps {
  produtoId: number
  precoAtual: number
  editandoId: number | null
  precoEditando: number
  aoIniciarEdicao: (id: number, preco: number) => void
  aoConfirmar: (id: number) => void
  aoCancelar: () => void
  aoMudarPreco: (v: number) => void
}

function CelulaEdicaoPreco({
  produtoId,
  precoAtual,
  editandoId,
  precoEditando,
  aoIniciarEdicao,
  aoConfirmar,
  aoCancelar,
  aoMudarPreco,
}: CelulaEdicaoPrecoProps) {
  const emEdicao = editandoId === produtoId

  if (!emEdicao) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span>{formatarMoeda(precoAtual)}</span>
        <button
          type="button"
          title="Editar preço"
          onClick={() => aoIniciarEdicao(produtoId, precoAtual)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px 4px',
            color: 'var(--cor-muted)',
            borderRadius: 4,
            lineHeight: 0,
          }}
        >
          <Icone nome="editar" tamanho={14} />
        </button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ width: 110 }}>
        <CampoMonetario
          rotulo=""
          nome="preco-inline"
          valor={precoEditando}
          aoMudar={aoMudarPreco}
        />
      </div>
      <button
        type="button"
        title="Confirmar"
        onClick={() => aoConfirmar(produtoId)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px',
          color: 'var(--cor-musgo)',
          borderRadius: 4,
          lineHeight: 0,
        }}
      >
        <Icone nome="check" tamanho={16} />
      </button>
      <button
        type="button"
        title="Cancelar"
        onClick={aoCancelar}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '4px',
          color: 'var(--cor-perigo)',
          borderRadius: 4,
          lineHeight: 0,
        }}
      >
        <Icone nome="fechar" tamanho={16} />
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------
export default function Precificacao() {
  const { produtosAtivos, editarProduto } = useProdutos()
  const { toasts, exibirToast, removerToast } = useToast()

  // Edição inline
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [precoEditando, setPrecoEditando] = useState(0)

  // Modo edição em massa
  const [modoMassa, setModoMassa] = useState(false)
  const [selecionados, setSelecionados] = useState<Set<number>>(new Set())
  const [ajustePercentual, setAjustePercentual] = useState(0)

  // Simulador de preço
  const [custoSimulador, setCustoSimulador] = useState(0)
  const [margemSimulador, setMargemSimulador] = useState(60)
  const [produtoSimuladorId, setProdutoSimuladorId] = useState('')

  // -------------------------------------------------------------------------
  // Dados da tabela
  // -------------------------------------------------------------------------
  const linhas = useMemo<LinhaPrecificacao[]>(
    () =>
      produtosAtivos.map((p) => ({
        id: p.id,
        nome: p.nome,
        gramagem: formatarGramagem(p.gramagem),
        custo: p.custoProducao,
        precoVenda: p.precoVenda,
        margem: p.margem,
        markup: p.markup,
        _produto: p,
      })),
    [produtosAtivos]
  )

  // -------------------------------------------------------------------------
  // Simulador (tempo real, useMemo)
  // -------------------------------------------------------------------------
  const precoSugerido = useMemo(
    () => calcularPrecoSugerido(custoSimulador, margemSimulador),
    [custoSimulador, margemSimulador]
  )

  const markupSimulador = useMemo(
    () => calcularMarkup(custoSimulador, precoSugerido),
    [custoSimulador, precoSugerido]
  )

  // -------------------------------------------------------------------------
  // Handlers — inline
  // -------------------------------------------------------------------------
  const aoIniciarEdicao = useCallback((id: number, preco: number) => {
    setEditandoId(id)
    setPrecoEditando(preco)
  }, [])

  const aoCancelarEdicao = useCallback(() => {
    setEditandoId(null)
    setPrecoEditando(0)
  }, [])

  const aoConfirmarEdicao = useCallback(
    async (id: number) => {
      const produto = produtosAtivos.find((p) => p.id === id)
      if (!produto) return
      if (precoEditando <= 0) {
        exibirToast('O preço precisa ser maior que zero.', 'erro')
        return
      }
      try {
        await editarProduto({ ...produto, precoVenda: precoEditando })
        exibirToast(`Preço de "${produto.nome}" atualizado.`, 'sucesso')
        setEditandoId(null)
        setPrecoEditando(0)
      } catch {
        exibirToast('Não foi possível atualizar o preço.', 'erro')
      }
    },
    [produtosAtivos, precoEditando, editarProduto, exibirToast]
  )

  const aoMudarPrecoEditando = useCallback((v: number) => {
    setPrecoEditando(v)
  }, [])

  // -------------------------------------------------------------------------
  // Handlers — modo massa
  // -------------------------------------------------------------------------
  const toggleModoMassa = useCallback(() => {
    setModoMassa((prev) => {
      if (prev) {
        setSelecionados(new Set())
        setAjustePercentual(0)
      }
      return !prev
    })
  }, [])

  const toggleSelecionado = useCallback((id: number) => {
    setSelecionados((prev) => {
      const novo = new Set(prev)
      if (novo.has(id)) {
        novo.delete(id)
      } else {
        novo.add(id)
      }
      return novo
    })
  }, [])

  const selecionarTodos = useCallback(() => {
    setSelecionados(new Set(linhas.map((l) => l.id)))
  }, [linhas])

  const deselecionarTodos = useCallback(() => {
    setSelecionados(new Set())
  }, [])

  const aplicarAjusteMassa = useCallback(async () => {
    if (selecionados.size === 0) {
      exibirToast('Selecione ao menos um produto.', 'aviso')
      return
    }
    if (ajustePercentual === 0) {
      exibirToast('Informe um percentual de ajuste.', 'aviso')
      return
    }
    // Monta os novos preços e dispara todas as edições, aguardando o resultado
    // real de cada uma — em edição em massa uma falha parcial (rede/RLS) não pode
    // ser mascarada por um toast de sucesso agregado.
    const edicoes = [...selecionados]
      .map((id) => produtosAtivos.find((p) => p.id === id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p))
      .map((produto) => ({ produto, novoPreco: produto.precoVenda * (1 + ajustePercentual / 100) }))
      .filter(({ novoPreco }) => novoPreco > 0)

    const resultados = await Promise.allSettled(
      edicoes.map(({ produto, novoPreco }) => editarProduto({ ...produto, precoVenda: novoPreco }))
    )
    const falhas = resultados.filter((r) => r.status === 'rejected').length
    const sucessos = resultados.length - falhas

    if (falhas > 0) {
      exibirToast(
        `${sucessos} produto(s) ajustado(s); ${falhas} falhou(aram). Tente novamente.`,
        sucessos > 0 ? 'aviso' : 'erro'
      )
    } else {
      exibirToast(
        `Preços de ${sucessos} produto(s) ajustados em ${ajustePercentual > 0 ? '+' : ''}${ajustePercentual}%.`,
        'sucesso'
      )
    }
    setSelecionados(new Set())
    setAjustePercentual(0)
    setModoMassa(false)
  }, [selecionados, ajustePercentual, produtosAtivos, editarProduto, exibirToast])

  const aoMudarAjuste = useCallback((v: string) => {
    setAjustePercentual(parseFloat(v) || 0)
  }, [])

  // -------------------------------------------------------------------------
  // Colunas da tabela
  // -------------------------------------------------------------------------
  const colunas = useMemo(
    () => [
      ...(modoMassa
        ? [
            {
              chave: 'checkbox',
              titulo: '',
              renderizar: (l: LinhaPrecificacao) => (
                <input
                  type="checkbox"
                  checked={selecionados.has(l.id)}
                  onChange={() => toggleSelecionado(l.id)}
                  style={{ cursor: 'pointer', accentColor: 'var(--cor-musgo)' }}
                />
              ),
            },
          ]
        : []),
      { chave: 'nome', titulo: 'Nome', ordenavel: true },
      { chave: 'gramagem', titulo: 'Gramagem', ordenavel: false },
      {
        chave: 'custo',
        titulo: 'Custo',
        ordenavel: true,
        renderizar: (l: LinhaPrecificacao) => formatarMoeda(l.custo),
      },
      {
        chave: 'precoVenda',
        titulo: 'Preço atual',
        ordenavel: true,
        renderizar: (l: LinhaPrecificacao) => (
          <CelulaEdicaoPreco
            produtoId={l.id}
            precoAtual={l.precoVenda}
            editandoId={editandoId}
            precoEditando={precoEditando}
            aoIniciarEdicao={aoIniciarEdicao}
            aoConfirmar={aoConfirmarEdicao}
            aoCancelar={aoCancelarEdicao}
            aoMudarPreco={aoMudarPrecoEditando}
          />
        ),
      },
      {
        chave: 'margem',
        titulo: 'Margem',
        ordenavel: true,
        renderizar: (l: LinhaPrecificacao) => {
          const classe = classificarMargem(l.margem)
          return <Emblema tipo={classe} tamanho="sm" />
        },
      },
      {
        chave: 'markup',
        titulo: 'Markup',
        ordenavel: true,
        renderizar: (l: LinhaPrecificacao) => formatarPercentual(l.markup),
      },
    ],
    [
      modoMassa,
      selecionados,
      editandoId,
      precoEditando,
      aoIniciarEdicao,
      aoConfirmarEdicao,
      aoCancelarEdicao,
      aoMudarPrecoEditando,
      toggleSelecionado,
    ]
  )

  // -------------------------------------------------------------------------
  // Handlers de simulador
  // -------------------------------------------------------------------------
  const aoMudarCustoSimulador = useCallback((v: number) => {
    setCustoSimulador(v)
  }, [])

  const aoMudarMargemSimulador = useCallback((v: string) => {
    setMargemSimulador(parseFloat(v) || 0)
  }, [])

  const opcoesProdutoSimulador = useMemo(
    () => [
      { valor: '', rotulo: '— nenhum —' },
      ...produtosAtivos.map((p) => ({ valor: String(p.id), rotulo: p.nome })),
    ],
    [produtosAtivos]
  )

  const aoMudarProdutoSimulador = useCallback(
    (v: string) => {
      setProdutoSimuladorId(v)
      // Selecionar "— nenhum —" não é erro nem exige zerar o custo: o campo de
      // custo continua editável e a gestora pode ter digitado um valor manual
      // que deve ser preservado — por isso mantemos custoSimulador como está.
      if (!v) return
      const produto = produtosAtivos.find((p) => String(p.id) === v)
      if (produto) {
        setCustoSimulador(produto.custoProducao)
      }
    },
    [produtosAtivos]
  )

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--cor-argila)',
        padding: '32px',
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}
    >
      {/* Cabeçalho da página */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-display, inherit)',
              fontSize: 28,
              fontWeight: 700,
              color: 'var(--cor-texto)',
              margin: 0,
            }}
          >
            Precificação
          </h1>
          <p style={{ fontSize: 14, color: 'var(--cor-muted)', margin: '4px 0 0' }}>
            Gerencie os preços e margens dos produtos ativos
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <Botao
            variante={modoMassa ? 'primario' : 'secundario'}
            aoClicar={toggleModoMassa}
          >
            <Icone nome={modoMassa ? 'fechar' : 'editar'} tamanho={16} />
            {modoMassa ? 'Sair do modo massa' : 'Editar em massa'}
          </Botao>
        </div>
      </div>

      {/* Barra de modo massa */}
      {modoMassa && (
        <div
          style={{
            background: 'var(--cor-argila-card)',
            border: '1px solid var(--cor-argila-borda)',
            borderRadius: 8,
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'flex-end',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', gap: 8 }}>
            <Botao variante="ghost" tamanho="sm" aoClicar={selecionarTodos}>
              Selecionar todos
            </Botao>
            <Botao variante="ghost" tamanho="sm" aoClicar={deselecionarTodos}>
              Limpar seleção
            </Botao>
          </div>
          <div style={{ width: 140 }}>
            <Campo
              rotulo="Ajuste %"
              nome="ajuste-percentual"
              tipo="number"
              valor={String(ajustePercentual)}
              aoMudar={aoMudarAjuste}
              placeholder="Ex: 10 ou -5"
            />
          </div>
          <Botao
            variante="primario"
            aoClicar={aplicarAjusteMassa}
            desabilitado={selecionados.size === 0}
          >
            Aplicar a {selecionados.size} selecionado{selecionados.size !== 1 ? 's' : ''}
          </Botao>
        </div>
      )}

      {/* Tabela principal */}
      <div
        style={{
          background: 'var(--cor-argila-card)',
          border: '1px solid var(--cor-argila-borda)',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        {linhas.length === 0 ? (
          <EstadoVazio
            titulo="Nenhum produto ativo"
            subtitulo="Ative pelo menos um produto para gerenciar preços."
          />
        ) : (
          <TabelaDados<LinhaPrecificacao>
            colunas={colunas}
            dados={linhas}
            chaveUnica="id"
            mensagemVazia="Nenhum produto ativo encontrado."
          />
        )}
      </div>

      {/* Simulador de preço */}
      <div
        style={{
          background: 'var(--cor-argila-card)',
          border: '1px solid var(--cor-argila-borda)',
          borderRadius: 8,
          padding: '20px 24px',
        }}
      >
        <h2
          style={{
            fontFamily: 'var(--font-display, inherit)',
            fontSize: 18,
            fontWeight: 600,
            color: 'var(--cor-texto)',
            margin: '0 0 16px',
          }}
        >
          Simulador de preço
        </h2>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 16,
            alignItems: 'start',
          }}
        >
          {/* Entradas */}
          <CampoSelecao
            rotulo="Carregar custo de um produto"
            nome="produto-simulador"
            opcoes={opcoesProdutoSimulador}
            valor={produtoSimuladorId}
            aoMudar={aoMudarProdutoSimulador}
          />
          <CampoMonetario
            rotulo="Custo de produção"
            nome="custo-simulador"
            valor={custoSimulador}
            aoMudar={aoMudarCustoSimulador}
          />
          <Campo
            rotulo="Margem desejada (%)"
            nome="margem-simulador"
            tipo="number"
            valor={String(margemSimulador)}
            aoMudar={aoMudarMargemSimulador}
            placeholder="Ex: 60"
          />

          {/* Resultados */}
          <div
            style={{
              background: 'var(--cor-argila)',
              border: '1px solid var(--cor-argila-borda)',
              borderRadius: 6,
              padding: '12px 16px',
            }}
          >
            <p style={{ fontSize: 12, color: 'var(--cor-muted)', margin: '0 0 4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Preço sugerido
            </p>
            <p
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: 'var(--cor-musgo)',
                margin: 0,
                fontFamily: 'var(--font-display, inherit)',
              }}
            >
              {custoSimulador > 0 && margemSimulador < 100
                ? formatarMoeda(precoSugerido)
                : '—'}
            </p>
          </div>

          <div
            style={{
              background: 'var(--cor-argila)',
              border: '1px solid var(--cor-argila-borda)',
              borderRadius: 6,
              padding: '12px 16px',
            }}
          >
            <p style={{ fontSize: 12, color: 'var(--cor-muted)', margin: '0 0 4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Markup resultante
            </p>
            <p
              style={{
                fontSize: 24,
                fontWeight: 700,
                color: 'var(--cor-texto)',
                margin: 0,
                fontFamily: 'var(--font-display, inherit)',
              }}
            >
              {custoSimulador > 0 && margemSimulador < 100
                ? formatarPercentual(markupSimulador)
                : '—'}
            </p>
          </div>
        </div>

        {/* Fórmulas */}
        <div
          style={{
            marginTop: 16,
            padding: '12px 16px',
            background: 'var(--cor-argila)',
            borderRadius: 6,
            border: '1px solid var(--cor-argila-borda)',
          }}
        >
          <p
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--cor-muted)',
              margin: '0 0 6px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            Fórmulas
          </p>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            <p style={{ fontSize: 13, color: 'var(--cor-texto)', margin: 0, fontFamily: 'monospace' }}>
              Preço = Custo ÷ (1 − Margem)
            </p>
            <p style={{ fontSize: 13, color: 'var(--cor-texto)', margin: 0, fontFamily: 'monospace' }}>
              Markup = (Preço − Custo) ÷ Custo × 100
            </p>
          </div>
        </div>

        {/* Prévia da margem atual */}
        {custoSimulador > 0 && precoSugerido > 0 && (
          <div style={{ marginTop: 12 }}>
            <p style={{ fontSize: 13, color: 'var(--cor-muted)', margin: 0 }}>
              Margem real calculada:{' '}
              <strong style={{ color: 'var(--cor-texto)' }}>
                {formatarPercentual(calcularMargem(custoSimulador, precoSugerido))}
              </strong>
            </p>
          </div>
        )}
      </div>

      <ToastContainer toasts={toasts} aoRemover={removerToast} />
    </div>
  )
}
