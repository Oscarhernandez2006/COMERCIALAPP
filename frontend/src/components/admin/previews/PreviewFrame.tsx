import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Expand, Eye, X } from 'lucide-react';
import { useSiteSettings } from '@/hooks/usePublicData';
import { applyThemeToElement, loadFont, settingsToTheme } from '@/lib/theme';

const PreviewSizeContext = createContext<'compact' | 'expanded'>('compact');
export const usePreviewSize = () => useContext(PreviewSizeContext);

type Props = {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  // Cuando true, oculta el header decorativo y deja solo el contenedor (útil dentro de diálogos pequeños)
  bare?: boolean;
};

// Wrapper consistente para todas las vistas previas del admin.
// Aplica el tema actual del portal dentro del frame para que la previsualización
// se vea EXACTAMENTE igual a como se verá en el portal público.
// Incluye botón "Expandir" para verla en grande sobre toda la pantalla.
export function PreviewFrame({ title = 'Vista previa', subtitle, children, bare = false }: Props) {
  const { data: settings } = useSiteSettings();
  const ref = useRef<HTMLDivElement>(null);
  const expandedRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!settings) return;
    const theme = settingsToTheme(settings);
    if (theme.theme_font_family) loadFont(theme.theme_font_family);
    if (ref.current) applyThemeToElement(ref.current, theme);
    if (expandedRef.current) applyThemeToElement(expandedRef.current, theme);
  }, [settings, expanded]);

  useEffect(() => {
    if (!expanded) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setExpanded(false);
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [expanded]);

  return (
    <>
      <div className="flex flex-col gap-2">
        {!bare && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-600">
              <Eye className="size-3.5 text-[#53AC30]" /> {title}
              {subtitle && <span className="font-normal normal-case text-neutral-400">— {subtitle}</span>}
            </div>
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-white px-2 py-1 text-[11px] font-medium text-neutral-600 transition hover:border-[#53AC30] hover:text-[#53AC30]"
              title="Expandir vista previa"
            >
              <Expand className="size-3" /> Expandir
            </button>
          </div>
        )}
        <div
          ref={ref}
          className="overflow-hidden rounded-2xl border border-dashed bg-[var(--background)]"
          style={{ borderColor: 'var(--border)' }}
        >
          <PreviewSizeContext.Provider value="compact">{children}</PreviewSizeContext.Provider>
        </div>
      </div>

      {expanded &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex flex-col bg-black/85 p-4 backdrop-blur-sm md:p-8">
            <div className="mx-auto flex w-full max-w-7xl items-center justify-between text-white">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider">
                <Eye className="size-4 text-[#53AC30]" /> {title}
                {subtitle && <span className="font-normal normal-case opacity-70">— {subtitle}</span>}
              </div>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="inline-flex items-center gap-1 rounded-md bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-white/20"
              >
                <X className="size-4" /> Cerrar (Esc)
              </button>
            </div>

            <div className="mx-auto mt-4 w-full max-w-7xl flex-1 overflow-auto">
              <div
                ref={expandedRef}
                className="w-full overflow-hidden rounded-2xl border border-white/10 bg-[var(--background)] shadow-2xl"
                style={{ minHeight: '70vh' }}
              >
                <PreviewSizeContext.Provider value="expanded">{children}</PreviewSizeContext.Provider>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
