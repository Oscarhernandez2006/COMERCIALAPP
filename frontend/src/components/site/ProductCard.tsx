import { Link } from 'react-router-dom'
import { Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatPrice, type PublicProduct } from '@/hooks/usePublicData'
import { cn } from '@/lib/utils'

type Props = {
  product: PublicProduct
  className?: string
}

const badgeStyles: Record<string, string> = {
  OFERTA: 'bg-destructive text-white',
  NUEVO: 'bg-brand text-white',
  TOP: 'bg-ink text-white',
}

export function ProductCard({ product, className }: Props) {
  const off =
    product.compare_price && product.compare_price > product.price
      ? Math.round(
          ((product.compare_price - product.price) / product.compare_price) * 100,
        )
      : 0
  const rating = Number(product.rating ?? 0)
  const badgeClass = product.badge ? badgeStyles[product.badge] ?? 'bg-brand text-white' : ''

  return (
    <article
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl border border-border bg-white transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lg hover:shadow-brand/5',
        className,
      )}
    >
      <Link to={`/catalogo`} className="relative block overflow-hidden bg-muted">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="aspect-square w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid aspect-square w-full place-items-center bg-neutral-100 text-xs text-neutral-400">
            Sin imagen
          </div>
        )}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {product.badge && (
            <Badge
              className={cn(
                'rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                badgeClass,
              )}
            >
              {product.badge}
            </Badge>
          )}
          {off > 0 && (
            <Badge className="rounded-md bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-destructive shadow-sm">
              -{off}%
            </Badge>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-muted-foreground">
          <span>{product.category?.name ?? '—'}</span>
          {rating > 0 ? (
            <span className="inline-flex items-center gap-1 text-ink-soft">
              <Star className="h-3 w-3 fill-brand text-brand" />
              {rating.toFixed(1)}
            </span>
          ) : null}
        </div>
        <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-ink">
          {product.name}
        </h3>
        <p className="line-clamp-2 text-xs text-muted-foreground">
          {product.short_description}
        </p>
        <div className="mt-auto flex items-end justify-between pt-3">
          <div>
            {product.compare_price && (
              <div className="text-xs text-muted-foreground line-through">
                {formatPrice(product.compare_price)}
              </div>
            )}
            <div className="text-lg font-bold text-ink">
              {formatPrice(product.price)}
            </div>
          </div>
          <Button
            asChild
            size="sm"
            className="bg-brand text-white hover:bg-brand-hover"
          >
            <Link to="/vendedor">Cotizar</Link>
          </Button>
        </div>
      </div>
    </article>
  )
}
