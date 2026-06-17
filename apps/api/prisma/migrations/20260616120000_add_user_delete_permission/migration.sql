-- Grant user:delete permission to MANAGER role (manager-only team member removal)
INSERT INTO "permissions" ("id", "code", "name", "module", "created_at")
VALUES (gen_random_uuid(), 'user:delete', 'user delete', 'user', CURRENT_TIMESTAMP)
ON CONFLICT ("code") DO NOTHING;

INSERT INTO "role_permissions" ("id", "role_id", "permission_id")
SELECT gen_random_uuid(), r."id", p."id"
FROM "roles" r
INNER JOIN "permissions" p ON p."code" = 'user:delete'
WHERE r."code" = 'MANAGER'
ON CONFLICT ("role_id", "permission_id") DO NOTHING;
