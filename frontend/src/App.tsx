import { BrowserRouter, Routes, Route } from 'react-router-dom'
import BarraLateral from '@/componentes/layout/BarraLateral'
import { ToastContainer } from '@/componentes/ui/Toast'
import { useToast } from '@/hooks/useToast'
import Dashboard from '@/paginas/Dashboard'
import Produtos from '@/paginas/Produtos'
import Vendas from '@/paginas/Vendas'
import Clientes from '@/paginas/Clientes'
import Precificacao from '@/paginas/Precificacao'
import Relatorios from '@/paginas/Relatorios'
import Configuracoes from '@/paginas/Configuracoes'

export default function App() {
  const { toasts, removerToast } = useToast()

  return (
    <BrowserRouter>
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
          </Routes>
        </main>
      </div>
      <ToastContainer toasts={toasts} aoRemover={removerToast} />
    </BrowserRouter>
  )
}
