import { ImageIcon, Star } from 'lucide-react';
import { useObjectUrl } from './useObjectUrl';
import { PreviewFrame, usePreviewSize } from './PreviewFrame';

type Props = {
  name: string;
  shortDescription?: string;
  price: number;
  comparePrice?: number | string | null;
  badge?: string | null;
  rating?: string | number | null;
  categoryName?: string | null;
  imageFile?: File | null;
  currentImageUrl?: string | null;
  featured?: boolean;
};

const fmtCOP = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

export function ProductCardPreview({
  name,
  shortDescription,
  price,
  comparePrice,
  badge,
  rating,
  categoryName,
  imageFile,
  currentImageUrl,
  featured,
}: Props) {
  const objectUrl = useObjectUrl(imageFile ?? null);
  const imageUrl = objectUrl ?? currentImageUrl ?? null;
  const compare = Number(comparePrice ?? 0);
  const ratingNum = Number(rating ?? 0);
  const size = usePreviewSize();
  const cardMax = size === 'expanded' ? 'max-w-md' : 'max-w-[260px]';

  return (
    <PreviewFrame subtitle="ficha de catálogo">
      <div className="bg-[var(--background)] p-4">
        <div className={`mx-auto overflow-hidden rounded-xl border ${cardMax}`} style={{ borderColor: 'var(--border)' }}>
          <div className="relative aspect-square bg-[var(--muted)]">
            {imageUrl ? (
              <img src={imageUrl} alt={name || 'Producto'} className="size-full object-cover" />
            ) : (
              <div className="grid size-full place-items-center text-neutral-300">
                <ImageIcon className="size-10" />
              </div>
            )}
            {badge && (
              <span
                className="absolute left-2 top-2 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
                style={{ backgroundColor: 'var(--destructive)' }}
              >
                {badge}
              </span>
            )}
            {featured && (
              <span
                className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
                style={{ backgroundColor: 'var(--brand)' }}
              >
                <Star className="size-3 fill-current" /> Destacado
              </span>
            )}
          </div>
          <div className="space-y-1.5 p-3" style={{ color: 'var(--ink)' }}>
            {categoryName && (
              <div
                className="text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: 'var(--ink-soft)' }}
              >
                {categoryName}
              </div>
            )}
            <h3 className="line-clamp-2 font-semibold leading-tight" style={{ color: 'var(--ink)' }}>
              {name || 'Nombre del producto'}
            </h3>
            {shortDescription && (
              <p className="line-clamp-2 text-xs" style={{ color: 'var(--ink-soft)' }}>
                {shortDescription}
              </p>
            )}
            {ratingNum > 0 && (
              <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--brand)' }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`size-3 ${i < Math.round(ratingNum) ? 'fill-current' : 'opacity-30'}`}
                  />
                ))}
                <span className="ml-1" style={{ color: 'var(--ink-soft)' }}>
                  {ratingNum.toFixed(1)}
                </span>
              </div>
            )}
            <div className="flex items-end justify-between pt-1">
              <div>
                <div className="text-lg font-bold leading-none" style={{ color: 'var(--ink)' }}>
                  {fmtCOP(price || 0)}
                </div>
                {compare > 0 && compare > price && (
                  <div className="text-xs line-through" style={{ color: 'var(--ink-soft)' }}>
                    {fmtCOP(compare)}
                  </div>
                )}
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
      </div>
    </PreviewFrame>
  );
}
