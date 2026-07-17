import { useCallback, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase } from '@/servicos/supabase'
import { Campo } from '@/componentes/ui/Campo'
import { Botao } from '@/componentes/ui/Botao'
import { ToastContainer } from '@/componentes/ui/Toast'
import { useToast } from '@/hooks/useToast'
import { RPC_MARCAR_SENHA_TROCADA } from '@/constantes'
import { schemaTrocarSenha } from '@/utils/validadores'
import type { EntradaTrocarSenha } from '@/utils/validadores'

interface PropsTrocarSenha {
  // Chamado após a senha ser trocada com sucesso (RPC `marcar_senha_trocada` concluída) —
  // em produção é `recarregarPerfil`, que desbloqueia o app ao atualizar `deveTrocarSenha`.
  aoTrocarSenha: () => void
}

const valoresIniciais: EntradaTrocarSenha = { novaSenha: '', confirmarSenha: '' }

const MENSAGEM_ERRO_PADRAO = 'Não foi possível trocar a senha. Tente novamente.'

// Tela bloqueante de troca de senha obrigatória no primeiro login — renderizada sozinha
// (sem navegação) enquanto `deveTrocarSenha` for verdadeiro para a gestora logada.
export default function TrocarSenha({ aoTrocarSenha }: PropsTrocarSenha) {
  const { toasts, exibirToast, removerToast } = useToast()
  const [enviando, setEnviando] = useState(false)

  const {
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<EntradaTrocarSenha>({
    resolver: zodResolver(schemaTrocarSenha),
    defaultValues: valoresIniciais,
  })

  const aoEnviar = useCallback(
    async (dados: EntradaTrocarSenha) => {
      setEnviando(true)

      const { error: erroSenha } = await supabase.auth.updateUser({ password: dados.novaSenha })
      if (erroSenha) {
        exibirToast(erroSenha.message || MENSAGEM_ERRO_PADRAO, 'erro')
        setEnviando(false)
        return
      }

      const { error: erroRpc } = await supabase.rpc(RPC_MARCAR_SENHA_TROCADA)
      setEnviando(false)
      if (erroRpc) {
        exibirToast(MENSAGEM_ERRO_PADRAO, 'erro')
        return
      }

      reset(valoresIniciais)
      aoTrocarSenha()
    },
    [aoTrocarSenha, exibirToast, reset]
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
          <h1 className="font-titulo text-2xl text-texto">Troque sua senha</h1>
          <p className="font-corpo text-sm text-muted">
            Defina uma nova senha para continuar acessando o sistema.
          </p>
        </header>

        <form onSubmit={handleSubmit(aoEnviar)} noValidate className="flex flex-col gap-3">
          <Campo
            rotulo="Nova senha"
            nome="novaSenha"
            tipo="password"
            valor={watch('novaSenha')}
            aoMudar={(v) => setValue('novaSenha', v, { shouldValidate: true })}
            erro={errors.novaSenha?.message}
            obrigatorio
          />
          <Campo
            rotulo="Confirmar senha"
            nome="confirmarSenha"
            tipo="password"
            valor={watch('confirmarSenha')}
            aoMudar={(v) => setValue('confirmarSenha', v, { shouldValidate: true })}
            erro={errors.confirmarSenha?.message}
            obrigatorio
          />
          <Botao tipo="submit" carregando={enviando} desabilitado={enviando} larguraTotal>
            Trocar senha
          </Botao>
        </form>
      </div>

      <ToastContainer toasts={toasts} aoRemover={removerToast} />
    </div>
  )
}
