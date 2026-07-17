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

export function formatarCpf(cpf: string): string {
  const digitos = cpf.replace(/\D/g, '')
  if (digitos.length !== 11) {
    return cpf
  }
  return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${digitos.slice(9)}`
}

// Aplica a máscara do CPF PROGRESSIVAMENTE, conforme o usuário digita (para o input).
// Ignora tudo que não for dígito, limita a 11 dígitos e insere pontos/traço só até
// onde já houver número — ex.: "123" -> "123", "1234567" -> "123.456.7".
export function mascararCpf(valor: string): string {
  const d = valor.replace(/\D/g, '').slice(0, 11)
  if (d.length <= 3) return d
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
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
