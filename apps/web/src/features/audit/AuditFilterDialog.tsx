import { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { selectClassName } from '@/lib/formStyles';
import {
  AUDIT_ACTION_GROUPS,
  AUDIT_ENTITY_TYPES,
  emptyAuditFilters,
  type AuditFilters,
} from '@/features/audit/auditFilters';

interface AuditFilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: AuditFilters;
  onApply: (filters: AuditFilters) => void;
  users: Array<{ id: string; firstName: string; lastName: string; email: string }>;
}

export function AuditFilterDialog({
  open,
  onOpenChange,
  filters,
  onApply,
  users,
}: AuditFilterDialogProps) {
  const [draft, setDraft] = useState<AuditFilters>(filters);

  useEffect(() => {
    if (open) setDraft(filters);
  }, [open, filters]);

  const selectClass = selectClassName;
  const activeCount = Object.values(filters).filter(Boolean).length;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md max-h-[90vh] -translate-x-1/2 -translate-y-1/2 dashboard-card bg-card shadow-xl flex flex-col">
          <div className="flex items-center justify-between p-6 pb-0">
            <Dialog.Title className="text-lg font-semibold">
              Filter audit log
              {activeCount > 0 && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({activeCount} active)
                </span>
              )}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded-lg p-1 hover:bg-accent transition-colors">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="overflow-y-auto p-5 sm:p-6 space-y-4 flex-1">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Action</label>
              <select
                value={draft.action}
                onChange={(e) => setDraft((prev) => ({ ...prev, action: e.target.value }))}
                className={selectClass}
              >
                <option value="">All actions</option>
                {AUDIT_ACTION_GROUPS.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.actions.map((action) => (
                      <option key={action.value} value={action.value}>{action.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Entity type</label>
              <select
                value={draft.entityType}
                onChange={(e) => setDraft((prev) => ({ ...prev, entityType: e.target.value }))}
                className={selectClass}
              >
                <option value="">All entities</option>
                {AUDIT_ENTITY_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">User</label>
              <select
                value={draft.userId}
                onChange={(e) => setDraft((prev) => ({ ...prev, userId: e.target.value }))}
                className={selectClass}
              >
                <option value="">All users</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.firstName} {user.lastName}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">From date</label>
                <Input
                  type="date"
                  value={draft.dateFrom}
                  onChange={(e) => setDraft((prev) => ({ ...prev, dateFrom: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">To date</label>
                <Input
                  type="date"
                  value={draft.dateTo}
                  onChange={(e) => setDraft((prev) => ({ ...prev, dateTo: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between gap-2 p-6 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onApply(emptyAuditFilters);
                onOpenChange(false);
              }}
            >
              Clear all
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  onApply(draft);
                  onOpenChange(false);
                }}
              >
                Apply filters
              </Button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
