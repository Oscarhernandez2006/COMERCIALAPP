import { CalendarRange, ImageIcon, Tag } from 'lucide-react';
import { useObjectUrl } from './useObjectUrl';
import { PreviewFrame } from './PreviewFrame';

type Props = {
  title: string;
  subtitle?: string;
  description?: string;
  badge?: string;
  discount?: string;
  startsAt?: string;
  endsAt?: string;
  highlight?: boolean;
  imageFile?: File | null;
  currentImageUrl?: string | null;
};

export function PromotionPreview({
  title,
  subtitle,
  description,
  badge,
  discount,
  startsAt,
  endsAt,
  highlight,
  imageFile,
  currentImageUrl,
}: Props) {
  const objectUrl = useObjectUrl(imageFile ?? null);
  const imageUrl = objectUrl ?? currentImageUrl ?? null;

  return (
    <PreviewFrame subtitle="banner de promoción">
      <div className="bg-[var(--background)] p-4">
        <article
          className="relative overflow-hidden border"
          style={{
            borderColor: 'var(--border)',
            borderRadius: 'var(--radius)',
            background: highlight ? 'var(--brand-soft)' : 'var(--background)',
          }}
        >
          <div className="grid sm:grid-cols-[1fr_180px]">
            <div className="space-y-2 p-4">
              <div className="flex flex-wrap items-center gap-2">
                {badge && (
                  <span
                    className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
                    style={{ backgroundColor: 'var(--destructive)' }}
                  >
                    <Tag className="size-3" /> {badge}
                  </span>
                )}
                {discount && (
                  <span
                    className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
                    style={{ backgroundColor: 'var(--brand)' }}
                  >
                    {discount}
                  </span>
                )}
                {highlight && (
                  <span
                    className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                    style={{ backgroundColor: 'var(--brand)', color: '#fff' }}
                  >
                    Destacada
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold leading-tight" style={{ color: 'var(--ink)' }}>
                {title || 'Título de la promoción'}
              </h3>
              {subtitle && (
                <p className="text-sm font-medium" style={{ color: 'var(--brand-dark)' }}>
                  {subtitle}
                </p>
              )}
              {description && (
                <p className="text-xs leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
                  {description}
                </p>
              )}
              {(startsAt || endsAt) && (
                <div
                  className="inline-flex items-center gap-1 text-[11px]"
                  style={{ color: 'var(--ink-soft)' }}
                >
                  <CalendarRange className="size-3" />
                  {startsAt || '—'} → {endsAt || '—'}
                </div>
              )}
              <div className="pt-2">
                <button
                  className="px-3 py-1.5 text-xs font-semibold text-white"
                  style={{ backgroundColor: 'var(--brand)', borderRadius: 'var(--radius)' }}
                >
                  Quiero aprovecharla
                </button>
              </div>
            </div>
            <div className="relative min-h-[140px] bg-[var(--muted)]">
              {imageUrl ? (
                <img src={imageUrl} alt={title || 'Promoción'} className="size-full object-cover" />
              ) : (
                <div className="grid size-full place-items-center text-neutral-300">
                  <ImageIcon className="size-10" />
                </div>
              )}
            </div>
          </div>
        </article>
      </div>
    </PreviewFrame>
  );
}
