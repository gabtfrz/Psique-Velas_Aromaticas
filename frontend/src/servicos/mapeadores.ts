// Mapeamento camelCase (domínio) ↔ snake_case (tabelas Supabase).
// Mantém a tradução de linha do banco para o tipo do domínio (e vice-versa) isolada
// dos hooks, que só devem orquestrar chamadas — nunca conhecer o formato das colunas.
import type { Produto, Cliente, Venda, ItemVenda, Gestora, Insumo, ItemReceita } from '@/tipos'

// ─── Produtos ──────────────────────────────────────────────────────────────

// Formato de uma linha da tabela `produtos`, como retornado pela Supabase.
export interface LinhaProduto {
  id: number
  nome: string
  intencao: string
  tipo_cera: Produto['tipoCera']
  granulometria: Produto['granulometria']
  gramagem: number
  notas_aromaticas: Produto['notasAromaticas']
  percentual_fragrancia: number
  tipo_pavio: Produto['tipoPavio']
  cor_cera: string
  recipiente: string
  tempo_queima: number
  custo_producao: number
  preco_venda: number
  margem: number
  markup: number
  categoria: Produto['categoria']
  tags: string[]
  estoque_atual: number
  estoque_minimo: number
  descricao_curta: string
  historia_vela: string
  ativo: boolean
  percentual_custos_extras: number
  criado_em: string
  atualizado_em: string
  // Receita de insumos (join aninhado, presente apenas quando a consulta pede
  // `produto_insumos ( *, insumos (...) )`; ausente no retorno das RPCs/updates simples).
  produto_insumos?: LinhaProdutoInsumo[]
}

/** Converte uma linha da tabela `produtos` (snake_case) para o tipo de domínio `Produto`. */
export function linhaParaProduto(linha: LinhaProduto): Produto {
  return {
    id: linha.id,
    nome: linha.nome,
    intencao: linha.intencao,
    tipoCera: linha.tipo_cera,
    granulometria: linha.granulometria,
    gramagem: linha.gramagem,
    notasAromaticas: linha.notas_aromaticas,
    percentualFragrancia: linha.percentual_fragrancia,
    tipoPavio: linha.tipo_pavio,
    corCera: linha.cor_cera,
    recipiente: linha.recipiente,
    tempoQueima: linha.tempo_queima,
    custoProducao: linha.custo_producao,
    precoVenda: linha.preco_venda,
    margem: linha.margem,
    markup: linha.markup,
    categoria: linha.categoria,
    tags: linha.tags,
    estoqueAtual: linha.estoque_atual,
    estoqueMinimo: linha.estoque_minimo,
    descricaoCurta: linha.descricao_curta,
    historiaVela: linha.historia_vela,
    ativo: linha.ativo,
    percentualCustosExtras: linha.percentual_custos_extras,
    receita: (linha.produto_insumos ?? []).map(linhaParaItemReceita),
    criadoEm: new Date(linha.criado_em),
    atualizadoEm: new Date(linha.atualizado_em),
  }
}

/** Converte um `Produto` (sem id/datas geradas pelo banco) para a carga a persistir na Supabase. */
export function produtoParaLinha(produto: Omit<Produto, 'id' | 'criadoEm' | 'atualizadoEm'>) {
  return {
    nome: produto.nome,
    intencao: produto.intencao,
    tipo_cera: produto.tipoCera,
    granulometria: produto.granulometria,
    gramagem: produto.gramagem,
    notas_aromaticas: produto.notasAromaticas,
    percentual_fragrancia: produto.percentualFragrancia,
    tipo_pavio: produto.tipoPavio,
    cor_cera: produto.corCera,
    recipiente: produto.recipiente,
    tempo_queima: produto.tempoQueima,
    custo_producao: produto.custoProducao,
    preco_venda: produto.precoVenda,
    margem: produto.margem,
    markup: produto.markup,
    categoria: produto.categoria,
    tags: produto.tags,
    estoque_atual: produto.estoqueAtual,
    estoque_minimo: produto.estoqueMinimo,
    descricao_curta: produto.descricaoCurta,
    historia_vela: produto.historiaVela,
    ativo: produto.ativo,
    percentual_custos_extras: produto.percentualCustosExtras,
  }
}

/**
 * Converte um produto (sem id/margem/markup/datas geradas pelo banco), já com margem e
 * markup calculados, e sua receita de insumos para a carga da RPC transacional
 * `registrar_produto_com_receita`, que grava o produto e os itens da receita atomicamente.
 * Quando `entrada.id` está presente, a RPC edita o produto existente; caso contrário, cria um novo.
 */
export function produtoParaPayloadRpc(
  entrada: Omit<Produto, 'id' | 'margem' | 'markup' | 'criadoEm' | 'atualizadoEm'> & {
    id?: number
  },
  margem: number,
  markup: number
) {
  return {
    p_produto: {
      ...(entrada.id !== undefined ? { id: entrada.id } : {}),
      nome: entrada.nome,
      intencao: entrada.intencao,
      tipo_cera: entrada.tipoCera,
      granulometria: entrada.granulometria,
      gramagem: entrada.gramagem,
      notas_aromaticas: entrada.notasAromaticas,
      percentual_fragrancia: entrada.percentualFragrancia,
      tipo_pavio: entrada.tipoPavio,
      cor_cera: entrada.corCera,
      recipiente: entrada.recipiente,
      tempo_queima: entrada.tempoQueima,
      percentual_custos_extras: entrada.percentualCustosExtras,
      custo_producao: entrada.custoProducao,
      preco_venda: entrada.precoVenda,
      margem,
      markup,
      categoria: entrada.categoria,
      tags: entrada.tags,
      estoque_atual: entrada.estoqueAtual,
      estoque_minimo: entrada.estoqueMinimo,
      descricao_curta: entrada.descricaoCurta,
      historia_vela: entrada.historiaVela,
      ativo: entrada.ativo,
    },
    p_itens: entrada.receita.map((item) => ({
      insumo_id: item.insumoId,
      quantidade: item.quantidade,
    })),
  }
}

// ─── Clientes ──────────────────────────────────────────────────────────────

// Formato de uma linha da tabela `clientes`, como retornado pela Supabase.
export interface LinhaCliente {
  id: number
  nome_completo: string
  cpf: string | null
  data_nascimento: string | null
  email: string
  whatsapp: string
  canal_origem: Cliente['canalOrigem']
  endereco: Cliente['endereco']
  observacoes_internas: string | null
  criado_em: string
}

/** Converte uma linha da tabela `clientes` (snake_case) para o tipo de domínio `Cliente`. */
export function linhaParaCliente(linha: LinhaCliente): Cliente {
  return {
    id: linha.id,
    nomeCompleto: linha.nome_completo,
    cpf: linha.cpf ?? undefined,
    dataNascimento: linha.data_nascimento ? new Date(linha.data_nascimento) : undefined,
    email: linha.email,
    whatsapp: linha.whatsapp,
    canalOrigem: linha.canal_origem,
    endereco: linha.endereco,
    observacoesInternas: linha.observacoes_internas ?? undefined,
    criadoEm: new Date(linha.criado_em),
  }
}

/** Converte um `Cliente` (sem id/data geradas pelo banco) para a carga a persistir na Supabase. */
export function clienteParaLinha(cliente: Omit<Cliente, 'id' | 'criadoEm'>) {
  return {
    nome_completo: cliente.nomeCompleto,
    cpf: cliente.cpf ?? null,
    data_nascimento: cliente.dataNascimento
      ? new Date(cliente.dataNascimento).toISOString().slice(0, 10)
      : null,
    email: cliente.email,
    whatsapp: cliente.whatsapp,
    canal_origem: cliente.canalOrigem,
    endereco: cliente.endereco,
    observacoes_internas: cliente.observacoesInternas ?? null,
  }
}

// ─── Vendas ────────────────────────────────────────────────────────────────

// Formato de uma linha da tabela `itens_venda`, como retornado pela Supabase.
export interface LinhaItemVenda {
  id: number
  venda_id: number
  produto_id: number
  nome_produto: string
  quantidade: number
  preco_unitario: number
  subtotal: number
}

// Formato de uma linha da tabela `vendas`, como retornado pela Supabase.
export interface LinhaVenda {
  id: number
  numero_pedido: string
  cliente_id: number | null
  desconto: number
  total: number
  canal_venda: Venda['canalVenda']
  forma_pagamento: Venda['formaPagamento']
  status_pagamento: Venda['statusPagamento']
  tipo_entrega: Venda['tipoEntrega']
  status_entrega: Venda['statusEntrega']
  observacoes: string | null
  criado_em: string
}

/** Linha de `vendas` com os itens da tabela `itens_venda` já carregados (join aninhado). */
export interface LinhaVendaComItens extends LinhaVenda {
  itens_venda: LinhaItemVenda[]
}

/** Converte uma linha da tabela `itens_venda` (snake_case) para o tipo de domínio `ItemVenda`. */
export function linhaParaItemVenda(linha: LinhaItemVenda): ItemVenda {
  return {
    id: linha.id,
    produtoId: linha.produto_id,
    nomeProduto: linha.nome_produto,
    quantidade: linha.quantidade,
    precoUnitario: linha.preco_unitario,
    subtotal: linha.subtotal,
  }
}

/** Converte uma linha de `vendas` (com os itens já aninhados) para o tipo de domínio `Venda`. */
export function linhaParaVenda(linha: LinhaVendaComItens): Venda {
  return {
    id: linha.id,
    numeroPedido: linha.numero_pedido,
    clienteId: linha.cliente_id ?? undefined,
    itens: (linha.itens_venda ?? []).map(linhaParaItemVenda),
    desconto: linha.desconto,
    total: linha.total,
    canalVenda: linha.canal_venda,
    formaPagamento: linha.forma_pagamento,
    statusPagamento: linha.status_pagamento,
    tipoEntrega: linha.tipo_entrega,
    statusEntrega: linha.status_entrega,
    observacoes: linha.observacoes ?? undefined,
    criadoEm: new Date(linha.criado_em),
  }
}

/**
 * Converte uma venda (sem id/total/criadoEm) já com o total calculado para a carga da
 * RPC transacional `registrar_venda`, que insere a venda, os itens e baixa o estoque.
 */
export function vendaParaPayloadRpc(
  entrada: Omit<Venda, 'id' | 'total' | 'criadoEm'>,
  total: number
) {
  return {
    p_venda: {
      numero_pedido: entrada.numeroPedido,
      cliente_id: entrada.clienteId ?? null,
      desconto: entrada.desconto,
      total,
      canal_venda: entrada.canalVenda,
      forma_pagamento: entrada.formaPagamento,
      status_pagamento: entrada.statusPagamento,
      tipo_entrega: entrada.tipoEntrega,
      status_entrega: entrada.statusEntrega,
      observacoes: entrada.observacoes ?? null,
    },
    p_itens: entrada.itens.map((item) => ({
      produto_id: item.produtoId,
      nome_produto: item.nomeProduto,
      quantidade: item.quantidade,
      preco_unitario: item.precoUnitario,
      subtotal: item.subtotal,
    })),
  }
}

// ─── Insumos ───────────────────────────────────────────────────────────────

// Formato de uma linha da tabela `insumos`, como retornado pela Supabase.
export interface LinhaInsumo {
  id: number
  nome: string
  categoria: Insumo['categoria']
  unidade_medida: Insumo['unidadeMedida']
  preco_unitario: number
  fornecedor: string | null
  quantidade_embalagem: number | null
  preco_embalagem: number | null
  criado_em: string
  atualizado_em: string
}

/** Converte uma linha da tabela `insumos` (snake_case) para o tipo de domínio `Insumo`. */
export function linhaParaInsumo(linha: LinhaInsumo): Insumo {
  return {
    id: linha.id,
    nome: linha.nome,
    categoria: linha.categoria,
    unidadeMedida: linha.unidade_medida,
    precoUnitario: linha.preco_unitario,
    fornecedor: linha.fornecedor ?? undefined,
    quantidadeEmbalagem: linha.quantidade_embalagem ?? undefined,
    precoEmbalagem: linha.preco_embalagem ?? undefined,
    criadoEm: new Date(linha.criado_em),
    atualizadoEm: new Date(linha.atualizado_em),
  }
}

/** Converte um `Insumo` (sem id/datas geradas pelo banco) para a carga a persistir na Supabase. */
export function insumoParaLinha(insumo: Omit<Insumo, 'id' | 'criadoEm' | 'atualizadoEm'>) {
  return {
    nome: insumo.nome,
    categoria: insumo.categoria,
    unidade_medida: insumo.unidadeMedida,
    preco_unitario: insumo.precoUnitario,
    fornecedor: insumo.fornecedor ?? null,
    quantidade_embalagem: insumo.quantidadeEmbalagem ?? null,
    preco_embalagem: insumo.precoEmbalagem ?? null,
  }
}

// Formato de uma linha da tabela `produto_insumos`, com o insumo relacionado já
// aninhado via join (select com `insumos ( nome, unidade_medida, preco_unitario )`).
export interface LinhaProdutoInsumo {
  id: number
  produto_id: number
  insumo_id: number
  quantidade: number
  criado_em: string
  insumos: {
    nome: string
    unidade_medida: Insumo['unidadeMedida']
    preco_unitario: number
  }
}

/**
 * Converte uma linha de `produto_insumos` (com o insumo relacionado aninhado) para o
 * tipo de domínio `ItemReceita`. O subtotal é calculado a partir da quantidade da
 * receita e do preço unitário vigente do insumo.
 */
export function linhaParaItemReceita(linha: LinhaProdutoInsumo): ItemReceita {
  return {
    insumoId: linha.insumo_id,
    nomeInsumo: linha.insumos.nome,
    unidadeMedida: linha.insumos.unidade_medida,
    quantidade: linha.quantidade,
    subtotal: linha.quantidade * linha.insumos.preco_unitario,
  }
}

// ─── Gestoras ──────────────────────────────────────────────────────────────

// Formato de uma linha devolvida pela RPC `listar_gestoras` — o CPF já vem decifrado
// (a função só é executável pelo papel master) e nunca inclui `cpf_cifrado`.
export interface LinhaGestora {
  id: number
  nome: string
  papel: Gestora['papel']
  email: string
  telefone: string
  cpf: string
  deve_trocar_senha: boolean
  criado_em: string
}

/** Converte uma linha de `listar_gestoras` (snake_case) para o tipo de domínio `Gestora`. */
export function linhaParaGestora(linha: LinhaGestora): Gestora {
  return {
    id: linha.id,
    nome: linha.nome,
    papel: linha.papel,
    email: linha.email,
    telefone: linha.telefone,
    cpf: linha.cpf,
    deveTrocarSenha: linha.deve_trocar_senha,
    criadoEm: new Date(linha.criado_em),
  }
}
