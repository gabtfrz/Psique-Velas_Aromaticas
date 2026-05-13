import type { ReactNode } from 'react'

interface PropsConteudoPagina {
  children: ReactNode
}

export default function ConteudoPagina({ children }: PropsConteudoPagina) {
  return (
    <div
      style={{ minHeight: '100%' }}
      className="max-w-7xl mx-auto px-6 py-6"
    >
      {children}
    </div>
  )
}
