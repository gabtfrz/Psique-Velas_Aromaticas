-- 0014_insumos_embalagem.sql
-- Adiciona à tabela `public.insumos` (0010_insumos.sql) os dados opcionais da
-- embalagem comprada, usados no frontend para calcular o preco_unitario
-- (preco_embalagem / quantidade_embalagem) quando o cadastro é feito por
-- embalagem em vez de valor unitário direto. Ambas as colunas são NULLABLE:
-- insumos já cadastrados e cadastros feitos só pelo preco_unitario continuam
-- válidos sem preenchê-las.
--
-- RLS e o trigger_auditoria de `public.insumos` já existem (0010_insumos.sql)
-- e cobrem automaticamente estas colunas novas — não é preciso recriar nada.

alter table public.insumos
  add column quantidade_embalagem numeric(12,4) check (quantidade_embalagem > 0);

alter table public.insumos
  add column preco_embalagem numeric(12,2) check (preco_embalagem >= 0);

comment on column public.insumos.quantidade_embalagem is
  'Quantidade total contida na embalagem comprada (na unidade_medida do insumo). Opcional: usada junto com preco_embalagem para calcular preco_unitario no frontend (preco_embalagem / quantidade_embalagem).';
comment on column public.insumos.preco_embalagem is
  'Preço total pago pela embalagem inteira (não o unitário). Opcional: base do cálculo de preco_unitario no frontend junto com quantidade_embalagem.';
