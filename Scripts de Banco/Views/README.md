# Views

**Nenhuma view definida no banco no momento.**

O front acessa as tabelas direto via `@supabase/supabase-js` (com RLS) e usa
funções RPC (`listar_gestoras`, `registrar_venda`, etc.) quando precisa de lógica
no servidor. Consultas derivadas/relatórios hoje são montadas no frontend
(`utils/`) a partir dos dados das tabelas.

Quando surgir a primeira view, criar um arquivo por view aqui, no padrão:

```sql
create or replace view vw_nome as
select ...
from ...
inner join ...;
```
