import { SlidersHorizontal } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router';
import { cn } from '@/lib/utils';
import { formFocus } from '@/lib/formStyles';

export function WidgetTrigger({ className }: { className?: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = location.pathname.startsWith('/settings/appearance');

  return (
    <button
      type="button"
      onClick={() => navigate('/settings/appearance')}
      className={cn(
        'relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground transition-colors shrink-0',
        isActive && 'border-primary/50 text-foreground bg-primary/5',
        formFocus,
        className,
      )}
      aria-label="Appearance settings"
      aria-current={isActive ? 'page' : undefined}
    >
      <SlidersHorizontal className="h-4 w-4" />
    </button>
  );
}
