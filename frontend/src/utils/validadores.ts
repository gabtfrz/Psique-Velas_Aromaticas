import { z } from 'zod'
import {
  LIMITE_DESCRICAO_CURTA,
  LIMITE_HISTORIA_VELA,
  QUANTIDADE_MINIMA_ITEM_RECEITA,
  SENHA_MINIMA_USUARIO,
} from '@/constantes'

const QUANTIDADE_DIGITOS_CPF = 11
const PESO_INICIAL_PRIMEIRO_DIGITO_CPF = 10
const PESO_INICIAL_SEGUNDO_DIGITO_CPF = 11
const MODULO_DIGITO_CPF = 11
const RESTO_DIGITO_ZERO_CPF = 10

// Valida um CPF (com ou sem máscara) pelo algoritmo padrão dos dígitos verificadores.
// Usado como defesa em profundidade no cliente — o servidor sempre revalida.
export function validarCpf(cpf: string): boolean {
  const digitos = cpf.replace(/\D/g, '')

  if (digitos.length !== QUANTIDADE_DIGITOS_CPF || /^(\d)\1+$/.test(digitos)) {
    return false
  }

  function calcularDigitoVerificador(base: string, pesoInicial: number): number {
    const soma = base
      .split('')
      .reduce((acc, digito, indice) => acc + Number(digito) * (pesoInicial - indice), 0)
    const resto = (soma * 10) % MODULO_DIGITO_CPF
    return resto === RESTO_DIGITO_ZERO_CPF ? 0 : resto
  }

  const primeiroDigito = calcularDigitoVerificador(
    digitos.slice(0, 9),
    PESO_INICIAL_PRIMEIRO_DIGITO_CPF
  )
  const segundoDigito = calcularDigitoVerificador(
    digitos.slice(0, 10),
    PESO_INICIAL_SEGUNDO_DIGITO_CPF
  )

  return primeiroDigito === Number(digitos[9]) && segundoDigito === Number(digitos[10])
}

export const schemaItemReceita = z.object({
  insumoId: z.number({ error: 'Selecione um insumo' }),
  nomeInsumo: z.string().min(1),
  unidadeMedida: z.enum(['ml', 'g', 'un', 'cm', 'm']),
  quantidade: z
    .number()
    .min(QUANTIDADE_MINIMA_ITEM_RECEITA, 'A quantidade precisa ser maior que zero'),
  subtotal: z.number().min(0),
})

export const schemaProduto = z.object({
  nome: z.string().min(2, 'Informe o nome da vela'),
  intencao: z.string().min(5, 'Descreva a intenção desta vela'),
  tipoCera: z.enum(['vegetal-soja', 'vegetal-coco', 'mista'], {
    error: () => 'Selecione o tipo de cera',
  }),
  granulometria: z.enum(['fina', 'media', 'grossa'], {
    error: () => 'Selecione a granulometria',
  }),
  gramagem: z
    .number({ error: 'Informe a gramagem em gramas' })
    .min(50, 'A gramagem mínima é 50g')
    .max(2000, 'A gramagem máxima é 2000g'),
  notasAromaticas: z.object({
    topo: z.string().min(1, 'Informe a nota de topo'),
    coracao: z.string().min(1, 'Informe a nota de coração'),
    fundo: z.string().min(1, 'Informe a nota de fundo'),
  }),
  percentualFragrancia: z
    .number({ error: 'Informe o percentual de fragrância' })
    .min(1, 'O percentual mínimo é 1%')
    .max(15, 'O percentual máximo é 15%'),
  tipoPavio: z.enum(['algodao', 'madeira', 'duplo'], {
    error: () => 'Selecione o tipo de pavio',
  }),
  corCera: z.string().min(1, 'Selecione a cor da cera'),
  recipiente: z.string().min(2, 'Descreva o recipiente'),
  tempoQueima: z
    .number({ error: 'Informe o tempo de queima em horas' })
    .min(5, 'O tempo mínimo é 5 horas'),
  custoProducao: z
    .number({ error: 'Informe o custo de produção' })
    .min(0.01, 'O custo precisa ser maior que zero'),
  precoVenda: z
    .number({ error: 'Informe o preço de venda' })
    .min(0.01, 'O preço precisa ser maior que zero'),
  categoria: z.enum(
    ['para-rituais', 'para-presentes', 'colecao-especial', 'uso-diario'],
    { error: () => 'Selecione a categoria' }
  ),
  tags: z.array(z.string()).optional().default([]),
  estoqueAtual: z
    .number({ error: 'Informe o estoque atual' })
    .min(0, 'O estoque não pode ser negativo'),
  estoqueMinimo: z
    .number({ error: 'Informe o estoque mínimo para alerta' })
    .min(0, 'O estoque mínimo não pode ser negativo'),
  descricaoCurta: z
    .string()
    .min(10, 'A descrição precisa ter pelo menos 10 caracteres')
    .max(LIMITE_DESCRICAO_CURTA, `Máximo de ${LIMITE_DESCRICAO_CURTA} caracteres`),
  historiaVela: z
    .string()
    .min(20, 'Conte um pouco mais sobre esta vela')
    .max(LIMITE_HISTORIA_VELA, `Máximo de ${LIMITE_HISTORIA_VELA} caracteres`),
  percentualCustosExtras: z
    .number({ error: 'Informe o percentual de custos extras' })
    .min(0, 'O percentual não pode ser negativo')
    .default(0),
  receita: z.array(schemaItemReceita).optional().default([]),
})

export const schemaInsumo = z.object({
  nome: z.string().min(1, 'Informe o nome do insumo'),
  categoria: z.enum(['cera', 'fragrancia', 'pavio', 'recipiente', 'corante', 'outro'], {
    error: () => 'Selecione a categoria do insumo',
  }),
  unidadeMedida: z.enum(['ml', 'g', 'un', 'cm', 'm'], {
    error: () => 'Selecione a unidade de medida',
  }),
  precoUnitario: z
    .number({ error: 'Informe o preço unitário' })
    .min(0, 'O preço unitário não pode ser negativo'),
  fornecedor: z.string().optional(),
  quantidadeEmbalagem: z
    .number()
    .positive('A quantidade da embalagem precisa ser maior que zero')
    .optional(),
  precoEmbalagem: z
    .number()
    .min(0, 'O preço da embalagem não pode ser negativo')
    .optional(),
})

export const schemaCliente = z.object({
  nomeCompleto: z.string().min(3, 'Informe o nome completo'),
  cpf: z
    .string()
    .optional()
    .refine((v) => !v || /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(v), {
      message: 'CPF inválido. Use o formato 000.000.000-00',
    }),
  dataNascimento: z.string().optional(),
  email: z.string().email('Informe um e-mail válido'),
  whatsapp: z
    .string()
    .min(10, 'Informe o WhatsApp com DDD')
    .refine((v) => /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/.test(v.replace(/\s/g, '')), {
      message: 'Número de WhatsApp inválido',
    }),
  canalOrigem: z.enum(['instagram', 'indicacao', 'site', 'feira', 'whatsapp', 'outro'], {
    error: () => 'Selecione como a cliente chegou até nós',
  }),
  endereco: z.object({
    cep: z.string().min(8, 'Informe o CEP'),
    logradouro: z.string().min(2, 'Informe o logradouro'),
    numero: z.string().min(1, 'Informe o número'),
    complemento: z.string().optional(),
    bairro: z.string().min(2, 'Informe o bairro'),
    cidade: z.string().min(2, 'Informe a cidade'),
    uf: z.string().length(2, 'Informe a UF com 2 letras'),
  }),
  observacoesInternas: z.string().optional(),
})

export const schemaVenda = z.object({
  clienteId: z.number().optional(),
  itens: z
    .array(
      z.object({
        produtoId: z.number({ error: 'Selecione um produto' }),
        nomeProduto: z.string().min(1),
        quantidade: z.number().min(1, 'A quantidade mínima é 1'),
        precoUnitario: z.number().min(0),
        subtotal: z.number().min(0),
      })
    )
    .min(1, 'Adicione pelo menos um produto à venda'),
  desconto: z.number().min(0, 'O desconto não pode ser negativo').default(0),
  canalVenda: z.enum(['site', 'instagram', 'whatsapp', 'presencial', 'marketplace'], {
    error: () => 'Selecione o canal de venda',
  }),
  formaPagamento: z.enum(
    ['pix', 'cartao-credito', 'cartao-debito', 'dinheiro', 'boleto'],
    { error: () => 'Selecione a forma de pagamento' }
  ),
  statusPagamento: z.enum(['pago', 'pendente']).default('pendente'),
  tipoEntrega: z.enum(['retirada', 'correios', 'motoboy'], {
    error: () => 'Selecione o tipo de entrega',
  }),
  statusEntrega: z.enum(['aguardando', 'em-producao', 'enviado', 'entregue']).default('aguardando'),
  observacoes: z.string().optional(),
})

export const schemaUsuario = z.object({
  nome: z.string().min(3, 'Informe o nome completo'),
  cpf: z
    .string()
    .min(1, 'Informe o CPF')
    .refine((v) => /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(v) || /^\d{11}$/.test(v), {
      message: 'CPF inválido. Use o formato 000.000.000-00',
    })
    .refine((v) => validarCpf(v), { message: 'CPF inválido' }),
  telefone: z
    .string()
    .min(10, 'Informe o telefone com DDD')
    .refine((v) => /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/.test(v.replace(/\s/g, '')), {
      message: 'Telefone inválido',
    }),
  email: z.string().email('Informe um e-mail válido'),
  senha: z
    .string()
    .min(SENHA_MINIMA_USUARIO, `A senha precisa ter pelo menos ${SENHA_MINIMA_USUARIO} caracteres`),
})

// Edição de uma gestora existente (só master) — nome, telefone e CPF; e-mail e papel
// não são editáveis por aqui (e-mail é a identidade de login).
export const schemaEditarUsuario = z.object({
  nome: z.string().min(3, 'Informe o nome completo'),
  cpf: z
    .string()
    .min(1, 'Informe o CPF')
    .refine((v) => /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(v) || /^\d{11}$/.test(v), {
      message: 'CPF inválido. Use o formato 000.000.000-00',
    })
    .refine((v) => validarCpf(v), { message: 'CPF inválido' }),
  telefone: z
    .string()
    .min(10, 'Informe o telefone com DDD')
    .refine((v) => /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/.test(v.replace(/\s/g, '')), {
      message: 'Telefone inválido',
    }),
})

// Troca de senha obrigatória no primeiro login — as duas senhas precisam coincidir.
export const schemaTrocarSenha = z
  .object({
    novaSenha: z
      .string()
      .min(SENHA_MINIMA_USUARIO, `A senha precisa ter pelo menos ${SENHA_MINIMA_USUARIO} caracteres`),
    confirmarSenha: z.string().min(1, 'Confirme a nova senha'),
  })
  .refine((dados) => dados.novaSenha === dados.confirmarSenha, {
    message: 'As senhas não coincidem',
    path: ['confirmarSenha'],
  })

export type EntradaInsumo = z.infer<typeof schemaInsumo>
export type EntradaItemReceita = z.infer<typeof schemaItemReceita>
export type EntradaProduto = z.infer<typeof schemaProduto>
export type EntradaCliente = z.infer<typeof schemaCliente>
export type EntradaVenda = z.infer<typeof schemaVenda>
export type EntradaUsuario = z.infer<typeof schemaUsuario>
export type EntradaEditarUsuario = z.infer<typeof schemaEditarUsuario>
export type EntradaTrocarSenha = z.infer<typeof schemaTrocarSenha>
