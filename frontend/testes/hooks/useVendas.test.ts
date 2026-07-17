// Testes do hook useVendas — registro (RPC transacional com baixa de estoque) e
// histórico de vendas persistidos nas tabelas `vendas`/`itens_venda` da Supabase.
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useVendas } from '@/hooks/useVendas'
import { supabase } from '@/servicos/supabase'
import type { LinhaVendaComItens } from '@/servicos/mapeadores'

vi.mock('@/servicos/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}))

// ─── Fixtures ────────────────────────────────────────────────────────────────

const linhaVendaExistente: LinhaVendaComItens = {
  id: 1,
  numero_pedido: 'PSQ-100001',
  cliente_id: 3,
  desconto: 0,
  total: 170,
  canal_venda: 'instagram',
  forma_pagamento: 'pix',
  status_pagamento: 'pago',
  tipo_entrega: 'correios',
  status_entrega: 'entregue',
  observacoes: null,
  criado_em: '2024-10-05T00:00:00.000Z',
  itens_venda: [
    {
      id: 10,
      venda_id: 1,
      produto_id: 4,
      nome_produto: 'Pertencimento',
      quantidade: 2,
      preco_unitario: 85,
      subtotal: 170,
    },
  ],
}

const entradaNovaVenda = {
  clienteId: 3,
  itens: [
    { produtoId: 1, nomeProduto: 'Recomeços', quantidade: 2, precoUnitario: 68, subtotal: 136 },
  ],
  desconto: 0,
  canalVenda: 'site' as const,
  formaPagamento: 'pix' as const,
  statusPagamento: 'pago' as const,
  tipoEntrega: 'retirada' as const,
  statusEntrega: 'aguardando' as const,
  observacoes: undefined,
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

describe('useVendas sobre Supabase', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('caso válido: registrarVenda chama a RPC registrar_venda com o payload correto e reflete a nova venda', async () => {
    const construtorCarga = criarConstrutorMock({ data: [], error: null })
    vi.mocked(supabase.from).mockReturnValueOnce(
      construtorCarga as unknown as ReturnType<typeof supabase.from>
    )
    vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: 501, error: null } as never)

    const { result } = renderHook(() => useVendas())
    await waitFor(() => expect(result.current.vendas).toEqual([]))

    await act(async () => {
      await result.current.registrarVenda(entradaNovaVenda)
    })

    expect(supabase.rpc).toHaveBeenCalledWith('registrar_venda', {
      p_venda: expect.objectContaining({
        cliente_id: 3,
        desconto: 0,
        total: 136,
        canal_venda: 'site',
        forma_pagamento: 'pix',
        status_pagamento: 'pago',
        tipo_entrega: 'retirada',
        status_entrega: 'aguardando',
      }),
      p_itens: [
        expect.objectContaining({
          produto_id: 1,
          nome_produto: 'Recomeços',
          quantidade: 2,
          preco_unitario: 68,
          subtotal: 136,
        }),
      ],
    })

    expect(result.current.vendas.some((v) => v.id === 501 && v.total === 136)).toBe(true)
  })

  it('caso de erro: RPC com estoque insuficiente é tratada sem corromper o estado', async () => {
    const construtorCarga = criarConstrutorMock({ data: [], error: null })
    vi.mocked(supabase.from).mockReturnValueOnce(
      construtorCarga as unknown as ReturnType<typeof supabase.from>
    )
    vi.mocked(supabase.rpc).mockResolvedValueOnce({
      data: null,
      error: { message: 'estoque insuficiente para o produto Recomeços' },
    } as never)

    const { result } = renderHook(() => useVendas())
    await waitFor(() => expect(result.current.vendas).toEqual([]))

    await expect(
      act(async () => {
        await result.current.registrarVenda(entradaNovaVenda)
      })
    ).rejects.toBeTruthy()

    expect(result.current.vendas).toEqual([])
  })

  it('carrega o histórico de vendas com os itens já na inicialização', async () => {
    const construtorCarga = criarConstrutorMock({ data: [linhaVendaExistente], error: null })
    vi.mocked(supabase.from).mockReturnValueOnce(
      construtorCarga as unknown as ReturnType<typeof supabase.from>
    )

    const { result } = renderHook(() => useVendas())

    await waitFor(() => expect(result.current.vendas).toHaveLength(1))
    expect(result.current.vendas[0].itens[0].nomeProduto).toBe('Pertencimento')
    expect(result.current.vendas[0].id).toBe(1)
  })

  it('atualizarStatusVenda persiste a alteração via update e reflete no estado', async () => {
    const construtorCarga = criarConstrutorMock({ data: [linhaVendaExistente], error: null })
    const construtorUpdate = criarConstrutorMock({ data: null, error: null })
    vi.mocked(supabase.from)
      .mockReturnValueOnce(construtorCarga as unknown as ReturnType<typeof supabase.from>)
      .mockReturnValueOnce(construtorUpdate as unknown as ReturnType<typeof supabase.from>)

    const { result } = renderHook(() => useVendas())
    await waitFor(() => expect(result.current.vendas).toHaveLength(1))

    await act(async () => {
      await result.current.atualizarStatusVenda(1, {
        statusPagamento: 'pago',
        statusEntrega: 'enviado',
      })
    })

    expect(construtorUpdate.eq).toHaveBeenCalledWith('id', 1)
    expect(result.current.vendas[0].statusEntrega).toBe('enviado')
  })
})
