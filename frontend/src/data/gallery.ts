export type MediaItem = {
  id: number
  type: 'image' | 'video'
  title: string
  album: string
  src: string
  thumb: string
}

export const galleryItems: MediaItem[] = [
  ...Array.from({ length: 8 }).map((_, i) => ({
    id: i + 1,
    type: 'image' as const,
    title: `Instalación #${i + 1}`,
    album: 'Proyectos',
    src: `https://picsum.photos/seed/sc-gal-${i + 1}/1600/1100`,
    thumb: `https://picsum.photos/seed/sc-gal-${i + 1}/800/600`,
  })),
  ...Array.from({ length: 4 }).map((_, i) => ({
    id: 100 + i,
    type: 'image' as const,
    title: `Showroom ${i + 1}`,
    album: 'Showroom',
    src: `https://picsum.photos/seed/sc-show-${i + 1}/1600/1100`,
    thumb: `https://picsum.photos/seed/sc-show-${i + 1}/800/600`,
  })),
  {
    id: 200,
    type: 'video',
    title: 'Detrás de cámaras: nuestra bodega',
    album: 'Videos',
    src: 'https://www.w3schools.com/html/mov_bbb.mp4',
    thumb: 'https://picsum.photos/seed/sc-vid-1/800/600',
  },
  {
    id: 201,
    type: 'video',
    title: 'Línea de ensamble Pro',
    album: 'Videos',
    src: 'https://www.w3schools.com/html/movie.mp4',
    thumb: 'https://picsum.photos/seed/sc-vid-2/800/600',
  },
]

export const galleryAlbums = Array.from(
  new Set(galleryItems.map((i) => i.album)),
)
