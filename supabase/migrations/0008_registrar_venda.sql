-- 0008_registrar_venda.sql
-- RPC `public.registrar_venda(p_venda jsonb, p_itens jsonb)` — registra uma
-- venda inteira de forma ATÔMICA: insere a linha em `vendas`, insere cada
-- linha de `itens_venda` e baixa o `estoque_atual` de cada produto vendido,
-- tudo dentro da mesma transação implícita da chamada de função. Se algum
-- item pedir quantidade maior que o estoque disponível, a função levanta
-- exceção e o Postgres desfaz TUDO (nenhuma baixa parcial, nenhuma venda
-- gravada) — é o mesmo comportamento de qualquer erro dentro de uma função
-- plpgsql: a transação da chamada é revertida por inteiro.
--
-- Depende de:
--   - 0003_ids_sequenciais.sql (vendas/itens_venda/produtos com PK int)
--   - 0004_gestoras_papeis.sql (função `eh_gestora()`)
--   - 0005_auditoria.sql (trigger `registrar_log()` em vendas/itens_venda/produtos
--     — dispara normalmente a partir desta RPC, pois os INSERT/UPDATE internos
--     são estatuções DML comuns)
--
-- Quem chama: o frontend, via `supabase.rpc('registrar_venda', { p_venda, p_itens })`,
-- com a sessão da gestora logada (role `authenticated`).
--
-- SECURITY INVOKER (padrão do Postgres — explicitado aqui de propósito): a
-- função roda com os privilégios e o RLS do CHAMADOR, não do dono da função.
-- Isso significa que os UPDATE/INSERT internos ainda passam pelas policies
-- `gestora_acesso_total` de `produtos`, `vendas` e `itens_venda` (que exigem
-- `eh_gestora()`). A checagem explícita de `eh_gestora()` logo no início é uma
-- defesa em profundidade (falha cedo com mensagem clara, antes de tocar em
-- qualquer tabela) — a autorização "de verdade" continua sendo a RLS.

-- ============================================================
-- Função `public.registrar_venda`.
-- ============================================================
create or replace function public.registrar_venda(
  p_venda jsonb,
  p_itens jsonb
)
returns int
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_venda_id      int;
  v_item          jsonb;
  v_produto_id    int;
  v_nome_produto  text;
  v_quantidade    int;
  v_preco_unit    numeric;
  v_subtotal      numeric;
begin
  -- Defesa em profundidade: a RLS de vendas/itens_venda/produtos já bloqueia
  -- quem não é gestora, mas falhar aqui dá uma mensagem clara e cedo.
  if not public.eh_gestora() then
    raise exception 'nao autorizado';
  end if;

  if p_itens is null or jsonb_typeof(p_itens) <> 'array' or jsonb_array_length(p_itens) = 0 then
    raise exception 'a venda precisa ter ao menos um item';
  end if;

  -- 1) Insere a venda.
  insert into public.vendas (
    numero_pedido, cliente_id, desconto, total, canal_venda,
    forma_pagamento, status_pagamento, tipo_entrega, status_entrega, observacoes
  )
  values (
    p_venda ->> 'numero_pedido',
    nullif(p_venda ->> 'cliente_id', '')::int,
    coalesce((p_venda ->> 'desconto')::numeric, 0),
    coalesce((p_venda ->> 'total')::numeric, 0),
    p_venda ->> 'canal_venda',
    p_venda ->> 'forma_pagamento',
    p_venda ->> 'status_pagamento',
    p_venda ->> 'tipo_entrega',
    p_venda ->> 'status_entrega',
    p_venda ->> 'observacoes'
  )
  returning id into v_venda_id;

  -- 2) Para cada item: baixa o estoque de forma atômica (a condição
  -- `estoque_atual >= quantidade` no WHERE evita estoque negativo mesmo sob
  -- concorrência) e só insere o item se a baixa realmente afetou uma linha.
  for v_item in select * from jsonb_array_elements(p_itens)
  loop
    v_produto_id   := (v_item ->> 'produto_id')::int;
    v_nome_produto := v_item ->> 'nome_produto';
    v_quantidade   := (v_item ->> 'quantidade')::int;
    v_preco_unit   := (v_item ->> 'preco_unitario')::numeric;
    v_subtotal     := (v_item ->> 'subtotal')::numeric;

    update public.produtos
       set estoque_atual = estoque_atual - v_quantidade
     where id = v_produto_id
       and estoque_atual >= v_quantidade;

    if not found then
      -- Levanta exceção: o Postgres desfaz TODA a transação da chamada
      -- (a venda recém-inserida e qualquer baixa de estoque já feita nesta
      -- mesma chamada, incluindo itens anteriores do loop).
      raise exception 'estoque insuficiente para o produto %', v_produto_id;
    end if;

    insert into public.itens_venda (
      venda_id, produto_id, nome_produto, quantidade, preco_unitario, subtotal
    )
    values (
      v_venda_id, v_produto_id, v_nome_produto, v_quantidade, v_preco_unit, v_subtotal
    );
  end loop;

  return v_venda_id;
end;
$$;

comment on function public.registrar_venda(jsonb, jsonb) is
  'Registra uma venda inteira de forma atômica: insere vendas + itens_venda e baixa produtos.estoque_atual de cada item. SECURITY INVOKER (RLS/eh_gestora() do chamador continua valendo). Se algum item pedir quantidade > estoque disponível, levanta exceção e reverte a transação inteira (nenhuma baixa parcial, nenhuma venda gravada).';

-- ============================================================
-- Superfície RPC: fecha para anon, libera só para authenticated.
-- Mesmo motivo do 0006: a Supabase concede EXECUTE a PUBLIC (e portanto a
-- anon/authenticated) em toda função nova por padrão. Revogamos de
-- public/anon e concedemos explicitamente só a authenticated — a gestora
-- logada chama via `supabase.rpc('registrar_venda', ...)`. A RLS dentro da
-- função continua sendo a barreira real; isto só evita a chamada por sessão
-- anônima.
-- ============================================================
revoke execute on function public.registrar_venda(jsonb, jsonb) from public, anon;
grant  execute on function public.registrar_venda(jsonb, jsonb) to authenticated;
