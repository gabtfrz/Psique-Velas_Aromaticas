import { useState, useEffect } from 'react'

export function useArmazenamentoLocal<T>(
  chave: string,
  valorInicial: T
): [T, (valor: T) => void] {
  const [estado, setEstado] = useState<T>(() => {
    try {
      const item = localStorage.getItem(chave)
      return item ? (JSON.parse(item) as T) : valorInicial
    } catch {
      return valorInicial
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(chave, JSON.stringify(estado))
    } catch {
      // localStorage pode estar cheio ou desabilitado
    }
  }, [chave, estado])

  return [estado, setEstado]
}
