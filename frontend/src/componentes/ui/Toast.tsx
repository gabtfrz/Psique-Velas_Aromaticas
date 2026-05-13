import { useEffect } from 'react'

type TipoToast = 'sucesso' | 'erro' | 'aviso'

export interface ToastProps {
  id: string
  mensagem: string
  tipo: TipoToast
  aoRemover: (id: string) => void
}

interface ToastContainerProps {
  toasts: Omit<ToastProps, 'aoRemover'>[]
  aoRemover: (id: string) => void
}

const DURACAO_MS = 4000

const estilosTipo: Record<
  TipoToast,
  { borda: string; icone: string; fundo: string; barra: string }
> = {
  sucesso: {
    borda: 'var(--cor-musgo)',
    icone: 'var(--cor-musgo)',
    fundo: 'var(--cor-argila-card)',
    barra: 'var(--cor-musgo)',
  },
  erro: {
    borda: 'var(--cor-perigo)',
    icone: 'var(--cor-perigo)',
    fundo: 'var(--cor-argila-card)',
    barra: 'var(--cor-perigo)',
  },
  aviso: {
    borda: '#8B7355',
    icone: '#8B7355',
    fundo: 'var(--cor-argila-card)',
    barra: '#8B7355',
  },
}

function IconeTipo({ tipo }: { tipo: TipoToast }) {
  if (tipo === 'sucesso') {
    return (
      <svg width={18} height={18} viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
        aria-hidden="true">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    )
  }
  if (tipo === 'erro') {
    return (
      <svg width={18} height={18} viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
        aria-hidden="true">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    )
  }
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
      aria-hidden="true">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  )
}

function ToastItem({ id, mensagem, tipo, aoRemover }: ToastProps) {
  const est = estilosTipo[tipo]

  useEffect(() => {
    const timer = setTimeout(() => aoRemover(id), DURACAO_MS)
    return () => clearTimeout(timer)
  }, [id, aoRemover])

  const rotulos: Record<TipoToast, string> = {
    sucesso: 'Sucesso',
    erro: 'Erro',
    aviso: 'Aviso',
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      style={{
        backgroundColor: est.fundo,
        borderColor: est.borda,
        color: 'var(--cor-texto)',
        borderLeftWidth: 4,
        animation: 'toastEntrar 0.25s ease forwards',
        overflow: 'hidden',
        position: 'relative',
      }}
      className="w-80 rounded-lg border shadow-md flex flex-col"
    >
      <div className="flex items-start gap-3 px-4 py-3">
        <span style={{ color: est.icone, flexShrink: 0, marginTop: 1 }}>
          <IconeTipo tipo={tipo} />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold font-corpo mb-0.5" style={{ color: est.icone }}>
            {rotulos[tipo]}
          </p>
          <p className="text-sm font-corpo text-texto leading-snug">{mensagem}</p>
        </div>
        <button
          type="button"
          onClick={() => aoRemover(id)}
          aria-label="Fechar notificação"
          style={{ color: 'var(--cor-muted)', flexShrink: 0 }}
          className="hover:text-texto transition-colors duration-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-musgo rounded"
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
            aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Barra de progresso */}
      <div
        style={{
          height: 3,
          backgroundColor: est.barra,
          transformOrigin: 'left',
          animation: `toastBarra ${DURACAO_MS}ms linear forwards`,
        }}
      />

      <style>{`
        @keyframes toastEntrar {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes toastBarra {
          from { transform: scaleX(1); }
          to   { transform: scaleX(0); }
        }
      `}</style>
    </div>
  )
}

export function ToastContainer({ toasts, aoRemover }: ToastContainerProps) {
  if (toasts.length === 0) return null

  return (
    <div
      aria-label="Notificações"
      style={{ zIndex: 10000 }}
      className="fixed bottom-4 right-4 flex flex-col gap-2 items-end"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} {...t} aoRemover={aoRemover} />
      ))}
    </div>
  )
}

export { ToastItem as Toast }
export default ToastContainer
