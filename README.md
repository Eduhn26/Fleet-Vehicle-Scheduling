<div align="center">

<br/>

# Fleet Vehicle Scheduling

**Full-stack fleet management, vehicle scheduling and operational intelligence platform built with Node.js, React, MongoDB and Python.**

<br/>

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB_Atlas-47A248?style=flat-square&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Python](https://img.shields.io/badge/Python-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Pandas](https://img.shields.io/badge/Pandas-150458?style=flat-square&logo=pandas&logoColor=white)](https://pandas.pydata.org)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white)](https://docker.com)
[![Jest](https://img.shields.io/badge/Jest-tested-C21325?style=flat-square&logo=jest&logoColor=white)](https://jestjs.io)
[![CI](https://img.shields.io/badge/CI-GitHub_Actions-2088FF?style=flat-square&logo=github-actions&logoColor=white)](https://github.com/features/actions)

<br/>

[🖥️ Live Demo](https://fleet-vehicle-scheduling.vercel.app) ·
[⚙️ API](https://fleet-vehicle-scheduling.onrender.com) ·
[🩺 Health Check](https://fleet-vehicle-scheduling.onrender.com/api/health)

<br/>

</div>

---

## Sobre o Projeto

O **Fleet Vehicle Scheduling** é uma plataforma corporativa de gestão de frota construída para demonstrar a evolução real de um sistema full stack ao longo de fases incrementais de engenharia.

O projeto cobre:

- autenticação e autorização;
- gestão de veículos;
- solicitações e aprovação de reservas;
- devolução e quilometragem;
- manutenção;
- testes automatizados;
- CI/CD;
- observabilidade;
- Docker;
- inteligência operacional da frota.

Na Fase 13, o sistema ganhou uma camada dedicada de **Fleet Intelligence** com Python, FastAPI e Pandas.

A aplicação continua usando Node.js como backend principal. O serviço Python recebe apenas um dataset normalizado e processa indicadores, rankings, séries temporais, alertas de manutenção e exportações analíticas.

---

## Stack

| Categoria | Tecnologia |
|---|---|
| Frontend | React, React Router |
| Backend operacional | Node.js, Express |
| Banco de dados | MongoDB Atlas, Mongoose |
| Autenticação | JWT |
| Analytics | Python, FastAPI, Pandas |
| Validação | Zod, Pydantic |
| Testes Node.js | Jest, Supertest, MongoMemoryServer |
| Testes Python | Pytest, pytest-cov |
| CI/CD | GitHub Actions |
| Containerização | Docker, Docker Compose |
| Hosting | Render, Vercel |
| Cliente HTTP | Axios |
| Tooling | ESLint, Prettier, Nodemon |

---

## Arquitetura do Sistema

```txt
React
  ↓
Node.js / Express
  ├── MongoDB Atlas
  ├── Authentication
  ├── Authorization
  ├── Operational workflows
  └── Normalized analytics dataset
          ↓
      FastAPI
          ↓
       Pandas
          ↓
 KPIs, rankings, trends,
 maintenance alerts and exports
```

### Responsabilidades

| Camada | Responsabilidade |
|---|---|
| React | Interface operacional, filtros e visualização |
| Node.js | API pública, autenticação, autorização, regras operacionais e analytics boundary |
| MongoDB | Fonte de verdade dos dados operacionais |
| FastAPI | Contrato interno do serviço analítico |
| Pandas | Transformações, métricas, rankings, séries temporais e exportações |

O frontend não chama Python diretamente.

O serviço Python não acessa MongoDB diretamente.

O backend Node.js continua sendo o ponto seguro de entrada da aplicação.

---

## Fleet Intelligence

A área administrativa possui:

```txt
/admin/analytics
```

A experiência de inteligência operacional apresenta:

- filtros automáticos por período, status, veículo e departamento;
- KPIs contextuais;
- evolução temporal das reservas;
- leitura semântica dos status;
- rankings de utilização;
- demanda por departamento;
- quilometragem;
- alertas de manutenção;
- insights contextuais;
- navegação interna;
- exportação de dados.

A interface React responde principalmente:

> O que está acontecendo com a frota agora?

Análises históricas profundas e exploração gerencial ficam preparadas para uma futura camada de Power BI.

---

## Mini ETL

A Fase 13 introduz um fluxo analítico pequeno e adequado ao escopo do projeto:

```txt
Extract
  Node.js consulta os dados operacionais
        ↓
Transform
  Node.js normaliza o dataset
  Pandas calcula as métricas
        ↓
Load
  React recebe os indicadores
  Node.js disponibiliza JSON e CSV
```

---

## Analytics Fallback

A camada analítica não é necessária para os fluxos principais.

Se o serviço Python ficar indisponível:

```txt
Node.js permanece disponível
Reservas continuam funcionando
Veículos continuam funcionando
Devoluções continuam funcionando
Contagens básicas permanecem disponíveis
Analytics avançado entra em modo degradado
```

Isso impede que uma dependência secundária derrube o sistema operacional.

---

## Exportações Analíticas

Endpoints:

```txt
GET /api/analytics/export/json
GET /api/analytics/export/csv?table=<table>
```

Tabelas disponíveis:

```txt
summary
rentals
vehicles
mileageHistory
rentalsByStatus
vehicleUsage
departmentUsage
rentalTrend
maintenanceAlerts
```

CSV preparado para Excel pt-BR:

```txt
Delimiter: ;
Decimal separator: ,
Encoding: UTF-8 with BOM
Line ending: CRLF
```

---

## Dataset Anual Demonstrativo

O projeto inclui uma seed determinística para demonstração anual.

```bash
cd backend
npm run seed:annual:dry-run
```

Cenário:

```txt
Ano: 2025
Empresa simulada: 1.000 funcionários
Usuários do sistema: 226
Veículos: 5
Solicitações: 1.620
Reservas concluídas: 1.330
Quilometragem registrada: 111.120 km
```

> Os dados são demonstrativos e simulados. Não representam dados operacionais de uma empresa real.

---

## Quick Start com Docker

```bash
git clone <repository-url>
cd Fleet-Vehicle-Scheduling
docker compose up --build
```

| Serviço | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000 |
| Backend Health | http://localhost:5000/api/health |
| Analytics Service | http://localhost:8000 |
| Analytics Readiness | http://localhost:8000/health/ready |

Parar os containers:

```bash
docker compose down
```

---

## Testes

### Backend

```bash
cd backend
npm test
```

Resultado validado:

```txt
5 suites
37 tests
```

### Analytics Node.js

```bash
npm run test:analytics
npm run test:analytics:coverage
```

Resultado validado:

```txt
3 suites
19 tests

Statements: 82.22%
Branches:   60.31%
Functions:  89.09%
Lines:      87.25%
```

### Python Analytics

```bash
docker compose run --rm analytics-service pytest
```

Resultado validado:

```txt
24 tests
96.09% coverage
```

---

## Estrutura do Projeto

```txt
Fleet-Vehicle-Scheduling/
├── analytics-service/
│   ├── app/
│   ├── tests/
│   ├── Dockerfile
│   └── requirements.txt
├── backend/
│   ├── scripts/
│   ├── src/
│   └── tests/
├── frontend/
│   └── src/
├── docs/
│   ├── phase-1.md
│   ├── ...
│   ├── phase-12.md
│   └── phase-13.md
├── docker-compose.yml
└── README.md
```

---

## Funcionalidades

| Feature | Status |
|---|---|
| Autenticação JWT e controle por perfil | ✅ |
| Solicitação de reserva | ✅ |
| Aprovação e rejeição administrativa | ✅ |
| Cancelamento e conflito de agenda | ✅ |
| Devolução e atualização de quilometragem | ✅ |
| Controle de manutenção | ✅ |
| Testes automatizados e CI | ✅ |
| Observabilidade e correlation IDs | ✅ |
| Rate limiting | ✅ |
| Docker Compose | ✅ |
| Fleet Intelligence | ✅ |
| Filtros e análise temporal | ✅ |
| Analytics fallback | ✅ |
| Exportação JSON e CSV | ✅ |
| Dataset anual demonstrativo | ✅ |

---

## Fases de Engenharia

| Fase | Foco |
|---|---|
| **Phase 1** | Backend foundation |
| **Phase 2** | Service layer and business logic |
| **Phase 3** | HTTP API, authentication and validation |
| **Phase 4** | React frontend foundation |
| **Phase 5** | Vehicle rental request workflow |
| **Phase 6** | Reservation lifecycle rules |
| **Phase 7** | UX and administrative workflows |
| **Phase 8** | Production deployment |
| **Phase 9** | Fleet lifecycle and vehicle operations |
| **Phase 10** | Engineering hardening and backend quality |
| **Phase 11** | Observability and operational maturity |
| **Phase 12** | Docker containerization and local infrastructure |
| **Phase 13** | Fleet Intelligence and operational analytics |

Cada fase possui documentação correspondente em [`/docs`](./docs).

---

## Explicação Técnica da Phase 13

> O sistema MERN continua responsável pelos fluxos operacionais. A camada de Fleet Intelligence adiciona um serviço FastAPI que recebe um dataset normalizado do backend e usa Pandas para produzir KPIs, rankings, análise temporal, alertas de manutenção e exportações preparadas para Power BI. A integração possui timeout, fallback, testes automatizados e execução completa por Docker Compose.

---

<div align="center">

<br/>

Made with ☕ by **Eduardo Henrique**

<br/>

</div>
