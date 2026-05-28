import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  Headphones,
  ShieldCheck,
  Sparkles,
  Truck,
  ChevronRight,
  Quote,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SectionHeader } from '@/components/site/SectionHeader'
import { ProductCard } from '@/components/site/ProductCard'
import {
  usePublicCategories,
  usePublicProducts,
  usePublicPromotions,
  useSiteSettings,
} from '@/hooks/usePublicData'

export default function Home() {
  const { data: featured = [] } = usePublicProducts({ featured: true })
  const { data: promotions = [] } = usePublicPromotions()
  const { data: categories = [] } = usePublicCategories()
  const { data: settings = {} } = useSiteSettings()
  const heroPromo = promotions.find((p) => p.highlight) ?? promotions[0]

  const heroEyebrow = settings.hero_eyebrow || 'Nueva temporada'
  const heroTitle = settings.hero_title || 'Productos que impulsan tu negocio.'
  const heroDescription =
    settings.hero_description ||
    'En Grupo Santacruz distribuimos productos para tu negocio con cobertura nacional.'
  const heroCtaPrimary = settings.hero_cta_primary || 'Explorar catálogo'
  const heroCtaSecondary = settings.hero_cta_secondary || 'Hablar con un vendedor'

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden bg-brand-radial">
        <div className="absolute inset-0 bg-grid opacity-50" />
        <div className="container-page relative grid gap-12 py-16 lg:grid-cols-[1.05fr_1fr] lg:py-24">
          <div className="flex flex-col justify-center">
            <div className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-brand/30 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-brand-dark shadow-sm">
              <Sparkles className="h-3 w-3" />
              {heroEyebrow}
            </div>
            <h1 className="text-balance text-4xl font-extrabold leading-[1.05] tracking-tight text-ink sm:text-5xl lg:text-6xl">
              {heroTitle}
            </h1>
            <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
              {heroDescription}
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button
                asChild
                size="lg"
                className="h-12 bg-brand px-6 text-base text-white hover:bg-brand-hover"
              >
                <Link to="/catalogo">
                  {heroCtaPrimary}
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 border-ink/15 px-6 text-base text-ink hover:bg-ink hover:text-white"
              >
                <Link to="/vendedor">{heroCtaSecondary}</Link>
              </Button>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-6 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-brand" />
                +12 años en el mercado
              </span>
              <span className="inline-flex items-center gap-2">
                <Truck className="h-4 w-4 text-brand" />
                Envíos a todo el país
              </span>
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-brand" />
                Garantía en cada producto
              </span>
            </div>
          </div>

          {/* Hero promo card */}
          {heroPromo ? (
          <div className="relative">
            <div className="relative overflow-hidden rounded-3xl border border-border bg-white shadow-2xl shadow-brand/10">
              {heroPromo.image_url ? (
                <img
                  src={heroPromo.image_url}
                  alt={heroPromo.title}
                  className="aspect-[5/4] w-full object-cover"
                />
              ) : (
                <div className="aspect-[5/4] w-full bg-gradient-to-br from-brand to-brand-dark" />
              )}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-6 text-white">
                <Badge className="mb-3 rounded-md bg-brand px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">
                  Promoción destacada
                </Badge>
                <h3 className="text-2xl font-bold leading-tight">
                  {heroPromo.title}
                </h3>
                <p className="mt-1 line-clamp-2 text-sm text-white/80">
                  {heroPromo.description}
                </p>
                <Button
                  asChild
                  size="sm"
                  className="mt-4 bg-white text-ink hover:bg-brand hover:text-white"
                >
                  <Link to="/promociones">
                    Ver promociones
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
            {heroPromo.discount ? (
              <div className="absolute -bottom-5 -left-5 hidden h-28 w-28 rounded-2xl border border-border bg-white p-3 shadow-xl lg:flex lg:flex-col lg:items-center lg:justify-center">
                <div className="text-3xl font-extrabold text-brand">{heroPromo.discount}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  de descuento
                </div>
              </div>
            ) : null}
          </div>
          ) : null}
        </div>
      </section>

      {/* TRUST STRIP */}
      <section className="border-y border-border bg-white">
        <div className="container-page grid grid-cols-2 gap-6 py-6 md:grid-cols-4">
          {[
            { icon: Truck, t: 'Envío nacional', s: 'A todo Colombia' },
            { icon: ShieldCheck, t: 'Garantía real', s: 'Respaldo de marca' },
            { icon: Headphones, t: 'Asesoría 1 a 1', s: 'Equipo comercial' },
            { icon: BadgeCheck, t: 'Calidad certificada', s: 'Productos auditados' },
          ].map(({ icon: Icon, t, s }) => (
            <div
              key={t}
              className="flex items-center gap-3 rounded-lg p-2"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-brand-soft text-brand">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <div className="text-sm font-semibold text-ink">{t}</div>
                <div className="text-xs text-muted-foreground">{s}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CATEGORÍAS */}
      <section className="container-page py-16 sm:py-20">
        <SectionHeader
          eyebrow="Categorías"
          title="Encuentra lo que tu empresa necesita"
          description="Explora nuestras líneas principales. Cada categoría incluye productos seleccionados y combos por volumen."
          action={
            <Button asChild variant="ghost" className="text-brand-dark hover:bg-brand-soft">
              <Link to="/catalogo">
                Ver todo
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          }
        />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {categories.map((c) => (
            <Link
              key={c.id}
              to="/catalogo"
              className="group relative overflow-hidden rounded-xl border border-border bg-white transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-lg"
            >
              {c.image_url ? (
                <img
                  src={c.image_url}
                  alt={c.name}
                  loading="lazy"
                  className="aspect-[4/3] w-full object-cover transition duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="aspect-[4/3] w-full bg-gradient-to-br from-brand-soft to-brand/30" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                <div className="text-lg font-bold">{c.name}</div>
                <div className="text-xs text-white/80">{c.description}</div>
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand">
                  Ver productos <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* PRODUCTOS DESTACADOS */}
      <section className="bg-muted/40 py-16 sm:py-20">
        <div className="container-page">
          <SectionHeader
            eyebrow="Más vendidos"
            title="Productos destacados"
            description="Los favoritos de nuestros clientes corporativos este mes."
            action={
              <Button asChild className="bg-ink text-white hover:bg-ink/90">
                <Link to="/catalogo">
                  Ver catálogo completo
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            }
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* PROMOCIONES BANNER */}
      <section className="container-page py-16 sm:py-20">
        <SectionHeader
          eyebrow="Promociones"
          title="Aprovecha mientras estén activas"
          action={
            <Button asChild variant="ghost" className="text-brand-dark hover:bg-brand-soft">
              <Link to="/promociones">
                Ver todas
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          }
        />
        <div className="grid gap-5 md:grid-cols-3">
          {promotions.slice(0, 3).map((promo, idx) => (
            <Link
              key={promo.id}
              to="/promociones"
              className={`group relative overflow-hidden rounded-2xl border border-border bg-white transition hover:-translate-y-0.5 hover:shadow-xl ${
                idx === 0 ? 'md:col-span-2 md:row-span-1' : ''
              }`}
            >
              {promo.image_url ? (
                <img
                  src={promo.image_url}
                  alt={promo.title}
                  loading="lazy"
                  className="h-64 w-full object-cover transition duration-500 group-hover:scale-105"
                />
              ) : (
                <div className="h-64 w-full bg-gradient-to-br from-brand-dark to-brand" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <Badge className="mb-2 rounded-md bg-brand text-white">
                  {promo.badge}
                </Badge>
                <div className="text-xl font-bold leading-tight">
                  {promo.title}
                </div>
                <div className="mt-1 text-sm text-white/80">{promo.subtitle}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* TESTIMONIOS */}
      <section className="border-y border-border bg-ink py-16 text-white sm:py-20">
        <div className="container-page">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand/40 bg-brand/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-brand">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              Lo que dicen nuestros clientes
            </div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Confianza construida proyecto a proyecto
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              {
                name: 'Andrea Rojas',
                role: 'Gerente de compras · Logiplus',
                text: 'La asesoría personalizada hizo la diferencia. Tiempos de entrega impecables y precios competitivos.',
              },
              {
                name: 'Carlos Méndez',
                role: 'Jefe de planta · Industrial JM',
                text: 'Renovamos toda la dotación con ellos. Calidad real y soporte post-venta de verdad.',
              },
              {
                name: 'Mariana Quintero',
                role: 'CEO · Estudio Norte',
                text: 'Equipamos toda la oficina nueva en menos de una semana. Recomendados al 100%.',
              },
            ].map((t) => (
              <figure
                key={t.name}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
              >
                <Quote className="h-6 w-6 text-brand" />
                <blockquote className="mt-3 text-sm leading-relaxed text-white/85">
                  "{t.text}"
                </blockquote>
                <figcaption className="mt-5 border-t border-white/10 pt-4">
                  <div className="text-sm font-semibold">{t.name}</div>
                  <div className="text-xs text-white/60">{t.role}</div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="container-page py-16 sm:py-20">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-brand-soft via-white to-white p-8 sm:p-12">
          <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-brand/15 blur-3xl" />
          <div className="relative grid items-center gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand/30 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-brand-dark">
                <Sparkles className="h-3 w-3" />
                Atención personalizada
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
                ¿Necesitas una cotización a la medida?
              </h2>
              <p className="mt-3 max-w-xl text-base text-muted-foreground">
                Cuéntanos qué buscas. Un asesor te contactará con la mejor opción,
                precios por volumen y tiempos de entrega.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Button
                asChild
                size="lg"
                className="h-12 bg-brand px-6 text-base text-white hover:bg-brand-hover"
              >
                <Link to="/vendedor">
                  Hablar con un vendedor
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 border-ink/15 px-6 text-base text-ink hover:bg-ink hover:text-white"
              >
                <Link to="/catalogo">Ver catálogo</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
