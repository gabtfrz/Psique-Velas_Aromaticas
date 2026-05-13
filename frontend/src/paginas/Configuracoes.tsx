import { useState, useCallback } from 'react'
import { Campo } from '@/componentes/ui/Campo'
import { Alternador } from '@/componentes/ui/Alternador'
import { Botao } from '@/componentes/ui/Botao'
import { ToastContainer } from '@/componentes/ui/Toast'
import { useToast } from '@/hooks/useToast'

const estiloSecao: React.CSSProperties = {
  background: 'var(--cor-argila-card)',
  border: '1px solid var(--cor-argila-borda)',
  borderRadius: 10,
  padding: '24px 28px',
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
}

const estiloTituloSecao: React.CSSProperties = {
  fontFamily: '"Cormorant Garamond", serif',
  fontSize: '1.2rem',
  fontWeight: 500,
  color: 'var(--cor-texto)',
  margin: '0 0 4px',
  paddingBottom: 12,
  borderBottom: '1px solid var(--cor-argila-borda)',
}

const estiloSeparador: React.CSSProperties = {
  borderBottom: '1px solid var(--cor-argila-borda)',
  paddingBottom: 16,
}

export default function Configuracoes() {
  const { toasts, exibirToast, removerToast } = useToast()

  // Dados da empresa
  const [nomeEmpresa, setNomeEmpresa] = useState('Psiquê Velas Aromáticas')
  const [descricaoEmpresa, setDescricaoEmpresa] = useState(
    'Velas artesanais com intenção, feitas para rituais do cotidiano.'
  )

  // Preferências
  const [mostrarMarkup, setMostrarMarkup] = useState(false)
  const [alertarEstoqueBaixo, setAlertarEstoqueBaixo] = useState(true)

  const handleSalvar = useCallback(() => {
    exibirToast('Configurações salvas com sucesso!', 'sucesso')
  }, [exibirToast])

  return (
    <div
      style={{
        padding: '28px 32px',
        display: 'flex',
        flexDirection: 'column',
        gap: 28,
        maxWidth: 760,
      }}
    >
      {/* Cabeçalho */}
      <div>
        <h1
          style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: '1.75rem',
            fontWeight: 500,
            color: 'var(--cor-texto)',
            margin: '0 0 4px',
          }}
        >
          Configurações
        </h1>
        <p style={{ fontSize: 14, color: 'var(--cor-muted)', margin: 0 }}>
          Personalize as informações e preferências do seu painel.
        </p>
      </div>

      {/* Seção — Dados da empresa */}
      <section style={estiloSecao}>
        <div>
          <h2 style={estiloTituloSecao}>Dados da empresa</h2>
        </div>

        <div style={{ ...estiloSeparador }}>
          <Campo
            rotulo="Nome da empresa"
            nome="nomeEmpresa"
            valor={nomeEmpresa}
            aoMudar={setNomeEmpresa}
            placeholder="Ex: Psiquê Velas Aromáticas"
          />
        </div>

        <div>
          <Campo
            rotulo="Descrição"
            nome="descricaoEmpresa"
            valor={descricaoEmpresa}
            aoMudar={setDescricaoEmpresa}
            placeholder="Uma breve descrição da sua marca..."
          />
        </div>
      </section>

      {/* Seção — Preferências */}
      <section style={estiloSecao}>
        <div>
          <h2 style={estiloTituloSecao}>Preferências</h2>
        </div>

        <div style={{ ...estiloSeparador }}>
          <Alternador
            rotulo="Mostrar markup na tabela de produtos"
            ativo={mostrarMarkup}
            aoAlternar={setMostrarMarkup}
            descricao="Exibe a coluna de markup (%) ao lado da margem na listagem de produtos."
          />
        </div>

        <div>
          <Alternador
            rotulo="Alertar quando estoque estiver baixo"
            ativo={alertarEstoqueBaixo}
            aoAlternar={setAlertarEstoqueBaixo}
            descricao="Destaca em vermelho os produtos com estoque abaixo do mínimo configurado."
          />
        </div>
      </section>

      {/* Botão salvar */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Botao variante="primario" tamanho="md" aoClicar={handleSalvar}>
          Salvar configurações
        </Botao>
      </div>

      <ToastContainer toasts={toasts} aoRemover={removerToast} />
    </div>
  )
}
