// Tokens visuales editables desde el panel admin.
// Cada token se persiste como SiteSetting (group: "theme") y se aplica
// como CSS variable en :root vía ThemeProvider.

export type ThemeTokens = {
  // Colores
  theme_brand: string;
  theme_brand_hover: string;
  theme_brand_soft: string;
  theme_brand_dark: string;
  theme_ink: string;
  theme_ink_soft: string;
  theme_bg: string;
  theme_muted: string;
  theme_border: string;
  theme_destructive: string;
  // Tipografía
  theme_font_family: string;
  theme_font_size_base: string; // px (14..18)
  theme_heading_scale: string; // 1.125 | 1.2 | 1.25 | 1.333
  theme_heading_weight: string; // 600 | 700 | 800 | 900
  theme_radius: string; // rem (0.25..1)
  // Componentes
  theme_logo_size: string; // px del badge del logo (28..80)
  theme_logo_text_size: string; // px del nombre del sitio (12..24)
};

export const DEFAULT_THEME: ThemeTokens = {
  theme_brand: '#53AC30',
  theme_brand_hover: '#468F28',
  theme_brand_soft: '#EAF6E4',
  theme_brand_dark: '#2F6B1C',
  theme_ink: '#0A0A0A',
  theme_ink_soft: '#525252',
  theme_bg: '#FFFFFF',
  theme_muted: '#F5F5F5',
  theme_border: '#E5E5E5',
  theme_destructive: '#DC2626',
  theme_font_family: 'Inter',
  theme_font_size_base: '16',
  theme_heading_scale: '1.25',
  theme_heading_weight: '800',
  theme_radius: '0.75',
  theme_logo_size: '36',
  theme_logo_text_size: '15',
};

export const FONT_OPTIONS = [
  { label: 'Inter (recomendada)', value: 'Inter' },
  { label: 'Poppins', value: 'Poppins' },
  { label: 'Roboto', value: 'Roboto' },
  { label: 'Montserrat', value: 'Montserrat' },
  { label: 'Open Sans', value: 'Open Sans' },
  { label: 'Lato', value: 'Lato' },
  { label: 'Nunito', value: 'Nunito' },
  { label: 'Sistema (sin fuente externa)', value: 'system' },
];

export const FONT_SIZE_OPTIONS = ['14', '15', '16', '17', '18'];
export const HEADING_SCALE_OPTIONS = [
  { label: 'Compacto (1.125)', value: '1.125' },
  { label: 'Normal (1.2)', value: '1.2' },
  { label: 'Cómodo (1.25)', value: '1.25' },
  { label: 'Generoso (1.333)', value: '1.333' },
];
export const RADIUS_OPTIONS = [
  { label: 'Recto (0.25rem)', value: '0.25' },
  { label: 'Suave (0.5rem)', value: '0.5' },
  { label: 'Estándar (0.75rem)', value: '0.75' },
  { label: 'Redondeado (1rem)', value: '1' },
];

export const HEADING_WEIGHT_OPTIONS = [
  { label: 'Semi-bold (600)', value: '600' },
  { label: 'Bold (700)', value: '700' },
  { label: 'Extra-bold (800)', value: '800' },
  { label: 'Black (900)', value: '900' },
];

export const LOGO_SIZE_OPTIONS = [
  { label: 'Pequeño (32px)', value: '32' },
  { label: 'Normal (40px)', value: '40' },
  { label: 'Grande (56px)', value: '56' },
  { label: 'Extra grande (72px)', value: '72' },
  { label: 'Gigante (96px)', value: '96' },
  { label: 'Enorme (120px)', value: '120' },
  { label: 'Máximo (160px)', value: '160' },
  { label: 'Banner (200px)', value: '200' },
];

export const LOGO_TEXT_SIZE_OPTIONS = [
  { label: 'Pequeño (13px)', value: '13' },
  { label: 'Normal (15px)', value: '15' },
  { label: 'Grande (18px)', value: '18' },
  { label: 'Extra grande (22px)', value: '22' },
  { label: 'Enorme (26px)', value: '26' },
];

// Map de token → variable CSS objetivo
const CSS_VAR_MAP: Partial<Record<keyof ThemeTokens, string[]>> = {
  theme_brand: ['--brand', '--primary', '--ring', '--color-brand', '--color-primary', '--color-ring'],
  theme_brand_hover: ['--brand-hover', '--color-brand-hover'],
  theme_brand_soft: ['--brand-soft', '--accent', '--color-brand-soft', '--color-accent'],
  theme_brand_dark: ['--brand-dark', '--accent-foreground', '--color-brand-dark'],
  theme_ink: ['--ink', '--foreground', '--card-foreground', '--popover-foreground', '--color-ink', '--color-foreground'],
  theme_ink_soft: ['--ink-soft', '--muted-foreground', '--color-ink-soft', '--color-muted-foreground'],
  theme_bg: ['--background', '--card', '--popover', '--color-background', '--color-card', '--color-popover'],
  theme_muted: ['--muted', '--secondary', '--color-muted', '--color-secondary'],
  theme_border: ['--border', '--input', '--color-border', '--color-input'],
  theme_destructive: ['--destructive', '--color-destructive'],
};

const FONT_STACK = (family: string) =>
  family === 'system'
    ? 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'
    : `'${family}', system-ui, -apple-system, sans-serif`;

export function applyThemeToElement(el: HTMLElement, theme: Partial<ThemeTokens>) {
  const merged = { ...DEFAULT_THEME, ...theme };
  (Object.keys(CSS_VAR_MAP) as (keyof ThemeTokens)[]).forEach((key) => {
    const value = merged[key];
    if (!value) return;
    CSS_VAR_MAP[key]!.forEach((cssVar) => el.style.setProperty(cssVar, value));
  });

  // Tipografía
  const stack = FONT_STACK(merged.theme_font_family);
  el.style.setProperty('--font-sans', stack);
  el.style.setProperty('--font-display', stack);
  el.style.setProperty('font-family', stack);

  const base = Number(merged.theme_font_size_base) || 16;
  el.style.setProperty('font-size', `${base}px`);

  const scale = Number(merged.theme_heading_scale) || 1.25;
  el.style.setProperty('--heading-scale', String(scale));

  const radius = Number(merged.theme_radius) || 0.75;
  el.style.setProperty('--radius', `${radius}rem`);

  // Componentes
  const logoSize = Number(merged.theme_logo_size) || 36;
  el.style.setProperty('--logo-size', `${logoSize}px`);
  const logoText = Number(merged.theme_logo_text_size) || 15;
  el.style.setProperty('--logo-text-size', `${logoText}px`);
  el.style.setProperty('--logo-tagline-size', `${Math.max(9, Math.round(logoText * 0.65))}px`);
  const headingWeight = merged.theme_heading_weight || '800';
  el.style.setProperty('--heading-weight', headingWeight);
}

const LOADED_FONTS = new Set<string>();

export function loadFont(family: string) {
  if (!family || family === 'system' || family === 'Inter') return;
  if (LOADED_FONTS.has(family)) return;
  LOADED_FONTS.add(family);
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@400;500;600;700;800&display=swap`;
  document.head.appendChild(link);
}

export function settingsToTheme(map: Record<string, string>): Partial<ThemeTokens> {
  const out: Partial<ThemeTokens> = {};
  (Object.keys(DEFAULT_THEME) as (keyof ThemeTokens)[]).forEach((k) => {
    if (map[k]) out[k] = map[k];
  });
  return out;
}
