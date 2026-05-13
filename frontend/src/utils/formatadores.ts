export function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatarData(data: Date | string): string {
  const d = typeof data === 'string' ? new Date(data) : data
  return d.toLocaleDateString('pt-BR')
}

export function formatarDataHora(data: Date | string): string {
  const d = typeof data === 'string' ? new Date(data) : data
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export function formatarPercentual(valor: number, casas = 1): string {
  return `${valor.toFixed(casas)}%`
}

export function formatarGramagem(gramas: number): string {
  return gramas >= 1000 ? `${(gramas / 1000).toFixed(1)}kg` : `${gramas}g`
}

export function formatarWhatsApp(numero: string): string {
  const digitos = numero.replace(/\D/g, '')
  if (digitos.length === 11) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`
  }
  if (digitos.length === 10) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`
  }
  return numero
}

// calcularMargem(18, 68) → 73.5%   calcularMoeda(68) → "R$ 68,00"
