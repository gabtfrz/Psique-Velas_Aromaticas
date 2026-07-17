// Testes da página Precificação — simulador de preço com pré-carga de custo de produto.
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Precificacao from '@/paginas/Precificacao'
import { useProdutos } from '@/hooks/useProdutos'
import { calcularPrecoSugerido } from '@/utils/calculadores'
import { formatarMoeda } from '@/utils/formatadores'

vi.mock('@/hooks/useProdutos')
vi.mock('@/hooks/useToast', () => ({
  useToast: () => ({ toasts: [], exibirToast: vi.fn(), removerToast: vi.fn() }),
}))

const produtoComCusto = {
  id: 1,
  nome: 'Vela Lavanda',
  intencao: 'relaxar',
  tipoCera: 'vegetal-soja' as const,
  granulometria: 'media' as const,
  gramagem: 200,
  notasAromaticas: { topo: '', coracao: '', fundo: '' },
  percentualFragrancia: 8,
  tipoPavio: 'algodao' as const,
  corCera: '#fff',
  recipiente: 'vidro',
  tempoQueima: 40,
  custoProducao: 20,
  precoVenda: 60,
  margem: 66.6,
  markup: 200,
  categoria: 'uso-diario' as const,
  tags: [],
  estoqueAtual: 10,
  estoqueMinimo: 2,
  descricaoCurta: '',
  historiaVela: '',
  ativo: true,
  percentualCustosExtras: 0,
  receita: [],
  criadoEm: new Date('2026-01-01'),
  atualizadoEm: new Date('2026-01-01'),
}

const produtoSemCusto = {
  ...produtoComCusto,
  id: 2,
  nome: 'Vela Sem Receita',
  custoProducao: 0,
  precoVenda: 0,
  margem: 0,
  markup: 0,
}

function mockUseProdutos(overrides: Partial<ReturnType<typeof useProdutos>> = {}) {
  const base = {
    produtos: [produtoComCusto, produtoSemCusto],
    produtosAtivos: [produtoComCusto, produtoSemCusto],
    produtosComEstoqueBaixo: [],
    margemMedia: 0,
    adicionarProduto: vi.fn(),
    editarProduto: vi.fn(),
    removerProduto: vi.fn(),
    desativarProduto: vi.fn(),
    duplicarProduto: vi.fn(),
    buscarProdutoPorId: vi.fn(),
  }
  vi.mocked(useProdutos).mockReturnValue({ ...base, ...overrides } as ReturnType<typeof useProdutos>)
  return { ...base, ...overrides }
}

describe('Precificacao — simulador com pré-carga de custo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseProdutos()
  })

  it('caso válido: selecionar um produto carrega o custo dele no simulador e calcula o preço sugerido', () => {
    render(<Precificacao />)

    const seletor = screen.getByLabelText(/carregar custo de um produto/i) as HTMLSelectElement
    fireEvent.change(seletor, { target: { value: String(produtoComCusto.id) } })

    const campoCusto = screen.getByLabelText(/custo de produção/i) as HTMLInputElement
    expect(Number(campoCusto.value.replace(',', '.'))).toBeCloseTo(produtoComCusto.custoProducao)

    const margemPadrao = 60
    const precoEsperado = calcularPrecoSugerido(produtoComCusto.custoProducao, margemPadrao)
    const precoSugerido = screen.getByText('Preço sugerido').parentElement
    expect(precoSugerido?.textContent?.replace(/\s/g, ' ')).toContain(
      formatarMoeda(precoEsperado).replace(/\s/g, ' ')
    )
  })

  it('caso de borda: selecionar produto com custo zero mantém o simulador funcional exibindo "—"', () => {
    render(<Precificacao />)

    const seletor = screen.getByLabelText(/carregar custo de um produto/i) as HTMLSelectElement
    fireEvent.change(seletor, { target: { value: String(produtoSemCusto.id) } })

    const campoCusto = screen.getByLabelText(/custo de produção/i) as HTMLInputElement
    expect(Number(campoCusto.value.replace(',', '.'))).toBe(0)

    const precoSugerido = screen.getByText('Preço sugerido').parentElement
    expect(precoSugerido).toHaveTextContent('—')
  })

  it('caso válido: editar o custo manualmente após carregar de um produto faz o valor digitado prevalecer', () => {
    render(<Precificacao />)

    const seletor = screen.getByLabelText(/carregar custo de um produto/i) as HTMLSelectElement
    fireEvent.change(seletor, { target: { value: String(produtoComCusto.id) } })

    const campoCusto = screen.getByLabelText(/custo de produção/i) as HTMLInputElement
    expect(Number(campoCusto.value.replace(',', '.'))).toBeCloseTo(produtoComCusto.custoProducao)

    fireEvent.change(campoCusto, { target: { value: '35' } })
    expect(Number(campoCusto.value.replace(',', '.'))).toBe(35)

    const margemPadrao = 60
    const precoEsperado = calcularPrecoSugerido(35, margemPadrao)
    const precoSugerido = screen.getByText('Preço sugerido').parentElement
    expect(precoSugerido?.textContent?.replace(/\s/g, ' ')).toContain(
      formatarMoeda(precoEsperado).replace(/\s/g, ' ')
    )
  })

  it('caso de borda: voltar o seletor para "— nenhum —" preserva o último custo carregado/editado', () => {
    render(<Precificacao />)

    const seletor = screen.getByLabelText(/carregar custo de um produto/i) as HTMLSelectElement
    fireEvent.change(seletor, { target: { value: String(produtoComCusto.id) } })

    const campoCusto = screen.getByLabelText(/custo de produção/i) as HTMLInputElement
    expect(Number(campoCusto.value.replace(',', '.'))).toBeCloseTo(produtoComCusto.custoProducao)

    fireEvent.change(seletor, { target: { value: '' } })

    expect(Number(campoCusto.value.replace(',', '.'))).toBeCloseTo(produtoComCusto.custoProducao)
  })
})
