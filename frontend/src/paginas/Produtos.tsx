import { useState, useMemo, useCallback } from 'react'
import { useProdutos } from '@/hooks/useProdutos'
import { useToast } from '@/hooks/useToast'
import { TabelaDados } from '@/componentes/compartilhados/TabelaDados'
import { EstadoVazio } from '@/componentes/compartilhados/EstadoVazio'
import { ModalNovoProduto } from '@/componentes/compartilhados/ModalNovoProduto'
import { Campo } from '@/componentes/ui/Campo'
import { CampoSelecao } from '@/componentes/ui/CampoSelecao'
import { Botao } from '@/componentes/ui/Botao'
import { Emblema } from '@/componentes/ui/Emblema'
import { Icone } from '@/componentes/ui/Icone'
import { formatarMoeda, formatarGramagem } from '@/utils/formatadores'
import { classificarMargem } from '@/utils/calculadores'
import type { EntradaProduto } from '@/utils/validadores'
import type { Produto, OpcaoSelecao, CategoriaProduto } from '@/tipos'

// ─── Linha da tabela ─────────────────────────────────────────────────────────

interface LinhaProduto extends Record<string, unknown> {
  id: number
  nome: string
  aroma: string
  gramagem: string
  custo: string
  preco: string
  margem: number
  estoque: number
  ativo: boolean
  _produto: Produto
}

// ─── Opções ──────────────────────────────────────────────────────────────────

const opcoesCategoria: OpcaoSelecao[] = [
  { valor: '', rotulo: 'Todas as categorias' },
  { valor: 'para-rituais', rotulo: 'Para rituais' },
  { valor: 'para-presentes', rotulo: 'Para presentes' },
  { valor: 'colecao-especial', rotulo: 'Coleção especial' },
  { valor: 'uso-diario', rotulo: 'Uso diário' },
]

// ─── Toast flutuante ─────────────────────────────────────────────────────────

interface ToastFlutuanteProps {
  mensagem: string
  tipo: 'sucesso' | 'erro' | 'aviso'
}

function ToastFlutuante({ mensagem, tipo }: ToastFlutuanteProps) {
  const cores: Record<string, string> = {
    sucesso: 'var(--cor-musgo)',
    erro: 'var(--cor-perigo)',
    aviso: '#6B4C00',
  }
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        background: 'var(--cor-argila-card)',
        border: `1px solid ${cores[tipo]}`,
        borderLeft: `4px solid ${cores[tipo]}`,
        borderRadius: 8,
        padding: '12px 18px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        zIndex: 9998,
        fontSize: 14,
        color: 'var(--cor-texto)',
        maxWidth: 320,
      }}
    >
      {mensagem}
    </div>
  )
}

// ─── Componente principal ────────────────────────────────────────────────────

export default function Produtos() {
  const { produtos, adicionarProduto, editarProduto, duplicarProduto, desativarProduto } =
    useProdutos()
  const { toasts, exibirToast } = useToast()

  const [busca, setBusca] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [produtoEditando, setProdutoEditando] = useState<Produto | undefined>(undefined)

  // Abrir modal para novo produto
  const abrirModalNovo = useCallback(() => {
    setProdutoEditando(undefined)
    setModalAberto(true)
  }, [])

  // Fechar modal
  const fecharModal = useCallback(() => {
    setModalAberto(false)
    setProdutoEditando(undefined)
  }, [])

  // Abrir modal para editar
  const abrirModalEditar = useCallback((produto: Produto) => {
    setProdutoEditando(produto)
    setModalAberto(true)
  }, [])

  // Duplicar produto
  const handleDuplicar = useCallback(
    async (id: number) => {
      try {
        await duplicarProduto(id)
        exibirToast('Vela duplicada com sucesso!', 'sucesso')
      } catch {
        exibirToast('Não foi possível duplicar a vela.', 'erro')
      }
    },
    [duplicarProduto, exibirToast]
  )

  // Desativar / ativar produto
  const handleDesativar = useCallback(
    async (produto: Produto) => {
      try {
        await desativarProduto(produto.id)
        exibirToast(
          produto.ativo ? 'Vela desativada.' : 'Vela reativada!',
          'aviso'
        )
      } catch {
        exibirToast('Não foi possível alterar o status da vela.', 'erro')
      }
    },
    [desativarProduto, exibirToast]
  )

  // Salvar produto (novo ou edição) — só fecha o modal e sinaliza sucesso após
  // a persistência na Supabase resolver; em falha (rede/RLS), avisa e mantém o modal.
  const handleSalvar = useCallback(
    async (dados: EntradaProduto) => {
      try {
        if (produtoEditando) {
          await editarProduto({
            ...produtoEditando,
            ...dados,
          })
          exibirToast('Vela atualizada com sucesso!', 'sucesso')
        } else {
          await adicionarProduto({
            ...dados,
            ativo: true,
          })
          exibirToast('Nova vela cadastrada!', 'sucesso')
        }
        fecharModal()
      } catch {
        exibirToast('Não foi possível salvar a vela. Tente novamente.', 'erro')
      }
    },
    [produtoEditando, editarProduto, adicionarProduto, exibirToast, fecharModal]
  )

  // Lista filtrada com useMemo
  const produtosFiltrados = useMemo<LinhaProduto[]>(() => {
    const termoBusca = busca.toLowerCase()
    return produtos
      .filter((p) => {
        const correspondeNome = p.nome.toLowerCase().includes(termoBusca)
        const correspondeCategoria =
          filtroCategoria === '' || p.categoria === (filtroCategoria as CategoriaProduto)
        return correspondeNome && correspondeCategoria
      })
      .map((p) => ({
        id: p.id,
        nome: p.nome,
        aroma: `${p.notasAromaticas.topo} / ${p.notasAromaticas.coracao} / ${p.notasAromaticas.fundo}`,
        gramagem: formatarGramagem(p.gramagem),
        custo: formatarMoeda(p.custoProducao),
        preco: formatarMoeda(p.precoVenda),
        margem: p.margem,
        estoque: p.estoqueAtual,
        ativo: p.ativo,
        _produto: p,
      }))
  }, [produtos, busca, filtroCategoria])

  // Colunas da tabela
  const colunas = useMemo(
    () => [
      { chave: 'nome', titulo: 'Nome', ordenavel: true },
      { chave: 'aroma', titulo: 'Aroma (notas)' },
      { chave: 'gramagem', titulo: 'Gramagem', ordenavel: true },
      { chave: 'custo', titulo: 'Custo' },
      { chave: 'preco', titulo: 'Preço' },
      {
        chave: 'margem',
        titulo: 'Margem',
        ordenavel: true,
        renderizar: (item: LinhaProduto) => (
          <Emblema tipo={classificarMargem(item.margem)} tamanho="sm" />
        ),
      },
      {
        chave: 'estoque',
        titulo: 'Estoque',
        ordenavel: true,
        renderizar: (item: LinhaProduto) => {
          const baixo = item.estoque <= item._produto.estoqueMinimo
          return (
            <span
              style={{
                fontWeight: baixo ? 600 : 400,
                color: baixo ? 'var(--cor-perigo)' : 'var(--cor-texto)',
              }}
            >
              {item.estoque}
            </span>
          )
        },
      },
      {
        chave: 'ativo',
        titulo: 'Status',
        renderizar: (item: LinhaProduto) => (
          <Emblema tipo={item.ativo ? 'ativo' : 'inativo'} tamanho="sm" />
        ),
      },
      {
        chave: 'acoes',
        titulo: 'Ações',
        renderizar: (item: LinhaProduto) => (
          <AcoesLinha
            produto={item._produto}
            onEditar={abrirModalEditar}
            onDuplicar={handleDuplicar}
            onDesativar={handleDesativar}
          />
        ),
      },
    ],
    [abrirModalEditar, handleDuplicar, handleDesativar]
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
            Produtos
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--cor-muted)' }}>
            {produtos.length} vela{produtos.length !== 1 ? 's' : ''} cadastrada{produtos.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Botao variante="primario" aoClicar={abrirModalNovo}>
          <Icone nome="mais" tamanho={16} />
          Nova vela
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
              placeholder="Recomeços, Silêncio..."
            />
          </div>
          <div style={{ flex: '1 1 200px', minWidth: 160 }}>
            <CampoSelecao
              rotulo="Filtrar por categoria"
              nome="filtroCategoria"
              opcoes={opcoesCategoria}
              valor={filtroCategoria}
              aoMudar={setFiltroCategoria}
            />
          </div>
        </div>

        {/* Tabela ou estado vazio */}
        {produtosFiltrados.length === 0 ? (
          <EstadoVazio
            titulo="Nenhuma vela encontrada"
            subtitulo={
              busca || filtroCategoria
                ? 'Tente ajustar os filtros de busca.'
                : 'Cadastre sua primeira vela para começar.'
            }
            textoBotao={busca || filtroCategoria ? undefined : 'Cadastrar vela'}
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
            <TabelaDados<LinhaProduto>
              colunas={colunas}
              dados={produtosFiltrados}
              chaveUnica="id"
              itensPorPagina={10}
              mensagemVazia="Nenhum produto corresponde à busca."
            />
          </div>
        )}

      </div>

      {/* Modal de cadastro/edição */}
      <ModalNovoProduto
        aberto={modalAberto}
        aoFechar={fecharModal}
        aoSalvar={handleSalvar}
        produtoParaEditar={produtoEditando}
      />

      {/* Toasts */}
      {toasts.map((t) => (
        <ToastFlutuante key={t.id} mensagem={t.mensagem} tipo={t.tipo} />
      ))}
    </div>
  )
}

// ─── Sub-componente de ações (externo para evitar inline em JSX) ──────────────

interface PropsAcoesLinha {
  produto: Produto
  onEditar: (produto: Produto) => void
  onDuplicar: (id: number) => void
  onDesativar: (produto: Produto) => void
}

function AcoesLinha({ produto, onEditar, onDuplicar, onDesativar }: PropsAcoesLinha) {
  const handleEditar = useCallback(() => onEditar(produto), [onEditar, produto])
  const handleDuplicar = useCallback(() => onDuplicar(produto.id), [onDuplicar, produto.id])
  const handleDesativar = useCallback(() => onDesativar(produto), [onDesativar, produto])

  return (
    <div style={{ display: 'flex', gap: 4 }}>
      <button
        type="button"
        onClick={handleEditar}
        title="Editar"
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
        onClick={handleDuplicar}
        title="Duplicar"
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
        <Icone nome="duplicar" tamanho={16} />
      </button>
      <button
        type="button"
        onClick={handleDesativar}
        title={produto.ativo ? 'Desativar' : 'Ativar'}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 4,
          borderRadius: 4,
          color: produto.ativo ? 'var(--cor-perigo)' : 'var(--cor-musgo)',
          display: 'inline-flex',
          alignItems: 'center',
        }}
      >
        <Icone nome={produto.ativo ? 'excluir' : 'check'} tamanho={16} />
      </button>
    </div>
  )
}
