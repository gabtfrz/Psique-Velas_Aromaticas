import { useState, useMemo, useCallback } from 'react'
import { useClientes } from '@/hooks/useClientes'
import { useVendas } from '@/hooks/useVendas'
import { useToast } from '@/hooks/useToast'
import { TabelaDados } from '@/componentes/compartilhados/TabelaDados'
import { EstadoVazio } from '@/componentes/compartilhados/EstadoVazio'
import { ModalNovoCliente } from '@/componentes/compartilhados/ModalNovoCliente'
import { ToastContainer } from '@/componentes/ui/Toast'
import { Botao } from '@/componentes/ui/Botao'
import { Campo } from '@/componentes/ui/Campo'
import { Icone } from '@/componentes/ui/Icone'
import { Modal } from '@/componentes/ui/Modal'
import { TabelaDados as TabelaDetalhe } from '@/componentes/compartilhados/TabelaDados'
import { formatarMoeda, formatarData, formatarWhatsApp } from '@/utils/formatadores'
import type { EntradaCliente } from '@/utils/validadores'
import type { Cliente, Venda } from '@/tipos'

// ---------------------------------------------------------------------------
// Tipos de linha da tabela principal
// ---------------------------------------------------------------------------
interface LinhaCliente extends Record<string, unknown> {
  id: number
  nomeCompleto: string
  whatsapp: string
  email: string
  cidade: string
  canalOrigem: string
  totalGasto: number
  numeroPedidos: number
  ultimaCompra: string
  _cliente: Cliente
}

// ---------------------------------------------------------------------------
// Tipos de linha da tabela de pedidos do detalhe
// ---------------------------------------------------------------------------
interface LinhaPedido extends Record<string, unknown> {
  id: number
  numeroPedido: string
  data: string
  canal: string
  total: number
  status: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const rotuloCanal: Record<string, string> = {
  instagram: 'Instagram',
  indicacao: 'Indicação',
  site: 'Site',
  feira: 'Feira',
  whatsapp: 'WhatsApp',
  outro: 'Outro',
}

function vendasDoCliente(vendas: Venda[], clienteId: number): Venda[] {
  return vendas.filter((v) => v.clienteId === clienteId)
}

function totalGastoCliente(vendas: Venda[], clienteId: number): number {
  return vendasDoCliente(vendas, clienteId).reduce((acc, v) => acc + v.total, 0)
}

function ultimaCompraCliente(vendas: Venda[], clienteId: number): string {
  const compras = vendasDoCliente(vendas, clienteId)
  if (compras.length === 0) return '—'
  const mais = compras.reduce((a, b) =>
    new Date(a.criadoEm) > new Date(b.criadoEm) ? a : b
  )
  return formatarData(mais.criadoEm)
}

function produtoFavorito(vendas: Venda[]): string {
  const contagem: Record<string, number> = {}
  for (const v of vendas) {
    for (const item of v.itens) {
      contagem[item.nomeProduto] = (contagem[item.nomeProduto] ?? 0) + item.quantidade
    }
  }
  const entradas = Object.entries(contagem)
  if (entradas.length === 0) return '—'
  return entradas.reduce((a, b) => (b[1] > a[1] ? b : a))[0]
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------
export default function Clientes() {
  const { clientes, adicionarCliente, editarCliente } = useClientes()
  const { vendas } = useVendas()
  const { toasts, exibirToast, removerToast } = useToast()

  const [busca, setBusca] = useState('')
  const [modalAberto, setModalAberto] = useState(false)
  const [clienteEditando, setClienteEditando] = useState<Cliente | undefined>(undefined)
  const [clienteDetalhe, setClienteDetalhe] = useState<Cliente | undefined>(undefined)

  // -------------------------------------------------------------------------
  // Lista filtrada
  // -------------------------------------------------------------------------
  const clientesFiltrados = useMemo<LinhaCliente[]>(() => {
    const termo = busca.toLowerCase().trim()
    return clientes
      .filter((c) => {
        if (!termo) return true
        return (
          c.nomeCompleto.toLowerCase().includes(termo) ||
          c.email.toLowerCase().includes(termo) ||
          c.whatsapp.replace(/\D/g, '').includes(termo.replace(/\D/g, ''))
        )
      })
      .map<LinhaCliente>((c) => ({
        id: c.id,
        nomeCompleto: c.nomeCompleto,
        whatsapp: formatarWhatsApp(c.whatsapp),
        email: c.email,
        cidade: c.endereco.cidade,
        canalOrigem: rotuloCanal[c.canalOrigem] ?? c.canalOrigem,
        totalGasto: totalGastoCliente(vendas, c.id),
        numeroPedidos: vendasDoCliente(vendas, c.id).length,
        ultimaCompra: ultimaCompraCliente(vendas, c.id),
        _cliente: c,
      }))
  }, [clientes, vendas, busca])

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------
  const abrirModalNovo = useCallback(() => {
    setClienteEditando(undefined)
    setModalAberto(true)
  }, [])

  const abrirModalEditar = useCallback((cliente: Cliente) => {
    setClienteEditando(cliente)
    setModalAberto(true)
  }, [])

  const fecharModal = useCallback(() => {
    setModalAberto(false)
    setClienteEditando(undefined)
  }, [])

  const abrirDetalhe = useCallback((cliente: Cliente) => {
    setClienteDetalhe(cliente)
  }, [])

  const fecharDetalhe = useCallback(() => {
    setClienteDetalhe(undefined)
  }, [])

  const handleSalvarCliente = useCallback(
    async (dados: EntradaCliente) => {
      try {
        if (clienteEditando) {
          await editarCliente({
            ...clienteEditando,
            ...dados,
            dataNascimento: dados.dataNascimento
              ? new Date(dados.dataNascimento)
              : undefined,
          })
          exibirToast('Cliente atualizado com sucesso.', 'sucesso')
        } else {
          await adicionarCliente({
            ...dados,
            dataNascimento: dados.dataNascimento
              ? new Date(dados.dataNascimento)
              : undefined,
          })
          exibirToast('Cliente cadastrado com sucesso.', 'sucesso')
        }
        fecharModal()
      } catch {
        exibirToast('Não foi possível salvar o cliente. Tente novamente.', 'erro')
      }
    },
    [clienteEditando, adicionarCliente, editarCliente, exibirToast, fecharModal]
  )

  const handleBusca = useCallback((v: string) => {
    setBusca(v)
  }, [])

  // -------------------------------------------------------------------------
  // Colunas da tabela principal
  // -------------------------------------------------------------------------
  const colunas = useMemo(
    () => [
      { chave: 'nomeCompleto', titulo: 'Nome', ordenavel: true },
      { chave: 'whatsapp', titulo: 'WhatsApp' },
      { chave: 'email', titulo: 'E-mail', ordenavel: true },
      { chave: 'cidade', titulo: 'Cidade', ordenavel: true },
      { chave: 'canalOrigem', titulo: 'Canal', ordenavel: true },
      {
        chave: 'totalGasto',
        titulo: 'Total Gasto',
        ordenavel: true,
        renderizar: (linha: LinhaCliente) => (
          <span style={{ fontWeight: 600, color: 'var(--cor-musgo)' }}>
            {formatarMoeda(linha.totalGasto)}
          </span>
        ),
      },
      {
        chave: 'numeroPedidos',
        titulo: 'Pedidos',
        ordenavel: true,
        renderizar: (linha: LinhaCliente) => String(linha.numeroPedidos),
      },
      { chave: 'ultimaCompra', titulo: 'Última Compra', ordenavel: false },
      {
        chave: 'acoes',
        titulo: 'Ações',
        renderizar: (linha: LinhaCliente) => (
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              type="button"
              title="Ver detalhes"
              onClick={() => abrirDetalhe(linha._cliente)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                color: 'var(--cor-musgo)',
                borderRadius: 4,
              }}
            >
              <Icone nome="info" tamanho={16} />
            </button>
            <button
              type="button"
              title="Editar"
              onClick={() => abrirModalEditar(linha._cliente)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                color: 'var(--cor-muted)',
                borderRadius: 4,
              }}
            >
              <Icone nome="editar" tamanho={16} />
            </button>
          </div>
        ),
      },
    ],
    [abrirDetalhe, abrirModalEditar]
  )

  // -------------------------------------------------------------------------
  // Painel de detalhe
  // -------------------------------------------------------------------------
  const dadosDetalhe = useMemo<{
    vendas: LinhaPedido[]
    totalGasto: number
    produtoFav: string
    primeiraCompra: string
    ultimaCompra: string
  } | null>(() => {
    if (!clienteDetalhe) return null
    const compras = vendasDoCliente(vendas, clienteDetalhe.id)
    const total = compras.reduce((a, v) => a + v.total, 0)
    const fav = produtoFavorito(compras)

    const datas = compras.map((v) => new Date(v.criadoEm).getTime())
    const primeira = datas.length > 0 ? formatarData(new Date(Math.min(...datas))) : '—'
    const ultima = datas.length > 0 ? formatarData(new Date(Math.max(...datas))) : '—'

    const linhas: LinhaPedido[] = compras.map((v) => ({
      id: v.id,
      numeroPedido: v.numeroPedido,
      data: formatarData(v.criadoEm),
      canal: v.canalVenda,
      total: v.total,
      status: v.statusEntrega,
    }))

    return { vendas: linhas, totalGasto: total, produtoFav: fav, primeiraCompra: primeira, ultimaCompra: ultima }
  }, [clienteDetalhe, vendas])

  const colunasDetalhe = useMemo(
    () => [
      { chave: 'numeroPedido', titulo: 'Pedido', ordenavel: true },
      { chave: 'data', titulo: 'Data', ordenavel: false },
      { chave: 'canal', titulo: 'Canal', ordenavel: true },
      {
        chave: 'total',
        titulo: 'Total',
        ordenavel: true,
        renderizar: (l: LinhaPedido) => (
          <span style={{ fontWeight: 600, color: 'var(--cor-musgo)' }}>
            {formatarMoeda(l.total)}
          </span>
        ),
      },
      { chave: 'status', titulo: 'Status', ordenavel: true },
    ],
    []
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
      }}
    >
      {/* Cabeçalho da página */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
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
            Clientes
          </h1>
          <p style={{ fontSize: 14, color: 'var(--cor-muted)', margin: '4px 0 0' }}>
            {clientes.length} {clientes.length === 1 ? 'cliente cadastrado' : 'clientes cadastrados'}
          </p>
        </div>
        <Botao variante="primario" aoClicar={abrirModalNovo}>
          <Icone nome="mais" tamanho={16} />
          Novo cliente
        </Botao>
      </div>

      {/* Busca */}
      <div
        style={{
          background: 'var(--cor-argila-card)',
          border: '1px solid var(--cor-argila-borda)',
          borderRadius: 8,
          padding: '16px 20px',
          marginBottom: 20,
        }}
      >
        <div style={{ maxWidth: 400 }}>
          <Campo
            rotulo="Buscar cliente"
            nome="busca"
            valor={busca}
            aoMudar={handleBusca}
            placeholder="Nome, e-mail ou WhatsApp..."
          />
        </div>
      </div>

      {/* Tabela */}
      <div
        style={{
          background: 'var(--cor-argila-card)',
          border: '1px solid var(--cor-argila-borda)',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        {clientesFiltrados.length === 0 && busca === '' ? (
          <EstadoVazio
            titulo="Nenhum cliente ainda"
            subtitulo="Cadastre sua primeira cliente para começar a acompanhar o histórico de compras."
            textoBotao="Cadastrar cliente"
            aoClicarBotao={abrirModalNovo}
          />
        ) : (
          <TabelaDados<LinhaCliente>
            colunas={colunas}
            dados={clientesFiltrados}
            chaveUnica="id"
            mensagemVazia="Nenhum cliente encontrado para esta busca."
          />
        )}
      </div>

      {/* Modal de criação/edição */}
      <ModalNovoCliente
        aberto={modalAberto}
        aoFechar={fecharModal}
        aoSalvar={handleSalvarCliente}
        clienteParaEditar={clienteEditando}
      />

      {/* Painel de detalhe */}
      {clienteDetalhe && dadosDetalhe && (
        <Modal
          aberto={!!clienteDetalhe}
          aoFechar={fecharDetalhe}
          titulo={`Detalhes — ${clienteDetalhe.nomeCompleto}`}
          largura="xl"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Dados do cliente */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 12,
              }}
            >
              <InfoItem rotulo="E-mail" valor={clienteDetalhe.email} />
              <InfoItem rotulo="WhatsApp" valor={formatarWhatsApp(clienteDetalhe.whatsapp)} />
              <InfoItem rotulo="Cidade" valor={`${clienteDetalhe.endereco.cidade} — ${clienteDetalhe.endereco.uf}`} />
              <InfoItem rotulo="Canal de origem" valor={rotuloCanal[clienteDetalhe.canalOrigem] ?? clienteDetalhe.canalOrigem} />
              {clienteDetalhe.cpf && (
                <InfoItem rotulo="CPF" valor={clienteDetalhe.cpf} />
              )}
              {clienteDetalhe.dataNascimento && (
                <InfoItem rotulo="Data de nascimento" valor={formatarData(clienteDetalhe.dataNascimento)} />
              )}
              {clienteDetalhe.observacoesInternas && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <InfoItem rotulo="Observações" valor={clienteDetalhe.observacoesInternas} />
                </div>
              )}
            </div>

            {/* Resumo financeiro */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 12,
              }}
            >
              <ResumoCard rotulo="Total gasto" valor={formatarMoeda(dadosDetalhe.totalGasto)} />
              <ResumoCard rotulo="Nº de pedidos" valor={String(dadosDetalhe.vendas.length)} />
              <ResumoCard rotulo="Produto favorito" valor={dadosDetalhe.produtoFav} />
              <ResumoCard rotulo="Primeira compra" valor={dadosDetalhe.primeiraCompra} />
            </div>

            {/* Histórico de pedidos */}
            <div>
              <h3
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--cor-texto)',
                  marginBottom: 12,
                }}
              >
                Histórico de pedidos
              </h3>
              <div
                style={{
                  border: '1px solid var(--cor-argila-borda)',
                  borderRadius: 6,
                  overflow: 'hidden',
                }}
              >
                <TabelaDetalhe<LinhaPedido>
                  colunas={colunasDetalhe}
                  dados={dadosDetalhe.vendas}
                  chaveUnica="id"
                  mensagemVazia="Nenhum pedido encontrado para esta cliente."
                  itensPorPagina={5}
                />
              </div>
            </div>
          </div>
        </Modal>
      )}

      <ToastContainer toasts={toasts} aoRemover={removerToast} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-componentes auxiliares (somente leitura, sem props callback)
// ---------------------------------------------------------------------------
function InfoItem({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div>
      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--cor-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          margin: '0 0 2px',
        }}
      >
        {rotulo}
      </p>
      <p style={{ fontSize: 13, color: 'var(--cor-texto)', margin: 0 }}>{valor}</p>
    </div>
  )
}

function ResumoCard({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div
      style={{
        background: 'var(--cor-argila)',
        border: '1px solid var(--cor-argila-borda)',
        borderRadius: 6,
        padding: '12px 14px',
      }}
    >
      <p style={{ fontSize: 11, color: 'var(--cor-muted)', margin: '0 0 4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {rotulo}
      </p>
      <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--cor-texto)', margin: 0 }}>
        {valor}
      </p>
    </div>
  )
}
