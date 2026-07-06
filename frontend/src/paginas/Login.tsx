import { useCallback, useState } from 'react'
import { Botao } from '@/componentes/ui/Botao'
import { Campo } from '@/componentes/ui/Campo'
import { useAutenticacao } from '@/hooks/useAutenticacao'

// Página de entrada. Autentica a gestora via Supabase Auth; o App redireciona
// para as rotas internas assim que a sessão passa a existir.
export default function Login() {
  const { entrar } = useAutenticacao()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  const aoEnviar = useCallback(
    async (evento: React.FormEvent) => {
      evento.preventDefault()
      setErro('')
      setEnviando(true)
      const resultado = await entrar(email.trim(), senha)
      if (!resultado.sucesso) {
        setErro(resultado.erro ?? 'Não foi possível entrar.')
      }
      setEnviando(false)
    },
    [email, senha, entrar]
  )

  return (
    <div
      className="flex items-center justify-center min-h-screen p-4"
      style={{ background: 'var(--cor-argila)' }}
    >
      <div
        className="w-full max-w-sm rounded-lg p-8 flex flex-col gap-6 border"
        style={{
          background: 'var(--cor-argila-card)',
          borderColor: 'var(--cor-argila-borda)',
        }}
      >
        <header className="flex flex-col gap-1 text-center">
          <h1 className="font-titulo text-2xl text-texto">Psiquê Velas Aromáticas</h1>
          <p className="font-corpo text-sm text-muted">Acesso à gestão interna</p>
        </header>

        <form onSubmit={aoEnviar} className="flex flex-col gap-3">
          <Campo
            rotulo="E-mail"
            nome="email"
            tipo="email"
            valor={email}
            aoMudar={setEmail}
            placeholder="voce@exemplo.com"
            obrigatorio
          />
          <Campo
            rotulo="Senha"
            nome="senha"
            tipo="password"
            valor={senha}
            aoMudar={setSenha}
            obrigatorio
            erro={erro}
          />
          <Botao tipo="submit" carregando={enviando} desabilitado={enviando} larguraTotal>
            Entrar
          </Botao>
        </form>
      </div>
    </div>
  )
}
