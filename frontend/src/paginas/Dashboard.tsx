import { useMemo } from 'react'
import { useProdutos } from '@/hooks/useProdutos'
import { useVendas } from '@/hooks/useVendas'
import { useClientes } from '@/hooks/useClientes'
import { CartaoKpi } from '@/componentes/compartilhados/CartaoKpi'
import { CartaoGrafico } from '@/componentes/compartilhados/CartaoGrafico'
import { TabelaDados } from '@/componentes/compartilhados/TabelaDados'
import { GraficoLinha } from '@/componentes/graficos/GraficoLinha'
import { GraficoBarra } from '@/componentes/graficos/GraficoBarra'
import { Emblema } from '@/componentes/ui/Emblema'
import { Icone } from '@/componentes/ui/Icone'
import { formatarMoeda, formatarPercentual, formatarData } from '@/utils/formatadores'
import { filtrarFaturamentoUltimosDias } from '@/utils/vendas'
import { DIAS_GRAFICO_LINHA } from '@/constantes'
import type { StatusPagamento, CanalVenda } from '@/tipos'

// ─── Tipos auxiliares para as tabelas ───────────────────────────────────────

interface LinhaVenda extends Record<string, unknown> {
  id: number
  data: string
  cliente: string
  produto: string
  canal: CanalVenda
  valor: string
  statusPagamento: StatusPagamento
}

interface LinhaEstoque extends Record<string, unknown> {
  id: number
  nome: string
  estoqueAtual: number
  estoqueMinimo: number
}

// ─── Rótulos de canal ────────────────────────────────────────────────────────

const ROTULOS_CANAL: Record<CanalVenda, string> = {
  site: 'Site',
  instagram: 'Instagram',
  whatsapp: 'WhatsApp',
  presencial: 'Presencial',
  marketplace: 'Marketplace',
}

// ─── Componente ──────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { produtos, produtosComEstoqueBaixo, margemMedia } = useProdutos()
  const { vendas, vendasDoMes, calcularFaturamentoPeriodo, calcularTicketMedio, agruparFaturamentoPorDia } =
    useVendas()
  const { buscarClientePorId } = useClientes()

  // KPIs
  const agora = new Date()
  const inicioMes = useMemo(
    () => new Date(agora.getFullYear(), agora.getMonth(), 1),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )
  const fimMes = useMemo(
    () => new Date(agora.getFullYear(), agora.getMonth() + 1, 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const faturamentoMes = useMemo(
    () => calcularFaturamentoPeriodo(inicioMes, fimMes),
    [calcularFaturamentoPeriodo, inicioMes, fimMes]
  )

  const quantidadePedidosMes = useMemo(() => vendasDoMes.length, [vendasDoMes])

  const ticketMedio = useMemo(() => calcularTicketMedio(), [calcularTicketMedio])

  // Faturamento diário dos últimos 30 dias para o gráfico de linha
  const faturamentoDiario = useMemo(
    () => filtrarFaturamentoUltimosDias(agruparFaturamentoPorDia(), DIAS_GRAFICO_LINHA),
    [agruparFaturamentoPorDia]
  )

  // Top 5 produtos mais vendidos por quantidade
  const top5Produtos = useMemo(() => {
    const mapa = new Map<number, { nome: string; quantidade: number }>()
    vendas.forEach((venda) => {
      venda.itens.forEach((item) => {
        const atual = mapa.get(item.produtoId)
        if (atual) {
          mapa.set(item.produtoId, {
            nome: item.nomeProduto,
            quantidade: atual.quantidade + item.quantidade,
          })
        } else {
          mapa.set(item.produtoId, {
            nome: item.nomeProduto,
            quantidade: item.quantidade,
          })
        }
      })
    })
    return Array.from(mapa.values())
      .sort((a, b) => b.quantidade - a.quantidade)
      .slice(0, 5)
      .map((item) => ({ rotulo: item.nome, valor: item.quantidade }))
  }, [vendas])

  // Últimas 5 vendas ordenadas por data desc
  const ultimas5Vendas = useMemo<LinhaVenda[]>(() => {
    return [...vendas]
      .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime())
      .slice(0, 5)
      .map((v) => {
        const cliente = v.clienteId ? buscarClientePorId(v.clienteId) : undefined
        const nomeCliente = cliente ? cliente.nomeCompleto : 'Venda avulsa'
        const nomesProdutos = v.itens.map((i) => i.nomeProduto).join(', ')
        return {
          id: v.id,
          data: formatarData(v.criadoEm),
          cliente: nomeCliente,
          produto: nomesProdutos,
          canal: v.canalVenda,
          valor: formatarMoeda(v.total),
          statusPagamento: v.statusPagamento,
        }
      })
  }, [vendas, buscarClientePorId])

  // Produtos com estoque baixo para tabela
  const linhasEstoqueBaixo = useMemo<LinhaEstoque[]>(() => {
    return produtosComEstoqueBaixo.map((p) => ({
      id: p.id,
      nome: p.nome,
      estoqueAtual: p.estoqueAtual,
      estoqueMinimo: p.estoqueMinimo,
    }))
  }, [produtosComEstoqueBaixo])

  // Colunas tabela últimas vendas
  const colunasVendas = useMemo(
    () => [
      { chave: 'data', titulo: 'Data' },
      { chave: 'cliente', titulo: 'Cliente' },
      { chave: 'produto', titulo: 'Produto' },
      {
        chave: 'canal',
        titulo: 'Canal',
        renderizar: (item: LinhaVenda) => (
          <span style={{ fontSize: 13, color: 'var(--cor-texto)' }}>
            {ROTULOS_CANAL[item.canal]}
          </span>
        ),
      },
      { chave: 'valor', titulo: 'Valor' },
      {
        chave: 'statusPagamento',
        titulo: 'Pagamento',
        renderizar: (item: LinhaVenda) => (
          <Emblema tipo={item.statusPagamento as StatusPagamento} tamanho="sm" />
        ),
      },
    ],
    []
  )

  // Colunas tabela estoque baixo
  const colunasEstoque = useMemo(
    () => [
      { chave: 'nome', titulo: 'Produto' },
      {
        chave: 'estoqueAtual',
        titulo: 'Estoque atual',
        renderizar: (item: LinhaEstoque) => (
          <span style={{ color: 'var(--cor-perigo)', fontWeight: 600 }}>
            {item.estoqueAtual}
          </span>
        ),
      },
      { chave: 'estoqueMinimo', titulo: 'Mínimo' },
      {
        chave: 'id',
        titulo: 'Alerta',
        renderizar: () => <Emblema tipo="baixa" tamanho="sm" />,
      },
    ],
    []
  )

  const _ = produtos // garante que produtos é usado (para evitar unused warning)
  void _

  return (
    <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Cabeçalho */}
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
          Dashboard
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--cor-muted)' }}>
          Visão geral do mês
        </p>
      </div>

      {/* Seção 1 — KPIs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
        }}
      >
        <CartaoKpi
          titulo="Faturamento do mês"
          valor={formatarMoeda(faturamentoMes)}
          nomeIcone="reais"
        />
        <CartaoKpi
          titulo="Pedidos este mês"
          valor={String(quantidadePedidosMes)}
          nomeIcone="venda"
        />
        <CartaoKpi
          titulo="Ticket médio"
          valor={formatarMoeda(ticketMedio)}
          nomeIcone="grafico"
        />
        <CartaoKpi
          titulo="Margem média"
          valor={formatarPercentual(margemMedia)}
          nomeIcone="precificacao"
        />
      </div>

      {/* Seção 2 — Gráficos */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 16,
        }}
      >
        <CartaoGrafico
          titulo="Faturamento — últimos 30 dias"
          subtitulo="Receita diária acumulada"
        >
          <GraficoLinha dados={faturamentoDiario} altura={240} />
        </CartaoGrafico>

        <CartaoGrafico
          titulo="Top 5 produtos"
          subtitulo="Mais vendidos por quantidade"
        >
          <GraficoBarra dados={top5Produtos} altura={240} />
        </CartaoGrafico>
      </div>

      {/* Seção 3 — Linha inferior */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr',
          gap: 16,
          alignItems: 'start',
        }}
      >
        {/* Últimas vendas */}
        <div
          style={{
            background: 'var(--cor-argila-card)',
            border: '1px solid var(--cor-argila-borda)',
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--cor-argila-borda)' }}>
            <h3
              style={{
                fontFamily: 'var(--font-display, inherit)',
                fontSize: 16,
                fontWeight: 600,
                color: 'var(--cor-texto)',
                margin: 0,
              }}
            >
              Últimas 5 vendas
            </h3>
          </div>
          <TabelaDados<LinhaVenda>
            colunas={colunasVendas}
            dados={ultimas5Vendas}
            chaveUnica="id"
            itensPorPagina={5}
            mensagemVazia="Nenhuma venda registrada ainda."
          />
        </div>

        {/* Estoque baixo */}
        <div
          style={{
            background: 'var(--cor-argila-card)',
            border: '1px solid var(--cor-argila-borda)',
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '16px 20px 12px', borderBottom: '1px solid var(--cor-argila-borda)' }}>
            <h3
              style={{
                fontFamily: 'var(--font-display, inherit)',
                fontSize: 16,
                fontWeight: 600,
                color: 'var(--cor-texto)',
                margin: 0,
              }}
            >
              Alerta de estoque
            </h3>
          </div>

          {linhasEstoqueBaixo.length === 0 ? (
            <div
              style={{
                padding: '32px 20px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                textAlign: 'center',
              }}
            >
              <Icone nome="check" tamanho={28} cor="var(--cor-musgo)" />
              <p style={{ margin: 0, fontSize: 14, color: 'var(--cor-muted)' }}>
                Todos os produtos estão com estoque confortável.
              </p>
            </div>
          ) : (
            <TabelaDados<LinhaEstoque>
              colunas={colunasEstoque}
              dados={linhasEstoqueBaixo}
              chaveUnica="id"
              itensPorPagina={10}
              mensagemVazia="Sem alertas de estoque."
            />
          )}
        </div>
      </div>
    </div>
  )
}
