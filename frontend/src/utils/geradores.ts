export function gerarId(): string {
  return crypto.randomUUID()
}

export function gerarNumeroPedido(): string {
  const numero = Math.floor(Math.random() * 900000) + 100000
  return `PSQ-${numero}`
}
