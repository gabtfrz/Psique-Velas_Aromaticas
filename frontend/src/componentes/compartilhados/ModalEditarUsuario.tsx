import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Modal } from '@/componentes/ui/Modal'
import { Campo } from '@/componentes/ui/Campo'
import { Botao } from '@/componentes/ui/Botao'
import { schemaEditarUsuario } from '@/utils/validadores'
import type { EntradaEditarUsuario } from '@/utils/validadores'
import { formatarCpf, mascararCpf } from '@/utils/formatadores'
import type { Gestora } from '@/tipos'

// CPF mascarado tem 14 caracteres: 000.000.000-00
const MAX_CARACTERES_CPF = 14

interface PropsModalEditarUsuario {
  aberto: boolean
  gestora: Gestora | null
  aoFechar: () => void
  aoSalvar: (id: number, dados: EntradaEditarUsuario) => void
  salvando?: boolean
}

const valoresVazios: EntradaEditarUsuario = { nome: '', cpf: '', telefone: '' }

// Formulário de edição de uma gestora existente (só master) — nome, telefone e CPF
// editáveis; e-mail é a identidade de login e não pode ser alterado por aqui; sem campo
// de senha (a gestora troca a própria senha pela tela de primeiro login).
export function ModalEditarUsuario({
  aberto,
  gestora,
  aoFechar,
  aoSalvar,
  salvando = false,
}: PropsModalEditarUsuario) {
  const {
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EntradaEditarUsuario>({
    resolver: zodResolver(schemaEditarUsuario),
    defaultValues: valoresVazios,
  })

  useEffect(() => {
    if (aberto && gestora) {
      // O CPF vem do banco só com dígitos — mostra já mascarado no campo.
      reset({ nome: gestora.nome, cpf: formatarCpf(gestora.cpf), telefone: gestora.telefone })
    }
  }, [aberto, gestora, reset])

  function onSubmit(dados: EntradaEditarUsuario) {
    if (!gestora) return
    aoSalvar(gestora.id, dados)
  }

  return (
    <Modal aberto={aberto} aoFechar={aoFechar} titulo="Editar gestora" largura="md">
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
            valor={gestora?.email ?? ''}
            desabilitado
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
              Salvar alterações
            </Botao>
          </div>
        </div>
      </form>
    </Modal>
  )
}

export default ModalEditarUsuario
