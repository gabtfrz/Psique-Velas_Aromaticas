# Psiquê Velas Aromáticas — Sistema de Gestão

<p align="center">
  <img src="docs/assets/logo-placeholder.png" alt="Psiquê" width="80" />
</p>

<p align="center">
  Sistema interno de gestão de e-commerce para a <strong>Psiquê Velas Aromáticas</strong> —
  controle de produtos, vendas, clientes e relatórios, fiel à identidade visual da marca.
</p>

---

## Visão Geral

A Psiquê é uma marca de velas aromáticas posicionada como instrumento emocional — cada vela acompanha um momento da vida. Este sistema foi desenvolvido para dar à gestora da marca controle total sobre o seu negócio: cadastro de produtos com todas as características técnicas de uma vela artesanal, registro de vendas por múltiplos canais, gestão de clientes e relatórios de desempenho.

O sistema roda localmente na máquina da cliente, sem dependência de serviços externos, com uma interface que respeita e traduz a identidade visual do brandbook oficial da marca.

---

## Status do Projeto

| Fase | Descrição | Status |
|------|-----------|--------|
| MVP Frontend | Interface completa com dados mockados (aprovação do cliente) | Em desenvolvimento |
| Backend FastAPI | API REST com autenticação e regras de negócio | Planejado |
| Banco de Dados | PostgreSQL com Prisma migrations | Planejado |
| Integração | Frontend conectado ao backend real | Planejado |
| Deploy Local | Docker Compose para rodar na máquina da cliente | Planejado |

---

## Estrutura do Repositório

```
psique-sistema/
│
├── frontend/              # React + Vite + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── components/    # Componentes reutilizáveis (UI, layout, shared)
│   │   ├── pages/         # Páginas da aplicação
│   │   ├── data/          # Mock data centralizado
│   │   ├── hooks/         # Custom hooks (useLocalStorage, etc.)
│   │   ├── utils/         # Formatadores (moeda, data, percentual)
│   │   ├── types/         # Interfaces TypeScript do domínio
│   │   └── styles/        # CSS global + variáveis da marca
│   ├── public/
│   ├── tailwind.config.ts
│   └── vite.config.ts
│
├── backend/               # Python + FastAPI
│   ├── app/
│   │   ├── api/           # Routers: produtos, vendas, clientes, relatórios, auth
│   │   ├── models/        # SQLAlchemy models (mapeamento das tabelas)
│   │   ├── schemas/       # Pydantic schemas (validação de entrada/saída)
│   │   ├── services/      # Regras de negócio (precificação, relatórios)
│   │   ├── core/          # Configurações, segurança, autenticação JWT
│   │   └── main.py        # Entry point FastAPI
│   ├── tests/             # Testes unitários e de integração
│   ├── requirements.txt
│   └── .env.example
│
├── database/              # Scripts e migrations do banco de dados
│   ├── migrations/        # Alembic migrations (versionamento do schema)
│   ├── seeds/             # Dados iniciais para desenvolvimento
│   └── schema.sql         # Schema SQL documentado (referência)
│
├── docs/                  # Documentação do projeto
│   ├── instalacao.md      # Guia de instalação passo a passo
│   ├── tecnologias.md     # Stack completa e justificativas
│   ├── decisoes.md        # ADRs — decisões de arquitetura
│   ├── api.md             # Documentação dos endpoints REST
│   └── assets/            # Imagens e diagramas da documentação
│
├── docker-compose.yml     # Orquestração local (backend + banco + frontend)
├── .gitignore
└── README.md              # Este arquivo
```

---

## Módulos do Sistema

- **Dashboard** — Visão geral com KPIs, gráficos de faturamento e alertas de estoque baixo
- **Produtos** — Cadastro completo de velas (composição, aromas, precificação, estoque)
- **Vendas** — PDV para registro de vendas + histórico com filtros
- **Clientes** — Cadastro com histórico de pedidos e perfil de compra
- **Precificação** — Gestão de margens com simulador de preço
- **Relatórios** — Análise de desempenho por período, canal e produto, com exportação

---

## Tecnologias

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Frontend | React + TypeScript | 18.x |
| Build | Vite | 5.x |
| Estilo | Tailwind CSS | 3.x |
| Componentes | shadcn/ui | latest |
| Gráficos | Recharts | 2.x |
| Backend | FastAPI (Python) | 0.111.x |
| ORM | SQLAlchemy + Alembic | 2.x |
| Banco (dev) | SQLite | — |
| Banco (prod) | PostgreSQL | 16.x |
| Autenticação | JWT (python-jose) | — |
| Containerização | Docker + Docker Compose | — |

Documentação completa em [`docs/tecnologias.md`](docs/tecnologias.md).

---

## Início Rápido

### MVP Frontend (dados mockados)

```bash
cd frontend
npm install
npm run dev
```

Acesse em `http://localhost:5173`

### Sistema Completo (backend + banco)

```bash
# Na raiz do projeto
docker-compose up --build
```

Serviços disponíveis:
- Frontend: `http://localhost:5173`
- API: `http://localhost:8000`
- Docs da API (Swagger): `http://localhost:8000/docs`

Guia completo em [`docs/instalacao.md`](docs/instalacao.md).

---

## Identidade Visual

O sistema segue fielmente o brandbook oficial da Psiquê (Matuto Astuto Estúdio, 2026).

| Token | Valor | Uso |
|-------|-------|-----|
| `--color-clay` | `#EAE4DA` | Background principal |
| `--color-moss` | `#6B6B2A` | Acento da marca, botões primários |
| `--color-dark` | `#2C2C2A` | Texto principal |
| `--color-muted` | `#B8AFA5` | Texto secundário, bordas |
| `--font-display` | Cormorant Garamond | Títulos, nomes de produtos |
| `--font-body` | DM Sans | Labels, tabelas, navegação |
| `--font-accent` | Sacramento | Elementos decorativos |

---

## Desenvolvido por

Gabriel — Desenvolvimento de Software  
Cliente: Psiquê Velas Aromáticas  
Brandbook: Breno Castilho / Matuto Astuto Estúdio
