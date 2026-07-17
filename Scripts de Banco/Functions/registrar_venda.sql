/* ============================================================
   Função: REGISTRAR_VENDA(p_venda jsonb, p_itens jsonb) -> int
   Registra uma venda inteira de forma ATÔMICA: insere em vendas,
   insere cada item em itens_venda e baixa produtos.estoque_atual de
   cada item — tudo na mesma transação. Se algum item pedir mais que
   o estoque disponível, levanta exceção e reverte TUDO (nenhuma baixa
   parcial, nenhuma venda gravada).

   Quem chama: o frontend, via supabase.rpc('registrar_venda', ...),
   com a sessão da gestora (role authenticated).

   SECURITY INVOKER (explícito): roda com a RLS/privilégios do chamador
   — os INSERT/UPDATE internos ainda passam pelas policies
   gestora_acesso_total. A checagem eh_gestora() no início é defesa em
   profundidade. EXECUTE liberado só a authenticated.
   ============================================================ */
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
  -- estoque_atual >= quantidade no WHERE evita estoque negativo mesmo
  -- sob concorrência) e só insere o item se a baixa afetou uma linha.
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

/* Superfície RPC: fechada para anon; liberada a authenticated. */
revoke execute on function public.registrar_venda(jsonb, jsonb) from public, anon;
grant  execute on function public.registrar_venda(jsonb, jsonb) to authenticated;
