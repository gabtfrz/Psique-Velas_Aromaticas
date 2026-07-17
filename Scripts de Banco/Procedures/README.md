# Procedures

**Nenhuma stored procedure (`CREATE PROCEDURE` / `CALL`) no banco no momento.**

No PostgreSQL/Supabase deste projeto, toda a lógica de servidor é feita com
**funções** (`CREATE FUNCTION`), inclusive as que causam efeito colateral e são
chamadas como RPC pelo front (ex.: `registrar_venda`, `criar_gestora`,
`atualizar_gestora`, `marcar_senha_trocada`). Veja a pasta **`Functions/`**.

Diferença rápida (Postgres):
- **Function**: retorna valor; chamada em `select func(...)` ou `supabase.rpc(...)`.
  É o que usamos.
- **Procedure**: não retorna valor; chamada com `CALL proc(...)`; pode fazer
  `COMMIT`/`ROLLBACK` próprio. Não usamos até aqui.

Se no futuro uma procedure for necessária, criar um arquivo por procedure aqui,
no padrão `create or replace procedure nome(...) language plpgsql as $$ ... $$;`.
