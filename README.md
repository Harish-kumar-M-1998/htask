# Htask — Enterprise Task & Workflow Management System

Production-grade enterprise platform combining task management, configurable workflows, worklogs, audit trails, reporting, and team analytics.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                              │
│  React 19 + Vite + PWA │ Mobile Bottom Nav │ Real-time WS       │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTPS / WSS
┌──────────────────────────────▼──────────────────────────────────┐
│                     API Gateway (Express)                        │
│  JWT Auth │ RBAC │ Rate Limit │ CSRF │ Validation │ Audit       │
└──────────────────────────────┬──────────────────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        ▼                      ▼                      ▼
┌───────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  PostgreSQL   │    │     Redis       │    │  Storage (S3/   │
│  (Prisma)     │    │  BullMQ/Cache   │    │  MinIO/Local)   │
└───────────────┘    └─────────────────┘    └─────────────────┘
        │                      │
        ▼                      ▼
┌───────────────┐    ┌─────────────────┐
│  Graylog      │    │  Nodemailer     │
│  (Logging)    │    │  (Email)        │
└───────────────┘    └─────────────────┘
```

## Monorepo Structure

```
Htask/
├── apps/
│   ├── api/                 # Express + Prisma backend
│   └── web/                 # React 19 frontend
├── packages/
│   └── shared/              # Shared types, Zod schemas
├── docs/                    # Architecture documentation
├── docker/                  # Docker configs
└── .github/workflows/       # CI/CD pipelines
```

## Quick Start

### Prerequisites

- Node.js 20 LTS+
- Docker & Docker Compose
- PostgreSQL 16+ (or use Docker)

### Development

```bash
# Start infrastructure
docker compose up -d postgres redis minio

# Install dependencies
npm install

# Setup database
cp apps/api/.env.example apps/api/.env
npm run db:migrate
npm run db:seed

# Start dev servers
npm run dev
```

- **API**: http://localhost:3001
- **Web**: http://localhost:5173
- **Swagger**: http://localhost:3001/api/docs
- **MinIO Console**: http://localhost:9001

### Default Credentials (seed)

| Role        | Email              | Password    |
|-------------|--------------------|-------------|
| Manager     | manager@htask.io   | Manager@123 |
| Team Lead   | lead@htask.io      | Lead@123    |
| Team Member | member@htask.io    | Member@123  |
| PMO         | pmo@htask.io       | Pmo@123     |
| QA          | qa@htask.io        | Qa@123      |

## Documentation

| Document | Description |
|----------|-------------|
| [System Architecture](docs/01-system-architecture.md) | High-level architecture |
| [Database Design](docs/02-database-design.md) | ER diagram & schema |
| [API Design](docs/03-api-design.md) | REST API contracts |
| [Permission Matrix](docs/04-permission-matrix.md) | RBAC model |
| [Workflow Engine](docs/05-workflow-engine.md) | Configurable transitions |
| [Audit System](docs/06-audit-architecture.md) | Audit trail design |
| [Notifications](docs/07-notification-architecture.md) | Multi-channel notifications |
| [Reporting](docs/08-reporting-architecture.md) | Report generation |
| [Mobile Strategy](docs/09-mobile-design-strategy.md) | PWA & responsive design |
| [Deployment](docs/10-deployment-strategy.md) | Production deployment |
| [Scalability](docs/11-future-scalability.md) | Growth plan |

## Tech Stack

**Frontend**: React 19, TypeScript, Vite, Zustand, TanStack Query/Table/Virtual, Tailwind, shadcn/ui, Framer Motion, Recharts, dnd-kit

**Backend**: Node.js, Express, TypeScript, Prisma, PostgreSQL, JWT, BullMQ, Redis, Socket.IO, Winston

**Infrastructure**: Docker, GitHub Actions, AWS S3 / MinIO

## License

Proprietary — All rights reserved.
