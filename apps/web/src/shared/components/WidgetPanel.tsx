import { useEffect } from 'react';
import { X, Sun, Moon, Monitor, RotateCcw } from 'lucide-react';
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

export function WidgetPanel() {
  const {
    widgetOpen,
    setWidgetOpen,
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

  useEffect(() => {
    if (!widgetOpen) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [widgetOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setWidgetOpen(false);
    };
    if (widgetOpen) {
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }
  }, [widgetOpen, setWidgetOpen]);

  if (!widgetOpen) return null;

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
        onClick={() => setWidgetOpen(false)}
        aria-label="Close widget panel"
      />
      <aside
        className="fixed inset-y-0 right-0 z-50 flex w-[min(100vw,320px)] flex-col border-l border-border bg-card shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Appearance and preferences"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4 shrink-0">
          <div>
            <h2 className="text-base font-semibold">Widget</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Customize your workspace</p>
          </div>
          <button
            type="button"
            onClick={() => setWidgetOpen(false)}
            className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-8">
          <section>
            <SectionTitle>Appearance</SectionTitle>
            <div className="grid grid-cols-3 gap-2">
              {MODE_OPTIONS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTheme(id)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-medium transition-colors',
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
            <SectionTitle>Color theme</SectionTitle>
            <div className="grid grid-cols-3 gap-2">
              {COLOR_THEMES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setColorTheme(item.id)}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-xl border p-3 text-xs font-medium transition-all',
                    colorTheme === item.id
                      ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                      : 'border-border hover:border-primary/40 hover:bg-accent/50',
                  )}
                >
                  <span
                    className="h-8 w-8 rounded-full border border-black/10 shadow-sm"
                    style={{ backgroundColor: item.swatch }}
                  />
                  {item.label}
                </button>
              ))}
            </div>
          </section>

          <section>
            <SectionTitle>Preferences</SectionTitle>
            <div className="space-y-2">
              <label className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3 cursor-pointer hover:bg-accent/40 transition-colors">
                <div>
                  <p className="text-sm font-medium">Compact layout</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Tighter spacing across pages</p>
                </div>
                <input
                  type="checkbox"
                  checked={compactUI}
                  onChange={(e) => setCompactUI(e.target.checked)}
                  className="h-4 w-4 rounded border-border accent-primary"
                />
              </label>

              <label className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3 cursor-pointer hover:bg-accent/40 transition-colors">
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
                  className="flex w-full items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-medium hover:bg-accent/40 transition-colors"
                >
                  <RotateCcw className="h-4 w-4 text-muted-foreground" />
                  Expand sidebar
                </button>
              )}
            </div>
          </section>
        </div>
      </aside>
    </>
  );
}
