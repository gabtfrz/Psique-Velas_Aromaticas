import { useState, useMemo, useCallback } from 'react'
import { useVendas } from '@/hooks/useVendas'
import { useProdutos } from '@/hooks/useProdutos'
import { useToast } from '@/hooks/useToast'
import { CartaoKpi } from '@/componentes/compartilhados/CartaoKpi'
import { CartaoGrafico } from '@/componentes/compartilhados/CartaoGrafico'
import { TabelaDados } from '@/componentes/compartilhados/TabelaDados'
import { GraficoLinha } from '@/componentes/graficos/GraficoLinha'
import { GraficoBarra } from '@/componentes/graficos/GraficoBarra'
import { GraficoRosca } from '@/componentes/graficos/GraficoRosca'
import { SeletorIntervalo } from '@/componentes/ui/SeletorIntervalo'
import { CampoSelecao } from '@/componentes/ui/CampoSelecao'
import { Botao } from '@/componentes/ui/Botao'
import { ToastContainer } from '@/componentes/ui/Toast'
import { Icone } from '@/componentes/ui/Icone'
import {
  calcularTicketMedio,
  calcularMargem,
} from '@/utils/calculadores'
import {
  formatarMoeda,
  formatarPercentual,
  formatarData,
} from '@/utils/formatadores'
import type { Venda, CanalVenda, FaturamentoDiario, OpcaoSelecao } from '@/tipos'

// ---------------------------------------------------------------------------
// Helpers — datas padrão (últimos 30 dias)
// ---------------------------------------------------------------------------
function dataParaString(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function obterPadrao30Dias(): { inicio: string; fim: string } {
  const fim = new Date()
  const inicio = new Date()
  inicio.setDate(inicio.getDate() - 29)
  return { inicio: dataParaString(inicio), fim: dataParaString(fim) }
}

// ---------------------------------------------------------------------------
// Tipos de linha da tabela de desempenho
// ---------------------------------------------------------------------------
interface LinhaDesempenho extends Record<string, unknown> {
  id: string
  nome: string
  qtdVendida: number
  faturamento: number
  margemMedia: number
}

// ---------------------------------------------------------------------------
// Opções de seleção
// ---------------------------------------------------------------------------
const opcoesCanal: OpcaoSelecao[] = [
  { valor: '', rotulo: 'Todos os canais' },
  { valor: 'site', rotulo: 'Site' },
  { valor: 'instagram', rotulo: 'Instagram' },
  { valor: 'whatsapp', rotulo: 'WhatsApp' },
  { valor: 'presencial', rotulo: 'Presencial' },
  { valor: 'marketplace', rotulo: 'Marketplace' },
]

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------
export default function Relatorios() {
  const { vendas } = useVendas()
  const { produtos } = useProdutos()
  const { toasts, exibirToast, removerToast } = useToast()

  const padrao = obterPadrao30Dias()
  const [dataInicio, setDataInicio] = useState(padrao.inicio)
  const [dataFim, setDataFim] = useState(padrao.fim)
  const [canalFiltro, setCanalFiltro] = useState('')
  const [produtoFiltro, setProdutoFiltro] = useState('')

  // -------------------------------------------------------------------------
  // Opções dinâmicas de produto
  // -------------------------------------------------------------------------
  const opcoesProduto = useMemo<OpcaoSelecao[]>(() => {
    const base: OpcaoSelecao[] = [{ valor: '', rotulo: 'Todos os produtos' }]
    return [
      ...base,
      ...produtos
        .filter((p) => p.ativo)
        .map((p) => ({ valor: p.id, rotulo: p.nome })),
    ]
  }, [produtos])

  // -------------------------------------------------------------------------
  // Vendas filtradas (useMemo)
  // -------------------------------------------------------------------------
  const vendasFiltradas = useMemo<Venda[]>(() => {
    const inicio = dataInicio ? new Date(dataInicio) : null
    const fim = dataFim ? new Date(dataFim + 'T23:59:59') : null

    return vendas.filter((v) => {
      const data = new Date(v.criadoEm)

      if (inicio && data < inicio) return false
      if (fim && data > fim) return false
      if (canalFiltro && v.canalVenda !== canalFiltro) return false
      if (produtoFiltro && !v.itens.some((i) => i.produtoId === produtoFiltro)) return false

      return true
    })
  }, [vendas, dataInicio, dataFim, canalFiltro, produtoFiltro])

  // -------------------------------------------------------------------------
  // KPIs derivados
  // -------------------------------------------------------------------------
  const faturamentoBruto = useMemo(
    () => vendasFiltradas.reduce((acc, v) => acc + v.total, 0),
    [vendasFiltradas]
  )

  const ticketMedio = useMemo(
    () => calcularTicketMedio(vendasFiltradas),
    [vendasFiltradas]
  )

  const margemBruta = useMemo(() => {
    if (vendasFiltradas.length === 0) return 0
    const margens: number[] = []
    for (const venda of vendasFiltradas) {
      for (const item of venda.itens) {
        const produto = produtos.find((p) => p.id === item.produtoId)
        if (produto) {
          margens.push(calcularMargem(produto.custoProducao, item.precoUnitario))
        }
      }
    }
    if (margens.length === 0) return 0
    return margens.reduce((a, b) => a + b, 0) / margens.length
  }, [vendasFiltradas, produtos])

  // -------------------------------------------------------------------------
  // Dados para GraficoLinha — faturamento diário
  // -------------------------------------------------------------------------
  const faturamentoDiario = useMemo<FaturamentoDiario[]>(() => {
    const mapa = new Map<string, number>()
    for (const v of vendasFiltradas) {
      const chave = new Date(v.criadoEm).toISOString().slice(0, 10)
      mapa.set(chave, (mapa.get(chave) ?? 0) + v.total)
    }
    return Array.from(mapa.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([data, valor]) => ({ data: new Date(data), valor }))
  }, [vendasFiltradas])

  // -------------------------------------------------------------------------
  // Dados para GraficoBarra — faturamento por produto
  // -------------------------------------------------------------------------
  const faturamentoPorProduto = useMemo<Array<{ rotulo: string; valor: number }>>(() => {
    const mapa = new Map<string, { nome: string; valor: number }>()
    for (const v of vendasFiltradas) {
      for (const item of v.itens) {
        const existente = mapa.get(item.produtoId)
        if (existente) {
          existente.valor += item.subtotal
        } else {
          mapa.set(item.produtoId, { nome: item.nomeProduto, valor: item.subtotal })
        }
      }
    }
    return Array.from(mapa.values())
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 8)
      .map((e) => ({ rotulo: e.nome, valor: e.valor }))
  }, [vendasFiltradas])

  // -------------------------------------------------------------------------
  // Dados para GraficoRosca — vendas por canal
  // -------------------------------------------------------------------------
  const vendasPorCanal = useMemo<Array<{ rotulo: string; valor: number }>>(() => {
    const mapa = {} as Record<CanalVenda, number>
    for (const v of vendasFiltradas) {
      mapa[v.canalVenda] = (mapa[v.canalVenda] ?? 0) + v.total
    }
    const rotulosCanal: Record<CanalVenda, string> = {
      site: 'Site',
      instagram: 'Instagram',
      whatsapp: 'WhatsApp',
      presencial: 'Presencial',
      marketplace: 'Marketplace',
    }
    return Object.entries(mapa)
      .filter(([, v]) => v > 0)
      .map(([canal, valor]) => ({
        rotulo: rotulosCanal[canal as CanalVenda] ?? canal,
        valor,
      }))
      .sort((a, b) => b.valor - a.valor)
  }, [vendasFiltradas])

  // -------------------------------------------------------------------------
  // Tabela de desempenho por produto
  // -------------------------------------------------------------------------
  const linhasDesempenho = useMemo<LinhaDesempenho[]>(() => {
    const mapa = new Map<
      string,
      { nome: string; qtd: number; fat: number; margens: number[] }
    >()
    for (const v of vendasFiltradas) {
      for (const item of v.itens) {
        const existente = mapa.get(item.produtoId)
        const produto = produtos.find((p) => p.id === item.produtoId)
        const margem = produto
          ? calcularMargem(produto.custoProducao, item.precoUnitario)
          : 0
        if (existente) {
          existente.qtd += item.quantidade
          existente.fat += item.subtotal
          existente.margens.push(margem)
        } else {
          mapa.set(item.produtoId, {
            nome: item.nomeProduto,
            qtd: item.quantidade,
            fat: item.subtotal,
            margens: [margem],
          })
        }
      }
    }
    return Array.from(mapa.entries()).map(([id, dados]) => ({
      id,
      nome: dados.nome,
      qtdVendida: dados.qtd,
      faturamento: dados.fat,
      margemMedia:
        dados.margens.length > 0
          ? dados.margens.reduce((a, b) => a + b, 0) / dados.margens.length
          : 0,
    }))
  }, [vendasFiltradas, produtos])

  const colunasDesempenho = useMemo(
    () => [
      { chave: 'nome', titulo: 'Nome', ordenavel: true },
      {
        chave: 'qtdVendida',
        titulo: 'Qtd vendida',
        ordenavel: true,
        renderizar: (l: LinhaDesempenho) => String(l.qtdVendida),
      },
      {
        chave: 'faturamento',
        titulo: 'Faturamento',
        ordenavel: true,
        renderizar: (l: LinhaDesempenho) => (
          <span style={{ fontWeight: 600, color: 'var(--cor-musgo)' }}>
            {formatarMoeda(l.faturamento)}
          </span>
        ),
      },
      {
        chave: 'margemMedia',
        titulo: 'Margem média',
        ordenavel: true,
        renderizar: (l: LinhaDesempenho) => formatarPercentual(l.margemMedia),
      },
    ],
    []
  )

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------
  const aoMudarIntervalo = useCallback((inicio: string, fim: string) => {
    setDataInicio(inicio)
    setDataFim(fim)
  }, [])

  const aoMudarCanal = useCallback((v: string) => {
    setCanalFiltro(v)
  }, [])

  const aoMudarProduto = useCallback((v: string) => {
    setProdutoFiltro(v)
  }, [])

  const handleExportarPdf = useCallback(() => {
    exibirToast('Exportação disponível na versão completa do sistema.', 'aviso')
  }, [exibirToast])

  const handleExportarExcel = useCallback(() => {
    exibirToast('Exportação disponível na versão completa do sistema.', 'aviso')
  }, [exibirToast])

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
      {/* Cabeçalho */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
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
            Relatórios
          </h1>
          <p style={{ fontSize: 14, color: 'var(--cor-muted)', margin: '4px 0 0' }}>
            Análise de desempenho e vendas
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <Botao variante="secundario" aoClicar={handleExportarPdf}>
            <Icone nome="exportar" tamanho={16} />
            Exportar PDF
          </Botao>
          <Botao variante="secundario" aoClicar={handleExportarExcel}>
            <Icone nome="exportar" tamanho={16} />
            Exportar Excel
          </Botao>
        </div>
      </div>

      {/* Barra de filtros */}
      <div
        style={{
          background: 'var(--cor-argila-card)',
          border: '1px solid var(--cor-argila-borda)',
          borderRadius: 8,
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'flex-end',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <SeletorIntervalo
          rotulo="Período"
          dataInicio={dataInicio}
          dataFim={dataFim}
          aoMudar={aoMudarIntervalo}
        />
        <div style={{ minWidth: 180 }}>
          <CampoSelecao
            rotulo="Canal de venda"
            nome="canal-filtro"
            opcoes={opcoesCanal}
            valor={canalFiltro}
            aoMudar={aoMudarCanal}
          />
        </div>
        <div style={{ minWidth: 200 }}>
          <CampoSelecao
            rotulo="Produto"
            nome="produto-filtro"
            opcoes={opcoesProduto}
            valor={produtoFiltro}
            aoMudar={aoMudarProduto}
          />
        </div>
        <div style={{ fontSize: 12, color: 'var(--cor-muted)', alignSelf: 'flex-end', paddingBottom: 8 }}>
          {vendasFiltradas.length} venda{vendasFiltradas.length !== 1 ? 's' : ''} no período
        </div>
      </div>

      {/* KPIs */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 16,
        }}
      >
        <CartaoKpi
          titulo="Faturamento bruto"
          valor={formatarMoeda(faturamentoBruto)}
          nomeIcone="reais"
        />
        <CartaoKpi
          titulo="Margem bruta média"
          valor={formatarPercentual(margemBruta)}
          nomeIcone="precificacao"
        />
        <CartaoKpi
          titulo="Ticket médio"
          valor={formatarMoeda(ticketMedio)}
          nomeIcone="venda"
        />
        <CartaoKpi
          titulo="Nº de pedidos"
          valor={String(vendasFiltradas.length)}
          nomeIcone="relatorio"
        />
      </div>

      {/* Gráficos superiores */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 20,
        }}
      >
        <CartaoGrafico
          titulo="Faturamento diário"
          subtitulo={`${dataInicio ? formatarData(new Date(dataInicio)) : '—'} até ${dataFim ? formatarData(new Date(dataFim)) : '—'}`}
        >
          <GraficoLinha dados={faturamentoDiario} altura={240} />
        </CartaoGrafico>

        <CartaoGrafico titulo="Faturamento por produto">
          <GraficoBarra dados={faturamentoPorProduto} altura={240} />
        </CartaoGrafico>
      </div>

      {/* Gráfico inferior — rosca por canal */}
      <CartaoGrafico titulo="Vendas por canal" subtitulo="Valor total por canal de venda">
        <GraficoRosca dados={vendasPorCanal} tamanho={220} />
      </CartaoGrafico>

      {/* Tabela de desempenho por produto */}
      <div
        style={{
          background: 'var(--cor-argila-card)',
          border: '1px solid var(--cor-argila-borda)',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--cor-argila-borda)',
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--font-display, inherit)',
              fontSize: 18,
              fontWeight: 600,
              color: 'var(--cor-texto)',
              margin: 0,
            }}
          >
            Desempenho por produto
          </h2>
        </div>
        <TabelaDados<LinhaDesempenho>
          colunas={colunasDesempenho}
          dados={linhasDesempenho}
          chaveUnica="id"
          mensagemVazia="Nenhuma venda encontrada para o período e filtros selecionados."
        />
      </div>

      <ToastContainer toasts={toasts} aoRemover={removerToast} />
    </div>
  )
}
