import { Link } from 'react-router-dom'
import { CalendarDays, Tag, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PageHero } from '@/components/site/SectionHeader'
import { usePublicPromotions } from '@/hooks/usePublicData'

const fmt = (d: string | null) =>
  d
    ? new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—'

export default function Promotions() {
  const { data: promotions = [], isLoading } = usePublicPromotions()
  return (
    <>
      <PageHero
        eyebrow="Promociones activas"
        title="Ofertas pensadas para tu empresa"
        description="Descuentos por temporada, combos por volumen y financiación corporativa. Vigentes hasta agotar existencias."
      />
      <section className="container-page py-10 sm:py-14">
        {isLoading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Cargando…</div>
        ) : promotions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
            No hay promociones activas en este momento.
          </div>
        ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {promotions.map((p, idx) => (
            <article
              key={p.id}
              className="group relative overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              <div className="relative">
                {p.image_url ? (
                  <img
                    src={p.image_url}
                    alt={p.title}
                    loading="lazy"
                    className="aspect-[16/9] w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="aspect-[16/9] w-full bg-gradient-to-br from-brand to-brand-dark" />
                )}
                {p.badge ? (
                <Badge
                  className={`absolute left-4 top-4 rounded-md px-2.5 py-1 text-xs font-bold ${
                    idx === 0
                      ? 'bg-destructive text-white'
                      : 'bg-brand text-white'
                  }`}
                >
                  {p.badge}
                </Badge>
                ) : null}
                {p.discount ? (
                <div className="absolute right-4 top-4 rounded-lg bg-white/95 px-3 py-2 text-right shadow-sm backdrop-blur">
                  <div className="text-xl font-extrabold text-brand">
                    {p.discount}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    descuento
                  </div>
                </div>
                ) : null}
              </div>
              <div className="p-6">
                <div className="mb-2 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-brand-dark">
                  <Tag className="h-3 w-3" />
                  {p.subtitle}
                </div>
                <h3 className="text-2xl font-bold text-ink">{p.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {p.description}
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarDays className="h-4 w-4 text-brand" />
                    Vigente {fmt(p.starts_at)} – {fmt(p.ends_at)}
                  </div>
                  <Button
                    asChild
                    size="sm"
                    className="bg-brand text-white hover:bg-brand-hover"
                  >
                    <Link to="/vendedor">
                      Aprovechar
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
        )}
      </section>
    </>
  )
}
