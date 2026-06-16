# Deployment Strategy

## Environments

| Environment | Purpose | URL |
|-------------|---------|-----|
| Development | Local dev | localhost |
| Staging | Pre-production testing | staging.htask.io |
| Production | Live system | app.htask.io |

## Docker Architecture

```mermaid
graph TB
    subgraph Production
        LB[NGINX Load Balancer]
        LB --> API1[API Instance 1]
        LB --> API2[API Instance 2]
        LB --> WEB[Web Static Files]
        API1 --> PG[(PostgreSQL)]
        API2 --> PG
        API1 --> REDIS[(Redis)]
        API2 --> REDIS
        API1 --> S3[(S3/MinIO)]
        API2 --> S3
        WORKER[BullMQ Workers] --> REDIS
        WORKER --> PG
        WORKER --> S3
    end
```

## Docker Compose Services

| Service | Image | Port | Purpose |
|---------|-------|------|---------|
| api | htask-api | 3001 | Express API |
| web | htask-web (nginx) | 80 | React SPA |
| postgres | postgres:16-alpine | 5432 | Database |
| redis | redis:7-alpine | 6379 | Cache + Queue |
| minio | minio/minio | 9000/9001 | Object storage |
| worker | htask-api (worker mode) | — | Background jobs |
| graylog | graylog/graylog | 9000 | Log aggregation |

## Container Configuration

### API Dockerfile (Multi-stage)
```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npx prisma generate

# Stage 2: Production
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
EXPOSE 3001
CMD ["node", "dist/server.js"]
```

### Web Dockerfile
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN npm ci && npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

## Environment Variables

### API
```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://user:pass@postgres:5432/htask
REDIS_URL=redis://redis:6379
JWT_SECRET=<strong-secret>
JWT_REFRESH_SECRET=<strong-secret>
STORAGE_PROVIDER=s3|minio|local
S3_BUCKET=htask-files
S3_ENDPOINT=http://minio:9000
SMTP_HOST=smtp.example.com
GRAYLOG_HOST=graylog
GRAYLOG_PORT=12201
CORS_ORIGIN=https://app.htask.io
```

### Web
```env
VITE_API_URL=https://api.htask.io
VITE_WS_URL=wss://api.htask.io
```

## CI/CD Pipeline (GitHub Actions)

```yaml
# Trigger: push to main, PR to main
Stages:
  1. Lint & Type Check (parallel: api, web)
  2. Unit Tests (parallel: api, web)
  3. Integration Tests (api + postgres service)
  4. Build Docker Images
  5. Push to Container Registry
  6. Deploy to Staging (auto)
  7. E2E Tests on Staging
  8. Deploy to Production (manual approval)
```

## Health Checks

```
GET /health          → { status: 'ok', uptime, version }
GET /health/ready    → Checks DB, Redis, Storage connectivity
GET /health/live     → Process alive check
```

## NGINX Configuration

- SSL termination (Let's Encrypt)
- Gzip compression
- Static asset caching (1 year)
- API proxy with WebSocket upgrade
- Rate limiting at edge
- Security headers

## Database Migrations

- Run via `prisma migrate deploy` in CI/CD before app start
- Blue-green compatible (additive migrations only)
- Rollback: keep previous migration state, redeploy old image

## Monitoring

| Tool | Purpose |
|------|---------|
| Graylog | Centralized logging |
| Health endpoints | Uptime monitoring |
| BullMQ Dashboard | Queue monitoring |
| PostgreSQL metrics | Query performance |

## Backup Strategy

| Data | Frequency | Retention |
|------|-----------|-----------|
| PostgreSQL | Daily automated | 30 days |
| File storage | Continuous (S3 versioning) | 90 days |
| Redis | Not backed up (ephemeral) | — |

## SSL/TLS

- Let's Encrypt via Certbot
- Auto-renewal cron job
- HSTS enabled
- TLS 1.2+ only
