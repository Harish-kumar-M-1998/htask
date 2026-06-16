# Mobile Design Strategy

## Design Philosophy

Mobile experience should feel like a native application, not a shrunken desktop site. The PWA provides installability, offline capability, and push notifications.

## Responsive Breakpoints

| Breakpoint | Target | Layout |
|------------|--------|--------|
| `< 640px` | Mobile | Bottom nav, cards, drawers |
| `640–1024px` | Tablet | Side drawer, split views |
| `> 1024px` | Desktop | Full sidebar, multi-panel |

## Mobile Navigation

```
┌─────────────────────────┐
│  ☰  Htask        🔔 👤  │  ← Top bar (sticky)
├─────────────────────────┤
│                         │
│     Main Content        │
│     (scrollable)        │
│                         │
├─────────────────────────┤
│ 🏠  📋  ⏱️  📊  🔍     │  ← Bottom navigation
│ Home Tasks Time Reports Search
└─────────────────────────┘
```

### Bottom Nav Items
1. **Home** — Personal dashboard
2. **Tasks** — My tasks (card list)
3. **Time** — Active worklog + timer
4. **Reports** — Quick metrics
5. **Search** — Global search

## Mobile Drawer

Hamburger menu opens slide-in drawer with:
- Projects list
- Modules
- Releases
- Backlog
- Settings
- Theme toggle
- Logout

## Component Adaptations

### Tables → Cards (Mobile)
```
Desktop: TanStack Table with virtual scrolling
Mobile:  Card list with swipe actions
         ┌─────────────────────────┐
         │ HT-123  🔴 Critical    │
         │ Fix auth token refresh  │
         │ 👤 John  📅 Jun 20     │
         │ ████████░░ 80%         │
         └─────────────────────────┘
```

### Kanban Board (Mobile)
- Horizontal scroll between columns
- Tap to open task detail (full screen)
- Long-press for transition menu

### Task Detail (Mobile)
- Full-screen modal/page
- Tabbed sections: Details, Comments, History, Files
- Sticky action bar at bottom (Transition, Comment, Log Work)

### Worklog Timer (Mobile)
- Floating action button when work is active
- Full-screen timer with pause/stop controls
- Haptic feedback on state changes

## Gesture Support

| Gesture | Action |
|---------|--------|
| Swipe right on task card | Quick assign |
| Swipe left on task card | Change status |
| Pull to refresh | Reload data |
| Long press | Context menu |
| Pinch on chart | Zoom analytics |

## PWA Configuration

```json
{
  "name": "Htask",
  "short_name": "Htask",
  "theme_color": "#6366f1",
  "background_color": "#0f172a",
  "display": "standalone",
  "orientation": "portrait-primary",
  "start_url": "/",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192" },
    { "src": "/icons/icon-512.png", "sizes": "512x512" }
  ]
}
```

### Service Worker Strategy
- **Cache-first**: Static assets, fonts, icons
- **Network-first**: API data with offline fallback
- **Background sync**: Queue mutations when offline

## Theme System

```typescript
type Theme = 'light' | 'dark' | 'system';

// CSS variables for theming
:root {
  --background: 0 0% 100%;
  --foreground: 222 47% 11%;
  --primary: 239 84% 67%;
  --glass-bg: rgba(255, 255, 255, 0.7);
  --clay-shadow: 8px 8px 16px #d1d5db, -8px -8px 16px #ffffff;
}

.dark {
  --background: 222 47% 6%;
  --foreground: 210 40% 98%;
  --glass-bg: rgba(15, 23, 42, 0.7);
  --clay-shadow: 8px 8px 16px #0a0f1a, -8px -8px 16px #141c2e;
}
```

## Visual Design Language

### Glassmorphism
```css
.glass-panel {
  background: var(--glass-bg);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
}
```

### Claymorphism
```css
.clay-card {
  background: var(--background);
  border-radius: 20px;
  box-shadow: var(--clay-shadow);
}
```

### Animations (Framer Motion)
- Page transitions: slide + fade (200ms)
- Card hover: subtle scale (1.02)
- Modal: spring animation
- List items: staggered fade-in
- Skeleton loading: shimmer effect

## Performance Targets

| Metric | Target |
|--------|--------|
| First Contentful Paint | < 1.5s |
| Time to Interactive | < 3s |
| Lighthouse PWA | > 90 |
| Bundle size (initial) | < 200KB gzipped |

### Optimization Techniques
- Route-based code splitting (React.lazy)
- Virtual scrolling for long lists (TanStack Virtual)
- Image lazy loading
- Prefetch on hover for navigation
- Optimistic updates for mutations

## Offline Support

- Cache last-viewed tasks and projects
- Queue create/update operations
- Show offline indicator banner
- Sync on reconnect with conflict resolution
