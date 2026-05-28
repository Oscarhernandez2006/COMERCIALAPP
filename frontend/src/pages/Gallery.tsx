import { useMemo, useState } from 'react'
import { Play, X } from 'lucide-react'
import { PageHero } from '@/components/site/SectionHeader'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { usePublicGallery, type PublicMedia } from '@/hooks/usePublicData'

export default function Gallery() {
  const [open, setOpen] = useState<PublicMedia | null>(null)
  const { data: items = [], isLoading } = usePublicGallery()
  const albums = useMemo(() => Array.from(new Set(items.map((i) => i.album))), [items])

  return (
    <>
      <PageHero
        eyebrow="Galería"
        title="Proyectos, showroom y vida en Grupo Santacruz"
        description="Mira instalaciones reales, nuestro showroom y videos del día a día."
      />
      <section className="container-page py-10 sm:py-14">
        {isLoading ? (
          <div className="py-16 text-center text-sm text-muted-foreground">Cargando…</div>
        ) : items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
            Aún no hemos publicado contenido en la galería.
          </div>
        ) : (
          <Tabs defaultValue="Todos" className="w-full">
            <TabsList className="mb-6 bg-muted">
              <TabsTrigger value="Todos">Todos</TabsTrigger>
              {albums.map((a) => (
                <TabsTrigger key={a} value={a}>
                  {a}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="Todos">
              <Grid items={items} onSelect={setOpen} />
            </TabsContent>
            {albums.map((a) => (
              <TabsContent key={a} value={a}>
                <Grid items={items.filter((i) => i.album === a)} onSelect={setOpen} />
              </TabsContent>
            ))}
          </Tabs>
        )}
      </section>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-w-5xl border-0 bg-black p-0 text-white sm:rounded-xl" showCloseButton={false}>
          <DialogTitle className="sr-only">{open?.title ?? 'Media'}</DialogTitle>
          <button
            onClick={() => setOpen(null)}
            className="absolute right-3 top-3 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
          {open?.type === 'image' && open.src_url ? (
            <img src={open.src_url} alt={open.title ?? ''} className="max-h-[80vh] w-full rounded-xl object-contain" />
          ) : open?.type === 'video' && open.src_url ? (
            <video src={open.src_url} controls autoPlay className="max-h-[80vh] w-full rounded-xl bg-black" />
          ) : null}
          {open && (
            <div className="bg-black/80 px-4 py-3 text-sm text-white/80">
              <span className="font-semibold text-white">{open.title}</span> · {open.album}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

function Grid({ items, onSelect }: { items: PublicMedia[]; onSelect: (m: PublicMedia) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item, idx) => {
        const cover = item.thumb_url ?? item.src_url
        return (
          <button
            key={item.id}
            onClick={() => onSelect(item)}
            className={`group relative overflow-hidden rounded-xl border border-border bg-muted transition hover:shadow-lg ${
              idx % 7 === 0 ? 'row-span-2 aspect-[3/4]' : 'aspect-square'
            }`}
          >
            {cover ? (
              <img
                src={cover}
                alt={item.title ?? ''}
                loading="lazy"
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="grid h-full w-full place-items-center bg-neutral-200 text-xs text-neutral-500">Sin imagen</div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-transparent opacity-0 transition group-hover:opacity-100" />
            <div className="absolute inset-x-0 bottom-0 translate-y-2 p-3 text-left text-white opacity-0 transition group-hover:translate-y-0 group-hover:opacity-100">
              <div className="text-xs font-semibold">{item.title}</div>
              <div className="text-[10px] uppercase tracking-wider text-white/70">{item.album}</div>
            </div>
            {item.type === 'video' && (
              <span className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white shadow-lg">
                <Play className="h-4 w-4 fill-current" />
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
