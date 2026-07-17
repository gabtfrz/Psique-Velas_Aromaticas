import type { OpcaoSelecao } from '@/tipos'

// Nomes das tabelas na Supabase (evita números/strings mágicas nos hooks de domínio).
export const TABELAS = {
  PRODUTOS: 'produtos',
  CLIENTES: 'clientes',
  VENDAS: 'vendas',
  ITENS_VENDA: 'itens_venda',
  GESTORAS: 'gestoras',
  INSUMOS: 'insumos',
  PRODUTO_INSUMOS: 'produto_insumos',
} as const

// Opções de unidade de medida usadas nos formulários de insumo/receita.
export const OPCOES_UNIDADE_MEDIDA: OpcaoSelecao[] = [
  { valor: 'ml', rotulo: 'Mililitro (ml)' },
  { valor: 'g', rotulo: 'Grama (g)' },
  { valor: 'un', rotulo: 'Unidade (un)' },
  { valor: 'cm', rotulo: 'Centímetro (cm)' },
  { valor: 'm', rotulo: 'Metro (m)' },
]

// Opções de categoria de insumo usadas no formulário de cadastro de insumo.
export const OPCOES_CATEGORIA_INSUMO: OpcaoSelecao[] = [
  { valor: 'cera', rotulo: 'Cera' },
  { valor: 'fragrancia', rotulo: 'Fragrância' },
  { valor: 'pavio', rotulo: 'Pavio' },
  { valor: 'recipiente', rotulo: 'Recipiente' },
  { valor: 'corante', rotulo: 'Corante' },
  { valor: 'outro', rotulo: 'Outro' },
]

// Nome da Edge Function que cria uma nova gestora (só master, service_role no servidor).
export const FUNCAO_CRIAR_USUARIO = 'criar-usuario'

// Tamanho mínimo exigido para a senha de uma nova gestora (mesma regra da Edge Function).
// Senha provisória definida pelo master ao cadastrar uma gestora — mínimo baixo
// (6) de propósito: é provisória, a gestora deve trocá-la depois.
export const SENHA_MINIMA_USUARIO = 6

// Nome da função RPC transacional que registra a venda, insere os itens e baixa o estoque.
export const RPC_REGISTRAR_VENDA = 'registrar_venda'

// Nome da função RPC transacional que grava o produto e sua receita de insumos.
export const RPC_REGISTRAR_PRODUTO = 'registrar_produto_com_receita'

// Nome da RPC que lista as gestoras (só master) com o CPF já decifrado.
export const RPC_LISTAR_GESTORAS = 'listar_gestoras'
// Nome da RPC que edita nome/telefone/CPF de uma gestora (só master; re-cifra o CPF no banco).
export const RPC_ATUALIZAR_GESTORA = 'atualizar_gestora'
// Nome da RPC que zera a flag `deve_trocar_senha` da gestora logada.
export const RPC_MARCAR_SENHA_TROCADA = 'marcar_senha_trocada'

// Quantidade mínima de um item da receita (insumo) para que seja aceito — evita
// itens com quantidade zero/negativa tanto na validação (Zod) quanto na UI.
export const QUANTIDADE_MINIMA_ITEM_RECEITA = 0.01

export const MARGEM_ALERTA_BAIXA = 50
export const MARGEM_ALERTA_MEDIA = 65
export const LIMITE_DESCRICAO_CURTA = 160
export const LIMITE_HISTORIA_VELA = 500
export const ESTOQUE_MINIMO_PADRAO = 5
export const TEMPO_TOAST_MS = 3500
export const ITENS_POR_PAGINA = 10
export const DIAS_GRAFICO_LINHA = 30

export * from './vendas'
