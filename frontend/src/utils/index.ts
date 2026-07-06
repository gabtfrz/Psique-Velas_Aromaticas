// Barril de utilitários puros
export {
  calcularMargem,
  calcularMarkup,
  calcularPrecoSugerido,
  calcularTotalVenda,
  calcularTicketMedio,
  calcularFaturamentoPeriodo,
  calcularMargemMedia,
  estaAbaixoEstoqueMinimo,
  classificarMargem,
} from './calculadores'

export {
  formatarMoeda,
  formatarData,
  formatarDataHora,
  formatarPercentual,
  formatarGramagem,
  formatarWhatsApp,
} from './formatadores'

export { gerarId, gerarNumeroPedido } from './geradores'

export { escalarValores, calcularPontosLinha, calcularArcoRosca } from './svg'

export {
  schemaProduto,
  schemaCliente,
  schemaVenda,
} from './validadores'
export type { EntradaProduto, EntradaCliente, EntradaVenda } from './validadores'

export {
  calcularSubtotalItem,
  contarItensCarrinho,
  filtrarVendas,
} from './vendas'
export type { FiltrosVenda } from './vendas'
