# Psiquê Velas Aromáticas — Sistema de Gestão

Sistema interno de gestão para a **Psiquê Velas Aromáticas** — controle de produtos, vendas, clientes e relatórios, com identidade visual fiel ao brandbook da marca.

---

## Pré-requisitos

Antes de rodar o projeto, você precisa ter instalado:

| Ferramenta | Versão mínima | Como verificar |
|---|---|---|
| [Node.js](https://nodejs.org) | 18.x ou superior | `node -v` |
| npm | 9.x ou superior | `npm -v` |

> Não precisa instalar nada mais. O projeto não usa Docker, banco de dados nem backend nesta fase (MVP com dados mockados).

---

## Instalação

```bash
# 1. Entrar na pasta do frontend
cd frontend

# 2. Instalar as dependências
npm install
```

Isso instala automaticamente:
- React 18 + TypeScript
- Vite 5 (build tool)
- Tailwind CSS 3
- React Hook Form + Zod (formulários e validação)
- React Router DOM (navegação entre páginas)

---

## Rodando o projeto

```bash
# Dentro da pasta frontend/
npm run dev
```

Acesse no navegador: **http://localhost:5173**

O servidor recarrega automaticamente a cada alteração nos arquivos.

---

## Encerrando o projeto

No terminal onde o servidor está rodando, pressione:

```
Ctrl + C
```

Confirme com `S` ou `Y` se o terminal perguntar.

---

## Scripts disponíveis

Execute todos dentro da pasta `frontend/`:

| Comando | O que faz |
|---|---|
| `npm run dev` | Sobe o servidor de desenvolvimento em `localhost:5173` |
| `npm run build` | Gera a versão de produção otimizada em `frontend/dist/` |
| `npm run preview` | Serve localmente o build de produção (para testar antes de deploy) |

---

## Estrutura do projeto

```
frontend/
├── src/
│   ├── componentes/
│   │   ├── ui/              # Primitivos: Botao, Campo, Modal, Toast, Icone...
│   │   ├── graficos/        # Gráficos SVG puros: Linha, Barra, Rosca
│   │   ├── layout/          # BarraLateral, Cabecalho, ConteudoPagina
│   │   └── compartilhados/  # CartaoKpi, TabelaDados, Modais de produto/cliente
│   ├── paginas/
│   │   ├── Dashboard.tsx
│   │   ├── Produtos.tsx
│   │   ├── Vendas.tsx
│   │   ├── Clientes.tsx
│   │   ├── Precificacao.tsx
│   │   ├── Relatorios.tsx
│   │   └── Configuracoes.tsx
│   ├── dados/
│   │   └── dadosMock.ts     # 6 produtos, 8 clientes, 10 vendas, 30 dias de faturamento
│   ├── hooks/               # useProdutos, useVendas, useClientes, useToast...
│   ├── utils/               # formatadores, calculadores, validadores, svg
│   ├── tipos/               # Interfaces TypeScript do domínio
│   ├── constantes/          # Chaves de storage, limites, alertas
│   └── estilos/
│       └── global.css       # Imports de fontes, variáveis CSS da marca, reset
├── public/
│   └── favicon.svg
├── tailwind.config.ts
├── vite.config.ts
└── tsconfig.app.json
```

---

## Dados e armazenamento

Nesta fase de MVP, **todos os dados ficam no `localStorage` do navegador**. Isso significa:

- Os dados persistem enquanto você não limpar o cache do navegador
- Na primeira vez que abrir, os dados de exemplo (mock) são carregados automaticamente
- Qualquer produto, cliente ou venda criada fica salva entre sessões

### Como resetar para os dados originais

Se quiser voltar aos dados de exemplo do zero:

1. Abra o navegador em `http://localhost:5173`
2. Abra o DevTools (tecla `F12`)
3. Vá em **Application → Storage → Local Storage → http://localhost:5173**
4. Selecione e delete as três chaves:
   - `psique:produtos`
   - `psique:clientes`
   - `psique:vendas`
5. Recarregue a página (`F5`)

---

## Módulos do sistema

| Módulo | O que faz |
|---|---|
| **Dashboard** | KPIs do mês, gráfico de faturamento, top produtos e alertas de estoque |
| **Produtos** | Cadastro completo de velas com composição, aromas, precificação e estoque |
| **Vendas** | PDV para registrar vendas + histórico com filtros e status |
| **Clientes** | Cadastro de clientes com histórico de pedidos e perfil de compra |
| **Precificação** | Tabela de margens, edição de preços e simulador de precificação |
| **Relatórios** | Análise por período, canal e produto com gráficos e exportação |
| **Configurações** | Preferências visuais do sistema |

---

## Identidade visual

O sistema segue o brandbook oficial da Psiquê (Matuto Astuto Estúdio, Breno Castilho, Goiânia).

| Variável CSS | Cor | Uso |
|---|---|---|
| `--cor-argila` | `#EAE4DA` | Background principal |
| `--cor-argila-card` | `#F0EBE3` | Surface de cards |
| `--cor-musgo` | `#6B6B2A` | Botões primários, acento da marca |
| `--cor-texto` | `#2C2C2A` | Texto principal |
| `--cor-muted` | `#B8AFA5` | Texto secundário |
| `--cor-perigo` | `#8B4A3A` | Ações destrutivas |

Fontes (Google Fonts):
- **Cormorant Garamond** — títulos e nomes de produto
- **DM Sans** — corpo, labels, tabelas
- **Sacramento** — elementos decorativos

---

## Stack tecnológica

| Camada | Tecnologia |
|---|---|
| Interface | React 18 + TypeScript |
| Build | Vite 5 |
| Estilo | Tailwind CSS 3 |
| Formulários | React Hook Form + Zod |
| Navegação | React Router DOM |
| Gráficos | SVG puro (zero bibliotecas externas) |
| Componentes | 100% próprios (zero shadcn/ui, Radix, Lucide, etc.) |
| Dados (MVP) | localStorage + dados mockados |

---

## Próximas fases

| Fase | Descrição |
|---|---|
| Backend | API REST em FastAPI (Python) |
| Banco de dados | PostgreSQL com migrações Alembic |
| Autenticação | Login com JWT |
| Deploy | Docker Compose para rodar na máquina da cliente |

---

Desenvolvido por Gabriel — Desenvolvimento de Software  
Cliente: Psiquê Velas Aromáticas  
Brandbook: Breno Castilho / Matuto Astuto Estúdio, Goiânia
