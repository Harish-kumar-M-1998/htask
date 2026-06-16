import { cn } from '@/lib/utils';

const SIZE_CLASSES = {
  xs: 'h-7 w-7 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-9 w-9 text-xs',
  lg: 'h-11 w-11 text-sm',
  xl: 'h-12 w-12 text-base',
  '2xl': 'h-14 w-14 text-xl',
} as const;

const SHAPE_CLASSES = {
  circle: 'rounded-full',
  rounded: 'rounded-lg',
  squircle: 'rounded-xl',
} as const;

interface AvatarInitialsProps {
  initials: string;
  size?: keyof typeof SIZE_CLASSES;
  shape?: keyof typeof SHAPE_CLASSES;
  className?: string;
}

export function AvatarInitials({
  initials,
  size = 'md',
  shape = 'circle',
  className,
}: AvatarInitialsProps) {
  return (
    <div
      className={cn(
        'avatar-initials',
        SIZE_CLASSES[size],
        SHAPE_CLASSES[shape],
        className,
      )}
      aria-hidden
    >
      {initials}
    </div>
  );
}

export function getInitials(firstName?: string, lastName?: string, fallback = '?'): string {
  const first = firstName?.[0] ?? '';
  const last = lastName?.[0] ?? '';
  const value = `${first}${last}`.toUpperCase();
  return value || fallback;
}
