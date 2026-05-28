import { useEffect, useRef } from 'react';
import { ArrowRight, Star, Tag } from 'lucide-react';
import { applyThemeToElement, loadFont, type ThemeTokens } from '@/lib/theme';

type Props = {
  theme: Partial<ThemeTokens>;
};

// Vista previa aislada — aplica las CSS vars solo dentro del wrapper.
// Así el panel admin no se "tinta" con la marca del cliente.
export function ThemePreview({ theme }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    if (theme.theme_font_family) loadFont(theme.theme_font_family);
    applyThemeToElement(ref.current, theme);
  }, [theme]);

  const scale = Number(theme.theme_heading_scale ?? 1.25);
  const base = Number(theme.theme_font_size_base ?? 16);

  return (
    <div
      ref={ref}
      className="overflow-hidden rounded-2xl border bg-[var(--background)] text-[var(--foreground)]"
      style={{ borderColor: 'var(--border)' }}
    >
      {/* Mini header */}
      <div
        className="flex items-center justify-between border-b px-5 py-3"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <div
            className="grid size-8 place-items-center rounded-md font-bold text-white"
            style={{ backgroundColor: 'var(--brand)' }}
          >
            G
          </div>
          <span className="font-semibold" style={{ color: 'var(--ink)' }}>
            Grupo Santacruz
          </span>
        </div>
        <nav className="hidden gap-5 text-sm md:flex" style={{ color: 'var(--ink-soft)' }}>
          <span>Inicio</span>
          <span>Catálogo</span>
          <span>Promociones</span>
        </nav>
      </div>

      {/* Hero */}
      <section
        className="relative px-6 py-8"
        style={{
          background: `linear-gradient(135deg, var(--brand-soft) 0%, var(--background) 70%)`,
        }}
      >
        <span
          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider"
          style={{ backgroundColor: 'var(--brand-soft)', color: 'var(--brand-dark)' }}
        >
          <Tag className="size-3" /> Nueva temporada
        </span>
        <h1
          className="mt-3 font-extrabold leading-tight"
          style={{ fontSize: `${base * scale * scale * 1.5}px`, color: 'var(--ink)' }}
        >
          Productos que <span style={{ color: 'var(--brand)' }}>impulsan</span> tu negocio.
        </h1>
        <p className="mt-2 max-w-md text-sm" style={{ color: 'var(--ink-soft)' }}>
          Así se verán los textos secundarios del portal con la tipografía y tamaños elegidos.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            className="inline-flex items-center gap-1 px-4 py-2 text-sm font-semibold text-white transition"
            style={{ backgroundColor: 'var(--brand)', borderRadius: 'var(--radius)' }}
          >
            Explorar catálogo <ArrowRight className="size-4" />
          </button>
          <button
            className="inline-flex items-center gap-1 border px-4 py-2 text-sm font-semibold transition"
            style={{
              borderColor: 'var(--ink)',
              color: 'var(--ink)',
              borderRadius: 'var(--radius)',
              backgroundColor: 'transparent',
            }}
          >
            Hablar con un vendedor
          </button>
        </div>
      </section>

      {/* Escala tipográfica */}
      <section className="space-y-1 px-6 py-5" style={{ backgroundColor: 'var(--background)' }}>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--ink-soft)' }}>
          Escala tipográfica
        </p>
        <div style={{ fontSize: `${base * scale * scale * scale}px`, color: 'var(--ink)' }} className="font-bold">
          Título H1
        </div>
        <div style={{ fontSize: `${base * scale * scale}px`, color: 'var(--ink)' }} className="font-bold">
          Título H2
        </div>
        <div style={{ fontSize: `${base * scale}px`, color: 'var(--ink)' }} className="font-semibold">
          Título H3
        </div>
        <div style={{ fontSize: `${base}px`, color: 'var(--ink)' }}>Texto base / párrafo</div>
        <div style={{ fontSize: `${base / scale}px`, color: 'var(--ink-soft)' }}>Texto pequeño / metadatos</div>
      </section>

      {/* Producto + badges */}
      <section className="grid gap-4 px-6 py-5 sm:grid-cols-[1fr_220px]" style={{ backgroundColor: 'var(--muted)' }}>
        <div
          className="overflow-hidden border bg-[var(--background)]"
          style={{ borderColor: 'var(--border)', borderRadius: 'var(--radius)' }}
        >
          <div
            className="relative h-32"
            style={{
              background: `repeating-linear-gradient(45deg, var(--brand-soft) 0 12px, var(--background) 12px 24px)`,
            }}
          >
            <span
              className="absolute left-3 top-3 inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
              style={{ backgroundColor: 'var(--destructive)' }}
            >
              OFERTA
            </span>
          </div>
          <div className="p-3">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider" style={{ color: 'var(--ink-soft)' }}>
              <span>Categoría</span>
              <span className="flex items-center gap-1" style={{ color: 'var(--brand)' }}>
                <Star className="size-3 fill-current" /> 4.8
              </span>
            </div>
            <h3 className="mt-1 font-semibold" style={{ color: 'var(--ink)' }}>
              Producto destacado
            </h3>
            <div className="mt-2 flex items-end justify-between">
              <div className="text-lg font-bold" style={{ color: 'var(--ink)' }}>
                $489.000
              </div>
              <button
                className="px-3 py-1.5 text-xs font-semibold text-white"
                style={{ backgroundColor: 'var(--brand)', borderRadius: 'var(--radius)' }}
              >
                Cotizar
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--ink-soft)' }}>
            Etiquetas
          </p>
          {[
            { label: 'OFERTA', bg: 'var(--destructive)' },
            { label: 'NUEVO', bg: 'var(--brand)' },
            { label: 'TOP', bg: 'var(--ink)' },
          ].map((b) => (
            <span
              key={b.label}
              className="mr-1 inline-flex rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
              style={{ backgroundColor: b.bg }}
            >
              {b.label}
            </span>
          ))}
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--ink-soft)' }}>
            Enlaces
          </p>
          <a className="block text-sm font-medium" style={{ color: 'var(--brand)' }}>
            Link primario
          </a>
          <a className="block text-sm" style={{ color: 'var(--ink-soft)' }}>
            Texto secundario
          </a>
        </div>
      </section>
    </div>
  );
}
