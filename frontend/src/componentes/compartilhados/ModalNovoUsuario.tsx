import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Modal } from '@/componentes/ui/Modal'
import { Campo } from '@/componentes/ui/Campo'
import { Botao } from '@/componentes/ui/Botao'
import { schemaUsuario } from '@/utils/validadores'
import type { EntradaUsuario } from '@/utils/validadores'
import { mascararCpf } from '@/utils/formatadores'

// CPF mascarado tem 14 caracteres: 000.000.000-00
const MAX_CARACTERES_CPF = 14

interface PropsModalNovoUsuario {
  aberto: boolean
  aoFechar: () => void
  aoSalvar: (dados: EntradaUsuario) => void
  salvando?: boolean
}

const valoresIniciais: EntradaUsuario = {
  nome: '',
  cpf: '',
  telefone: '',
  email: '',
  senha: '',
}

// Formulário de cadastro de uma nova gestora — validação Zod no cliente (defesa em
// profundidade; a Edge Function `criar-usuario` sempre revalida no servidor).
export function ModalNovoUsuario({
  aberto,
  aoFechar,
  aoSalvar,
  salvando = false,
}: PropsModalNovoUsuario) {
  const {
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EntradaUsuario>({
    resolver: zodResolver(schemaUsuario),
    defaultValues: valoresIniciais,
  })

  useEffect(() => {
    if (aberto) {
      reset(valoresIniciais)
    }
  }, [aberto, reset])

  function onSubmit(dados: EntradaUsuario) {
    aoSalvar(dados)
  }

  return (
    <Modal aberto={aberto} aoFechar={aoFechar} titulo="Nova gestora" largura="md">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Campo
            rotulo="Nome completo"
            nome="nome"
            valor={watch('nome')}
            aoMudar={(v) => setValue('nome', v, { shouldValidate: true })}
            erro={errors.nome?.message}
            obrigatorio
          />
          <Campo
            rotulo="CPF"
            nome="cpf"
            valor={watch('cpf')}
            aoMudar={(v) => setValue('cpf', mascararCpf(v), { shouldValidate: true })}
            erro={errors.cpf?.message}
            placeholder="000.000.000-00"
            maxCaracteres={MAX_CARACTERES_CPF}
            obrigatorio
          />
          <Campo
            rotulo="Telefone"
            nome="telefone"
            valor={watch('telefone')}
            aoMudar={(v) => setValue('telefone', v, { shouldValidate: true })}
            erro={errors.telefone?.message}
            placeholder="(11) 99999-9999"
            obrigatorio
          />
          <Campo
            rotulo="E-mail"
            nome="email"
            tipo="email"
            valor={watch('email')}
            aoMudar={(v) => setValue('email', v, { shouldValidate: true })}
            erro={errors.email?.message}
            obrigatorio
          />
          <Campo
            rotulo="Senha provisória"
            nome="senha"
            tipo="password"
            valor={watch('senha')}
            aoMudar={(v) => setValue('senha', v, { shouldValidate: true })}
            erro={errors.senha?.message}
            obrigatorio
          />

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8,
              paddingTop: 8,
              borderTop: '1px solid var(--cor-argila-borda)',
            }}
          >
            <Botao variante="secundario" aoClicar={aoFechar} tipo="button">
              Cancelar
            </Botao>
            <Botao variante="primario" tipo="submit" carregando={salvando}>
              Cadastrar gestora
            </Botao>
          </div>
        </div>
      </form>
    </Modal>
  )
}

export default ModalNovoUsuario
