import { ImageIcon, PlayCircle } from 'lucide-react';
import { useObjectUrl } from './useObjectUrl';
import { PreviewFrame, usePreviewSize } from './PreviewFrame';

type Props = {
  type: 'image' | 'video';
  title?: string;
  album?: string;
  file?: File | null;
  thumb?: File | null;
  currentSrcUrl?: string | null;
  currentThumbUrl?: string | null;
};

export function MediaPreview({
  type,
  title,
  album,
  file,
  thumb,
  currentSrcUrl,
  currentThumbUrl,
}: Props) {
  const fileUrl = useObjectUrl(file ?? null);
  const thumbUrl = useObjectUrl(thumb ?? null);
  const src = fileUrl ?? currentSrcUrl ?? null;
  const tnail = thumbUrl ?? currentThumbUrl ?? null;
  const size = usePreviewSize();
  const cardMax = size === 'expanded' ? 'max-w-2xl' : 'max-w-[260px]';

  return (
    <PreviewFrame subtitle="ítem de galería">
      <div className="bg-[var(--background)] p-4">
        <div
          className={`mx-auto overflow-hidden border ${cardMax}`}
          style={{ borderColor: 'var(--border)', borderRadius: 'var(--radius)' }}
        >
          <div className="relative aspect-square bg-[var(--muted)]">
            {type === 'image' ? (
              src ? (
                <img src={src} alt={title ?? ''} className="size-full object-cover" />
              ) : (
                <div className="grid size-full place-items-center text-neutral-300">
                  <ImageIcon className="size-10" />
                </div>
              )
            ) : (
              <>
                {tnail ? (
                  <img src={tnail} alt={title ?? ''} className="size-full object-cover opacity-80" />
                ) : src ? (
                  <video src={src} className="size-full object-cover" muted />
                ) : (
                  <div className="size-full bg-neutral-900" />
                )}
                <div className="absolute inset-0 grid place-items-center">
                  <PlayCircle className="size-12 text-white drop-shadow-lg" />
                </div>
              </>
            )}
            <div
              className="absolute bottom-0 left-0 right-0 px-2 py-1.5 text-[11px] font-medium text-white"
              style={{ background: 'linear-gradient(180deg, transparent, rgba(0,0,0,0.75))' }}
            >
              {title || 'Sin título'}
              {album && <span className="ml-2 opacity-70">· {album}</span>}
            </div>
          </div>
        </div>
      </div>
    </PreviewFrame>
  );
}
