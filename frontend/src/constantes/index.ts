export const CHAVES_STORAGE = {
  PRODUTOS: 'psique:produtos',
  CLIENTES: 'psique:clientes',
  VENDAS: 'psique:vendas',
} as const

export const MARGEM_ALERTA_BAIXA = 50
export const MARGEM_ALERTA_MEDIA = 65
export const LIMITE_DESCRICAO_CURTA = 160
export const LIMITE_HISTORIA_VELA = 500
export const ESTOQUE_MINIMO_PADRAO = 5
export const TEMPO_TOAST_MS = 3500
export const ITENS_POR_PAGINA = 10
export const DIAS_GRAFICO_LINHA = 30

export * from './vendas'
