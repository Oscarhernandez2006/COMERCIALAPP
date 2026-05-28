import { ArrowRight, Clock, Globe, Mail, MapPin, Phone } from 'lucide-react';
import { PreviewFrame, usePreviewSize } from './PreviewFrame';

type HeroProps = {
  eyebrow?: string;
  title?: string;
  description?: string;
  ctaPrimary?: string;
  ctaSecondary?: string;
  siteName?: string;
  tagline?: string;
};

export function HeroPreview({
  eyebrow,
  title,
  description,
  ctaPrimary,
  ctaSecondary,
  siteName,
  tagline,
}: HeroProps) {
  const size = usePreviewSize();
  const isExpanded = size === 'expanded';
  const pad = isExpanded ? 'px-10 py-16 md:px-16 md:py-24' : 'px-6 py-10';
  const titleSize = isExpanded ? 'text-5xl md:text-6xl' : 'text-3xl md:text-4xl';
  const descSize = isExpanded ? 'text-lg md:text-xl' : 'text-sm';
  const minH = isExpanded ? '560px' : '320px';

  // Placeholders amables cuando un campo aún está vacío, para que la preview
  // se vea siempre como una sección real.
  const showEyebrow = eyebrow || 'Bienvenido';
  const showTitle = title || 'Tu título principal aquí';
  const showDescription =
    description ||
    'Aquí va una descripción breve que invita al cliente a explorar tu portal. Edita el texto del hero para personalizarlo.';
  const showCtaPrimary = ctaPrimary || 'Explorar catálogo';
  const showCtaSecondary = ctaSecondary || 'Hablar con un vendedor';

  return (
    <PreviewFrame subtitle="hero del portal">
      <section
        className={`relative flex flex-col justify-center ${pad}`}
        style={{
          minHeight: minH,
          background: `linear-gradient(135deg, var(--brand-soft) 0%, var(--background) 70%)`,
        }}
      >
        {/* Brand mark arriba a la izquierda (header simulado) */}
        <div className="absolute left-6 top-6 flex items-center gap-2 md:left-10 md:top-8">
          <div
            className={`grid place-items-center rounded-md font-bold text-white ${
              isExpanded ? 'size-10 text-base' : 'size-8 text-sm'
            }`}
            style={{ backgroundColor: 'var(--brand)' }}
          >
            {(siteName ?? 'G')[0].toUpperCase()}
          </div>
          <div className="leading-tight">
            <div
              className={`font-semibold ${isExpanded ? 'text-base' : 'text-sm'}`}
              style={{ color: 'var(--ink)' }}
            >
              {siteName || 'Tu marca'}
            </div>
            {tagline && (
              <div className={isExpanded ? 'text-xs' : 'text-[11px]'} style={{ color: 'var(--ink-soft)' }}>
                {tagline}
              </div>
            )}
          </div>
        </div>

        {/* Decoración: orbes de marca */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 top-10 size-40 rounded-full opacity-40 blur-3xl md:size-72"
          style={{ backgroundColor: 'var(--brand)' }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-10 bottom-0 size-32 rounded-full opacity-30 blur-3xl md:size-56"
          style={{ backgroundColor: 'var(--brand-dark)' }}
        />

        <div className={`relative ${isExpanded ? 'mt-10 max-w-3xl' : 'mt-8 max-w-xl'}`}>
          <span
            className="inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wider"
            style={{ backgroundColor: 'var(--brand-soft)', color: 'var(--brand-dark)' }}
          >
            {showEyebrow}
          </span>
          <h1
            className={`mt-4 font-extrabold leading-[1.05] ${titleSize}`}
            style={{ color: 'var(--ink)' }}
          >
            {showTitle}
          </h1>
          <p className={`mt-4 ${descSize}`} style={{ color: 'var(--ink-soft)' }}>
            {showDescription}
          </p>
          <div className={`flex flex-wrap gap-3 ${isExpanded ? 'mt-8' : 'mt-6'}`}>
            <button
              className={`inline-flex items-center gap-1 font-semibold text-white ${
                isExpanded ? 'px-6 py-3 text-base' : 'px-4 py-2 text-sm'
              }`}
              style={{ backgroundColor: 'var(--brand)', borderRadius: 'var(--radius)' }}
            >
              {showCtaPrimary} <ArrowRight className={isExpanded ? 'size-5' : 'size-4'} />
            </button>
            <button
              className={`inline-flex items-center gap-1 border-2 font-semibold ${
                isExpanded ? 'px-6 py-3 text-base' : 'px-4 py-2 text-sm'
              }`}
              style={{
                borderColor: 'var(--ink)',
                color: 'var(--ink)',
                borderRadius: 'var(--radius)',
                backgroundColor: 'transparent',
              }}
            >
              {showCtaSecondary}
            </button>
          </div>
        </div>
      </section>
    </PreviewFrame>
  );
}

type ContactProps = {
  phone?: string;
  email?: string;
  address?: string;
  hours?: string;
  facebook?: string;
  instagram?: string;
  linkedin?: string;
};

export function ContactPreview({ phone, email, address, hours, facebook, instagram, linkedin }: ContactProps) {
  const size = usePreviewSize();
  const pad = size === 'expanded' ? 'p-10 md:p-14' : 'p-4';
  const items = [
    { icon: Phone, label: 'Teléfono', value: phone },
    { icon: Mail, label: 'Correo', value: email },
    { icon: MapPin, label: 'Dirección', value: address },
    { icon: Clock, label: 'Horario', value: hours },
  ].filter((i) => i.value);

  const socials = [
    { label: 'fb', url: facebook },
    { label: 'ig', url: instagram },
    { label: 'in', url: linkedin },
  ].filter((s) => s.url);

  return (
    <PreviewFrame subtitle="bloque de contacto / footer">
      <div className={pad} style={{ backgroundColor: 'var(--muted)' }}>
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider" style={{ color: 'var(--ink)' }}>
          Contáctanos
        </h3>
        {items.length === 0 ? (
          <p className="text-xs" style={{ color: 'var(--ink-soft)' }}>
            Aún no has cargado datos de contacto.
          </p>
        ) : (
          <ul className="space-y-2">
            {items.map((i) => (
              <li key={i.label} className="flex items-start gap-2 text-sm">
                <i.icon className="mt-0.5 size-4" style={{ color: 'var(--brand)' }} />
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--ink-soft)' }}>
                    {i.label}
                  </div>
                  <div style={{ color: 'var(--ink)' }}>{i.value}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
        {socials.length > 0 && (
          <div className="mt-3 flex gap-2">
            {socials.map((s) => (
              <span
                key={s.label}
                className="grid size-8 place-items-center rounded-full text-[10px] font-bold uppercase text-white"
                style={{ backgroundColor: 'var(--brand)' }}
              >
                <Globe className="size-3.5" />
              </span>
            ))}
          </div>
        )}
      </div>
    </PreviewFrame>
  );
}
