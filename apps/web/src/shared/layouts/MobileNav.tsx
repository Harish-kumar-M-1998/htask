import { NavLink } from 'react-router';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  to: string;
  icon: LucideIcon;
  label: string;
}

export function MobileNav({ items }: { items: NavItem[] }) {
  const mobileItems = items.slice(0, 5);

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card safe-area-pb">
      <div className="flex items-center justify-around h-16">
        {mobileItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors min-w-[60px]',
                isActive ? 'text-foreground font-semibold' : 'text-muted-foreground',
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
