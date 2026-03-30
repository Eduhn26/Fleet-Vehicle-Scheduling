<div align="center">

<br/>

# Fleet Vehicle Scheduling

**Full-stack fleet management and vehicle scheduling system built with Node.js, Express, MongoDB and React.**

<br/>

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB_Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docker.com)
[![Jest](https://img.shields.io/badge/Jest-tested-C21325?style=flat-square&logo=jest&logoColor=white)](https://jestjs.io)
[![CI](https://img.shields.io/badge/CI-GitHub_Actions-2088FF?style=flat-square&logo=github-actions&logoColor=white)](https://github.com/features/actions)

<br/>

[🖥️ Live Demo](https://fleet-vehicle-scheduling.vercel.app) · [⚙️ API](https://fleet-vehicle-scheduling.onrender.com) · [🩺 Health Check](https://fleet-vehicle-scheduling.onrender.com/api/health)

<br/>

</div>

---

## Sobre o Projeto

Sistema de gestão de frota corporativa construído para demonstrar **práticas reais de engenharia de software** — arquitetura em camadas, evolução progressiva do sistema, CI/CD, observabilidade e deploy containerizado.

Em vez de implementar tudo de uma vez, o sistema foi construído em **12 fases incrementais de engenharia**, cada uma introduzindo novas capacidades arquiteturais enquanto preserva a fundação existente — simulando como sistemas de produção realmente evoluem ao longo do tempo.

---

## Stack

| Categoria | Tecnologia |
|---|---|
| Backend | Node.js, Express |
| Banco de dados | MongoDB Atlas |
| ODM | Mongoose |
| Autenticação | JWT |
| Frontend | React, React Router |
| Cliente HTTP | Axios |
| Testes | Jest, Supertest, MongoMemoryServer |
| CI/CD | GitHub Actions |
| Containerização | Docker, Docker Compose |
| Hosting | Render (API) · Vercel (Frontend) |
| Tooling | ESLint, Prettier, Nodemon |

---

## Quick Start (Docker)

O sistema completo sobe com um único comando — sem necessidade de instalar Node.js manualmente.

```bash
git clone <repository-url>
cd fleet-vehicle-scheduling
docker compose up --build
```

| Serviço | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000 |
| Health Check | http://localhost:5000/api/health |

```bash
# Parar os containers
docker compose down
```

---

## Arquitetura do Sistema

```
┌──────────────────────────────────────┐
│          React  (Vercel)             │  ← Interface do usuário
└─────────────────┬────────────────────┘
                  │ HTTPS / Axios
┌─────────────────▼────────────────────┐
│     Node.js + Express  (Render)      │  ← Lógica de negócio & API
└─────────────────┬────────────────────┘
                  │ Mongoose
┌─────────────────▼────────────────────┐
│           MongoDB Atlas              │  ← Persistência
└──────────────────────────────────────┘
```

| Camada | Responsabilidade |
|---|---|
| **Frontend (React)** | Interface, fluxo de autenticação, dashboards, interação com workflows |
| **Backend (Express)** | Lógica de negócio, ciclo de vida das reservas, autenticação, validação |
| **Banco (MongoDB)** | Armazenamento persistente de usuários, veículos e reservas |

---

## Arquitetura do Backend

O backend segue uma **arquitetura em camadas estrita** que isola responsabilidades em quatro níveis:

```
HTTP Request
     │
     ▼
  Routes       →  Define endpoints da API
     │
     ▼
Controllers    →  Parse de request, formatação de response
     │
     ▼
  Services     →  Toda a lógica de negócio vive aqui
     │
     ▼
   Models      →  Schemas Mongoose e acesso ao banco
```

| Camada | Responsabilidade | Exemplo |
|---|---|---|
| **Routes** | Definição de endpoints | `POST /api/auth/login` |
| **Controllers** | Orquestração HTTP | Parse de request, formatação de response |
| **Services** | Regras de negócio | `createRental()`, `approveRequest()` |
| **Models** | Schemas do banco | Schemas Mongoose |

### Princípios de design

- **Service isolation** — Regras de negócio vivem exclusivamente nos Services; nunca em Controllers ou Routes
- **Thin controllers** — Controllers orquestram chamadas mas não contêm lógica de negócio
- **Erros padronizados** — Classe centralizada `AppError` garante respostas de erro consistentes na API
- **Validação em camadas** — Estrutura do request validada em middleware; regras de domínio validadas nos services
- **Lifecycle protection** — Toda transição de estado de reserva é validada explicitamente antes de ser executada

---

## Ciclo de Vida da Frota

Veículos seguem um ciclo de vida bem definido com transições de estado explícitas e validadas:

```
                ┌──────────────────┐
                │   Disponível     │
                └────────┬─────────┘
                         │ Usuário solicita
                ┌────────▼─────────┐
                │    Reserva       │
                │   Solicitada     │
                └────────┬─────────┘
                         │ Admin aprova
                ┌────────▼─────────┐
                │    Em Uso        │
                └────────┬─────────┘
                         │ Usuário submete quilometragem
                ┌────────▼─────────┐
                │    Devolução     │
                │   Solicitada     │
                └────────┬─────────┘
                         │ Admin confirma
                ┌────────▼─────────┐
                │  Quilometragem   │
                │   Atualizada     │
                └────────┬─────────┘
                         │
             ┌───────────┴───────────┐
             │  threshold OK?        │
       ┌─────▼──────┐       ┌────────▼────────┐
       │ Disponível │       │   Manutenção    │
       └────────────┘       └─────────────────┘
```

> Se a quilometragem de retorno **exceder o threshold de manutenção**, o veículo é automaticamente movido para o status **Manutenção**.

---

## Testes

```bash
npm test
```

**Stack de testes:** Jest · Supertest · MongoMemoryServer (MongoDB in-memory para testes isolados)

```
backend/tests/
├── helpers/
│   └── appErrorAssert.js        # Helpers de asserção de erros customizados
├── http/
│   └── rentalRoutes.test.js     # Testes de integração HTTP
└── services/
    └── rentalService.test.js    # Testes unitários de lógica de negócio
```

**Cobertura:**

- Criação de solicitação de reserva
- Workflows de aprovação e rejeição pelo admin
- Regras de cancelamento e proteção contra conflitos de agendamento
- Ciclo de vida de devolução e validação de quilometragem
- Lógica de threshold de manutenção
- Validação de request/response nos endpoints HTTP

---

## CI Pipeline

Roda automaticamente em todo **push** e **pull request** via GitHub Actions.

```
npm ci → npm run lint → npm test
```

Todos os três estágios precisam passar antes que um branch possa ser mergeado.

---

## Observabilidade

Cada request HTTP é logado com um **correlation ID** para rastreamento ponta a ponta:

```
[2026-03-13T12:15:53.590Z] [req:54bd0435] [ip:127.0.0.1] GET /api/vehicles 200 19ms
```

**Recursos operacionais adicionais:**

- Log estruturado em JSON para diagnóstico legível por máquinas
- Rate limiting com resposta HTTP `429` ao atingir o threshold
- Suporte a reverse proxy com forwarding de headers confiáveis
- Endpoint `/api/health` com metadados do serviço: nome, versão, ambiente, uptime e requestId

---

## Estrutura do Projeto

```
fleet-vehicle-scheduling/
├── backend/
│   ├── src/
│   │   ├── config/           # Configuração de ambiente e banco de dados
│   │   ├── controllers/      # Handlers de request/response HTTP
│   │   ├── middleware/       # Auth, validação, logging, rate limiting
│   │   ├── models/           # Schemas Mongoose
│   │   ├── routes/           # Definições de endpoints da API
│   │   ├── services/         # Camada de lógica de negócio
│   │   ├── utils/            # Utilitários compartilhados (AppError, logger)
│   │   └── validators/       # Validadores de estrutura de request
│   ├── tests/                # Suites Jest
│   ├── scripts/              # Scripts utilitários e de seed
│   ├── Dockerfile
│   ├── jest.config.js
│   └── server.js
├── frontend/
│   ├── Dockerfile
│   └── src/
│       ├── components/       # Componentes de UI reutilizáveis
│       ├── context/          # React Context (Auth)
│       ├── pages/            # Views por página
│       ├── services/         # Wrappers do cliente Axios
│       └── styles/           # CSS global e por componente
└── docs/
    ├── phase-1.md
    ├── ...
    └── phase-12.md           # Diário de engenharia fase a fase
```

---

## Funcionalidades

| Feature | Status |
|---|---|
| Autenticação JWT e dashboards por role | ✅ |
| Criação de solicitação de reserva de veículo | ✅ |
| Workflows de aprovação e rejeição pelo admin | ✅ |
| Cancelamento com proteção contra conflitos | ✅ |
| Ciclo de vida completo da frota com rastreamento de quilometragem | ✅ |
| Transições automáticas para ciclo de manutenção | ✅ |
| Testes automatizados e pipeline de CI | ✅ |
| Request logging estruturado com correlation IDs | ✅ |
| Rate limiting de API | ✅ |
| Health diagnostics operacional | ✅ |
| Desenvolvimento local containerizado (Docker) | ✅ |
| UI responsiva para dispositivos móveis | ✅ |

---

## Fases de Engenharia

| Fase | Foco |
|---|---|
| **Fase 1** | Fundação do backend e setup de ambiente |
| **Fase 2** | Camada de services e centralização da lógica de negócio |
| **Fase 3** | HTTP API, autenticação e validação |
| **Fase 4** | Fundação do frontend React |
| **Fase 5** | Workflow de solicitação de reserva |
| **Fase 6** | Regras do ciclo de vida das reservas |
| **Fase 7** | Melhorias de UX e workflow do admin |
| **Fase 8** | Deploy em produção |
| **Fase 9** | Gestão do ciclo de vida da frota |
| **Fase 10** | Testes de backend e pipeline de CI |
| **Fase 11** | Observabilidade e diagnósticos operacionais |
| **Fase 12** | Containerização Docker e infraestrutura local |

Cada fase tem um documento correspondente em `/docs/` detalhando as decisões, mudanças arquiteturais e lições aprendidas.

---

<div align="center">

<br/>

Made with ☕ by **Eduardo Henrique**

<br/>

</div>
