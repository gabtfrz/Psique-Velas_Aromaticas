import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import BarraLateral from '@/componentes/layout/BarraLateral'
import { ToastContainer } from '@/componentes/ui/Toast'
import { useToast } from '@/hooks/useToast'
import { useAutenticacao } from '@/hooks/useAutenticacao'
import Login from '@/paginas/Login'
import Dashboard from '@/paginas/Dashboard'
import Produtos from '@/paginas/Produtos'
import Vendas from '@/paginas/Vendas'
import Clientes from '@/paginas/Clientes'
import Precificacao from '@/paginas/Precificacao'
import Relatorios from '@/paginas/Relatorios'
import Configuracoes from '@/paginas/Configuracoes'

// Área interna: barra lateral + rotas dos módulos. Só renderizada com sessão ativa.
function AreaInterna() {
  const { toasts, removerToast } = useToast()

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        background: 'var(--cor-argila)',
      }}
    >
      <BarraLateral />
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
          <Route path="/vendas" element={<Vendas />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/precificacao" element={<Precificacao />} />
          <Route path="/relatorios" element={<Relatorios />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
          {/* Qualquer rota desconhecida com sessão volta ao Dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <ToastContainer toasts={toasts} aoRemover={removerToast} />
    </div>
  )
}

export default function App() {
  const { sessao, carregando } = useAutenticacao()

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
        <AreaInterna />
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
