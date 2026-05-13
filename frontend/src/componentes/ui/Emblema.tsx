type TipoEmblema =
  | 'pago'
  | 'pendente'
  | 'aguardando'
  | 'em-producao'
  | 'enviado'
  | 'entregue'
  | 'ativo'
  | 'inativo'
  | 'baixa'
  | 'media'
  | 'boa'

type TamanhoEmblema = 'sm' | 'md'

interface EmblemaProps {
  tipo: TipoEmblema
  tamanho?: TamanhoEmblema
}

const estilosTipo: Record<TipoEmblema, { bg: string; texto: string; label: string }> = {
  // Verde/musgo — positivos
  pago:      { bg: 'rgba(107,107,42,0.12)', texto: 'var(--cor-musgo-escuro)', label: 'Pago' },
  entregue:  { bg: 'rgba(107,107,42,0.12)', texto: 'var(--cor-musgo-escuro)', label: 'Entregue' },
  ativo:     { bg: 'rgba(107,107,42,0.12)', texto: 'var(--cor-musgo-escuro)', label: 'Ativo' },
  boa:       { bg: 'rgba(107,107,42,0.12)', texto: 'var(--cor-musgo-escuro)', label: 'Boa' },

  // Âmbar — neutro/atenção
  pendente:   { bg: 'rgba(139,115,85,0.12)', texto: '#6B4C00', label: 'Pendente' },
  aguardando: { bg: 'rgba(139,115,85,0.12)', texto: '#6B4C00', label: 'Aguardando' },
  media:      { bg: 'rgba(139,115,85,0.12)', texto: '#6B4C00', label: 'Média' },

  // Azul-argila — em andamento
  'em-producao': { bg: 'rgba(74,107,107,0.12)', texto: '#2A4A4A', label: 'Em produção' },
  enviado:       { bg: 'rgba(74,107,107,0.12)', texto: '#2A4A4A', label: 'Enviado' },

  // Perigo — negativo
  inativo: { bg: 'rgba(139,74,58,0.12)', texto: 'var(--cor-perigo)', label: 'Inativo' },
  baixa:   { bg: 'rgba(139,74,58,0.12)', texto: 'var(--cor-perigo)', label: 'Baixa' },
}

const tamanhos: Record<TamanhoEmblema, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
}

export function Emblema({ tipo, tamanho = 'md' }: EmblemaProps) {
  const est = estilosTipo[tipo]

  return (
    <span
      style={{ backgroundColor: est.bg, color: est.texto }}
      className={[
        'inline-flex items-center rounded-full font-corpo font-medium whitespace-nowrap',
        tamanhos[tamanho],
      ].join(' ')}
    >
      {est.label}
    </span>
  )
}

export default Emblema
