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
import { ToastContainer } from '@/componentes/ui/Toast'
import {
  ItemCarrinho,
  ResultadoBusca,
  ModalDetalhesVenda,
  ModalEditarStatus,
  AcoesHistorico,
} from '@/componentes/vendas'
import type { LinhaHistorico } from '@/componentes/vendas'
import { formatarMoeda, formatarData } from '@/utils/formatadores'
import { calcularTotalVenda } from '@/utils/calculadores'
import { calcularSubtotalItem, contarItensCarrinho, filtrarVendas } from '@/utils/vendas'
import {
  OPCOES_CANAL,
  OPCOES_PAGAMENTO,
  OPCOES_ENTREGA,
  OPCOES_STATUS_ENTREGA,
  OPCOES_STATUS_PAGAMENTO,
  ROTULOS_CANAL,
  ITENS_POR_PAGINA,
} from '@/constantes'
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

// ─── Tipos locais ─────────────────────────────────────────────────────────────

type AbaVenda = 'nova-venda' | 'historico'

// ─── Estilos estáticos das abas ───────────────────────────────────────────────

const ESTILO_ABA_BASE: React.CSSProperties = {
  padding: '8px 20px',
  borderRadius: '6px 6px 0 0',
  border: '1px solid var(--cor-argila-borda)',
  cursor: 'pointer',
  fontSize: 14,
  fontFamily: 'inherit',
  marginBottom: -1,
  transition: 'all 0.1s ease',
}

const ESTILO_ABA_ATIVA: React.CSSProperties = {
  ...ESTILO_ABA_BASE,
  borderBottom: '1px solid var(--cor-argila-card)',
  background: 'var(--cor-argila-card)',
  fontWeight: 600,
  color: 'var(--cor-musgo)',
}

const ESTILO_ABA_INATIVA: React.CSSProperties = {
  ...ESTILO_ABA_BASE,
  borderBottom: '1px solid var(--cor-argila-borda)',
  background: 'var(--cor-argila)',
  fontWeight: 400,
  color: 'var(--cor-muted)',
}

// ─── Componente principal ────────────────────────────────────────────────────

export default function Vendas() {
  const { produtosAtivos } = useProdutos()
  const { vendas, registrarVenda, atualizarStatusVenda } = useVendas()
  const { clientes, buscarClientePorId } = useClientes()
  const { toasts, exibirToast, removerToast } = useToast()

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
    () => [{ valor: '', rotulo: 'Todos os canais' }, ...OPCOES_CANAL],
    []
  )

  // ── Opções de status de pagamento para filtro (com "todos") ──
  const opcoesStatusPagComTodos = useMemo<OpcaoSelecao[]>(
    () => [{ valor: '', rotulo: 'Todos' }, ...OPCOES_STATUS_PAGAMENTO],
    []
  )

  // ── Linhas do histórico filtradas ──
  const linhasHistorico = useMemo<LinhaHistorico[]>(() => {
    return filtrarVendas(vendas, {
      dataInicio: filtroDataInicio,
      dataFim: filtroDataFim,
      canal: filtroCanal,
      statusPagamento: filtroStatusPag,
    })
      .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime())
      .map((v) => {
        const cliente = v.clienteId ? buscarClientePorId(v.clienteId) : undefined
        return {
          id: v.id,
          data: formatarData(v.criadoEm),
          numeroPedido: v.numeroPedido,
          cliente: cliente ? cliente.nomeCompleto : 'Venda avulsa',
          quantidadeItens: contarItensCarrinho(v.itens),
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
                subtotal: calcularSubtotalItem(i.quantidade + 1, i.precoUnitario),
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
          subtotal: calcularSubtotalItem(1, produto.precoVenda),
        },
      ]
    })
    setBuscaProduto('')
  }, [])

  const handleAumentarQtd = useCallback((produtoId: string) => {
    setCarrinho((anterior) =>
      anterior.map((i) =>
        i.produtoId === produtoId
          ? { ...i, quantidade: i.quantidade + 1, subtotal: calcularSubtotalItem(i.quantidade + 1, i.precoUnitario) }
          : i
      )
    )
  }, [])

  const handleDiminuirQtd = useCallback((produtoId: string) => {
    setCarrinho((anterior) =>
      anterior.map((i) =>
        i.produtoId === produtoId && i.quantidade > 1
          ? { ...i, quantidade: i.quantidade - 1, subtotal: calcularSubtotalItem(i.quantidade - 1, i.precoUnitario) }
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
            aoVerDetalhes={handleVerDetalhes}
            aoEditarStatus={handleEditarStatus}
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
        <button type="button" style={abaAtiva === 'nova-venda' ? ESTILO_ABA_ATIVA : ESTILO_ABA_INATIVA} onClick={handleAbaNovaVenda}>
          Nova venda
        </button>
        <button type="button" style={abaAtiva === 'historico' ? ESTILO_ABA_ATIVA : ESTILO_ABA_INATIVA} onClick={handleAbaHistorico}>
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
                        aoAdicionarAoCarrinho={handleAdicionarAoCarrinho}
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
                      aoAumentarQtd={handleAumentarQtd}
                      aoDiminuirQtd={handleDiminuirQtd}
                      aoRemover={handleRemoverDoCarrinho}
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
                opcoes={OPCOES_CANAL}
                valor={canalVenda}
                aoMudar={handleSetCanalVenda}
              />

              <CampoSelecao
                rotulo="Forma de pagamento"
                nome="formaPagamento"
                opcoes={OPCOES_PAGAMENTO}
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
                opcoes={OPCOES_ENTREGA}
                valor={tipoEntrega}
                aoMudar={handleSetTipoEntrega}
              />

              <CampoSelecao
                rotulo="Status de entrega"
                nome="statusEntrega"
                opcoes={OPCOES_STATUS_ENTREGA}
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
                  opcoes={opcoesStatusPagComTodos}
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
                itensPorPagina={ITENS_POR_PAGINA}
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
        aoSalvar={handleSalvarStatus}
      />

      {/* Toasts */}
      <ToastContainer toasts={toasts} aoRemover={removerToast} />
    </div>
  )
}
