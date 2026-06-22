-- Allow returning tasks to Backlog (OPEN) from early pipeline stages.
-- Only applies when the default workflow definition exists (seeded environments).
INSERT INTO "workflow_transitions" (
  "id",
  "workflow_id",
  "from_status",
  "to_status",
  "name",
  "required_roles",
  "required_fields",
  "requires_approval",
  "notify_roles",
  "is_active"
)
SELECT gen_random_uuid(), w.id, v.from_status::"TaskStatus", v.to_status::"TaskStatus", v.name, v.roles, ARRAY[]::text[], false, ARRAY[]::text[], true
FROM "workflow_definitions" w
CROSS JOIN (
  VALUES
    ('ASSIGNED', 'OPEN', 'Return to Backlog', ARRAY['MANAGER', 'TEAM_LEAD', 'TEAM_MEMBER']::text[]),
    ('IN_PROGRESS', 'OPEN', 'Return to Backlog', ARRAY['MANAGER', 'TEAM_LEAD', 'TEAM_MEMBER']::text[]),
    ('BLOCKED', 'OPEN', 'Return to Backlog', ARRAY['MANAGER', 'TEAM_LEAD', 'TEAM_MEMBER']::text[])
) AS v(from_status, to_status, name, roles)
WHERE w.id = 'default-workflow'
ON CONFLICT ("workflow_id", "from_status", "to_status") DO NOTHING;
