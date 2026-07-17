import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '@/servicos/supabase'
import { calcularMargem, calcularMarkup, calcularMargemMedia, estaAbaixoEstoqueMinimo } from '@/utils/calculadores'
import { schemaProduto } from '@/utils/validadores'
import { RPC_REGISTRAR_PRODUTO, TABELAS } from '@/constantes'
import { linhaParaProduto, produtoParaPayloadRpc, type LinhaProduto } from '@/servicos/mapeadores'
import type { Produto } from '@/tipos'

type EntradaNovoProduto = Omit<Produto, 'id' | 'margem' | 'markup' | 'criadoEm' | 'atualizadoEm'>
type EntradaEdicaoProduto = Omit<Produto, 'margem' | 'markup' | 'criadoEm' | 'atualizadoEm'>

// Colunas de `produtos` com a receita de insumos (`produto_insumos`) já aninhada via join,
// incluindo os dados vigentes do insumo relacionado para calcular o subtotal de cada item.
const SELECAO_PRODUTO_COM_RECEITA =
  '*, produto_insumos ( *, insumos ( nome, unidade_medida, preco_unitario ) )'

// Hook de domínio de produtos — lê e grava na tabela `produtos` da Supabase.
// Cálculos (margem/markup/estoque baixo/margem média) permanecem em utils/calculadores.
export function useProdutos() {
  const [produtos, setProdutos] = useState<Produto[]>([])

  // Carrega os produtos da Supabase na inicialização.
  useEffect(() => {
    let ativo = true
    supabase
      .from(TABELAS.PRODUTOS)
      .select(SELECAO_PRODUTO_COM_RECEITA)
      .then(({ data, error }) => {
        if (!ativo || error || !data) return
        setProdutos((data as LinhaProduto[]).map(linhaParaProduto))
      })
    return () => {
      ativo = false
    }
  }, [])

  const adicionarProduto = useCallback(async (entrada: EntradaNovoProduto) => {
    schemaProduto.parse(entrada)
    const margem = calcularMargem(entrada.custoProducao, entrada.precoVenda)
    const markup = calcularMarkup(entrada.custoProducao, entrada.precoVenda)
    const { p_produto, p_itens } = produtoParaPayloadRpc(entrada, margem, markup)

    const { data, error } = await supabase.rpc(RPC_REGISTRAR_PRODUTO, { p_produto, p_itens })

    if (error || !data) {
      throw error ?? new Error('Não foi possível cadastrar a vela.')
    }

    // A RPC retorna só a linha de `produtos` (sem o join de receita) — a receita
    // vem da própria entrada, já validada e enviada como `p_itens`.
    const novoProduto: Produto = { ...linhaParaProduto(data as LinhaProduto), receita: entrada.receita }
    setProdutos((atuais) => [...atuais, novoProduto])
    return novoProduto
  }, [])

  const editarProduto = useCallback(async (entrada: EntradaEdicaoProduto) => {
    schemaProduto.parse(entrada)
    const margem = calcularMargem(entrada.custoProducao, entrada.precoVenda)
    const markup = calcularMarkup(entrada.custoProducao, entrada.precoVenda)
    const { p_produto, p_itens } = produtoParaPayloadRpc(entrada, margem, markup)

    const { data, error } = await supabase.rpc(RPC_REGISTRAR_PRODUTO, { p_produto, p_itens })

    if (error || !data) {
      throw error ?? new Error('Não foi possível salvar as alterações da vela.')
    }

    const produtoAtualizado: Produto = {
      ...linhaParaProduto(data as LinhaProduto),
      receita: entrada.receita,
    }
    setProdutos((atuais) => atuais.map((p) => (p.id === entrada.id ? produtoAtualizado : p)))
  }, [])

  const removerProduto = useCallback(async (id: number) => {
    const { error } = await supabase.from(TABELAS.PRODUTOS).delete().eq('id', id)
    if (error) {
      throw error
    }
    setProdutos((atuais) => atuais.filter((p) => p.id !== id))
  }, [])

  const desativarProduto = useCallback(
    async (id: number) => {
      const produto = produtos.find((p) => p.id === id)
      if (!produto) return

      const { data, error } = await supabase
        .from(TABELAS.PRODUTOS)
        .update({ ativo: !produto.ativo, atualizado_em: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error || !data) {
        throw error ?? new Error('Não foi possível atualizar o status da vela.')
      }

      const produtoAtualizado = linhaParaProduto(data as LinhaProduto)
      setProdutos((atuais) => atuais.map((p) => (p.id === id ? produtoAtualizado : p)))
    },
    [produtos]
  )

  const duplicarProduto = useCallback(
    async (id: number) => {
      const original = produtos.find((p) => p.id === id)
      if (!original) return

      const entradaCopia = {
        ...original,
        id: undefined,
        nome: `${original.nome} (cópia)`,
        estoqueAtual: 0,
      }
      const margem = calcularMargem(original.custoProducao, original.precoVenda)
      const markup = calcularMarkup(original.custoProducao, original.precoVenda)
      const { p_produto, p_itens } = produtoParaPayloadRpc(entradaCopia, margem, markup)

      const { data, error } = await supabase.rpc(RPC_REGISTRAR_PRODUTO, { p_produto, p_itens })

      if (error || !data) {
        throw error ?? new Error('Não foi possível duplicar a vela.')
      }

      const copia: Produto = { ...linhaParaProduto(data as LinhaProduto), receita: original.receita }
      setProdutos((atuais) => [...atuais, copia])
    },
    [produtos]
  )

  const buscarProdutoPorId = useCallback(
    (id: number) => produtos.find((p) => p.id === id),
    [produtos]
  )

  const produtosAtivos = useMemo(
    () => produtos.filter((p) => p.ativo),
    [produtos]
  )

  const produtosComEstoqueBaixo = useMemo(
    () => produtos.filter((p) => p.ativo && estaAbaixoEstoqueMinimo(p)),
    [produtos]
  )

  const margemMedia = useMemo(() => calcularMargemMedia(produtos), [produtos])

  return {
    produtos,
    produtosAtivos,
    produtosComEstoqueBaixo,
    margemMedia,
    adicionarProduto,
    editarProduto,
    removerProduto,
    desativarProduto,
    duplicarProduto,
    buscarProdutoPorId,
  }
}
