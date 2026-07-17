import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import type { Session } from '@supabase/supabase-js'
import BarraLateral from '@/componentes/layout/BarraLateral'
import BarraSuperior from '@/componentes/layout/BarraSuperior'
import { ToastContainer } from '@/componentes/ui/Toast'
import { useToast } from '@/hooks/useToast'
import { useAutenticacao } from '@/hooks/useAutenticacao'
import { usePerfil } from '@/hooks/usePerfil'
import Login from '@/paginas/Login'
import TrocarSenha from '@/paginas/TrocarSenha'
import Dashboard from '@/paginas/Dashboard'
import Produtos from '@/paginas/Produtos'
import Insumos from '@/paginas/Insumos'
import Vendas from '@/paginas/Vendas'
import Clientes from '@/paginas/Clientes'
import Precificacao from '@/paginas/Precificacao'
import Relatorios from '@/paginas/Relatorios'
import Configuracoes from '@/paginas/Configuracoes'
import Usuarios from '@/paginas/Usuarios'

interface PropsAreaInterna {
  sessao: Session | null
  sair: () => void
}

// Área interna: barra lateral + barra superior (saudação/Sair) + rotas dos módulos.
// Só renderizada com sessão ativa. O perfil (nome/papel) é buscado uma única vez aqui
// e compartilhado com a BarraSuperior (saudação) e a BarraLateral (gating por papel).
function AreaInterna({ sessao, sair }: PropsAreaInterna) {
  const { toasts, removerToast } = useToast()
  const {
    nome,
    papel,
    deveTrocarSenha,
    carregando: carregandoPerfil,
    recarregarPerfil,
  } = usePerfil(sessao)

  // Fluxo bloqueante: enquanto a gestora não trocar a senha provisória do primeiro
  // login, só a tela de troca é renderizada — sem barra lateral, barra superior ou rotas.
  if (!carregandoPerfil && deveTrocarSenha) {
    return <TrocarSenha aoTrocarSenha={recarregarPerfil} />
  }

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        background: 'var(--cor-argila)',
      }}
    >
      <BarraLateral papel={papel} />
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <BarraSuperior nome={nome} carregando={carregandoPerfil} sair={sair} />
        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            background: 'var(--cor-argila)',
          }}
        >
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/produtos" element={<Produtos />} />
            <Route path="/insumos" element={<Insumos />} />
            <Route path="/vendas" element={<Vendas />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/precificacao" element={<Precificacao />} />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route
              path="/usuarios"
              // Enquanto o perfil ainda carrega, não decide (evita redirect prematuro/flicker).
              // Só o papel master acessa a tela de Usuários — qualquer outro papel volta ao Dashboard.
              element={
                carregandoPerfil ? null : papel === 'master' ? (
                  <Usuarios />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            <Route path="/configuracoes" element={<Configuracoes />} />
            {/* Qualquer rota desconhecida com sessão volta ao Dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      <ToastContainer toasts={toasts} aoRemover={removerToast} />
    </div>
  )
}

export default function App() {
  const { sessao, carregando, sair } = useAutenticacao()

  // Evita piscar a tela de login enquanto a sessão inicial é resolvida.
  if (carregando) {
    return (
      <div
        className="flex items-center justify-center min-h-screen font-corpo text-muted"
        style={{ background: 'var(--cor-argila)' }}
      >
        Carregando…
      </div>
    )
  }

  return (
    <BrowserRouter>
      {sessao ? (
        <AreaInterna sessao={sessao} sair={sair} />
      ) : (
        <Routes>
          <Route path="/login" element={<Login />} />
          {/* Sem sessão, toda rota interna cai no login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      )}
    </BrowserRouter>
  )
}
