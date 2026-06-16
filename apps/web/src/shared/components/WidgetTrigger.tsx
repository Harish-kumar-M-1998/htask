import { SlidersHorizontal } from 'lucide-react';
import { useUIStore } from '@/store';
import { cn } from '@/lib/utils';
import { formFocus } from '@/lib/formStyles';

export function WidgetTrigger({ className }: { className?: string }) {
  const setWidgetOpen = useUIStore((s) => s.setWidgetOpen);
  const widgetOpen = useUIStore((s) => s.widgetOpen);

  return (
    <button
      type="button"
      onClick={() => setWidgetOpen(!widgetOpen)}
      className={cn(
        'relative flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground hover:text-foreground transition-colors shrink-0',
        widgetOpen && 'border-primary/50 text-foreground bg-primary/5',
        formFocus,
        className,
      )}
      aria-label="Open appearance widget"
      aria-expanded={widgetOpen}
    >
      <SlidersHorizontal className="h-4 w-4" />
    </button>
  );
}
