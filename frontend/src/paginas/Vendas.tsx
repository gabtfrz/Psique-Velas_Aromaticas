import { useState, useMemo, useCallback } from 'react'
import { useProdutos } from '@/hooks/useProdutos'
import { useVendas } from '@/hooks/useVendas'
import { useClientes } from '@/hooks/useClientes'
import { useToast } from '@/hooks/useToast'
import { TabelaDados } from '@/componentes/compartilhados/TabelaDados'
import { Campo } from '@/componentes/ui/Campo'
import { CampoSelecao } from '@/componentes/ui/CampoSelecao'
import { CampoMonetario } from '@/componentes/ui/CampoMonetario'
import { CampoTexto } from '@/componentes/ui/CampoTexto'
import { Alternador } from '@/componentes/ui/Alternador'
import { SeletorIntervalo } from '@/componentes/ui/SeletorIntervalo'
import { Botao } from '@/componentes/ui/Botao'
import { Emblema } from '@/componentes/ui/Emblema'
import { Modal } from '@/componentes/ui/Modal'
import { Icone } from '@/componentes/ui/Icone'
import { formatarMoeda, formatarData, formatarDataHora } from '@/utils/formatadores'
import { calcularTotalVenda } from '@/utils/calculadores'
import type {
  ItemVenda,
  Venda,
  CanalVenda,
  FormaPagamento,
  TipoEntrega,
  StatusEntrega,
  StatusPagamento,
  OpcaoSelecao,
  Produto,
} from '@/tipos'

// ─── Opções de seleção ───────────────────────────────────────────────────────

const opcoesCanal: OpcaoSelecao[] = [
  { valor: 'instagram', rotulo: 'Instagram' },
  { valor: 'whatsapp', rotulo: 'WhatsApp' },
  { valor: 'site', rotulo: 'Site' },
  { valor: 'presencial', rotulo: 'Presencial' },
  { valor: 'marketplace', rotulo: 'Marketplace' },
]

const opcoesPagamento: OpcaoSelecao[] = [
  { valor: 'pix', rotulo: 'Pix' },
  { valor: 'cartao-credito', rotulo: 'Cartão de crédito' },
  { valor: 'cartao-debito', rotulo: 'Cartão de débito' },
  { valor: 'dinheiro', rotulo: 'Dinheiro' },
  { valor: 'boleto', rotulo: 'Boleto' },
]

const opcoesEntrega: OpcaoSelecao[] = [
  { valor: 'retirada', rotulo: 'Retirada' },
  { valor: 'correios', rotulo: 'Correios' },
  { valor: 'motoboy', rotulo: 'Motoboy' },
]

const opcoesStatusEntrega: OpcaoSelecao[] = [
  { valor: 'aguardando', rotulo: 'Aguardando' },
  { valor: 'em-producao', rotulo: 'Em produção' },
  { valor: 'enviado', rotulo: 'Enviado' },
  { valor: 'entregue', rotulo: 'Entregue' },
]

const opcoesStatusPagamento: OpcaoSelecao[] = [
  { valor: '', rotulo: 'Todos' },
  { valor: 'pago', rotulo: 'Pago' },
  { valor: 'pendente', rotulo: 'Pendente' },
]

const ROTULOS_CANAL: Record<CanalVenda, string> = {
  instagram: 'Instagram',
  whatsapp: 'WhatsApp',
  site: 'Site',
  presencial: 'Presencial',
  marketplace: 'Marketplace',
}

const ROTULOS_PAGAMENTO: Record<FormaPagamento, string> = {
  pix: 'Pix',
  'cartao-credito': 'Cartão de crédito',
  'cartao-debito': 'Cartão de débito',
  dinheiro: 'Dinheiro',
  boleto: 'Boleto',
}

const ROTULOS_ENTREGA: Record<TipoEntrega, string> = {
  retirada: 'Retirada',
  correios: 'Correios',
  motoboy: 'Motoboy',
}

// ─── Linha da tabela de histórico ────────────────────────────────────────────

interface LinhaHistorico extends Record<string, unknown> {
  id: string
  data: string
  numeroPedido: string
  cliente: string
  quantidadeItens: number
  canal: string
  statusPagamento: StatusPagamento
  statusEntrega: StatusEntrega
  total: string
  _venda: Venda
}

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

// ─── Item do carrinho ─────────────────────────────────────────────────────────

interface PropsItemCarrinho {
  item: ItemVenda
  onAumentarQtd: (produtoId: string) => void
  onDiminuirQtd: (produtoId: string) => void
  onRemover: (produtoId: string) => void
}

function ItemCarrinho({ item, onAumentarQtd, onDiminuirQtd, onRemover }: PropsItemCarrinho) {
  const handleAumentar = useCallback(
    () => onAumentarQtd(item.produtoId),
    [onAumentarQtd, item.produtoId]
  )
  const handleDiminuir = useCallback(
    () => onDiminuirQtd(item.produtoId),
    [onDiminuirQtd, item.produtoId]
  )
  const handleRemover = useCallback(
    () => onRemover(item.produtoId),
    [onRemover, item.produtoId]
  )

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 0',
        borderBottom: '1px solid var(--cor-argila-borda)',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--cor-texto)' }}>
          {item.nomeProduto}
        </p>
        <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--cor-muted)' }}>
          {formatarMoeda(item.precoUnitario)} un.
        </p>
      </div>

      {/* Controles de quantidade */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button
          type="button"
          onClick={handleDiminuir}
          disabled={item.quantidade <= 1}
          style={{
            width: 24,
            height: 24,
            borderRadius: 4,
            border: '1px solid var(--cor-argila-borda)',
            background: 'var(--cor-argila)',
            cursor: item.quantidade <= 1 ? 'not-allowed' : 'pointer',
            opacity: item.quantidade <= 1 ? 0.4 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            color: 'var(--cor-texto)',
            lineHeight: 1,
          }}
        >
          −
        </button>
        <span style={{ fontSize: 13, fontWeight: 600, minWidth: 20, textAlign: 'center', color: 'var(--cor-texto)' }}>
          {item.quantidade}
        </span>
        <button
          type="button"
          onClick={handleAumentar}
          style={{
            width: 24,
            height: 24,
            borderRadius: 4,
            border: '1px solid var(--cor-argila-borda)',
            background: 'var(--cor-argila)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            color: 'var(--cor-texto)',
            lineHeight: 1,
          }}
        >
          +
        </button>
      </div>

      {/* Subtotal */}
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--cor-texto)', minWidth: 72, textAlign: 'right' }}>
        {formatarMoeda(item.subtotal)}
      </span>

      {/* Remover */}
      <button
        type="button"
        onClick={handleRemover}
        title="Remover"
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 4,
          color: 'var(--cor-perigo)',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Icone nome="fechar" tamanho={14} />
      </button>
    </div>
  )
}

// ─── ResultadoBusca ───────────────────────────────────────────────────────────

interface PropsResultadoBusca {
  produto: Produto
  onAdicionarAoCarrinho: (produto: Produto) => void
}

function ResultadoBusca({ produto, onAdicionarAoCarrinho }: PropsResultadoBusca) {
  const handleAdicionar = useCallback(
    () => onAdicionarAoCarrinho(produto),
    [onAdicionarAoCarrinho, produto]
  )

  return (
    <button
      type="button"
      onClick={handleAdicionar}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 12px',
        background: 'none',
        border: 'none',
        borderBottom: '1px solid var(--cor-argila-borda)',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background 0.1s ease',
      }}
      onMouseEnter={(e) => {
        ;(e.currentTarget as HTMLButtonElement).style.background = 'var(--cor-argila)'
      }}
      onMouseLeave={(e) => {
        ;(e.currentTarget as HTMLButtonElement).style.background = 'none'
      }}
    >
      <div>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--cor-texto)' }}>
          {produto.nome}
        </p>
        <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--cor-muted)' }}>
          {produto.gramagem}g · Estoque: {produto.estoqueAtual}
        </p>
      </div>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--cor-musgo)', marginLeft: 8 }}>
        {formatarMoeda(produto.precoVenda)}
      </span>
    </button>
  )
}

// ─── Modal de detalhes da venda ───────────────────────────────────────────────

interface PropsModalDetalhes {
  aberto: boolean
  aoFechar: () => void
  venda: Venda | null
  nomeCliente: string
}

function ModalDetalhesVenda({ aberto, aoFechar, venda, nomeCliente }: PropsModalDetalhes) {
  if (!venda) return null
  return (
    <Modal aberto={aberto} aoFechar={aoFechar} titulo={`Pedido ${venda.numeroPedido}`} largura="md">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: 14, color: 'var(--cor-texto)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--cor-muted)' }}>Data</p>
            <p style={{ margin: '2px 0 0', fontWeight: 500 }}>{formatarDataHora(venda.criadoEm)}</p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--cor-muted)' }}>Cliente</p>
            <p style={{ margin: '2px 0 0', fontWeight: 500 }}>{nomeCliente}</p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--cor-muted)' }}>Canal</p>
            <p style={{ margin: '2px 0 0', fontWeight: 500 }}>{ROTULOS_CANAL[venda.canalVenda]}</p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--cor-muted)' }}>Pagamento</p>
            <p style={{ margin: '2px 0 0', fontWeight: 500 }}>{ROTULOS_PAGAMENTO[venda.formaPagamento]}</p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--cor-muted)' }}>Entrega</p>
            <p style={{ margin: '2px 0 0', fontWeight: 500 }}>{ROTULOS_ENTREGA[venda.tipoEntrega]}</p>
          </div>
        </div>

        <div>
          <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--cor-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Itens
          </p>
          {venda.itens.map((item, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '6px 0',
                borderBottom: '1px solid var(--cor-argila-borda)',
              }}
            >
              <span>{item.nomeProduto} × {item.quantidade}</span>
              <span style={{ fontWeight: 600 }}>{formatarMoeda(item.subtotal)}</span>
            </div>
          ))}
          {venda.desconto > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', color: 'var(--cor-muted)' }}>
              <span>Desconto</span>
              <span>− {formatarMoeda(venda.desconto)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontWeight: 700, fontSize: 15 }}>
            <span>Total</span>
            <span style={{ color: 'var(--cor-musgo)' }}>{formatarMoeda(venda.total)}</span>
          </div>
        </div>

        {venda.observacoes && (
          <div>
            <p style={{ margin: '0 0 4px', fontSize: 12, color: 'var(--cor-muted)' }}>Observações</p>
            <p style={{ margin: 0 }}>{venda.observacoes}</p>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <Emblema tipo={venda.statusPagamento} tamanho="md" />
          <Emblema tipo={venda.statusEntrega} tamanho="md" />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid var(--cor-argila-borda)' }}>
          <Botao variante="secundario" aoClicar={aoFechar}>Fechar</Botao>
        </div>
      </div>
    </Modal>
  )
}

// ─── Modal de edição de status ────────────────────────────────────────────────

interface PropsModalStatus {
  aberto: boolean
  aoFechar: () => void
  venda: Venda | null
  onSalvar: (id: string, statusPagamento: StatusPagamento, statusEntrega: StatusEntrega) => void
}

function ModalEditarStatus({ aberto, aoFechar, venda, onSalvar }: PropsModalStatus) {
  const [statusPag, setStatusPag] = useState<StatusPagamento>('pendente')
  const [statusEnt, setStatusEnt] = useState<StatusEntrega>('aguardando')

  // Sincronizar ao abrir
  const [inicializado, setInicializado] = useState(false)
  if (aberto && venda && !inicializado) {
    setStatusPag(venda.statusPagamento)
    setStatusEnt(venda.statusEntrega)
    setInicializado(true)
  }
  if (!aberto && inicializado) {
    setInicializado(false)
  }

  const handleSalvar = useCallback(() => {
    if (!venda) return
    onSalvar(venda.id, statusPag, statusEnt)
    aoFechar()
  }, [venda, onSalvar, statusPag, statusEnt, aoFechar])

  const handleStatusPag = useCallback((v: string) => setStatusPag(v as StatusPagamento), [])
  const handleStatusEnt = useCallback((v: string) => setStatusEnt(v as StatusEntrega), [])

  if (!venda) return null
  return (
    <Modal aberto={aberto} aoFechar={aoFechar} titulo="Editar status" largura="sm">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <CampoSelecao
          rotulo="Status de pagamento"
          nome="statusPagamento"
          opcoes={[
            { valor: 'pago', rotulo: 'Pago' },
            { valor: 'pendente', rotulo: 'Pendente' },
          ]}
          valor={statusPag}
          aoMudar={handleStatusPag}
        />
        <CampoSelecao
          rotulo="Status de entrega"
          nome="statusEntrega"
          opcoes={opcoesStatusEntrega}
          valor={statusEnt}
          aoMudar={handleStatusEnt}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 8, borderTop: '1px solid var(--cor-argila-borda)' }}>
          <Botao variante="secundario" aoClicar={aoFechar}>Cancelar</Botao>
          <Botao variante="primario" aoClicar={handleSalvar}>Salvar</Botao>
        </div>
      </div>
    </Modal>
  )
}

// ─── Ações do histórico ───────────────────────────────────────────────────────

interface PropsAcoesHistorico {
  venda: Venda
  onVerDetalhes: (venda: Venda) => void
  onEditarStatus: (venda: Venda) => void
}

function AcoesHistorico({ venda, onVerDetalhes, onEditarStatus }: PropsAcoesHistorico) {
  const handleDetalhes = useCallback(() => onVerDetalhes(venda), [onVerDetalhes, venda])
  const handleEditar = useCallback(() => onEditarStatus(venda), [onEditarStatus, venda])

  return (
    <div style={{ display: 'flex', gap: 4 }}>
      <button
        type="button"
        onClick={handleDetalhes}
        title="Ver detalhes"
        style={{
          background: 'none',
          border: '1px solid var(--cor-argila-borda)',
          borderRadius: 4,
          cursor: 'pointer',
          padding: '3px 8px',
          fontSize: 12,
          color: 'var(--cor-texto)',
          fontFamily: 'inherit',
        }}
      >
        Detalhes
      </button>
      <button
        type="button"
        onClick={handleEditar}
        title="Editar status"
        style={{
          background: 'none',
          border: '1px solid var(--cor-argila-borda)',
          borderRadius: 4,
          cursor: 'pointer',
          padding: '3px 8px',
          fontSize: 12,
          color: 'var(--cor-texto)',
          fontFamily: 'inherit',
        }}
      >
        Status
      </button>
    </div>
  )
}

// ─── Componente principal ────────────────────────────────────────────────────

type AbaVenda = 'nova-venda' | 'historico'

export default function Vendas() {
  const { produtosAtivos } = useProdutos()
  const { vendas, registrarVenda, atualizarStatusVenda } = useVendas()
  const { clientes, buscarClientePorId } = useClientes()
  const { toasts, exibirToast } = useToast()

  // Aba ativa
  const [abaAtiva, setAbaAtiva] = useState<AbaVenda>('nova-venda')

  // ── Estado da Nova Venda ──
  const [buscaProduto, setBuscaProduto] = useState('')
  const [carrinho, setCarrinho] = useState<ItemVenda[]>([])
  const [desconto, setDesconto] = useState(0)
  const [clienteId, setClienteId] = useState('')
  const [canalVenda, setCanalVenda] = useState<CanalVenda>('instagram')
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('pix')
  const [pagoPago, setPagoPago] = useState(false)
  const [tipoEntrega, setTipoEntrega] = useState<TipoEntrega>('correios')
  const [statusEntregaVenda, setStatusEntregaVenda] = useState<StatusEntrega>('aguardando')
  const [observacoes, setObservacoes] = useState('')

  // ── Estado do Histórico ──
  const [filtroDataInicio, setFiltroDataInicio] = useState('')
  const [filtroDataFim, setFiltroDataFim] = useState('')
  const [filtroCanal, setFiltroCanal] = useState('')
  const [filtroStatusPag, setFiltroStatusPag] = useState('')

  // ── Modais do Histórico ──
  const [vendaDetalhes, setVendaDetalhes] = useState<Venda | null>(null)
  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false)
  const [vendaEditandoStatus, setVendaEditandoStatus] = useState<Venda | null>(null)
  const [modalStatusAberto, setModalStatusAberto] = useState(false)

  // ── Filtro produtos ──
  const produtosFiltrados = useMemo(() => {
    const termo = buscaProduto.toLowerCase()
    if (!termo) return []
    return produtosAtivos.filter((p) => p.nome.toLowerCase().includes(termo))
  }, [produtosAtivos, buscaProduto])

  // ── Total do carrinho ──
  const totalVenda = useMemo(
    () => calcularTotalVenda(carrinho, desconto),
    [carrinho, desconto]
  )

  // ── Opções de clientes ──
  const opcoesClientes = useMemo<OpcaoSelecao[]>(
    () => [
      { valor: '', rotulo: 'Venda avulsa' },
      ...clientes.map((c) => ({ valor: c.id, rotulo: c.nomeCompleto })),
    ],
    [clientes]
  )

  // ── Opções de canal para filtro (com "todos") ──
  const opcoesCanaisComTodos = useMemo<OpcaoSelecao[]>(
    () => [{ valor: '', rotulo: 'Todos os canais' }, ...opcoesCanal],
    []
  )

  // ── Linhas do histórico filtradas ──
  const linhasHistorico = useMemo<LinhaHistorico[]>(() => {
    return vendas
      .filter((v) => {
        const data = new Date(v.criadoEm)
        if (filtroDataInicio) {
          const inicio = new Date(filtroDataInicio)
          inicio.setHours(0, 0, 0, 0)
          if (data < inicio) return false
        }
        if (filtroDataFim) {
          const fim = new Date(filtroDataFim)
          fim.setHours(23, 59, 59, 999)
          if (data > fim) return false
        }
        if (filtroCanal && v.canalVenda !== filtroCanal) return false
        if (filtroStatusPag && v.statusPagamento !== filtroStatusPag) return false
        return true
      })
      .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime())
      .map((v) => {
        const cliente = v.clienteId ? buscarClientePorId(v.clienteId) : undefined
        const quantidadeItens = v.itens.reduce((acc, i) => acc + i.quantidade, 0)
        return {
          id: v.id,
          data: formatarData(v.criadoEm),
          numeroPedido: v.numeroPedido,
          cliente: cliente ? cliente.nomeCompleto : 'Venda avulsa',
          quantidadeItens,
          canal: ROTULOS_CANAL[v.canalVenda],
          statusPagamento: v.statusPagamento,
          statusEntrega: v.statusEntrega,
          total: formatarMoeda(v.total),
          _venda: v,
        }
      })
  }, [vendas, filtroDataInicio, filtroDataFim, filtroCanal, filtroStatusPag, buscarClientePorId])

  // ── Handlers da Nova Venda ──

  const handleAdicionarAoCarrinho = useCallback((produto: Produto) => {
    setCarrinho((anterior) => {
      const existente = anterior.find((i) => i.produtoId === produto.id)
      if (existente) {
        return anterior.map((i) =>
          i.produtoId === produto.id
            ? {
                ...i,
                quantidade: i.quantidade + 1,
                subtotal: (i.quantidade + 1) * i.precoUnitario,
              }
            : i
        )
      }
      return [
        ...anterior,
        {
          produtoId: produto.id,
          nomeProduto: produto.nome,
          quantidade: 1,
          precoUnitario: produto.precoVenda,
          subtotal: produto.precoVenda,
        },
      ]
    })
    setBuscaProduto('')
  }, [])

  const handleAumentarQtd = useCallback((produtoId: string) => {
    setCarrinho((anterior) =>
      anterior.map((i) =>
        i.produtoId === produtoId
          ? { ...i, quantidade: i.quantidade + 1, subtotal: (i.quantidade + 1) * i.precoUnitario }
          : i
      )
    )
  }, [])

  const handleDiminuirQtd = useCallback((produtoId: string) => {
    setCarrinho((anterior) =>
      anterior.map((i) =>
        i.produtoId === produtoId && i.quantidade > 1
          ? { ...i, quantidade: i.quantidade - 1, subtotal: (i.quantidade - 1) * i.precoUnitario }
          : i
      )
    )
  }, [])

  const handleRemoverDoCarrinho = useCallback((produtoId: string) => {
    setCarrinho((anterior) => anterior.filter((i) => i.produtoId !== produtoId))
  }, [])

  const handleAlternarPago = useCallback((v: boolean) => setPagoPago(v), [])
  const handleSetClienteId = useCallback((v: string) => setClienteId(v), [])
  const handleSetCanalVenda = useCallback((v: string) => setCanalVenda(v as CanalVenda), [])
  const handleSetFormaPagamento = useCallback(
    (v: string) => setFormaPagamento(v as FormaPagamento),
    []
  )
  const handleSetTipoEntrega = useCallback((v: string) => setTipoEntrega(v as TipoEntrega), [])
  const handleSetStatusEntrega = useCallback(
    (v: string) => setStatusEntregaVenda(v as StatusEntrega),
    []
  )
  const handleSetObservacoes = useCallback((v: string) => setObservacoes(v), [])
  const handleSetDesconto = useCallback((v: number) => setDesconto(v), [])
  const handleSetBuscaProduto = useCallback((v: string) => setBuscaProduto(v), [])

  const handleRegistrarVenda = useCallback(() => {
    if (carrinho.length === 0) {
      exibirToast('Adicione pelo menos um produto ao carrinho.', 'erro')
      return
    }
    registrarVenda({
      clienteId: clienteId || undefined,
      itens: carrinho,
      desconto,
      canalVenda,
      formaPagamento,
      statusPagamento: pagoPago ? 'pago' : 'pendente',
      tipoEntrega,
      statusEntrega: statusEntregaVenda,
      observacoes: observacoes || undefined,
    })
    // Limpar carrinho e formulário
    setCarrinho([])
    setDesconto(0)
    setClienteId('')
    setCanalVenda('instagram')
    setFormaPagamento('pix')
    setPagoPago(false)
    setTipoEntrega('correios')
    setStatusEntregaVenda('aguardando')
    setObservacoes('')
    setBuscaProduto('')
    exibirToast('Venda registrada com sucesso!', 'sucesso')
    setAbaAtiva('historico')
  }, [
    carrinho,
    desconto,
    clienteId,
    canalVenda,
    formaPagamento,
    pagoPago,
    tipoEntrega,
    statusEntregaVenda,
    observacoes,
    registrarVenda,
    exibirToast,
  ])

  // ── Handlers do Histórico ──

  const handleFiltroIntervalo = useCallback((inicio: string, fim: string) => {
    setFiltroDataInicio(inicio)
    setFiltroDataFim(fim)
  }, [])

  const handleFiltroCanal = useCallback((v: string) => setFiltroCanal(v), [])
  const handleFiltroStatusPag = useCallback((v: string) => setFiltroStatusPag(v), [])

  const handleVerDetalhes = useCallback((venda: Venda) => {
    setVendaDetalhes(venda)
    setModalDetalhesAberto(true)
  }, [])

  const handleEditarStatus = useCallback((venda: Venda) => {
    setVendaEditandoStatus(venda)
    setModalStatusAberto(true)
  }, [])

  const handleFecharDetalhes = useCallback(() => {
    setModalDetalhesAberto(false)
  }, [])

  const handleFecharStatus = useCallback(() => {
    setModalStatusAberto(false)
  }, [])

  const handleSalvarStatus = useCallback(
    (id: string, sp: StatusPagamento, se: StatusEntrega) => {
      atualizarStatusVenda(id, { statusPagamento: sp, statusEntrega: se })
      exibirToast('Status atualizado!', 'sucesso')
    },
    [atualizarStatusVenda, exibirToast]
  )

  // ── Colunas do histórico ──

  const colunasHistorico = useMemo(
    () => [
      { chave: 'data', titulo: 'Data' },
      { chave: 'numeroPedido', titulo: 'Pedido #' },
      { chave: 'cliente', titulo: 'Cliente' },
      { chave: 'quantidadeItens', titulo: 'Itens', ordenavel: true },
      { chave: 'canal', titulo: 'Canal' },
      {
        chave: 'statusPagamento',
        titulo: 'Pagamento',
        renderizar: (item: LinhaHistorico) => (
          <Emblema tipo={item.statusPagamento} tamanho="sm" />
        ),
      },
      {
        chave: 'statusEntrega',
        titulo: 'Entrega',
        renderizar: (item: LinhaHistorico) => (
          <Emblema tipo={item.statusEntrega} tamanho="sm" />
        ),
      },
      { chave: 'total', titulo: 'Total', ordenavel: true },
      {
        chave: 'acoes',
        titulo: 'Ações',
        renderizar: (item: LinhaHistorico) => (
          <AcoesHistorico
            venda={item._venda}
            onVerDetalhes={handleVerDetalhes}
            onEditarStatus={handleEditarStatus}
          />
        ),
      },
    ],
    [handleVerDetalhes, handleEditarStatus]
  )

  // ── Nome do cliente para o modal de detalhes ──
  const nomeClienteDetalhes = useMemo(() => {
    if (!vendaDetalhes?.clienteId) return 'Venda avulsa'
    const c = buscarClientePorId(vendaDetalhes.clienteId)
    return c ? c.nomeCompleto : 'Cliente não encontrado'
  }, [vendaDetalhes, buscarClientePorId])

  // ── Estilo das abas ──

  const estiloAba = (ativa: boolean): React.CSSProperties => ({
    padding: '8px 20px',
    borderRadius: '6px 6px 0 0',
    border: '1px solid var(--cor-argila-borda)',
    borderBottom: ativa ? '1px solid var(--cor-argila-card)' : '1px solid var(--cor-argila-borda)',
    background: ativa ? 'var(--cor-argila-card)' : 'var(--cor-argila)',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: ativa ? 600 : 400,
    color: ativa ? 'var(--cor-musgo)' : 'var(--cor-muted)',
    fontFamily: 'inherit',
    marginBottom: -1,
    transition: 'all 0.1s ease',
  })

  const handleAbaNovaVenda = useCallback(() => setAbaAtiva('nova-venda'), [])
  const handleAbaHistorico = useCallback(() => setAbaAtiva('historico'), [])

  return (
    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* Cabeçalho */}
      <div style={{ marginBottom: 20 }}>
        <h1
          style={{
            fontFamily: 'var(--font-display, inherit)',
            fontSize: 26,
            fontWeight: 700,
            color: 'var(--cor-texto)',
            margin: 0,
          }}
        >
          Vendas
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--cor-muted)' }}>
          Registre vendas e acompanhe o histórico
        </p>
      </div>

      {/* Abas */}
      <div style={{ display: 'flex', gap: 4, position: 'relative' }}>
        <button type="button" style={estiloAba(abaAtiva === 'nova-venda')} onClick={handleAbaNovaVenda}>
          Nova venda
        </button>
        <button type="button" style={estiloAba(abaAtiva === 'historico')} onClick={handleAbaHistorico}>
          Histórico
        </button>
      </div>

      {/* Conteúdo da aba */}
      <div
        style={{
          background: 'var(--cor-argila-card)',
          border: '1px solid var(--cor-argila-borda)',
          borderRadius: '0 6px 6px 6px',
          padding: 24,
        }}
      >

        {/* ── Aba Nova Venda ── */}
        {abaAtiva === 'nova-venda' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>

            {/* Painel esquerdo — busca + carrinho */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3
                style={{
                  fontFamily: 'var(--font-display, inherit)',
                  fontSize: 16,
                  fontWeight: 600,
                  color: 'var(--cor-texto)',
                  margin: 0,
                }}
              >
                Carrinho
              </h3>

              {/* Busca de produto */}
              <div style={{ position: 'relative' }}>
                <Campo
                  rotulo="Buscar produto"
                  nome="buscaProduto"
                  valor={buscaProduto}
                  aoMudar={handleSetBuscaProduto}
                  placeholder="Nome da vela..."
                />
                {produtosFiltrados.length > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: 'var(--cor-argila-card)',
                      border: '1px solid var(--cor-argila-borda)',
                      borderRadius: '0 0 6px 6px',
                      zIndex: 10,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                      maxHeight: 240,
                      overflowY: 'auto',
                    }}
                  >
                    {produtosFiltrados.map((p) => (
                      <ResultadoBusca
                        key={p.id}
                        produto={p}
                        onAdicionarAoCarrinho={handleAdicionarAoCarrinho}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Itens do carrinho */}
              <div
                style={{
                  flex: 1,
                  minHeight: 120,
                  border: '1px solid var(--cor-argila-borda)',
                  borderRadius: 6,
                  padding: '8px 12px',
                  background: 'var(--cor-argila)',
                }}
              >
                {carrinho.length === 0 ? (
                  <p
                    style={{
                      margin: 0,
                      textAlign: 'center',
                      color: 'var(--cor-muted)',
                      fontSize: 13,
                      paddingTop: 24,
                    }}
                  >
                    Busque um produto acima para adicionar ao carrinho
                  </p>
                ) : (
                  carrinho.map((item) => (
                    <ItemCarrinho
                      key={item.produtoId}
                      item={item}
                      onAumentarQtd={handleAumentarQtd}
                      onDiminuirQtd={handleDiminuirQtd}
                      onRemover={handleRemoverDoCarrinho}
                    />
                  ))
                )}
              </div>

              {/* Desconto e total */}
              <CampoMonetario
                rotulo="Desconto (R$)"
                nome="desconto"
                valor={desconto}
                aoMudar={handleSetDesconto}
              />

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 16px',
                  background: 'var(--cor-argila)',
                  borderRadius: 8,
                  border: '1px solid var(--cor-argila-borda)',
                }}
              >
                <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--cor-texto)' }}>
                  Total
                </span>
                <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--cor-musgo)' }}>
                  {formatarMoeda(totalVenda)}
                </span>
              </div>
            </div>

            {/* Painel direito — dados da venda */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <h3
                style={{
                  fontFamily: 'var(--font-display, inherit)',
                  fontSize: 16,
                  fontWeight: 600,
                  color: 'var(--cor-texto)',
                  margin: 0,
                }}
              >
                Dados da venda
              </h3>

              <CampoSelecao
                rotulo="Cliente"
                nome="clienteId"
                opcoes={opcoesClientes}
                valor={clienteId}
                aoMudar={handleSetClienteId}
              />

              <CampoSelecao
                rotulo="Canal de venda"
                nome="canalVenda"
                opcoes={opcoesCanal}
                valor={canalVenda}
                aoMudar={handleSetCanalVenda}
              />

              <CampoSelecao
                rotulo="Forma de pagamento"
                nome="formaPagamento"
                opcoes={opcoesPagamento}
                valor={formaPagamento}
                aoMudar={handleSetFormaPagamento}
              />

              <Alternador
                rotulo="Status de pagamento"
                ativo={pagoPago}
                aoAlternar={handleAlternarPago}
                descricao={pagoPago ? 'Pago' : 'Pendente'}
              />

              <CampoSelecao
                rotulo="Tipo de entrega"
                nome="tipoEntrega"
                opcoes={opcoesEntrega}
                valor={tipoEntrega}
                aoMudar={handleSetTipoEntrega}
              />

              <CampoSelecao
                rotulo="Status de entrega"
                nome="statusEntrega"
                opcoes={opcoesStatusEntrega}
                valor={statusEntregaVenda}
                aoMudar={handleSetStatusEntrega}
              />

              <CampoTexto
                rotulo="Observações"
                nome="observacoes"
                valor={observacoes}
                aoMudar={handleSetObservacoes}
                linhas={3}
                placeholder="Alguma observação sobre este pedido..."
              />

              <Botao
                variante="primario"
                larguraTotal
                aoClicar={handleRegistrarVenda}
                desabilitado={carrinho.length === 0}
              >
                Registrar Venda
              </Botao>
            </div>
          </div>
        )}

        {/* ── Aba Histórico ── */}
        {abaAtiva === 'historico' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Filtros */}
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ flex: '2 1 240px', minWidth: 200 }}>
                <SeletorIntervalo
                  rotulo="Período"
                  dataInicio={filtroDataInicio}
                  dataFim={filtroDataFim}
                  aoMudar={handleFiltroIntervalo}
                />
              </div>
              <div style={{ flex: '1 1 160px', minWidth: 140 }}>
                <CampoSelecao
                  rotulo="Canal"
                  nome="filtroCanal"
                  opcoes={opcoesCanaisComTodos}
                  valor={filtroCanal}
                  aoMudar={handleFiltroCanal}
                />
              </div>
              <div style={{ flex: '1 1 160px', minWidth: 140 }}>
                <CampoSelecao
                  rotulo="Pagamento"
                  nome="filtroStatusPag"
                  opcoes={opcoesStatusPagamento}
                  valor={filtroStatusPag}
                  aoMudar={handleFiltroStatusPag}
                />
              </div>
            </div>

            {/* Tabela de histórico */}
            <div
              style={{
                border: '1px solid var(--cor-argila-borda)',
                borderRadius: 8,
                overflow: 'hidden',
              }}
            >
              <TabelaDados<LinhaHistorico>
                colunas={colunasHistorico}
                dados={linhasHistorico}
                chaveUnica="id"
                itensPorPagina={10}
                mensagemVazia="Nenhuma venda encontrada para os filtros selecionados."
              />
            </div>
          </div>
        )}
      </div>

      {/* Modais do histórico */}
      <ModalDetalhesVenda
        aberto={modalDetalhesAberto}
        aoFechar={handleFecharDetalhes}
        venda={vendaDetalhes}
        nomeCliente={nomeClienteDetalhes}
      />

      <ModalEditarStatus
        aberto={modalStatusAberto}
        aoFechar={handleFecharStatus}
        venda={vendaEditandoStatus}
        onSalvar={handleSalvarStatus}
      />

      {/* Toasts */}
      {toasts.map((t) => (
        <ToastFlutuante key={t.id} mensagem={t.mensagem} tipo={t.tipo} />
      ))}
    </div>
  )
}
