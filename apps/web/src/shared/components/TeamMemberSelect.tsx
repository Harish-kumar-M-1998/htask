import { Controller, type Control } from 'react-hook-form';

interface TeamMemberSelectProps {
  control: Control<{ memberIds?: string[] }>;
  users: Array<{ id: string; firstName: string; lastName: string; email: string }>;
  name?: 'memberIds';
}

export function TeamMemberSelect({ control, users, name = 'memberIds' }: TeamMemberSelectProps) {
  return (
    <div>
      <label className="text-sm font-medium mb-1.5 block">Team Members</label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <div className="border border-border rounded-lg max-h-36 overflow-y-auto divide-y divide-border">
            {users.length === 0 ? (
              <p className="text-xs text-muted-foreground p-3">
                No team members yet. Add members from the Team page first.
              </p>
            ) : (
              users.map((user) => {
                const checked = field.value?.includes(user.id) ?? false;
                return (
                  <label
                    key={user.id}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-accent/50 cursor-pointer text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        const next = e.target.checked
                          ? [...(field.value ?? []), user.id]
                          : (field.value ?? []).filter((id: string) => id !== user.id);
                        field.onChange(next);
                      }}
                      className="rounded border-border"
                    />
                    <span className="font-medium">{user.firstName} {user.lastName}</span>
                    <span className="text-muted-foreground text-xs truncate">{user.email}</span>
                  </label>
                );
              })
            )}
          </div>
        )}
      />
    </div>
  );
}
