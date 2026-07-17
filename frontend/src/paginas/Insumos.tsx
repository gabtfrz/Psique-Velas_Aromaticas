import { useState, useMemo, useCallback } from 'react'
import { useInsumos } from '@/hooks/useInsumos'
import { useToast } from '@/hooks/useToast'
import { TabelaDados } from '@/componentes/compartilhados/TabelaDados'
import { EstadoVazio } from '@/componentes/compartilhados/EstadoVazio'
import { ModalNovoInsumo } from '@/componentes/compartilhados/ModalNovoInsumo'
import { Campo } from '@/componentes/ui/Campo'
import { CampoSelecao } from '@/componentes/ui/CampoSelecao'
import { Botao } from '@/componentes/ui/Botao'
import { Icone } from '@/componentes/ui/Icone'
import { Modal } from '@/componentes/ui/Modal'
import { ToastContainer } from '@/componentes/ui/Toast'
import { formatarMoeda } from '@/utils/formatadores'
import { OPCOES_CATEGORIA_INSUMO } from '@/constantes'
import type { EntradaInsumo } from '@/utils/validadores'
import type { Insumo, OpcaoSelecao, CategoriaInsumo, UnidadeMedida } from '@/tipos'

// ─── Mensagem de erro de exclusão bloqueada por uso em receita ────────────────

const MENSAGEM_INSUMO_EM_USO =
  'Este insumo está em uso na receita de uma ou mais velas e não pode ser excluído.'

function ehErroDeInsumoEmUso(erro: unknown): boolean {
  const mensagem = erro instanceof Error ? erro.message : String(erro)
  return /foreign key|violates|restrict/i.test(mensagem)
}

// ─── Rótulos ─────────────────────────────────────────────────────────────────

const rotuloCategoria: Record<CategoriaInsumo, string> = {
  cera: 'Cera',
  fragrancia: 'Fragrância',
  pavio: 'Pavio',
  recipiente: 'Recipiente',
  corante: 'Corante',
  outro: 'Outro',
}

const rotuloUnidade: Record<UnidadeMedida, string> = {
  ml: 'ml',
  g: 'g',
  un: 'un',
  cm: 'cm',
  m: 'm',
}

// ─── Opções ──────────────────────────────────────────────────────────────────

const opcoesCategoriaFiltro: OpcaoSelecao[] = [
  { valor: '', rotulo: 'Todas as categorias' },
  ...OPCOES_CATEGORIA_INSUMO,
]

// ─── Linha da tabela ─────────────────────────────────────────────────────────

interface LinhaInsumo extends Record<string, unknown> {
  id: number
  nome: string
  categoria: string
  unidadeMedida: string
  precoUnitario: string
  fornecedor: string
  _insumo: Insumo
}

// ─── Componente principal ────────────────────────────────────────────────────

export default function Insumos() {
  const { insumosOrdenados, adicionarInsumo, editarInsumo, removerInsumo } = useInsumos()
  const { toasts, exibirToast, removerToast } = useToast()

  const [busca, setBusca] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [insumoEditando, setInsumoEditando] = useState<Insumo | undefined>(undefined)
  const [insumoExcluindo, setInsumoExcluindo] = useState<Insumo | undefined>(undefined)

  // Abrir modal para novo insumo
  const abrirModalNovo = useCallback(() => {
    setInsumoEditando(undefined)
    setModalAberto(true)
  }, [])

  // Fechar modal de cadastro/edição
  const fecharModal = useCallback(() => {
    setModalAberto(false)
    setInsumoEditando(undefined)
  }, [])

  // Abrir modal para editar
  const abrirModalEditar = useCallback((insumo: Insumo) => {
    setInsumoEditando(insumo)
    setModalAberto(true)
  }, [])

  // Abrir/fechar modal de confirmação de exclusão
  const abrirConfirmarExcluir = useCallback((insumo: Insumo) => {
    setInsumoExcluindo(insumo)
  }, [])

  const fecharConfirmarExcluir = useCallback(() => {
    setInsumoExcluindo(undefined)
  }, [])

  // Salvar insumo (novo ou edição)
  const handleSalvar = useCallback(
    async (dados: EntradaInsumo) => {
      try {
        if (insumoEditando) {
          await editarInsumo({ ...insumoEditando, ...dados })
          exibirToast('Insumo atualizado com sucesso!', 'sucesso')
        } else {
          await adicionarInsumo(dados)
          exibirToast('Novo insumo cadastrado!', 'sucesso')
        }
        fecharModal()
      } catch {
        exibirToast('Não foi possível salvar o insumo. Tente novamente.', 'erro')
      }
    },
    [insumoEditando, editarInsumo, adicionarInsumo, exibirToast, fecharModal]
  )

  // Excluir insumo
  const handleExcluir = useCallback(async () => {
    if (!insumoExcluindo) return
    try {
      await removerInsumo(insumoExcluindo.id)
      exibirToast('Insumo excluído com sucesso.', 'sucesso')
      fecharConfirmarExcluir()
    } catch (erro) {
      exibirToast(
        ehErroDeInsumoEmUso(erro) ? MENSAGEM_INSUMO_EM_USO : 'Não foi possível excluir o insumo.',
        'erro'
      )
    }
  }, [insumoExcluindo, removerInsumo, exibirToast, fecharConfirmarExcluir])

  // Lista filtrada com useMemo
  const insumosFiltrados = useMemo<LinhaInsumo[]>(() => {
    const termoBusca = busca.toLowerCase()
    return insumosOrdenados
      .filter((i) => {
        const correspondeNome = i.nome.toLowerCase().includes(termoBusca)
        const correspondeCategoria = filtroCategoria === '' || i.categoria === filtroCategoria
        return correspondeNome && correspondeCategoria
      })
      .map((i) => ({
        id: i.id,
        nome: i.nome,
        categoria: rotuloCategoria[i.categoria] ?? i.categoria,
        unidadeMedida: rotuloUnidade[i.unidadeMedida] ?? i.unidadeMedida,
        precoUnitario: formatarMoeda(i.precoUnitario),
        fornecedor: i.fornecedor ?? '—',
        _insumo: i,
      }))
  }, [insumosOrdenados, busca, filtroCategoria])

  // Colunas da tabela
  const colunas = useMemo(
    () => [
      { chave: 'nome', titulo: 'Nome', ordenavel: true },
      { chave: 'categoria', titulo: 'Categoria', ordenavel: true },
      { chave: 'unidadeMedida', titulo: 'Unidade' },
      { chave: 'precoUnitario', titulo: 'Preço unitário' },
      { chave: 'fornecedor', titulo: 'Fornecedor' },
      {
        chave: 'acoes',
        titulo: 'Ações',
        renderizar: (item: LinhaInsumo) => (
          <AcoesLinha
            insumo={item._insumo}
            onEditar={abrirModalEditar}
            onExcluir={abrirConfirmarExcluir}
          />
        ),
      },
    ],
    [abrirModalEditar, abrirConfirmarExcluir]
  )

  return (
    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Cabeçalho */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-display, inherit)',
              fontSize: 26,
              fontWeight: 700,
              color: 'var(--cor-texto)',
              margin: 0,
            }}
          >
            Insumos
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--cor-muted)' }}>
            {insumosOrdenados.length} insumo{insumosOrdenados.length !== 1 ? 's' : ''} cadastrado{insumosOrdenados.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Botao variante="primario" aoClicar={abrirModalNovo}>
          <Icone nome="mais" tamanho={16} />
          Novo insumo
        </Botao>
      </div>

      {/* Filtros + Tabela */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 220px', minWidth: 180 }}>
            <Campo
              rotulo="Buscar por nome"
              nome="busca"
              valor={busca}
              aoMudar={setBusca}
              placeholder="Cera de soja, pavio..."
            />
          </div>
          <div style={{ flex: '1 1 200px', minWidth: 160 }}>
            <CampoSelecao
              rotulo="Filtrar por categoria"
              nome="filtroCategoria"
              opcoes={opcoesCategoriaFiltro}
              valor={filtroCategoria}
              aoMudar={setFiltroCategoria}
            />
          </div>
        </div>

        {/* Tabela ou estado vazio */}
        {insumosFiltrados.length === 0 ? (
          <EstadoVazio
            titulo="Nenhum insumo encontrado"
            subtitulo={
              busca || filtroCategoria
                ? 'Tente ajustar os filtros de busca.'
                : 'Cadastre seu primeiro insumo para começar.'
            }
            textoBotao={busca || filtroCategoria ? undefined : 'Cadastrar insumo'}
            aoClicarBotao={busca || filtroCategoria ? undefined : abrirModalNovo}
          />
        ) : (
          <div
            style={{
              background: 'var(--cor-argila-card)',
              border: '1px solid var(--cor-argila-borda)',
              borderRadius: 8,
              overflow: 'hidden',
            }}
          >
            <TabelaDados<LinhaInsumo>
              colunas={colunas}
              dados={insumosFiltrados}
              chaveUnica="id"
              itensPorPagina={10}
              mensagemVazia="Nenhum insumo corresponde à busca."
            />
          </div>
        )}

      </div>

      {/* Modal de cadastro/edição */}
      <ModalNovoInsumo
        aberto={modalAberto}
        aoFechar={fecharModal}
        aoSalvar={handleSalvar}
        insumoParaEditar={insumoEditando}
      />

      {/* Modal de confirmação de exclusão */}
      {insumoExcluindo && (
        <Modal
          aberto={!!insumoExcluindo}
          aoFechar={fecharConfirmarExcluir}
          titulo="Excluir insumo"
          largura="sm"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ margin: 0, fontSize: 14, color: 'var(--cor-texto)' }}>
              Tem certeza que deseja excluir <strong>{insumoExcluindo.nome}</strong>? Esta ação não pode ser desfeita.
            </p>
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 8,
                paddingTop: 8,
                borderTop: '1px solid var(--cor-argila-borda)',
              }}
            >
              <Botao variante="secundario" aoClicar={fecharConfirmarExcluir} tipo="button">
                Cancelar
              </Botao>
              <Botao variante="primario" aoClicar={handleExcluir} tipo="button">
                Excluir
              </Botao>
            </div>
          </div>
        </Modal>
      )}

      {/* Toasts */}
      <ToastContainer toasts={toasts} aoRemover={removerToast} />
    </div>
  )
}

// ─── Sub-componente de ações (externo para evitar inline em JSX) ──────────────

interface PropsAcoesLinha {
  insumo: Insumo
  onEditar: (insumo: Insumo) => void
  onExcluir: (insumo: Insumo) => void
}

function AcoesLinha({ insumo, onEditar, onExcluir }: PropsAcoesLinha) {
  const handleEditar = useCallback(() => onEditar(insumo), [onEditar, insumo])
  const handleExcluir = useCallback(() => onExcluir(insumo), [onExcluir, insumo])

  return (
    <div style={{ display: 'flex', gap: 4 }}>
      <button
        type="button"
        onClick={handleEditar}
        title="Editar"
        aria-label={`Editar ${insumo.nome}`}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 4,
          borderRadius: 4,
          color: 'var(--cor-muted)',
          display: 'inline-flex',
          alignItems: 'center',
        }}
      >
        <Icone nome="editar" tamanho={16} />
      </button>
      <button
        type="button"
        onClick={handleExcluir}
        title="Excluir"
        aria-label={`Excluir ${insumo.nome}`}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 4,
          borderRadius: 4,
          color: 'var(--cor-perigo)',
          display: 'inline-flex',
          alignItems: 'center',
        }}
      >
        <Icone nome="excluir" tamanho={16} />
      </button>
    </div>
  )
}
