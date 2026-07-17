-- 0013_registrar_produto_com_receita.sql
-- RPC `public.registrar_produto_com_receita(p_produto jsonb, p_itens jsonb)` —
-- cria ou edita um produto E regrava a receita completa (`produto_insumos`)
-- de forma ATÔMICA: se `p_produto` trouxer `id`, atualiza o produto existente;
-- senão, insere um produto novo. Em seguida apaga toda a receita anterior do
-- produto e insere as linhas de `p_itens` (a receita final, completa). Se
-- qualquer item referenciar um insumo inexistente (FK inválida) ou violar
-- outro constraint, a função levanta exceção e o Postgres desfaz TUDO
-- (produto não fica criado/editado nem com receita parcial).
--
-- Depende de:
--   - 0003_ids_sequenciais.sql (produtos com PK int)
--   - 0004_gestoras_papeis.sql (função `eh_gestora()`)
--   - 0010_insumos.sql (tabela insumos)
--   - 0012_receita_produtos.sql (produtos.percentual_custos_extras + tabela
--     produto_insumos)
--   - 0005_auditoria.sql (trigger `registrar_log()` em produtos/produto_insumos
--     — dispara normalmente a partir desta RPC)
--
-- Quem chama: o frontend, via
-- `supabase.rpc('registrar_produto_com_receita', { p_produto, p_itens })`,
-- com a sessão da gestora logada (role `authenticated`).
--
-- SECURITY INVOKER (mesmo padrão de 0008_registrar_venda.sql): a função roda
-- com os privilégios e o RLS do CHAMADOR, não do dono da função. Os
-- INSERT/UPDATE/DELETE internos continuam passando pelas policies
-- `gestora_acesso_total` de `produtos` e `produto_insumos`. A checagem
-- explícita de `eh_gestora()` logo no início é defesa em profundidade.

-- ============================================================
-- Função `public.registrar_produto_com_receita`.
-- ============================================================
create or replace function public.registrar_produto_com_receita(
  p_produto jsonb,
  p_itens   jsonb
)
returns public.produtos
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_produto_id int;
  v_resultado  public.produtos;
begin
  -- Defesa em profundidade: a RLS de produtos/produto_insumos já bloqueia
  -- quem não é gestora, mas falhar aqui dá uma mensagem clara e cedo.
  if not public.eh_gestora() then
    raise exception 'nao autorizado';
  end if;

  if p_produto is null then
    raise exception 'produto e obrigatorio';
  end if;

  if p_itens is null or jsonb_typeof(p_itens) <> 'array' then
    raise exception 'itens da receita devem ser um array (pode ser vazio)';
  end if;

  v_produto_id := nullif(p_produto ->> 'id', '')::int;

  if v_produto_id is not null then
    -- Edição: atualiza o produto existente.
    update public.produtos
       set nome                      = p_produto ->> 'nome',
           intencao                  = p_produto ->> 'intencao',
           tipo_cera                 = p_produto ->> 'tipo_cera',
           granulometria             = p_produto ->> 'granulometria',
           gramagem                  = (p_produto ->> 'gramagem')::numeric,
           notas_aromaticas          = coalesce(p_produto -> 'notas_aromaticas', '{"topo":"","coracao":"","fundo":""}'::jsonb),
           percentual_fragrancia     = (p_produto ->> 'percentual_fragrancia')::numeric,
           tipo_pavio                = p_produto ->> 'tipo_pavio',
           cor_cera                  = p_produto ->> 'cor_cera',
           recipiente                = p_produto ->> 'recipiente',
           tempo_queima              = (p_produto ->> 'tempo_queima')::numeric,
           custo_producao            = coalesce((p_produto ->> 'custo_producao')::numeric, 0),
           preco_venda               = coalesce((p_produto ->> 'preco_venda')::numeric, 0),
           margem                    = coalesce((p_produto ->> 'margem')::numeric, 0),
           markup                    = coalesce((p_produto ->> 'markup')::numeric, 0),
           categoria                 = p_produto ->> 'categoria',
           tags                      = coalesce(
                                          (select array_agg(value::text) from jsonb_array_elements_text(p_produto -> 'tags')),
                                          '{}'::text[]
                                        ),
           estoque_atual             = coalesce((p_produto ->> 'estoque_atual')::int, 0),
           estoque_minimo            = coalesce((p_produto ->> 'estoque_minimo')::int, 0),
           descricao_curta           = coalesce(p_produto ->> 'descricao_curta', ''),
           historia_vela             = coalesce(p_produto ->> 'historia_vela', ''),
           ativo                     = coalesce((p_produto ->> 'ativo')::boolean, true),
           percentual_custos_extras  = coalesce((p_produto ->> 'percentual_custos_extras')::numeric, 0),
           atualizado_em             = now()
     where id = v_produto_id;

    if not found then
      raise exception 'produto % nao encontrado', v_produto_id;
    end if;
  else
    -- Criação: insere um produto novo.
    insert into public.produtos (
      nome, intencao, tipo_cera, granulometria, gramagem, notas_aromaticas,
      percentual_fragrancia, tipo_pavio, cor_cera, recipiente, tempo_queima,
      custo_producao, preco_venda, margem, markup, categoria, tags,
      estoque_atual, estoque_minimo, descricao_curta, historia_vela, ativo,
      percentual_custos_extras
    )
    values (
      p_produto ->> 'nome',
      p_produto ->> 'intencao',
      p_produto ->> 'tipo_cera',
      p_produto ->> 'granulometria',
      (p_produto ->> 'gramagem')::numeric,
      coalesce(p_produto -> 'notas_aromaticas', '{"topo":"","coracao":"","fundo":""}'::jsonb),
      (p_produto ->> 'percentual_fragrancia')::numeric,
      p_produto ->> 'tipo_pavio',
      p_produto ->> 'cor_cera',
      p_produto ->> 'recipiente',
      (p_produto ->> 'tempo_queima')::numeric,
      coalesce((p_produto ->> 'custo_producao')::numeric, 0),
      coalesce((p_produto ->> 'preco_venda')::numeric, 0),
      coalesce((p_produto ->> 'margem')::numeric, 0),
      coalesce((p_produto ->> 'markup')::numeric, 0),
      p_produto ->> 'categoria',
      coalesce(
        (select array_agg(value::text) from jsonb_array_elements_text(p_produto -> 'tags')),
        '{}'::text[]
      ),
      coalesce((p_produto ->> 'estoque_atual')::int, 0),
      coalesce((p_produto ->> 'estoque_minimo')::int, 0),
      coalesce(p_produto ->> 'descricao_curta', ''),
      coalesce(p_produto ->> 'historia_vela', ''),
      coalesce((p_produto ->> 'ativo')::boolean, true),
      coalesce((p_produto ->> 'percentual_custos_extras')::numeric, 0)
    )
    returning id into v_produto_id;
  end if;

  -- Regrava a receita de forma idempotente: apaga tudo e insere de novo a
  -- lista completa e final enviada em p_itens. Se algum insumo_id não
  -- existir (FK inválida) ou quantidade <= 0, o INSERT levanta exceção e o
  -- Postgres desfaz TUDO (o produto recém-criado/editado e o delete acima).
  delete from public.produto_insumos where produto_id = v_produto_id;

  insert into public.produto_insumos (produto_id, insumo_id, quantidade)
  select v_produto_id, (item ->> 'insumo_id')::int, (item ->> 'quantidade')::numeric
  from jsonb_array_elements(p_itens) as item;

  select * into v_resultado from public.produtos where id = v_produto_id;

  return v_resultado;
end;
$$;

comment on function public.registrar_produto_com_receita(jsonb, jsonb) is
  'Cria ou edita um produto e regrava sua receita (produto_insumos) de forma atômica. SECURITY INVOKER (RLS/eh_gestora() do chamador continua valendo). Se p_produto tiver id, edita; senão, cria. A receita anterior é sempre apagada e substituída pelos itens de p_itens. Qualquer erro (insumo inexistente, quantidade inválida etc.) reverte a transação inteira.';

-- ============================================================
-- Superfície RPC: fecha para anon, libera só para authenticated.
-- Mesmo padrão de 0006_grants_seguranca.sql / 0008_registrar_venda.sql.
-- ============================================================
revoke execute on function public.registrar_produto_com_receita(jsonb, jsonb) from public, anon;
grant  execute on function public.registrar_produto_com_receita(jsonb, jsonb) to authenticated;
