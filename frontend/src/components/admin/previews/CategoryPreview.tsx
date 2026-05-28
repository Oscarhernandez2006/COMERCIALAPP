import { ArrowRight, ImageIcon } from 'lucide-react';
import { useObjectUrl } from './useObjectUrl';
import { PreviewFrame, usePreviewSize } from './PreviewFrame';

type Props = {
  name: string;
  description?: string;
  imageFile?: File | null;
  currentImageUrl?: string | null;
};

export function CategoryPreview({ name, description, imageFile, currentImageUrl }: Props) {
  const objectUrl = useObjectUrl(imageFile ?? null);
  const imageUrl = objectUrl ?? currentImageUrl ?? null;
  const size = usePreviewSize();
  const cardMax = size === 'expanded' ? 'max-w-2xl' : 'max-w-[260px]';

  return (
    <PreviewFrame subtitle="tarjeta de categoría">
      <div className="bg-[var(--background)] p-4">
        <div
          className={`mx-auto overflow-hidden border ${cardMax}`}
          style={{ borderColor: 'var(--border)', borderRadius: 'var(--radius)' }}
        >
          <div className={size === 'expanded' ? 'relative h-64 bg-[var(--muted)]' : 'relative h-32 bg-[var(--muted)]'}>
            {imageUrl ? (
              <img src={imageUrl} alt={name || 'Categoría'} className="size-full object-cover" />
            ) : (
              <div className="grid size-full place-items-center text-neutral-300">
                <ImageIcon className="size-10" />
              </div>
            )}
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.55) 100%)' }}
            />
            <div className="absolute bottom-2 left-3 right-3 text-white">
              <h3 className="text-base font-bold leading-tight drop-shadow">{name || 'Nombre de la categoría'}</h3>
            </div>
          </div>
          <div className="p-3" style={{ backgroundColor: 'var(--background)' }}>
            <p className="line-clamp-2 text-xs" style={{ color: 'var(--ink-soft)' }}>
              {description || 'Descripción breve que ayudará al cliente a entender qué encontrará aquí.'}
            </p>
            <div
              className="mt-2 inline-flex items-center gap-1 text-xs font-semibold"
              style={{ color: 'var(--brand)' }}
            >
              Explorar <ArrowRight className="size-3" />
            </div>
          </div>
        </div>
      </div>
    </PreviewFrame>
  );
}
