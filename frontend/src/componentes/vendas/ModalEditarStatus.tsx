import { useState, useCallback } from 'react'
import { Modal } from '@/componentes/ui/Modal'
import { Botao } from '@/componentes/ui/Botao'
import { CampoSelecao } from '@/componentes/ui/CampoSelecao'
import { OPCOES_STATUS_ENTREGA } from '@/constantes'
import type { Venda, StatusPagamento, StatusEntrega } from '@/tipos'

export interface PropsModalStatus {
  aberto: boolean
  aoFechar: () => void
  venda: Venda | null
  aoSalvar: (id: number, statusPagamento: StatusPagamento, statusEntrega: StatusEntrega) => void
}

export function ModalEditarStatus({ aberto, aoFechar, venda, aoSalvar }: PropsModalStatus) {
  const [statusPag, setStatusPag] = useState<StatusPagamento>('pendente')
  const [statusEnt, setStatusEnt] = useState<StatusEntrega>('aguardando')

  // Sincronizar ao abrir
  const [inicializado, setInicializado] = useState(false)
  if (aberto && venda && !inicializado) {
    setStatusPag(venda.statusPagamento)
    setStatusEnt(venda.statusEntrega)
    setInicializado(true)
  }
  if (!aberto && inicializado) {
    setInicializado(false)
  }

  const handleSalvar = useCallback(() => {
    if (!venda) return
    aoSalvar(venda.id, statusPag, statusEnt)
    aoFechar()
  }, [venda, aoSalvar, statusPag, statusEnt, aoFechar])

  const handleStatusPag = useCallback((v: string) => setStatusPag(v as StatusPagamento), [])
  const handleStatusEnt = useCallback((v: string) => setStatusEnt(v as StatusEntrega), [])

  if (!venda) return null
  return (
    <Modal aberto={aberto} aoFechar={aoFechar} titulo="Editar status" largura="sm">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <CampoSelecao
          rotulo="Status de pagamento"
          nome="statusPagamento"
          opcoes={[
            { valor: 'pago', rotulo: 'Pago' },
            { valor: 'pendente', rotulo: 'Pendente' },
          ]}
          valor={statusPag}
          aoMudar={handleStatusPag}
        />
        <CampoSelecao
          rotulo="Status de entrega"
          nome="statusEntrega"
          opcoes={OPCOES_STATUS_ENTREGA}
          valor={statusEnt}
          aoMudar={handleStatusEnt}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 8, borderTop: '1px solid var(--cor-argila-borda)' }}>
          <Botao variante="secundario" aoClicar={aoFechar}>Cancelar</Botao>
          <Botao variante="primario" aoClicar={handleSalvar}>Salvar</Botao>
        </div>
      </div>
    </Modal>
  )
}
