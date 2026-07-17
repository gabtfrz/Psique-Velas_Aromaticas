import React, { useEffect, useRef } from 'react'

type LarguraModal = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'

interface ModalProps {
  aberto: boolean
  aoFechar: () => void
  titulo: string
  children: React.ReactNode
  largura?: LarguraModal
}

const larguras: Record<LarguraModal, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
}

const SELETORES_FOCAVEIS =
  'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function Modal({
  aberto,
  aoFechar,
  titulo,
  children,
  largura = 'md',
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const primeiroFocoRef = useRef<HTMLElement | null>(null)

  // Fecha com Esc
  useEffect(() => {
    if (!aberto) return

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        aoFechar()
        return
      }
      if (e.key === 'Tab' && dialogRef.current) {
        const focaveis = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(SELETORES_FOCAVEIS),
        ).filter((el) => !el.closest('[hidden]'))

        if (focaveis.length === 0) {
          e.preventDefault()
          return
        }

        const primeiro = focaveis[0]
        const ultimo = focaveis[focaveis.length - 1]

        if (e.shiftKey) {
          if (document.activeElement === primeiro) {
            e.preventDefault()
            ultimo.focus()
          }
        } else {
          if (document.activeElement === ultimo) {
            e.preventDefault()
            primeiro.focus()
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [aberto, aoFechar])

  // Foco inicial e restauração
  useEffect(() => {
    if (aberto) {
      primeiroFocoRef.current = document.activeElement as HTMLElement

      requestAnimationFrame(() => {
        if (dialogRef.current) {
          const primeiro = dialogRef.current.querySelector<HTMLElement>(SELETORES_FOCAVEIS)
          primeiro?.focus()
        }
      })

      document.body.style.overflow = 'hidden'
    } else {
      primeiroFocoRef.current?.focus()
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [aberto])

  if (!aberto) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-titulo"
      style={{ zIndex: 9999 }}
      className="fixed inset-0 flex items-center justify-center p-4"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'rgba(44, 44, 42, 0.5)', backdropFilter: 'blur(2px)' }}
        onClick={aoFechar}
        aria-hidden="true"
      />

      {/* Painel */}
      <div
        ref={dialogRef}
        style={{
          backgroundColor: 'var(--cor-argila-card)',
          borderColor: 'var(--cor-argila-borda)',
          animation: 'modalEntrar 0.18s ease forwards',
        }}
        className={[
          'relative w-full rounded-lg border shadow-lg flex flex-col',
          'max-h-[90vh]',
          larguras[largura],
        ].join(' ')}
      >
        {/* Cabeçalho */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0"
          style={{ borderColor: 'var(--cor-argila-borda)' }}
        >
          <h2
            id="modal-titulo"
            className="font-display text-lg font-semibold text-texto"
          >
            {titulo}
          </h2>
          <button
            type="button"
            onClick={aoFechar}
            aria-label="Fechar modal"
            style={{ color: 'var(--cor-muted)' }}
            className={[
              'p-1 rounded transition-colors duration-150',
              'hover:bg-argila hover:text-texto',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-musgo focus-visible:ring-offset-1',
            ].join(' ')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width={18}
              height={18}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Conteúdo com scroll */}
        <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0">{children}</div>
      </div>

      <style>{`
        @keyframes modalEntrar {
          from { opacity: 0; transform: scale(0.95) translateY(4px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
      `}</style>
    </div>
  )
}

export default Modal
