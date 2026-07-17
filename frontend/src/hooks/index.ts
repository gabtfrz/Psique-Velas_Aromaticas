// Barril de hooks de domínio
// Nota: useArmazenamentoLocal é interno (infraestrutura); exposto aqui para eventuais usos diretos,
// mas a preferência é consumir os hooks de domínio específicos abaixo.
export { useArmazenamentoLocal } from './useArmazenamentoLocal'
export { useAutenticacao } from './useAutenticacao'
export { useClientes } from './useClientes'
export { useInsumos } from './useInsumos'
export { usePerfil } from './usePerfil'
export { useProdutos } from './useProdutos'
export { useToast } from './useToast'
export { useVendas } from './useVendas'
