export interface NotasAromaticas {
  topo: string
  coracao: string
  fundo: string
}

export interface Endereco {
  cep: string
  logradouro: string
  numero: string
  complemento?: string
  bairro: string
  cidade: string
  uf: string
}

export type TipoCera = 'vegetal-soja' | 'vegetal-coco' | 'mista'
export type Granulometria = 'fina' | 'media' | 'grossa'
export type TipoPavio = 'algodao' | 'madeira' | 'duplo'
export type CategoriaProduto =
  | 'para-rituais'
  | 'para-presentes'
  | 'colecao-especial'
  | 'uso-diario'
export type ClassificacaoMargem = 'baixa' | 'media' | 'boa'

export type UnidadeMedida = 'ml' | 'g' | 'un' | 'cm' | 'm'
export type CategoriaInsumo = 'cera' | 'fragrancia' | 'pavio' | 'recipiente' | 'corante' | 'outro'

export interface Insumo {
  id: number
  nome: string
  categoria: CategoriaInsumo
  unidadeMedida: UnidadeMedida
  precoUnitario: number
  fornecedor?: string
  quantidadeEmbalagem?: number
  precoEmbalagem?: number
  criadoEm: Date
  atualizadoEm: Date
}

export interface ItemReceita {
  insumoId: number
  nomeInsumo: string
  unidadeMedida: UnidadeMedida
  quantidade: number
  subtotal: number
}

export interface Produto {
  id: number
  nome: string
  intencao: string
  tipoCera: TipoCera
  granulometria: Granulometria
  gramagem: number
  notasAromaticas: NotasAromaticas
  percentualFragrancia: number
  tipoPavio: TipoPavio
  corCera: string
  recipiente: string
  tempoQueima: number
  custoProducao: number
  precoVenda: number
  margem: number
  markup: number
  categoria: CategoriaProduto
  tags: string[]
  estoqueAtual: number
  estoqueMinimo: number
  descricaoCurta: string
  historiaVela: string
  ativo: boolean
  percentualCustosExtras: number
  receita: ItemReceita[]
  criadoEm: Date
  atualizadoEm: Date
}

export type CanalOrigem = 'instagram' | 'indicacao' | 'site' | 'feira' | 'whatsapp' | 'outro'

export interface Cliente {
  id: number
  nomeCompleto: string
  cpf?: string
  dataNascimento?: Date
  email: string
  whatsapp: string
  canalOrigem: CanalOrigem
  endereco: Endereco
  observacoesInternas?: string
  criadoEm: Date
}

export type CanalVenda = 'site' | 'instagram' | 'whatsapp' | 'presencial' | 'marketplace'
export type FormaPagamento =
  | 'pix'
  | 'cartao-credito'
  | 'cartao-debito'
  | 'dinheiro'
  | 'boleto'
export type StatusPagamento = 'pago' | 'pendente'
export type TipoEntrega = 'retirada' | 'correios' | 'motoboy'
export type StatusEntrega = 'aguardando' | 'em-producao' | 'enviado' | 'entregue'

export interface ItemVenda {
  id?: number
  produtoId: number
  nomeProduto: string
  quantidade: number
  precoUnitario: number
  subtotal: number
}

export interface Venda {
  id: number
  numeroPedido: string
  clienteId?: number
  itens: ItemVenda[]
  desconto: number
  total: number
  canalVenda: CanalVenda
  formaPagamento: FormaPagamento
  statusPagamento: StatusPagamento
  tipoEntrega: TipoEntrega
  statusEntrega: StatusEntrega
  observacoes?: string
  criadoEm: Date
}

export interface FaturamentoDiario {
  data: Date
  valor: number
}

export interface ToastProps {
  id: string
  mensagem: string
  tipo: 'sucesso' | 'erro' | 'aviso'
}

export interface OpcaoSelecao {
  valor: string
  rotulo: string
}

export interface ColunaTabela<T> {
  chave: keyof T | string
  titulo: string
  ordenavel?: boolean
  renderizar?: (item: T) => React.ReactNode
}

export type PapelGestora = 'master' | 'gestora'

export interface Gestora {
  id: number
  nome: string
  papel: PapelGestora
  email: string
  telefone: string
  cpf: string
  deveTrocarSenha: boolean
  criadoEm: Date
}
