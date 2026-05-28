import { useMemo, useState } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { PageHero } from '@/components/site/SectionHeader'
import { ProductCard } from '@/components/site/ProductCard'
import { usePublicCategories, usePublicProducts } from '@/hooks/usePublicData'

type SortKey = 'relevance' | 'price-asc' | 'price-desc' | 'rating'

export default function Catalog() {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<string>('all')
  const [sort, setSort] = useState<SortKey>('relevance')

  const { data: products = [], isLoading } = usePublicProducts()
  const { data: categories = [] } = usePublicCategories()

  const filtered = useMemo(() => {
    let list = products
    if (cat !== 'all') list = list.filter((p) => p.category?.slug === cat)
    if (q.trim()) {
      const needle = q.trim().toLowerCase()
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(needle) ||
          (p.short_description ?? '').toLowerCase().includes(needle),
      )
    }
    switch (sort) {
      case 'price-asc':
        return [...list].sort((a, b) => a.price - b.price)
      case 'price-desc':
        return [...list].sort((a, b) => b.price - a.price)
      case 'rating':
        return [...list].sort((a, b) => Number(b.rating ?? 0) - Number(a.rating ?? 0))
      default:
        return list
    }
  }, [products, q, cat, sort])

  return (
    <>
      <PageHero
        eyebrow="Catálogo"
        title="Productos para tu empresa"
        description="Filtra por categoría, busca por nombre y solicita cotización con un click."
      />
      <section className="container-page py-10 sm:py-14">
        {/* Toolbar */}
        <div className="mb-6 flex flex-col gap-3 rounded-xl border border-border bg-white p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar producto…"
              className="h-11 pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Select value={cat} onValueChange={setCat}>
              <SelectTrigger className="h-11 w-[170px]">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.slug} value={c.slug}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
              <SelectTrigger className="h-11 w-[170px]">
                <SlidersHorizontal className="mr-1 h-4 w-4 text-muted-foreground" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevancia</SelectItem>
                <SelectItem value="price-asc">Precio: menor a mayor</SelectItem>
                <SelectItem value="price-desc">Precio: mayor a menor</SelectItem>
                <SelectItem value="rating">Mejor calificados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active filters */}
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span>
            {filtered.length} producto{filtered.length === 1 ? '' : 's'}
          </span>
          {cat !== 'all' && (
            <Badge variant="outline" className="border-brand/30 text-brand-dark">
              {categories.find((c) => c.slug === cat)?.name}
              <button
                onClick={() => setCat('all')}
                className="ml-2 text-muted-foreground hover:text-ink"
              >
                ×
              </button>
            </Badge>
          )}
          {q && (
            <Badge variant="outline">
              "{q}"
              <button
                onClick={() => setQ('')}
                className="ml-2 text-muted-foreground hover:text-ink"
              >
                ×
              </button>
            </Badge>
          )}
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Cargando productos…</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <p className="text-muted-foreground">
              No encontramos productos con esos filtros.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setQ('')
                setCat('all')
              }}
            >
              Limpiar filtros
            </Button>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </>
  )
}
