# Permission Matrix

## Roles

| Role | Code | Description |
|------|------|-------------|
| Manager | `MANAGER` | Full system access, user management |
| Team Lead | `TEAM_LEAD` | Team oversight, workflow approval |
| Team Member | `TEAM_MEMBER` | Task execution, work logging |
| PMO | `PMO` | Read-only reporting and dashboards |
| QA Team | `QA` | QA workflow, defect management |

## Permission Definitions

| Permission | Code | Description |
|------------|------|-------------|
| Create Project | `project:create` | Create new projects |
| Read Project | `project:read` | View project details |
| Update Project | `project:update` | Edit project settings |
| Delete Project | `project:delete` | Soft delete projects |
| Manage Members | `project:manage_members` | Add/remove project members |
| Create Module | `module:create` | Create modules |
| Read Module | `module:read` | View modules |
| Update Module | `module:update` | Edit modules |
| Delete Module | `module:delete` | Soft delete modules |
| Create Task | `task:create` | Create tasks |
| Read Task | `task:read` | View tasks |
| Update Task | `task:update` | Edit task fields |
| Update Own Task | `task:update_own` | Edit own tasks only |
| Delete Task | `task:delete` | Soft delete any task |
| Delete Own Task | `task:delete_own` | Delete self-created tasks |
| Assign Task | `task:assign` | Assign tasks to users |
| Transition Task | `task:transition` | Change workflow state |
| Comment Task | `task:comment` | Add comments |
| Upload File | `task:upload` | Upload attachments |
| Create Worklog | `worklog:create` | Start work sessions |
| Read Worklog | `worklog:read` | View worklogs |
| Update Worklog | `worklog:update` | Pause/resume/stop work |
| Read Release | `release:read` | View releases |
| Create Release | `release:create` | Create releases |
| Update Release | `release:update` | Manage release items |
| Read Backlog | `backlog:read` | View backlog |
| Create Backlog | `backlog:create` | Create backlog items |
| Update Backlog | `backlog:update` | Prioritize backlog |
| View Report | `report:view` | View reports |
| Generate Report | `report:generate` | Generate reports |
| Export Report | `report:export` | Download reports |
| View Analytics | `analytics:view` | View dashboards |
| Read Audit | `audit:read` | View audit logs |
| Use Search | `search:use` | Global search |
| Read Notification | `notification:read` | View notifications |
| Update Notification | `notification:update` | Manage preferences |
| Read User | `user:read` | View users |
| Create User | `user:create` | Create users |
| Update User | `user:update` | Edit users |
| Manage Roles | `user:manage_roles` | Assign roles |
| Read Workflow | `workflow:read` | View workflows |
| Manage Workflow | `workflow:manage` | Configure workflows |
| QA Update | `qa:update` | Update QA status |
| QA Defect | `qa:defect` | Raise defects |
| QA Comment | `qa:comment` | Add QA comments |
| Approve Workflow | `workflow:approve` | Approve transitions |

## Role-Permission Matrix

| Permission | Manager | Team Lead | Team Member | PMO | QA |
|------------|:-------:|:---------:|:-----------:|:---:|:--:|
| project:create | ✅ | ❌ | ❌ | ❌ | ❌ |
| project:read | ✅ | ✅ | ✅ | ✅ | ✅ |
| project:update | ✅ | ❌ | ❌ | ❌ | ❌ |
| project:delete | ✅ | ❌ | ❌ | ❌ | ❌ |
| project:manage_members | ✅ | ❌ | ❌ | ❌ | ❌ |
| module:create | ✅ | ✅ | ❌ | ❌ | ❌ |
| module:read | ✅ | ✅ | ✅ | ✅ | ✅ |
| module:update | ✅ | ✅ | ❌ | ❌ | ❌ |
| module:delete | ✅ | ❌ | ❌ | ❌ | ❌ |
| task:create | ✅ | ✅ | ✅* | ❌ | ❌ |
| task:read | ✅ | ✅ | ✅ | ✅ | ✅ |
| task:update | ✅ | ✅** | ❌ | ❌ | ❌ |
| task:update_own | ✅ | ✅ | ✅ | ❌ | ❌ |
| task:delete | ✅ | ❌ | ❌ | ❌ | ❌ |
| task:delete_own | ✅ | ✅ | ✅*** | ❌ | ❌ |
| task:assign | ✅ | ✅ | ❌ | ❌ | ❌ |
| task:transition | ✅ | ✅ | ✅**** | ❌ | ✅***** |
| task:comment | ✅ | ✅ | ✅ | ❌ | ✅ |
| task:upload | ✅ | ✅ | ✅ | ❌ | ❌ |
| worklog:create | ✅ | ✅ | ✅ | ❌ | ❌ |
| worklog:read | ✅ | ✅ | ✅ | ✅ | ❌ |
| worklog:update | ✅ | ✅ | ✅ | ❌ | ❌ |
| release:read | ✅ | ✅ | ✅ | ✅ | ✅ |
| release:create | ✅ | ✅ | ❌ | ❌ | ❌ |
| release:update | ✅ | ✅ | ❌ | ❌ | ❌ |
| backlog:read | ✅ | ✅ | ✅ | ✅ | ❌ |
| backlog:create | ✅ | ✅ | ✅ | ❌ | ❌ |
| backlog:update | ✅ | ✅ | ❌ | ❌ | ❌ |
| report:view | ✅ | ✅ | ❌ | ✅ | ❌ |
| report:generate | ✅ | ✅ | ❌ | ❌ | ❌ |
| report:export | ✅ | ✅ | ✅ | ✅ | ❌ |
| analytics:view | ✅ | ✅ | ✅ | ✅ | ❌ |
| audit:read | ✅ | ❌ | ❌ | ❌ | ❌ |
| search:use | ✅ | ✅ | ✅ | ✅ | ✅ |
| notification:read | ✅ | ✅ | ✅ | ✅ | ✅ |
| notification:update | ✅ | ✅ | ✅ | ✅ | ✅ |
| user:read | ✅ | ✅ | ✅ | ✅ | ✅ |
| user:create | ✅ | ❌ | ❌ | ❌ | ❌ |
| user:update | ✅ | ❌ | ❌ | ❌ | ❌ |
| user:manage_roles | ✅ | ❌ | ❌ | ❌ | ❌ |
| workflow:read | ✅ | ✅ | ✅ | ✅ | ✅ |
| workflow:manage | ✅ | ❌ | ❌ | ❌ | ❌ |
| workflow:approve | ✅ | ✅ | ❌ | ❌ | ❌ |
| qa:update | ✅ | ✅ | ❌ | ❌ | ✅ |
| qa:defect | ✅ | ✅ | ❌ | ❌ | ✅ |
| qa:comment | ✅ | ✅ | ❌ | ❌ | ✅ |

### Footnotes

- \* Team Member can only create self-assigned tasks
- \** Team Lead can edit team member tasks within their projects
- \*** Team Member cannot delete TL-created tasks
- \**** Team Member can transition own tasks through dev states only
- \***** QA can transition through QA states only (QA_TESTING → QA_PASSED/QA_FAILED)

## Resource-Level Authorization

Beyond role permissions, the system enforces:

1. **Project Membership** — Users must be project members to access project resources
2. **Task Ownership** — `task:update_own` checks `createdById === currentUser.id`
3. **Assignee Scope** — Team Leads can only manage tasks in their assigned projects
4. **Workflow Transition Roles** — Each transition can restrict which roles can execute it
5. **QA Isolation** — QA role cannot modify development fields (only QA status, comments, defects)

## Implementation

```typescript
// Permission check flow
async function authorize(user: User, permission: string, resource?: Resource) {
  // 1. Check role has permission
  const hasPermission = user.roles.some(role => 
    role.permissions.includes(permission)
  );
  if (!hasPermission) throw new ForbiddenError();

  // 2. Resource-level checks
  if (resource) {
    await resourcePolicy.check(user, permission, resource);
  }
}
```
