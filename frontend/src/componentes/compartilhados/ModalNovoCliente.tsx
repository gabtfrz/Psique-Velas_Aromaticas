import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Modal } from '@/componentes/ui/Modal'
import { Campo } from '@/componentes/ui/Campo'
import { CampoSelecao } from '@/componentes/ui/CampoSelecao'
import { CampoTexto } from '@/componentes/ui/CampoTexto'
import { Botao } from '@/componentes/ui/Botao'
import { schemaCliente } from '@/utils/validadores'
import type { EntradaCliente } from '@/utils/validadores'
import type { Cliente, OpcaoSelecao } from '@/tipos'

interface PropsModalNovoCliente {
  aberto: boolean
  aoFechar: () => void
  aoSalvar: (dados: EntradaCliente) => void
  clienteParaEditar?: Cliente
}

const opcoesCanal: OpcaoSelecao[] = [
  { valor: 'instagram', rotulo: 'Instagram' },
  { valor: 'indicacao', rotulo: 'Indicação' },
  { valor: 'site', rotulo: 'Site' },
  { valor: 'feira', rotulo: 'Feira' },
  { valor: 'whatsapp', rotulo: 'WhatsApp' },
  { valor: 'outro', rotulo: 'Outro' },
]

function clienteParaEntrada(c: Cliente): EntradaCliente {
  return {
    nomeCompleto: c.nomeCompleto,
    cpf: c.cpf ?? '',
    dataNascimento: c.dataNascimento
      ? new Date(c.dataNascimento).toISOString().slice(0, 10)
      : '',
    email: c.email,
    whatsapp: c.whatsapp,
    canalOrigem: c.canalOrigem,
    endereco: {
      cep: c.endereco.cep,
      logradouro: c.endereco.logradouro,
      numero: c.endereco.numero,
      complemento: c.endereco.complemento ?? '',
      bairro: c.endereco.bairro,
      cidade: c.endereco.cidade,
      uf: c.endereco.uf,
    },
    observacoesInternas: c.observacoesInternas ?? '',
  }
}

const valoresIniciais: EntradaCliente = {
  nomeCompleto: '',
  cpf: '',
  dataNascimento: '',
  email: '',
  whatsapp: '',
  canalOrigem: 'instagram',
  endereco: {
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    uf: '',
  },
  observacoesInternas: '',
}

export function ModalNovoCliente({
  aberto,
  aoFechar,
  aoSalvar,
  clienteParaEditar,
}: PropsModalNovoCliente) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EntradaCliente>({
    resolver: zodResolver(schemaCliente),
    defaultValues: valoresIniciais,
  })

  useEffect(() => {
    if (aberto) {
      reset(clienteParaEditar ? clienteParaEntrada(clienteParaEditar) : valoresIniciais)
    }
  }, [aberto, clienteParaEditar, reset])

  function onSubmit(dados: EntradaCliente) {
    aoSalvar(dados)
  }

  const titulo = clienteParaEditar ? 'Editar cliente' : 'Novo cliente'

  return (
    <Modal aberto={aberto} aoFechar={aoFechar} titulo={titulo} largura="xl">
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Dados pessoais */}
          <section>
            <h3
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--cor-musgo)',
                marginBottom: 12,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Dados pessoais
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <Campo
                  rotulo="Nome completo"
                  nome="nomeCompleto"
                  valor={watch('nomeCompleto')}
                  aoMudar={(v) => setValue('nomeCompleto', v, { shouldValidate: true })}
                  erro={errors.nomeCompleto?.message}
                  obrigatorio
                />
              </div>
              <Campo
                rotulo="CPF (opcional)"
                nome="cpf"
                valor={watch('cpf') ?? ''}
                aoMudar={(v) => setValue('cpf', v, { shouldValidate: true })}
                erro={errors.cpf?.message}
                placeholder="000.000.000-00"
              />
              <Campo
                rotulo="Data de nascimento (opcional)"
                nome="dataNascimento"
                tipo="date"
                valor={watch('dataNascimento') ?? ''}
                aoMudar={(v) => setValue('dataNascimento', v, { shouldValidate: true })}
                erro={errors.dataNascimento?.message}
              />
            </div>
          </section>

          {/* Contato */}
          <section>
            <h3
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--cor-musgo)',
                marginBottom: 12,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Contato
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
                rotulo="WhatsApp"
                nome="whatsapp"
                valor={watch('whatsapp')}
                aoMudar={(v) => setValue('whatsapp', v, { shouldValidate: true })}
                erro={errors.whatsapp?.message}
                placeholder="(11) 99999-9999"
                obrigatorio
              />
              <CampoSelecao
                rotulo="Canal de origem"
                nome="canalOrigem"
                opcoes={opcoesCanal}
                valor={watch('canalOrigem')}
                aoMudar={(v) => setValue('canalOrigem', v as EntradaCliente['canalOrigem'], { shouldValidate: true })}
                erro={errors.canalOrigem?.message}
              />
            </div>
          </section>

          {/* Endereço */}
          <section>
            <h3
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--cor-musgo)',
                marginBottom: 12,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Endereço
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Campo
                rotulo="CEP"
                nome="endereco.cep"
                valor={watch('endereco.cep')}
                aoMudar={(v) => setValue('endereco.cep', v, { shouldValidate: true })}
                erro={errors.endereco?.cep?.message}
                placeholder="00000-000"
              />
              <Campo
                rotulo="Número"
                nome="endereco.numero"
                valor={watch('endereco.numero')}
                aoMudar={(v) => setValue('endereco.numero', v, { shouldValidate: true })}
                erro={errors.endereco?.numero?.message}
              />
              <div style={{ gridColumn: '1 / -1' }}>
                <Campo
                  rotulo="Logradouro"
                  nome="endereco.logradouro"
                  valor={watch('endereco.logradouro')}
                  aoMudar={(v) => setValue('endereco.logradouro', v, { shouldValidate: true })}
                  erro={errors.endereco?.logradouro?.message}
                />
              </div>
              <Campo
                rotulo="Complemento (opcional)"
                nome="endereco.complemento"
                valor={watch('endereco.complemento') ?? ''}
                aoMudar={(v) => setValue('endereco.complemento', v, { shouldValidate: true })}
                erro={errors.endereco?.complemento?.message}
              />
              <Campo
                rotulo="Bairro"
                nome="endereco.bairro"
                valor={watch('endereco.bairro')}
                aoMudar={(v) => setValue('endereco.bairro', v, { shouldValidate: true })}
                erro={errors.endereco?.bairro?.message}
              />
              <Campo
                rotulo="Cidade"
                nome="endereco.cidade"
                valor={watch('endereco.cidade')}
                aoMudar={(v) => setValue('endereco.cidade', v, { shouldValidate: true })}
                erro={errors.endereco?.cidade?.message}
              />
              <Campo
                rotulo="UF"
                nome="endereco.uf"
                valor={watch('endereco.uf')}
                aoMudar={(v) => setValue('endereco.uf', v.toUpperCase().slice(0, 2), { shouldValidate: true })}
                erro={errors.endereco?.uf?.message}
                placeholder="SP"
              />
            </div>
          </section>

          {/* Observações */}
          <section>
            <CampoTexto
              rotulo="Observações internas (opcional)"
              nome="observacoesInternas"
              valor={watch('observacoesInternas') ?? ''}
              aoMudar={(v) => setValue('observacoesInternas', v, { shouldValidate: true })}
              erro={errors.observacoesInternas?.message}
              linhas={3}
              placeholder="Notas privadas sobre a cliente..."
            />
          </section>

          {/* hidden inputs for react-hook-form registration */}
          <input type="hidden" {...register('nomeCompleto')} />

          {/* Ações */}
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
            <Botao variante="primario" tipo="submit" carregando={isSubmitting}>
              {clienteParaEditar ? 'Salvar alterações' : 'Cadastrar cliente'}
            </Botao>
          </div>
        </div>
      </form>
    </Modal>
  )
}

export default ModalNovoCliente
