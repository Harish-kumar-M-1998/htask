import { useEffect, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { ROLES } from '@htask/shared';
import { Button } from '@/shared/ui/button';
import { selectClassName } from '@/lib/formStyles';

export interface TeamFilters {
  role: string;
}

export const emptyTeamFilters: TeamFilters = {
  role: '',
};

const ROLE_OPTIONS = Object.entries(ROLES).map(([key, code]) => ({
  code,
  label: key.replace(/_/g, ' '),
}));

interface TeamFilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filters: TeamFilters;
  onApply: (filters: TeamFilters) => void;
}

export function TeamFilterDialog({
  open,
  onOpenChange,
  filters,
  onApply,
}: TeamFilterDialogProps) {
  const [draft, setDraft] = useState<TeamFilters>(filters);

  useEffect(() => {
    if (open) {
      setDraft(filters);
    }
  }, [open, filters]);

  const selectClass = selectClassName;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 dashboard-card bg-card shadow-xl flex flex-col">
          <div className="flex items-center justify-between p-6 pb-0">
            <Dialog.Title className="text-lg font-semibold">Filter Team</Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded-lg p-1 hover:bg-accent transition-colors">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <div className="p-5 sm:p-6 space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Role</label>
              <select
                value={draft.role}
                onChange={(e) => setDraft({ role: e.target.value })}
                className={selectClass}
              >
                <option value="">All roles</option>
                {ROLE_OPTIONS.map((role) => (
                  <option key={role.code} value={role.code}>{role.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-between gap-2 p-6 pt-0 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onApply(emptyTeamFilters);
                onOpenChange(false);
              }}
            >
              Clear
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
