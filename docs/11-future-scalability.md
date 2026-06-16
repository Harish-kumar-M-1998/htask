# Future Scalability Plan

## Current Architecture Limits

| Component | Current Capacity | Bottleneck |
|-----------|-----------------|------------|
| API | ~500 concurrent users | Single instance |
| PostgreSQL | ~10M rows | Single node |
| Redis | ~100K keys | Single node |
| Search | PostgreSQL FTS | Query latency at scale |
| File Storage | S3/MinIO | No CDN |

## Phase 1: Horizontal Scaling (0–1K users)

**Timeline**: Immediate architecture supports this

- [ ] Multiple API instances behind load balancer
- [ ] Socket.IO Redis adapter for multi-instance WebSocket
- [ ] PgBouncer connection pooling
- [ ] Redis Sentinel for HA
- [ ] CDN for static assets (CloudFront/Cloudflare)

**Estimated effort**: 1–2 weeks

## Phase 2: Read Optimization (1K–10K users)

**Timeline**: 3–6 months post-launch

- [ ] PostgreSQL read replicas for analytics/reporting queries
- [ ] Materialized views for dashboard metrics
- [ ] Redis caching layer for frequently accessed data
- [ ] Database query optimization and index tuning
- [ ] API response compression (Brotli)

**Estimated effort**: 2–4 weeks

## Phase 3: Search & Analytics (10K–50K users)

**Timeline**: 6–12 months post-launch

- [ ] Migrate search to Elasticsearch/OpenSearch
  - Real-time indexing via change data capture
  - Faceted search, fuzzy matching, relevance scoring
- [ ] Time-series database for analytics (TimescaleDB or ClickHouse)
  - Worklog aggregations
  - Velocity and burndown calculations
  - Pre-computed dashboard metrics
- [ ] Report generation on dedicated worker cluster

**Estimated effort**: 4–8 weeks

## Phase 4: Multi-Tenancy & Enterprise (50K+ users)

**Timeline**: 12–18 months post-launch

- [ ] Organization-level data isolation (schema-per-tenant or RLS)
- [ ] SSO integration (SAML 2.0, OIDC)
- [ ] Custom domain support per organization
- [ ] API rate limiting per organization tier
- [ ] Webhook system for external integrations
- [ ] Plugin/extension architecture

**Estimated effort**: 8–12 weeks

## Phase 5: Global Scale (100K+ users)

**Timeline**: 18+ months post-launch

- [ ] Multi-region deployment
- [ ] Database sharding by organization
- [ ] Event-driven architecture (Kafka/NATS)
- [ ] CQRS with separate read/write databases
- [ ] GraphQL API layer for flexible client queries
- [ ] Mobile native apps (React Native)

**Estimated effort**: 12+ weeks

## Technology Migration Paths

| Current | Scale Target | Migration Path |
|---------|-------------|----------------|
| PostgreSQL FTS | Fast global search | Elasticsearch with CDC |
| BullMQ | High-throughput events | Kafka + consumer groups |
| Single PostgreSQL | Write-heavy workloads | Read replicas → Sharding |
| Express monolith | Team autonomy | Microservices (gradual extraction) |
| In-memory cache | Distributed cache | Redis Cluster |
| Local sessions | Stateless scaling | Already JWT-based ✓ |

## Microservices Extraction Order

When monolith limits are reached, extract in this order:

1. **Notification Service** — Already event-driven, natural boundary
2. **Report Service** — CPU-intensive, benefits from independent scaling
3. **File Service** — Storage operations are I/O bound
4. **Search Service** — Requires different technology (Elasticsearch)
5. **Analytics Service** — Read-heavy, benefits from time-series DB

## Performance Benchmarks (Target)

| Operation | Target Latency | At Scale |
|-----------|---------------|----------|
| Task list (20 items) | < 100ms | < 200ms |
| Task detail | < 50ms | < 100ms |
| Global search | < 200ms | < 100ms (with ES) |
| Dashboard load | < 500ms | < 300ms (cached) |
| Report generation | < 30s | < 60s (queued) |
| WebSocket delivery | < 50ms | < 100ms |
| File upload (10MB) | < 5s | < 10s |

## Cost Optimization

| Strategy | Savings |
|----------|---------|
| Redis caching for dashboard | 60% fewer DB queries |
| Report pre-computation | 80% faster report access |
| S3 lifecycle policies | 50% storage cost reduction |
| Spot instances for workers | 70% compute cost reduction |
| Connection pooling | 40% fewer DB connections |

## Monitoring Evolution

| Phase | Monitoring |
|-------|-----------|
| Launch | Graylog + health checks |
| Phase 2 | Prometheus + Grafana dashboards |
| Phase 3 | APM (Datadog/New Relic) |
| Phase 4 | Distributed tracing (Jaeger) |
| Phase 5 | SLO-based alerting |
