// Testes da seção "Receita e custo" do ModalNovoProduto — a gestora monta a receita de
// insumos e o custo de produção é calculado automaticamente (com override manual).
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within, waitFor } from '@testing-library/react'
import { ModalNovoProduto } from '@/componentes/compartilhados/ModalNovoProduto'
import { useInsumos } from '@/hooks/useInsumos'
import type { Insumo, Produto } from '@/tipos'

vi.mock('@/hooks/useInsumos')

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
    precoUnitario: 0.8,
    criadoEm: new Date('2024-01-01'),
    atualizadoEm: new Date('2024-01-01'),
  },
]

function mockarUseInsumos() {
  vi.mocked(useInsumos).mockReturnValue({
    insumos: insumosFixture,
    insumosOrdenados: insumosFixture,
    adicionarInsumo: vi.fn(),
    editarInsumo: vi.fn(),
    removerInsumo: vi.fn(),
    buscarInsumoPorId: (id: number) => insumosFixture.find((i) => i.id === id),
  })
}

async function abrirModal() {
  render(
    <ModalNovoProduto aberto aoFechar={vi.fn()} aoSalvar={vi.fn()} />
  )
  return screen.findByRole('dialog')
}

function selecionarInsumo(dialog: HTMLElement, nomeInsumo: string) {
  const seletor = within(dialog).getByLabelText(/insumo/i) as HTMLSelectElement
  fireEvent.change(seletor, { target: { value: nomeInsumo } })
}

function preencherQuantidade(dialog: HTMLElement, valor: string) {
  const campo = within(dialog).getByLabelText(/^quantidade(\s\(.+\))?$/i) as HTMLInputElement
  fireEvent.change(campo, { target: { value: valor } })
}

function clicarAdicionar(dialog: HTMLElement) {
  fireEvent.click(within(dialog).getByRole('button', { name: /adicionar insumo/i }))
}

describe('ModalNovoProduto — Receita e custo', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockarUseInsumos()
  })

  it('caso válido: adicionar 2 insumos calcula o custo de produção com o percentual de extras', async () => {
    const dialog = await abrirModal()

    // Insumo 1: cera de soja, 50 g × R$0,05 = R$2,50
    selecionarInsumo(dialog, '1')
    preencherQuantidade(dialog, '50')
    clicarAdicionar(dialog)

    // Insumo 2: fragrância X, 10 ml × R$0,80 = R$8,00
    selecionarInsumo(dialog, '2')
    preencherQuantidade(dialog, '10')
    clicarAdicionar(dialog)

    // % de custos extras = 10
    const campoExtras = within(dialog).getByLabelText(/custos extras/i) as HTMLInputElement
    fireEvent.change(campoExtras, { target: { value: '10' } })

    // Custo dos insumos = 2,50 + 8,00 = 10,50 ; com 10% extra = 11,55
    expect(within(dialog).getByText(/10,50/)).toBeInTheDocument()

    const campoCusto = within(dialog).getByLabelText(/custo de produção/i) as HTMLInputElement
    expect(Number(campoCusto.value)).toBeCloseTo(11.55, 2)
  })

  it('caso válido: alterar a quantidade de um item da receita recalcula o custo em tempo real', async () => {
    const dialog = await abrirModal()

    selecionarInsumo(dialog, '1')
    preencherQuantidade(dialog, '50')
    clicarAdicionar(dialog)

    const campoCustoAntes = within(dialog).getByLabelText(/custo de produção/i) as HTMLInputElement
    expect(Number(campoCustoAntes.value)).toBeCloseTo(2.5, 2)

    const campoQuantidadeLinha = within(dialog).getByLabelText(/quantidade de cera de soja na receita/i) as HTMLInputElement
    fireEvent.change(campoQuantidadeLinha, { target: { value: '100' } })

    const campoCustoDepois = within(dialog).getByLabelText(/custo de produção/i) as HTMLInputElement
    expect(Number(campoCustoDepois.value)).toBeCloseTo(5, 2)
  })

  it('caso de erro: quantidade zero/negativa não adiciona o insumo à receita', async () => {
    const dialog = await abrirModal()

    selecionarInsumo(dialog, '1')
    preencherQuantidade(dialog, '0')
    clicarAdicionar(dialog)

    expect(within(dialog).queryByText(/cera de soja/i, { selector: 'td, span, p' })).not.toBeInTheDocument()
    expect(within(dialog).getByText(/nenhum insumo adicionado/i)).toBeInTheDocument()
  })

  it('caso de erro: adicionar o mesmo insumo duas vezes é impedido com aviso', async () => {
    const dialog = await abrirModal()

    selecionarInsumo(dialog, '1')
    preencherQuantidade(dialog, '50')
    clicarAdicionar(dialog)

    selecionarInsumo(dialog, '1')
    preencherQuantidade(dialog, '20')
    clicarAdicionar(dialog)

    expect(within(dialog).getByText(/já está na receita/i)).toBeInTheDocument()
    // Só uma linha de cera de soja na receita
    expect(within(dialog).getAllByLabelText(/quantidade de cera de soja na receita/i)).toHaveLength(1)
  })

  it('caso de erro: remover todos os insumos zera o custo calculado sem quebrar margem/markup', async () => {
    const dialog = await abrirModal()

    selecionarInsumo(dialog, '1')
    preencherQuantidade(dialog, '50')
    clicarAdicionar(dialog)

    const botaoRemover = within(dialog).getByRole('button', { name: /remover cera de soja da receita/i })
    fireEvent.click(botaoRemover)

    const campoCusto = within(dialog).getByLabelText(/custo de produção/i) as HTMLInputElement
    expect(Number(campoCusto.value)).toBe(0)
    expect(within(dialog).getByText(/nenhum insumo adicionado/i)).toBeInTheDocument()
    // Margem/markup continuam renderizados sem erro
    expect(within(dialog).getByText('Margem')).toBeInTheDocument()
    expect(within(dialog).getByText('Markup')).toBeInTheDocument()
  })

  it('caso válido: editar o custo à mão preserva o override ao mudar a receita, e "Recalcular da receita" volta ao valor calculado', async () => {
    const dialog = await abrirModal()

    // Insumo 1: cera de soja, 50 g × R$0,05 = R$2,50 (custo calculado inicial)
    selecionarInsumo(dialog, '1')
    preencherQuantidade(dialog, '50')
    clicarAdicionar(dialog)

    const campoCusto = within(dialog).getByLabelText(/custo de produção/i) as HTMLInputElement
    expect(Number(campoCusto.value)).toBeCloseTo(2.5, 2)
    expect(within(dialog).getByText(/calculado da receita/i)).toBeInTheDocument()

    // Gestora edita o custo à mão
    fireEvent.change(campoCusto, { target: { value: '12' } })
    expect(within(dialog).getByText(/valor editado manualmente/i)).toBeInTheDocument()

    // Alterar a quantidade de um item NÃO deve sobrescrever o valor manual
    const campoQuantidadeLinha = within(dialog).getByLabelText(
      /quantidade de cera de soja na receita/i
    ) as HTMLInputElement
    fireEvent.change(campoQuantidadeLinha, { target: { value: '100' } })

    const campoCustoAposReceita = within(dialog).getByLabelText(/custo de produção/i) as HTMLInputElement
    expect(Number(campoCustoAposReceita.value)).toBeCloseTo(12, 2)
    expect(within(dialog).getByText(/valor editado manualmente/i)).toBeInTheDocument()

    // "Recalcular da receita" volta ao valor calculado (100 g × R$0,05 = R$5,00)
    fireEvent.click(within(dialog).getByRole('button', { name: /recalcular da receita/i }))

    const campoCustoRecalculado = within(dialog).getByLabelText(/custo de produção/i) as HTMLInputElement
    expect(Number(campoCustoRecalculado.value)).toBeCloseTo(5, 2)
    expect(within(dialog).getByText(/calculado da receita/i)).toBeInTheDocument()
  })
})

// Preenche os campos obrigatórios do form (fora de Tags) para o submit passar na validação
// Zod — nome, intenção, notas aromáticas, recipiente, custo, preço, descrição e história.
function preencherCamposObrigatorios(dialog: HTMLElement) {
  fireEvent.change(within(dialog).getByLabelText(/nome da vela/i), { target: { value: 'Vela de teste' } })
  fireEvent.change(within(dialog).getByLabelText(/intenção/i), { target: { value: 'Para quem busca calma' } })
  fireEvent.change(within(dialog).getByLabelText(/nota de topo/i), { target: { value: 'Alecrim' } })
  fireEvent.change(within(dialog).getByLabelText(/nota de coração/i), { target: { value: 'Palo Santo' } })
  fireEvent.change(within(dialog).getByLabelText(/nota de fundo/i), { target: { value: 'Baunilha' } })
  fireEvent.change(within(dialog).getByLabelText(/recipiente/i), { target: { value: 'Pote de vidro âmbar' } })
  fireEvent.change(within(dialog).getByLabelText(/custo de produção/i), { target: { value: '10' } })
  fireEvent.change(within(dialog).getByLabelText(/preço de venda/i), { target: { value: '30' } })
  fireEvent.change(within(dialog).getByLabelText(/descrição curta/i), {
    target: { value: 'Uma vela para trazer calma ao ambiente' },
  })
  fireEvent.change(within(dialog).getByLabelText(/história da vela/i), {
    target: { value: 'Nasceu do desejo de trazer aconchego para a rotina da casa.' },
  })
}

async function submeter(dialog: HTMLElement, aoSalvar: ReturnType<typeof vi.fn>) {
  fireEvent.click(within(dialog).getByRole('button', { name: /cadastrar vela|salvar alterações/i }))
  await waitFor(() => expect(aoSalvar).toHaveBeenCalled())
}

const produtoBaseParaEdicao: Produto = {
  id: 1,
  nome: 'Vela existente',
  intencao: 'Para quem busca calma',
  tipoCera: 'vegetal-soja',
  granulometria: 'fina',
  gramagem: 200,
  notasAromaticas: { topo: 'Alecrim', coracao: 'Palo Santo', fundo: 'Baunilha' },
  percentualFragrancia: 8,
  tipoPavio: 'algodao',
  corCera: '#F5F0E8',
  recipiente: 'Pote de vidro âmbar',
  tempoQueima: 40,
  custoProducao: 10,
  precoVenda: 30,
  margem: 66.6,
  markup: 200,
  categoria: 'uso-diario',
  tags: [],
  estoqueAtual: 0,
  estoqueMinimo: 5,
  descricaoCurta: 'Uma vela para trazer calma ao ambiente',
  historiaVela: 'Nasceu do desejo de trazer aconchego para a rotina da casa.',
  ativo: true,
  percentualCustosExtras: 0,
  receita: [],
  criadoEm: new Date('2024-01-01'),
  atualizadoEm: new Date('2024-01-01'),
}

describe('ModalNovoProduto — Tags', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockarUseInsumos()
  })

  it('caso válido: digitar "renovação, rituais, calma" resulta em 3 tags no payload salvo', async () => {
    const aoSalvar = vi.fn()
    render(<ModalNovoProduto aberto aoFechar={vi.fn()} aoSalvar={aoSalvar} />)
    const dialog = await screen.findByRole('dialog')

    const campoTags = within(dialog).getByLabelText(/tags/i) as HTMLInputElement
    fireEvent.change(campoTags, { target: { value: 'renovação, rituais, calma' } })
    expect(campoTags.value).toBe('renovação, rituais, calma')

    preencherCamposObrigatorios(dialog)
    await submeter(dialog, aoSalvar)

    expect(aoSalvar).toHaveBeenCalledWith(
      expect.objectContaining({ tags: ['renovação', 'rituais', 'calma'] })
    )
  })

  it('caso de borda: vírgulas/espaços extras ("a,, b ,") não geram tags vazias no payload salvo', async () => {
    const aoSalvar = vi.fn()
    render(<ModalNovoProduto aberto aoFechar={vi.fn()} aoSalvar={aoSalvar} />)
    const dialog = await screen.findByRole('dialog')

    const campoTags = within(dialog).getByLabelText(/tags/i) as HTMLInputElement
    fireEvent.change(campoTags, { target: { value: 'a,, b ,' } })
    expect(campoTags.value).toBe('a,, b ,')

    preencherCamposObrigatorios(dialog)
    await submeter(dialog, aoSalvar)

    expect(aoSalvar).toHaveBeenCalledWith(expect.objectContaining({ tags: ['a', 'b'] }))
  })

  it('caso válido: editar uma vela existente carrega as tags no campo e preserva ao salvar sem alterar', async () => {
    const aoSalvar = vi.fn()
    const produtoExistente = {
      ...produtoBaseParaEdicao,
      tags: ['ritual', 'calma'],
    }
    render(
      <ModalNovoProduto
        aberto
        aoFechar={vi.fn()}
        aoSalvar={aoSalvar}
        produtoParaEditar={produtoExistente}
      />
    )
    const dialog = await screen.findByRole('dialog')

    const campoTags = within(dialog).getByLabelText(/tags/i) as HTMLInputElement
    expect(campoTags.value).toBe('ritual, calma')

    await submeter(dialog, aoSalvar)

    expect(aoSalvar).toHaveBeenCalledWith(expect.objectContaining({ tags: ['ritual', 'calma'] }))
  })
})
