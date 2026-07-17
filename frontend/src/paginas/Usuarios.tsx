import { useCallback, useMemo, useState } from 'react'
import { useUsuarios } from '@/hooks/useUsuarios'
import { useToast } from '@/hooks/useToast'
import { TabelaDados } from '@/componentes/compartilhados/TabelaDados'
import { EstadoVazio } from '@/componentes/compartilhados/EstadoVazio'
import { ModalNovoUsuario } from '@/componentes/compartilhados/ModalNovoUsuario'
import { ModalEditarUsuario } from '@/componentes/compartilhados/ModalEditarUsuario'
import { ToastContainer } from '@/componentes/ui/Toast'
import { Botao } from '@/componentes/ui/Botao'
import { Icone } from '@/componentes/ui/Icone'
import { formatarCpf } from '@/utils/formatadores'
import type { EntradaUsuario, EntradaEditarUsuario } from '@/utils/validadores'
import type { Gestora, PapelGestora } from '@/tipos'

// ---------------------------------------------------------------------------
// Tipo de linha da tabela
// ---------------------------------------------------------------------------
interface LinhaGestora extends Record<string, unknown> {
  id: number
  nome: string
  papel: string
  email: string
  telefone: string
  cpf: string
}

const ROTULO_PAPEL: Record<PapelGestora, string> = {
  master: 'Master',
  gestora: 'Gestora',
}

const MENSAGEM_ERRO_PADRAO = 'Não foi possível cadastrar a gestora.'
const MENSAGEM_ERRO_EDITAR_PADRAO = 'Não foi possível salvar as alterações.'

// ---------------------------------------------------------------------------
// Componente principal — visível e acessível só ao papel master (gating em App.tsx
// e no item de menu de BarraLateral).
// ---------------------------------------------------------------------------
export default function Usuarios() {
  const { gestoras, listarGestoras, criarUsuario, editarUsuario } = useUsuarios()
  const { toasts, exibirToast, removerToast } = useToast()

  const [modalAberto, setModalAberto] = useState(false)
  const [salvando, setSalvando] = useState(false)

  const [gestoraEmEdicao, setGestoraEmEdicao] = useState<Gestora | null>(null)
  const [salvandoEdicao, setSalvandoEdicao] = useState(false)

  const abrirModal = useCallback(() => setModalAberto(true), [])
  const fecharModal = useCallback(() => setModalAberto(false), [])

  const fecharModalEdicao = useCallback(() => setGestoraEmEdicao(null), [])

  const abrirEdicaoDe = useCallback(
    (id: number) => {
      const gestora = gestoras.find((g) => g.id === id) ?? null
      setGestoraEmEdicao(gestora)
    },
    [gestoras]
  )

  const handleSalvarUsuario = useCallback(
    async (dados: EntradaUsuario) => {
      setSalvando(true)
      const resultado = await criarUsuario(dados)
      setSalvando(false)

      if (resultado.sucesso) {
        exibirToast('Gestora cadastrada com sucesso.', 'sucesso')
        fecharModal()
        await listarGestoras()
        return
      }

      exibirToast(resultado.erro ?? MENSAGEM_ERRO_PADRAO, 'erro')
    },
    [criarUsuario, exibirToast, fecharModal, listarGestoras]
  )

  const handleSalvarEdicao = useCallback(
    async (id: number, dados: EntradaEditarUsuario) => {
      setSalvandoEdicao(true)
      const resultado = await editarUsuario(id, dados)
      setSalvandoEdicao(false)

      if (resultado.sucesso) {
        exibirToast('Gestora atualizada com sucesso.', 'sucesso')
        fecharModalEdicao()
        return
      }

      exibirToast(resultado.erro ?? MENSAGEM_ERRO_EDITAR_PADRAO, 'erro')
    },
    [editarUsuario, exibirToast, fecharModalEdicao]
  )

  const linhas = useMemo<LinhaGestora[]>(
    () =>
      gestoras.map((g) => ({
        id: g.id,
        nome: g.nome,
        papel: ROTULO_PAPEL[g.papel],
        email: g.email,
        telefone: g.telefone,
        cpf: formatarCpf(g.cpf),
      })),
    [gestoras]
  )

  const colunas = useMemo(
    () => [
      { chave: 'nome', titulo: 'Nome', ordenavel: true },
      { chave: 'papel', titulo: 'Papel', ordenavel: true },
      { chave: 'email', titulo: 'E-mail', ordenavel: true },
      { chave: 'telefone', titulo: 'Telefone' },
      { chave: 'cpf', titulo: 'CPF' },
      {
        chave: 'acoes',
        titulo: 'Ações',
        renderizar: (linha: LinhaGestora) => (
          <Botao variante="ghost" tamanho="sm" aoClicar={() => abrirEdicaoDe(linha.id)}>
            <Icone nome="editar" tamanho={14} />
            Editar
          </Botao>
        ),
      },
    ],
    [abrirEdicaoDe]
  )

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--cor-argila)',
        padding: '32px',
      }}
    >
      {/* Cabeçalho da página */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-display, inherit)',
              fontSize: 28,
              fontWeight: 700,
              color: 'var(--cor-texto)',
              margin: 0,
            }}
          >
            Usuários
          </h1>
          <p style={{ fontSize: 14, color: 'var(--cor-muted)', margin: '4px 0 0' }}>
            {gestoras.length} {gestoras.length === 1 ? 'gestora cadastrada' : 'gestoras cadastradas'}
          </p>
        </div>
        <Botao variante="primario" aoClicar={abrirModal}>
          <Icone nome="mais" tamanho={16} />
          Nova gestora
        </Botao>
      </div>

      {/* Tabela */}
      <div
        style={{
          background: 'var(--cor-argila-card)',
          border: '1px solid var(--cor-argila-borda)',
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        {linhas.length === 0 ? (
          <EstadoVazio
            titulo="Nenhuma gestora cadastrada"
            subtitulo="Cadastre a primeira gestora para que ela possa acessar o sistema."
            textoBotao="Cadastrar gestora"
            aoClicarBotao={abrirModal}
          />
        ) : (
          <TabelaDados<LinhaGestora>
            colunas={colunas}
            dados={linhas}
            chaveUnica="id"
            mensagemVazia="Nenhuma gestora encontrada."
          />
        )}
      </div>

      {/* Modal de cadastro */}
      <ModalNovoUsuario
        aberto={modalAberto}
        aoFechar={fecharModal}
        aoSalvar={handleSalvarUsuario}
        salvando={salvando}
      />

      {/* Modal de edição */}
      <ModalEditarUsuario
        aberto={gestoraEmEdicao !== null}
        gestora={gestoraEmEdicao}
        aoFechar={fecharModalEdicao}
        aoSalvar={handleSalvarEdicao}
        salvando={salvandoEdicao}
      />

      <ToastContainer toasts={toasts} aoRemover={removerToast} />
    </div>
  )
}
