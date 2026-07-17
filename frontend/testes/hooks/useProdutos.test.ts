// Testes do hook useProdutos — CRUD de produtos (com receita de insumos) persistido via a
// RPC transacional `registrar_produto_com_receita` na Supabase.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useProdutos } from '@/hooks/useProdutos'
import { supabase } from '@/servicos/supabase'
import {
  calcularMargem,
  calcularMarkup,
  calcularCustoInsumos,
  calcularCustoComExtras,
} from '@/utils/calculadores'
import type { LinhaProduto, LinhaProdutoInsumo } from '@/servicos/mapeadores'
import type { Insumo } from '@/tipos'

vi.mock('@/servicos/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}))

// ─── Fixtures ────────────────────────────────────────────────────────────────

// Insumos usados para tornar o `custoProducao` das fixtures de receita coerente
// (soma dos subtotais × (1 + percentual de custos extras)).
const insumosFixture: Insumo[] = [
  {
    id: 1,
    nome: 'Cera de soja',
    categoria: 'cera',
    unidadeMedida: 'g',
    precoUnitario: 0.05,
    criadoEm: new Date('2024-01-01'),
    atualizadoEm: new Date('2024-01-01'),
  },
  {
    id: 2,
    nome: 'Fragrância X',
    categoria: 'fragrancia',
    unidadeMedida: 'ml',
    precoUnitario: 0.5,
    criadoEm: new Date('2024-01-01'),
    atualizadoEm: new Date('2024-01-01'),
  },
]

const produtoInsumosExistente: LinhaProdutoInsumo[] = [
  {
    id: 1,
    produto_id: 1,
    insumo_id: 1,
    quantidade: 100,
    criado_em: '2024-01-15T00:00:00.000Z',
    insumos: { nome: 'Cera de soja', unidade_medida: 'g', preco_unitario: 0.05 },
  },
  {
    id: 2,
    produto_id: 1,
    insumo_id: 2,
    quantidade: 10,
    criado_em: '2024-01-15T00:00:00.000Z',
    insumos: { nome: 'Fragrância X', unidade_medida: 'ml', preco_unitario: 0.5 },
  },
]

const linhaExistente: LinhaProduto = {
  id: 1,
  nome: 'Recomeços',
  intencao: 'Para quem busca um novo começo',
  tipo_cera: 'vegetal-soja',
  granulometria: 'fina',
  gramagem: 200,
  notas_aromaticas: { topo: 'Alecrim', coracao: 'Palo Santo', fundo: 'Baunilha' },
  percentual_fragrancia: 8,
  tipo_pavio: 'algodao',
  cor_cera: '#F5F0E8',
  recipiente: 'Pote de vidro âmbar 200ml',
  tempo_queima: 40,
  custo_producao: 18,
  preco_venda: 68,
  margem: calcularMargem(18, 68),
  markup: calcularMarkup(18, 68),
  categoria: 'para-rituais',
  tags: ['renovação'],
  estoque_atual: 12,
  estoque_minimo: 5,
  descricao_curta: 'Uma vela para marcar o início de um novo ciclo.',
  historia_vela: 'Nasceu do desejo de criar um ritual de transição.',
  ativo: true,
  percentual_custos_extras: 10,
  criado_em: '2024-01-15T00:00:00.000Z',
  atualizado_em: '2024-11-10T00:00:00.000Z',
  produto_insumos: produtoInsumosExistente,
}

const receitaNovoProduto = [
  { insumoId: 1, nomeInsumo: 'Cera de soja', unidadeMedida: 'g' as const, quantidade: 180, subtotal: 9 },
  { insumoId: 2, nomeInsumo: 'Fragrância X', unidadeMedida: 'ml' as const, quantidade: 16, subtotal: 8 },
]

const percentualCustosExtrasNovoProduto = 5
// custoProducao coerente com a receita: soma dos subtotais × (1 + % de custos extras),
// deixando o teste honesto sobre o que é persistido (o cálculo em si é da UI, Task 3.2.1).
const custoProducaoNovoProduto = calcularCustoComExtras(
  calcularCustoInsumos(receitaNovoProduto, insumosFixture),
  percentualCustosExtrasNovoProduto
)

const entradaNovoProduto = {
  nome: 'Aurora',
  intencao: 'Para começar o dia com leveza e clareza',
  tipoCera: 'vegetal-soja' as const,
  granulometria: 'fina' as const,
  gramagem: 200,
  notasAromaticas: { topo: 'Laranja', coracao: 'Gengibre', fundo: 'Baunilha' },
  percentualFragrancia: 8,
  tipoPavio: 'algodao' as const,
  corCera: '#F5F0E8',
  recipiente: 'Pote de vidro 200ml',
  tempoQueima: 40,
  custoProducao: custoProducaoNovoProduto,
  precoVenda: 68,
  categoria: 'uso-diario' as const,
  tags: ['manhã'],
  estoqueAtual: 10,
  estoqueMinimo: 5,
  descricaoCurta: 'Uma vela para começar o dia com leveza e presença.',
  historiaVela: 'Criada para acompanhar as manhãs mais leves, com notas cítricas que despertam.',
  ativo: true,
  percentualCustosExtras: percentualCustosExtrasNovoProduto,
  receita: receitaNovoProduto,
}

const linhaNovoProdutoInserido: LinhaProduto = {
  id: 101,
  nome: entradaNovoProduto.nome,
  intencao: entradaNovoProduto.intencao,
  tipo_cera: entradaNovoProduto.tipoCera,
  granulometria: entradaNovoProduto.granulometria,
  gramagem: entradaNovoProduto.gramagem,
  notas_aromaticas: entradaNovoProduto.notasAromaticas,
  percentual_fragrancia: entradaNovoProduto.percentualFragrancia,
  tipo_pavio: entradaNovoProduto.tipoPavio,
  cor_cera: entradaNovoProduto.corCera,
  recipiente: entradaNovoProduto.recipiente,
  tempo_queima: entradaNovoProduto.tempoQueima,
  custo_producao: entradaNovoProduto.custoProducao,
  preco_venda: entradaNovoProduto.precoVenda,
  margem: calcularMargem(entradaNovoProduto.custoProducao, entradaNovoProduto.precoVenda),
  markup: calcularMarkup(entradaNovoProduto.custoProducao, entradaNovoProduto.precoVenda),
  categoria: entradaNovoProduto.categoria,
  tags: entradaNovoProduto.tags,
  estoque_atual: entradaNovoProduto.estoqueAtual,
  estoque_minimo: entradaNovoProduto.estoqueMinimo,
  descricao_curta: entradaNovoProduto.descricaoCurta,
  historia_vela: entradaNovoProduto.historiaVela,
  ativo: entradaNovoProduto.ativo,
  percentual_custos_extras: entradaNovoProduto.percentualCustosExtras,
  criado_em: '2026-01-01T00:00:00.000Z',
  atualizado_em: '2026-01-01T00:00:00.000Z',
  // A RPC retorna a linha de `produtos`, sem o join de receita — o hook usa a receita
  // da própria entrada para compor o estado local.
}

// ─── Construtor de mock para a cadeia do supabase-js (chainable + thenable) ──

type ResultadoMock = { data: unknown; error: unknown }

function criarConstrutorMock(resultado: ResultadoMock) {
  const construtor = {
    select: vi.fn(() => construtor),
    insert: vi.fn(() => construtor),
    update: vi.fn(() => construtor),
    delete: vi.fn(() => construtor),
    eq: vi.fn(() => construtor),
    single: vi.fn(() => Promise.resolve(resultado)),
    then: (aoResolver: (r: ResultadoMock) => unknown) =>
      Promise.resolve(resultado).then(aoResolver),
  }
  return construtor
}

describe('useProdutos sobre Supabase', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('caso válido: adicionarProduto chama a RPC registrar_produto_com_receita com o payload correto e reflete no estado', async () => {
    const construtorCarga = criarConstrutorMock({ data: [], error: null })
    vi.mocked(supabase.from).mockReturnValueOnce(
      construtorCarga as unknown as ReturnType<typeof supabase.from>
    )
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: linhaNovoProdutoInserido,
      error: null,
    } as never)

    const { result } = renderHook(() => useProdutos())
    await waitFor(() => expect(result.current.produtos).toEqual([]))

    await act(async () => {
      await result.current.adicionarProduto(entradaNovoProduto)
    })

    expect(supabase.rpc).toHaveBeenCalledWith('registrar_produto_com_receita', {
      p_produto: expect.objectContaining({
        nome: 'Aurora',
        percentual_custos_extras: percentualCustosExtrasNovoProduto,
        custo_producao: custoProducaoNovoProduto,
        preco_venda: 68,
      }),
      p_itens: [
        { insumo_id: 1, quantidade: 180 },
        { insumo_id: 2, quantidade: 16 },
      ],
    })

    const produtoInserido = result.current.produtos.find((p) => p.id === 101)
    expect(produtoInserido?.nome).toBe('Aurora')
    expect(produtoInserido?.receita).toHaveLength(2)
  })

  it('caso de erro: RPC com FK inválida é tratada sem corromper o estado', async () => {
    const construtorCarga = criarConstrutorMock({ data: [], error: null })
    vi.mocked(supabase.from).mockReturnValueOnce(
      construtorCarga as unknown as ReturnType<typeof supabase.from>
    )
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: null,
      error: { message: 'insira um insumo válido: violação de chave estrangeira' },
    } as never)

    const { result } = renderHook(() => useProdutos())
    await waitFor(() => expect(result.current.produtos).toEqual([]))

    await expect(
      act(async () => {
        await result.current.adicionarProduto(entradaNovoProduto)
      })
    ).rejects.toBeTruthy()

    expect(result.current.produtos).toEqual([])
  })

  it('caso de erro: payload inválido não chama a RPC', async () => {
    const construtorCarga = criarConstrutorMock({ data: [], error: null })
    vi.mocked(supabase.from).mockReturnValueOnce(
      construtorCarga as unknown as ReturnType<typeof supabase.from>
    )

    const { result } = renderHook(() => useProdutos())
    await waitFor(() => expect(result.current.produtos).toEqual([]))

    await expect(
      act(async () => {
        await result.current.adicionarProduto({ ...entradaNovoProduto, nome: '' })
      })
    ).rejects.toBeTruthy()

    expect(supabase.rpc).not.toHaveBeenCalled()
    expect(result.current.produtos).toEqual([])
  })

  it('caso válido: editarProduto chama a RPC com o id e reflete a alteração no estado', async () => {
    const construtorCarga = criarConstrutorMock({ data: [linhaExistente], error: null })
    vi.mocked(supabase.from).mockReturnValueOnce(
      construtorCarga as unknown as ReturnType<typeof supabase.from>
    )
    const linhaAtualizada: LinhaProduto = { ...linhaExistente, preco_venda: 75 }
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: linhaAtualizada,
      error: null,
    } as never)

    const { result } = renderHook(() => useProdutos())
    await waitFor(() => expect(result.current.produtos).toHaveLength(1))

    const produtoOriginal = result.current.produtos[0]
    await act(async () => {
      await result.current.editarProduto({ ...produtoOriginal, precoVenda: 75 })
    })

    expect(supabase.rpc).toHaveBeenCalledWith(
      'registrar_produto_com_receita',
      expect.objectContaining({
        p_produto: expect.objectContaining({ id: 1, preco_venda: 75 }),
      })
    )
    expect(result.current.produtos[0].precoVenda).toBe(75)
  })

  it('caso válido: editarProduto removendo um insumo da receita envia p_itens sem o item removido', async () => {
    const construtorCarga = criarConstrutorMock({ data: [linhaExistente], error: null })
    vi.mocked(supabase.from).mockReturnValueOnce(
      construtorCarga as unknown as ReturnType<typeof supabase.from>
    )
    const linhaAtualizada: LinhaProduto = { ...linhaExistente }
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: linhaAtualizada,
      error: null,
    } as never)

    const { result } = renderHook(() => useProdutos())
    await waitFor(() => expect(result.current.produtos).toHaveLength(1))

    const produtoOriginal = result.current.produtos[0]
    expect(produtoOriginal.receita).toHaveLength(2)

    const receitaSemFragrancia = produtoOriginal.receita.filter((item) => item.insumoId !== 2)
    await act(async () => {
      await result.current.editarProduto({ ...produtoOriginal, receita: receitaSemFragrancia })
    })

    expect(supabase.rpc).toHaveBeenCalledWith(
      'registrar_produto_com_receita',
      expect.objectContaining({
        p_itens: [{ insumo_id: 1, quantidade: 100 }],
      })
    )
  })

  it('caso válido: removerProduto persiste a remoção e reflete no estado', async () => {
    const construtorCarga = criarConstrutorMock({ data: [linhaExistente], error: null })
    const construtorDelete = criarConstrutorMock({ data: null, error: null })
    vi.mocked(supabase.from)
      .mockReturnValueOnce(construtorCarga as unknown as ReturnType<typeof supabase.from>)
      .mockReturnValueOnce(construtorDelete as unknown as ReturnType<typeof supabase.from>)

    const { result } = renderHook(() => useProdutos())
    await waitFor(() => expect(result.current.produtos).toHaveLength(1))

    await act(async () => {
      await result.current.removerProduto(1)
    })

    expect(construtorDelete.eq).toHaveBeenCalledWith('id', 1)
    expect(result.current.produtos).toHaveLength(0)
  })
})
