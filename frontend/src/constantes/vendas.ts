import type { CanalVenda, FormaPagamento, TipoEntrega, OpcaoSelecao } from '@/tipos'

// ─── Opções de seleção ────────────────────────────────────────────────────────

export const OPCOES_CANAL: OpcaoSelecao[] = [
  { valor: 'instagram',    rotulo: 'Instagram'    },
  { valor: 'whatsapp',     rotulo: 'WhatsApp'     },
  { valor: 'site',         rotulo: 'Site'         },
  { valor: 'presencial',   rotulo: 'Presencial'   },
  { valor: 'marketplace',  rotulo: 'Marketplace'  },
]

export const OPCOES_PAGAMENTO: OpcaoSelecao[] = [
  { valor: 'pix',            rotulo: 'Pix'               },
  { valor: 'cartao-credito', rotulo: 'Cartão de crédito' },
  { valor: 'cartao-debito',  rotulo: 'Cartão de débito'  },
  { valor: 'dinheiro',       rotulo: 'Dinheiro'          },
  { valor: 'boleto',         rotulo: 'Boleto'            },
]

export const OPCOES_ENTREGA: OpcaoSelecao[] = [
  { valor: 'retirada', rotulo: 'Retirada' },
  { valor: 'correios', rotulo: 'Correios' },
  { valor: 'motoboy',  rotulo: 'Motoboy'  },
]

export const OPCOES_STATUS_ENTREGA: OpcaoSelecao[] = [
  { valor: 'aguardando',   rotulo: 'Aguardando'   },
  { valor: 'em-producao',  rotulo: 'Em produção'  },
  { valor: 'enviado',      rotulo: 'Enviado'      },
  { valor: 'entregue',     rotulo: 'Entregue'     },
]

export const OPCOES_STATUS_PAGAMENTO: OpcaoSelecao[] = [
  { valor: 'pago',      rotulo: 'Pago'     },
  { valor: 'pendente',  rotulo: 'Pendente' },
]

// ─── Rótulos para exibição ────────────────────────────────────────────────────

export const ROTULOS_CANAL: Record<CanalVenda, string> = {
  instagram:   'Instagram',
  whatsapp:    'WhatsApp',
  site:        'Site',
  presencial:  'Presencial',
  marketplace: 'Marketplace',
}

export const ROTULOS_PAGAMENTO: Record<FormaPagamento, string> = {
  pix:             'Pix',
  'cartao-credito': 'Cartão de crédito',
  'cartao-debito':  'Cartão de débito',
  dinheiro:        'Dinheiro',
  boleto:          'Boleto',
}

export const ROTULOS_ENTREGA: Record<TipoEntrega, string> = {
  retirada: 'Retirada',
  correios: 'Correios',
  motoboy:  'Motoboy',
}
