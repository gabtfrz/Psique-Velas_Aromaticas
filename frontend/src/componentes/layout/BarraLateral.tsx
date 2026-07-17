import { useMemo, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Icone } from '@/componentes/ui/Icone'
import type { NomeIcone } from '@/componentes/ui/Icone'
import type { PapelGestora } from '@/tipos'

interface ItemNavegacao {
  caminho: string
  rotulo: string
  icone: NomeIcone
  // Papéis que enxergam este item. Ausente = visível para qualquer papel autenticado.
  papeis?: PapelGestora[]
}

const itensNavegacao: ItemNavegacao[] = [
  { caminho: '/',              rotulo: 'Dashboard',    icone: 'dashboard'    },
  { caminho: '/produtos',      rotulo: 'Produtos',     icone: 'produto'      },
  { caminho: '/insumos',       rotulo: 'Insumos',      icone: 'vela'         },
  { caminho: '/vendas',        rotulo: 'Vendas',       icone: 'venda'        },
  { caminho: '/clientes',      rotulo: 'Clientes',     icone: 'cliente'      },
  { caminho: '/precificacao',  rotulo: 'Precificação', icone: 'precificacao' },
  { caminho: '/relatorios',    rotulo: 'Relatórios',   icone: 'relatorio'    },
  { caminho: '/usuarios',      rotulo: 'Usuários',     icone: 'usuario',     papeis: ['master'] },
  { caminho: '/configuracoes', rotulo: 'Configurações',icone: 'configuracao' },
]

function LogoBorboleta() {
  return (
    <svg
      width={40}
      height={40}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Círculo externo */}
      <circle
        cx="20"
        cy="20"
        r="18"
        stroke="var(--cor-musgo)"
        strokeWidth="1"
        fill="none"
      />
      {/* Asa esquerda superior */}
      <path
        d="M20 20 C16 14 9 12 10 18 C11 22 16 22 20 20Z"
        stroke="var(--cor-musgo)"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Asa direita superior */}
      <path
        d="M20 20 C24 14 31 12 30 18 C29 22 24 22 20 20Z"
        stroke="var(--cor-musgo)"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Asa esquerda inferior */}
      <path
        d="M20 20 C15 22 10 26 12 29 C14 32 18 28 20 20Z"
        stroke="var(--cor-musgo)"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Asa direita inferior */}
      <path
        d="M20 20 C25 22 30 26 28 29 C26 32 22 28 20 20Z"
        stroke="var(--cor-musgo)"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Corpo da borboleta */}
      <ellipse
        cx="20"
        cy="20"
        rx="1.5"
        ry="4"
        stroke="var(--cor-musgo)"
        strokeWidth="1"
        fill="none"
      />
      {/* Antenas */}
      <path
        d="M19.2 16.5 C18 14 17 13 16.5 12.5"
        stroke="var(--cor-musgo)"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M20.8 16.5 C22 14 23 13 23.5 12.5"
        stroke="var(--cor-musgo)"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="16.5" cy="12.5" r="0.8" fill="var(--cor-musgo)" />
      <circle cx="23.5" cy="12.5" r="0.8" fill="var(--cor-musgo)" />
    </svg>
  )
}

interface PropsConteudoBarraLateral {
  itens: ItemNavegacao[]
  aoFechar?: () => void
}

function ConteudoBarraLateral({ itens, aoFechar }: PropsConteudoBarraLateral) {
  return (
    <div
      style={{
        width: 240,
        height: '100%',
        backgroundColor: 'var(--cor-argila-card)',
        borderRight: '1px solid var(--cor-argila-borda)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: '24px 20px 20px',
          borderBottom: '1px solid var(--cor-argila-borda)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <LogoBorboleta />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <span
            style={{
              fontFamily: '"Cormorant Garamond", serif',
              fontSize: '1.25rem',
              fontWeight: 500,
              color: 'var(--cor-texto)',
              lineHeight: 1.2,
            }}
          >
            Psiquê
          </span>
          <span
            style={{
              fontFamily: '"DM Sans", sans-serif',
              fontSize: '0.65rem',
              fontWeight: 500,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--cor-muted)',
              lineHeight: 1,
            }}
          >
            Velas Aromáticas
          </span>
        </div>
      </div>

      {/* Navegação */}
      <nav
        style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}
        aria-label="Navegação principal"
      >
        {itens.map((item) => (
          <NavLink
            key={item.caminho}
            to={item.caminho}
            end={item.caminho === '/'}
            onClick={aoFechar}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 20px',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontFamily: '"DM Sans", sans-serif',
              fontWeight: isActive ? 500 : 400,
              color: isActive ? 'var(--cor-musgo)' : 'var(--cor-muted)',
              backgroundColor: isActive ? 'var(--cor-argila)' : 'transparent',
              borderLeft: isActive
                ? '3px solid var(--cor-musgo)'
                : '3px solid transparent',
              transition: 'background-color 0.15s, color 0.15s',
            })}
            onMouseEnter={(e) => {
              const el = e.currentTarget
              const ativo = el.getAttribute('aria-current') === 'page'
              if (!ativo) {
                el.style.backgroundColor = 'var(--cor-argila-card)'
                el.style.color = 'var(--cor-texto)'
              }
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget
              const ativo = el.getAttribute('aria-current') === 'page'
              if (!ativo) {
                el.style.backgroundColor = 'transparent'
                el.style.color = 'var(--cor-muted)'
              }
            }}
          >
            <Icone nome={item.icone} tamanho={18} />
            <span>{item.rotulo}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

interface PropsBarraLateral {
  // Papel da gestora logada — controla quais itens de navegação ficam visíveis
  // (ex: "Usuários" só para master). `undefined` enquanto o perfil ainda carrega.
  papel?: PapelGestora
}

export default function BarraLateral({ papel }: PropsBarraLateral) {
  const [menuAberto, setMenuAberto] = useState(false)

  const itensVisiveis = useMemo(
    () => itensNavegacao.filter((item) => !item.papeis || (papel && item.papeis.includes(papel))),
    [papel]
  )

  return (
    <>
      {/* Desktop: sidebar fixa */}
      <aside
        className="hidden md:flex"
        style={{ flexShrink: 0, height: '100vh' }}
        aria-label="Barra lateral"
      >
        <ConteudoBarraLateral itens={itensVisiveis} />
      </aside>

      {/* Mobile: botão hamburger */}
      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setMenuAberto(true)}
          aria-label="Abrir menu"
          aria-expanded={menuAberto}
          style={{
            position: 'fixed',
            top: 12,
            left: 12,
            zIndex: 200,
            padding: 8,
            borderRadius: 6,
            backgroundColor: 'var(--cor-argila-card)',
            border: '1px solid var(--cor-argila-borda)',
            color: 'var(--cor-texto)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg
            width={20}
            height={20}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            aria-hidden="true"
          >
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {/* Overlay mobile */}
        {menuAberto && (
          <>
            <div
              onClick={() => setMenuAberto(false)}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 300,
                backgroundColor: 'rgba(44, 44, 42, 0.4)',
              }}
              aria-hidden="true"
            />
            <aside
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                bottom: 0,
                zIndex: 400,
                height: '100vh',
              }}
              aria-label="Barra lateral"
            >
              <ConteudoBarraLateral itens={itensVisiveis} aoFechar={() => setMenuAberto(false)} />
            </aside>
          </>
        )}
      </div>
    </>
  )
}
