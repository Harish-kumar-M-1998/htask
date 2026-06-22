import { Sun, Moon, Monitor, RotateCcw } from 'lucide-react';
import { useUIStore, type ThemeMode } from '@/store';
import { COLOR_THEMES } from '@/lib/appearance';
import { cn } from '@/lib/utils';

const MODE_OPTIONS: Array<{ id: ThemeMode; label: string; icon: typeof Sun }> = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'system', label: 'System', icon: Monitor },
];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
      {children}
    </h3>
  );
}

export function AppearanceSettingsForm() {
  const {
    theme,
    setTheme,
    colorTheme,
    setColorTheme,
    compactUI,
    setCompactUI,
    reduceMotionUI,
    setReduceMotionUI,
    sidebarOpen,
    toggleSidebar,
  } = useUIStore();

  return (
    <div className="space-y-8 max-w-2xl">
      <section>
        <SectionTitle>Theme mode</SectionTitle>
        <div className="grid grid-cols-3 gap-2 max-w-md">
          {MODE_OPTIONS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTheme(id)}
              className={cn(
                'flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 text-xs font-medium transition-fast',
                theme === id
                  ? 'border-primary bg-primary/10 text-foreground'
                  : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle>Accent color</SectionTitle>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 max-w-lg">
          {COLOR_THEMES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setColorTheme(item.id)}
              className={cn(
                'flex flex-col items-center gap-2 rounded-lg border p-3 text-xs font-medium transition-fast',
                colorTheme === item.id
                  ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                  : 'border-border hover:border-primary/40 hover:bg-accent/50',
              )}
            >
              <span
                className="h-8 w-8 rounded-full border border-black/10"
                style={{ backgroundColor: item.swatch }}
              />
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle>Layout</SectionTitle>
        <div className="space-y-2 max-w-lg">
          <label className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3 cursor-pointer hover:bg-accent/40 transition-fast">
            <div>
              <p className="text-sm font-medium">Compact layout</p>
              <p className="text-xs text-muted-foreground mt-0.5">Tighter spacing on boards and tables</p>
            </div>
            <input
              type="checkbox"
              checked={compactUI}
              onChange={(e) => setCompactUI(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-primary"
            />
          </label>

          <label className="flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3 cursor-pointer hover:bg-accent/40 transition-fast">
            <div>
              <p className="text-sm font-medium">Reduce motion</p>
              <p className="text-xs text-muted-foreground mt-0.5">Minimize UI animations</p>
            </div>
            <input
              type="checkbox"
              checked={reduceMotionUI}
              onChange={(e) => setReduceMotionUI(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-primary"
            />
          </label>

          {!sidebarOpen && (
            <button
              type="button"
              onClick={toggleSidebar}
              className="flex w-full items-center gap-2 rounded-lg border border-border px-4 py-3 text-sm font-medium hover:bg-accent/40 transition-fast"
            >
              <RotateCcw className="h-4 w-4 text-muted-foreground" />
              Expand sidebar
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
