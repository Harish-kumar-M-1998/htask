import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '@htask/shared';
import { applyAppearance, type ColorThemeId } from '@/lib/appearance';

export type ThemeMode = 'light' | 'dark' | 'system';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
}

interface UIState {
  theme: ThemeMode;
  colorTheme: ColorThemeId;
  compactUI: boolean;
  reduceMotionUI: boolean;
  sidebarOpen: boolean;
  mobileNav: boolean;
  widgetOpen: boolean;
  setTheme: (theme: ThemeMode) => void;
  setColorTheme: (colorTheme: ColorThemeId) => void;
  setCompactUI: (compactUI: boolean) => void;
  setReduceMotionUI: (reduceMotionUI: boolean) => void;
  toggleSidebar: () => void;
  setMobileNav: (open: boolean) => void;
  setWidgetOpen: (open: boolean) => void;
}

interface NotificationState {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      logout: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        set({ user: null, isAuthenticated: false });
      },
    }),
    { name: 'htask-auth', partialize: (s) => ({ user: s.user, isAuthenticated: s.isAuthenticated }) },
  ),
);

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      colorTheme: 'neutral',
      compactUI: false,
      reduceMotionUI: false,
      sidebarOpen: true,
      mobileNav: false,
      widgetOpen: false,
      setTheme: (theme) => {
        set({ theme });
        const root = document.documentElement;
        if (theme === 'system') {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          root.classList.toggle('dark', prefersDark);
        } else {
          root.classList.toggle('dark', theme === 'dark');
        }
      },
      setColorTheme: (colorTheme) => {
        set({ colorTheme });
        const { compactUI, reduceMotionUI } = get();
        applyAppearance({ colorTheme, compactUI, reduceMotionUI });
      },
      setCompactUI: (compactUI) => {
        set({ compactUI });
        const { colorTheme, reduceMotionUI } = get();
        applyAppearance({ colorTheme, compactUI, reduceMotionUI });
      },
      setReduceMotionUI: (reduceMotionUI) => {
        set({ reduceMotionUI });
        const { colorTheme, compactUI } = get();
        applyAppearance({ colorTheme, compactUI, reduceMotionUI });
      },
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setMobileNav: (open) => set({ mobileNav: open }),
      setWidgetOpen: (open) => set({ widgetOpen: open }),
    }),
    {
      name: 'htask-ui',
      partialize: (s) => ({
        theme: s.theme,
        colorTheme: s.colorTheme,
        compactUI: s.compactUI,
        reduceMotionUI: s.reduceMotionUI,
        sidebarOpen: s.sidebarOpen,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyAppearance({
            colorTheme: state.colorTheme,
            compactUI: state.compactUI,
            reduceMotionUI: state.reduceMotionUI,
          });
        }
      },
    },
  ),
);

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: count }),
}));
