# API Design

Base URL: `/api/v1`

## Authentication

### POST `/auth/login`
```json
// Request
{ "email": "user@htask.io", "password": "string" }

// Response 200
{
  "accessToken": "jwt...",
  "refreshToken": "jwt...",
  "expiresIn": 900,
  "user": { "id": "uuid", "email": "...", "roles": ["MANAGER"] }
}
```

### POST `/auth/refresh`
```json
// Request
{ "refreshToken": "jwt..." }

// Response 200
{ "accessToken": "jwt...", "expiresIn": 900 }
```

### POST `/auth/logout`
Revokes refresh token. Requires auth.

### GET `/auth/me`
Returns current user profile with permissions.

---

## Projects

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/projects` | `project:read` | List projects (paginated, filtered) |
| POST | `/projects` | `project:create` | Create project |
| GET | `/projects/:id` | `project:read` | Get project details |
| PATCH | `/projects/:id` | `project:update` | Update project |
| DELETE | `/projects/:id` | `project:delete` | Soft delete project |
| GET | `/projects/:id/members` | `project:read` | List members |
| POST | `/projects/:id/members` | `project:manage_members` | Add member |
| GET | `/projects/:id/history` | `project:read` | Project timeline |
| GET | `/projects/:id/analytics` | `report:view` | Project analytics |

### Query Parameters (List)
```
?page=1&limit=20&sort=createdAt:desc&status=ACTIVE&search=keyword
```

---

## Modules

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/projects/:projectId/modules` | `module:read` | List modules |
| POST | `/projects/:projectId/modules` | `module:create` | Create module |
| GET | `/modules/:id` | `module:read` | Get module |
| PATCH | `/modules/:id` | `module:update` | Update module |
| DELETE | `/modules/:id` | `module:delete` | Soft delete |
| GET | `/modules/:id/history` | `module:read` | Module timeline |

---

## Tasks

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/tasks` | `task:read` | Global task list (filtered) |
| POST | `/tasks` | `task:create` | Create task |
| GET | `/tasks/:id` | `task:read` | Get task with relations |
| PATCH | `/tasks/:id` | `task:update` | Update task fields |
| DELETE | `/tasks/:id` | `task:delete` | Soft delete |
| POST | `/tasks/:id/transition` | `task:transition` | Workflow state transition |
| POST | `/tasks/:id/assign` | `task:assign` | Assign users |
| GET | `/tasks/:id/history` | `task:read` | Task timeline |
| GET | `/tasks/:id/comments` | `task:read` | List comments |
| POST | `/tasks/:id/comments` | `task:comment` | Add comment |
| GET | `/tasks/:id/attachments` | `task:read` | List attachments |
| POST | `/tasks/:id/attachments` | `task:upload` | Upload file |
| GET | `/tasks/:id/worklogs` | `worklog:read` | List worklogs |

### POST `/tasks/:id/transition`
```json
{
  "toState": "IN_PROGRESS",
  "comment": "Starting development",
  "metadata": {}
}
```

### Task Filters
```
?projectId=uuid&moduleId=uuid&status=IN_PROGRESS&assigneeId=uuid
&type=BUG_FIX&priority=CRITICAL&overdue=true&sprintId=uuid
```

---

## Worklogs

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| POST | `/worklogs/start` | `worklog:create` | Start work on task |
| POST | `/worklogs/:id/pause` | `worklog:update` | Pause active session |
| POST | `/worklogs/:id/resume` | `worklog:update` | Resume paused session |
| POST | `/worklogs/:id/stop` | `worklog:update` | Stop and finalize |
| GET | `/worklogs` | `worklog:read` | List worklogs (filtered) |
| GET | `/worklogs/summary` | `worklog:read` | Utilization summary |

---

## Releases

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/projects/:projectId/releases` | `release:read` | List releases |
| POST | `/projects/:projectId/releases` | `release:create` | Create release |
| PATCH | `/releases/:id` | `release:update` | Update release |
| POST | `/releases/:id/items` | `release:update` | Add tasks to release |
| GET | `/releases/:id/progress` | `release:read` | Release progress |

---

## Backlog

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/projects/:projectId/backlog` | `backlog:read` | List backlog items |
| POST | `/projects/:projectId/backlog` | `backlog:create` | Create item |
| PATCH | `/backlog/:id` | `backlog:update` | Update (priority, points) |
| POST | `/backlog/:id/promote` | `backlog:update` | Promote to task |

---

## Reports

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/reports` | `report:view` | List generated reports |
| POST | `/reports/generate` | `report:generate` | Generate report |
| GET | `/reports/:id/download` | `report:export` | Download (PDF/Excel/CSV) |
| GET | `/reports/schedules` | `report:view` | List schedules |
| POST | `/reports/schedules` | `report:generate` | Create schedule |

### POST `/reports/generate`
```json
{
  "type": "WEEKLY",
  "format": "PDF",
  "projectId": "uuid",
  "dateRange": { "from": "2026-06-01", "to": "2026-06-07" },
  "sections": ["task_summary", "team_utilization", "bug_trends"]
}
```

---

## Analytics

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/analytics/dashboard` | `analytics:view` | Dashboard metrics |
| GET | `/analytics/task-distribution` | `analytics:view` | Status distribution |
| GET | `/analytics/productivity` | `analytics:view` | Developer productivity |
| GET | `/analytics/utilization` | `analytics:view` | Team utilization |
| GET | `/analytics/velocity` | `analytics:view` | Sprint velocity |
| GET | `/analytics/lead-time` | `analytics:view` | Lead/cycle time |
| GET | `/analytics/qa-metrics` | `analytics:view` | QA success rate |

---

## Audit

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/audit` | `audit:read` | Global audit log |
| GET | `/audit/entity/:type/:id` | `audit:read` | Entity-specific audit |
| GET | `/audit/user/:userId` | `audit:read` | User activity audit |

---

## Search

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/search` | `search:use` | Global search |
| GET | `/search/suggest` | `search:use` | Autocomplete suggestions |

```
?q=authentication&types=task,project,user&limit=10
```

---

## Notifications

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/notifications` | `notification:read` | List notifications |
| PATCH | `/notifications/:id/read` | `notification:read` | Mark as read |
| PATCH | `/notifications/read-all` | `notification:read` | Mark all read |
| GET | `/notifications/preferences` | `notification:read` | Get preferences |
| PATCH | `/notifications/preferences` | `notification:update` | Update preferences |

---

## Users

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/users` | `user:read` | List users |
| POST | `/users` | `user:create` | Create user |
| PATCH | `/users/:id` | `user:update` | Update user |
| PATCH | `/users/:id/roles` | `user:manage_roles` | Update roles |

---

## Workflows

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| GET | `/workflows` | `workflow:read` | List workflow definitions |
| POST | `/workflows` | `workflow:manage` | Create workflow |
| GET | `/workflows/:id/transitions` | `workflow:read` | Get available transitions |
| PATCH | `/workflows/:id/transitions` | `workflow:manage` | Configure transitions |

---

## Standard Response Envelope

### Success (Paginated)
```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

### Error
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [{ "field": "email", "message": "Invalid email format" }]
  }
}
```

### HTTP Status Codes
| Code | Usage |
|------|-------|
| 200 | Success |
| 201 | Created |
| 204 | No content (delete) |
| 400 | Validation error |
| 401 | Unauthorized |
| 403 | Forbidden (RBAC) |
| 404 | Not found |
| 409 | Conflict (invalid transition) |
| 429 | Rate limited |
| 500 | Internal error |

## WebSocket Events

Namespace: `/ws`

| Event | Direction | Payload |
|-------|-----------|---------|
| `notification:new` | Server → Client | `{ notification }` |
| `task:updated` | Server → Client | `{ taskId, changes }` |
| `dashboard:metrics` | Server → Client | `{ metrics }` |
| `presence:update` | Bidirectional | `{ userId, status }` |
| `worklog:started` | Server → Client | `{ worklog }` |

## Rate Limits

| Endpoint Group | Limit |
|----------------|-------|
| Auth | 10 req/min |
| API (authenticated) | 100 req/min |
| Search | 30 req/min |
| Report generation | 5 req/min |
| File upload | 20 req/min |
