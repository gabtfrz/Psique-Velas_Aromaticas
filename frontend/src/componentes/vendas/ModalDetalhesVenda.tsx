import { Modal } from '@/componentes/ui/Modal'
import { Botao } from '@/componentes/ui/Botao'
import { Emblema } from '@/componentes/ui/Emblema'
import { formatarMoeda, formatarDataHora } from '@/utils/formatadores'
import { ROTULOS_CANAL, ROTULOS_PAGAMENTO, ROTULOS_ENTREGA } from '@/constantes'
import type { Venda } from '@/tipos'

export interface PropsModalDetalhes {
  aberto: boolean
  aoFechar: () => void
  venda: Venda | null
  nomeCliente: string
}

export function ModalDetalhesVenda({ aberto, aoFechar, venda, nomeCliente }: PropsModalDetalhes) {
  if (!venda) return null
  return (
    <Modal aberto={aberto} aoFechar={aoFechar} titulo={`Pedido ${venda.numeroPedido}`} largura="md">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, fontSize: 14, color: 'var(--cor-texto)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--cor-muted)' }}>Data</p>
            <p style={{ margin: '2px 0 0', fontWeight: 500 }}>{formatarDataHora(venda.criadoEm)}</p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--cor-muted)' }}>Cliente</p>
            <p style={{ margin: '2px 0 0', fontWeight: 500 }}>{nomeCliente}</p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--cor-muted)' }}>Canal</p>
            <p style={{ margin: '2px 0 0', fontWeight: 500 }}>{ROTULOS_CANAL[venda.canalVenda]}</p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--cor-muted)' }}>Pagamento</p>
            <p style={{ margin: '2px 0 0', fontWeight: 500 }}>{ROTULOS_PAGAMENTO[venda.formaPagamento]}</p>
          </div>
          <div>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--cor-muted)' }}>Entrega</p>
            <p style={{ margin: '2px 0 0', fontWeight: 500 }}>{ROTULOS_ENTREGA[venda.tipoEntrega]}</p>
          </div>
        </div>

        <div>
          <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--cor-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Itens
          </p>
          {venda.itens.map((item) => (
            <div
              key={item.produtoId}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '6px 0',
                borderBottom: '1px solid var(--cor-argila-borda)',
              }}
            >
              <span>{item.nomeProduto} × {item.quantidade}</span>
              <span style={{ fontWeight: 600 }}>{formatarMoeda(item.subtotal)}</span>
            </div>
          ))}
          {venda.desconto > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', color: 'var(--cor-muted)' }}>
              <span>Desconto</span>
              <span>− {formatarMoeda(venda.desconto)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontWeight: 700, fontSize: 15 }}>
            <span>Total</span>
            <span style={{ color: 'var(--cor-musgo)' }}>{formatarMoeda(venda.total)}</span>
          </div>
        </div>

        {venda.observacoes && (
          <div>
            <p style={{ margin: '0 0 4px', fontSize: 12, color: 'var(--cor-muted)' }}>Observações</p>
            <p style={{ margin: 0 }}>{venda.observacoes}</p>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <Emblema tipo={venda.statusPagamento} tamanho="md" />
          <Emblema tipo={venda.statusEntrega} tamanho="md" />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 8, borderTop: '1px solid var(--cor-argila-borda)' }}>
          <Botao variante="secundario" aoClicar={aoFechar}>Fechar</Botao>
        </div>
      </div>
    </Modal>
  )
}
