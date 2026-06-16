import { cn, STATUS_COLORS } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'status' | 'priority';
  status?: string;
  className?: string;
}

export function Badge({ children, variant = 'default', status, className }: BadgeProps) {
  const statusClass = status && STATUS_COLORS[status] ? STATUS_COLORS[status] : '';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors',
        variant === 'status' && statusClass,
        variant === 'default' && 'bg-primary/10 text-primary',
        className,
      )}
    >
      {children}
    </span>
  );
}
