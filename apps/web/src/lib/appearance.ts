export type ColorThemeId = 'neutral' | 'ocean' | 'forest' | 'violet' | 'rose' | 'amber';

export const COLOR_THEMES: Array<{ id: ColorThemeId; label: string; swatch: string }> = [
  { id: 'neutral', label: 'Neutral', swatch: '#101113' },
  { id: 'ocean', label: 'Ocean', swatch: '#2563eb' },
  { id: 'forest', label: 'Forest', swatch: '#059669' },
  { id: 'violet', label: 'Violet', swatch: '#7c3aed' },
  { id: 'rose', label: 'Rose', swatch: '#e11d48' },
  { id: 'amber', label: 'Amber', swatch: '#d97706' },
];

export function applyAppearance(options: {
  colorTheme: ColorThemeId;
  compactUI?: boolean;
  reduceMotionUI?: boolean;
}) {
  const root = document.documentElement;
  root.setAttribute('data-color-theme', options.colorTheme);
  root.toggleAttribute('data-compact-ui', !!options.compactUI);
  root.toggleAttribute('data-reduce-motion-ui', !!options.reduceMotionUI);
}
