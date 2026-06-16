import { useNavigate } from 'react-router';
import { Bell } from 'lucide-react';
import { useNotificationStore } from '@/store';
import { cn } from '@/lib/utils';
import { formFocus } from '@/lib/formStyles';

export function NotificationBell({ className }: { className?: string }) {
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate('/search')}
      className={cn(
        'relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground transition-colors shrink-0',
        formFocus,
        className,
      )}
    >
      <Bell className="h-4 w-4" />
      {unreadCount > 0 && (
        <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-card" />
      )}
    </button>
  );
}
