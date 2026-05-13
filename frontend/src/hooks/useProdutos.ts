import { useCallback, useMemo } from 'react'
import { useArmazenamentoLocal } from './useArmazenamentoLocal'
import { produtosMock } from '@/dados/dadosMock'
import { calcularMargem, calcularMarkup, calcularMargemMedia, estaAbaixoEstoqueMinimo } from '@/utils/calculadores'
import { gerarId } from '@/utils/geradores'
import { CHAVES_STORAGE } from '@/constantes'
import type { Produto } from '@/tipos'

type EntradaNovoProduto = Omit<Produto, 'id' | 'margem' | 'markup' | 'criadoEm' | 'atualizadoEm'>
type EntradaEdicaoProduto = Omit<Produto, 'margem' | 'markup' | 'criadoEm' | 'atualizadoEm'>

export function useProdutos() {
  const [produtos, setProdutos] = useArmazenamentoLocal<Produto[]>(
    CHAVES_STORAGE.PRODUTOS,
    produtosMock
  )

  const adicionarProduto = useCallback(
    (entrada: EntradaNovoProduto) => {
      const novoProduto: Produto = {
        ...entrada,
        id: gerarId(),
        margem: calcularMargem(entrada.custoProducao, entrada.precoVenda),
        markup: calcularMarkup(entrada.custoProducao, entrada.precoVenda),
        criadoEm: new Date(),
        atualizadoEm: new Date(),
      }
      setProdutos([...produtos, novoProduto])
      return novoProduto
    },
    [produtos, setProdutos]
  )

  const editarProduto = useCallback(
    (entrada: EntradaEdicaoProduto) => {
      setProdutos(
        produtos.map((p) =>
          p.id === entrada.id
            ? {
                ...entrada,
                margem: calcularMargem(entrada.custoProducao, entrada.precoVenda),
                markup: calcularMarkup(entrada.custoProducao, entrada.precoVenda),
                criadoEm: p.criadoEm,
                atualizadoEm: new Date(),
              }
            : p
        )
      )
    },
    [produtos, setProdutos]
  )

  const removerProduto = useCallback(
    (id: string) => {
      setProdutos(produtos.filter((p) => p.id !== id))
    },
    [produtos, setProdutos]
  )

  const desativarProduto = useCallback(
    (id: string) => {
      setProdutos(
        produtos.map((p) =>
          p.id === id ? { ...p, ativo: !p.ativo, atualizadoEm: new Date() } : p
        )
      )
    },
    [produtos, setProdutos]
  )

  const duplicarProduto = useCallback(
    (id: string) => {
      const original = produtos.find((p) => p.id === id)
      if (!original) return
      const copia: Produto = {
        ...original,
        id: gerarId(),
        nome: `${original.nome} (cópia)`,
        estoqueAtual: 0,
        criadoEm: new Date(),
        atualizadoEm: new Date(),
      }
      setProdutos([...produtos, copia])
    },
    [produtos, setProdutos]
  )

  const buscarProdutoPorId = useCallback(
    (id: string) => produtos.find((p) => p.id === id),
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
