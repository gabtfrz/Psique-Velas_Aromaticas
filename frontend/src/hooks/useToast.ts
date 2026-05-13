import { useState, useCallback, useEffect } from 'react'
import { gerarId } from '@/utils/geradores'
import { TEMPO_TOAST_MS } from '@/constantes'
import type { ToastProps } from '@/tipos'

export function useToast() {
  const [toasts, setToasts] = useState<ToastProps[]>([])

  const removerToast = useCallback((id: string) => {
    setToasts((anterior) => anterior.filter((t) => t.id !== id))
  }, [])

  const exibirToast = useCallback(
    (mensagem: string, tipo: ToastProps['tipo'] = 'sucesso') => {
      const id = gerarId()
      setToasts((anterior) => [...anterior, { id, mensagem, tipo }])
    },
    []
  )

  useEffect(() => {
    if (toasts.length === 0) return
    const ultimo = toasts[toasts.length - 1]
    const timer = setTimeout(() => removerToast(ultimo.id), TEMPO_TOAST_MS)
    return () => clearTimeout(timer)
  }, [toasts, removerToast])

  return { toasts, exibirToast, removerToast }
}
