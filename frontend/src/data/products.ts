export type Product = {
  id: number
  slug: string
  name: string
  shortDescription: string
  price: number
  comparePrice?: number
  category: string
  categoryName: string
  image: string
  badge?: 'NUEVO' | 'OFERTA' | 'TOP'
  rating: number
  featured?: boolean
}

const peso = (n: number) => n

export const products: Product[] = [
  {
    id: 1,
    slug: 'taladro-industrial-pro',
    name: 'Taladro industrial Pro 850W',
    shortDescription: 'Motor de alto torque con percusión ajustable.',
    price: peso(489000),
    comparePrice: peso(549000),
    category: 'industriales',
    categoryName: 'Industriales',
    image: 'https://picsum.photos/seed/sc-prod-1/800/800',
    badge: 'OFERTA',
    rating: 4.8,
    featured: true,
  },
  {
    id: 2,
    slug: 'silla-ergonomica-executive',
    name: 'Silla ergonómica Executive',
    shortDescription: 'Soporte lumbar dinámico y malla transpirable.',
    price: peso(629000),
    category: 'oficina',
    categoryName: 'Oficina',
    image: 'https://picsum.photos/seed/sc-prod-2/800/800',
    badge: 'TOP',
    rating: 4.9,
    featured: true,
  },
  {
    id: 3,
    slug: 'monitor-27-4k',
    name: 'Monitor profesional 27" 4K',
    shortDescription: 'Panel IPS con cobertura 99% sRGB.',
    price: peso(1299000),
    category: 'tecnologia',
    categoryName: 'Tecnología',
    image: 'https://picsum.photos/seed/sc-prod-3/800/800',
    badge: 'NUEVO',
    rating: 4.7,
    featured: true,
  },
  {
    id: 4,
    slug: 'casco-seguridad-clase-e',
    name: 'Casco de seguridad Clase E',
    shortDescription: 'Certificado ANSI, ajuste rápido.',
    price: peso(89000),
    category: 'seguridad',
    categoryName: 'Seguridad',
    image: 'https://picsum.photos/seed/sc-prod-4/800/800',
    rating: 4.6,
    featured: true,
  },
  {
    id: 5,
    slug: 'compresor-50l',
    name: 'Compresor 50L 2HP',
    shortDescription: 'Ideal para taller mediano y pintura.',
    price: peso(1490000),
    comparePrice: peso(1690000),
    category: 'industriales',
    categoryName: 'Industriales',
    image: 'https://picsum.photos/seed/sc-prod-5/800/800',
    badge: 'OFERTA',
    rating: 4.5,
  },
  {
    id: 6,
    slug: 'escritorio-electrico',
    name: 'Escritorio eléctrico ajustable',
    shortDescription: 'Memoria de altura y panel táctil.',
    price: peso(1890000),
    category: 'oficina',
    categoryName: 'Oficina',
    image: 'https://picsum.photos/seed/sc-prod-6/800/800',
    badge: 'NUEVO',
    rating: 4.8,
  },
  {
    id: 7,
    slug: 'laptop-business-14',
    name: 'Laptop Business 14" i7',
    shortDescription: '16GB RAM · SSD 512GB · Windows 11 Pro.',
    price: peso(4290000),
    category: 'tecnologia',
    categoryName: 'Tecnología',
    image: 'https://picsum.photos/seed/sc-prod-7/800/800',
    rating: 4.7,
  },
  {
    id: 8,
    slug: 'botas-dielectricas',
    name: 'Botas dieléctricas reforzadas',
    shortDescription: 'Punta de composite, suela antideslizante.',
    price: peso(259000),
    category: 'seguridad',
    categoryName: 'Seguridad',
    image: 'https://picsum.photos/seed/sc-prod-8/800/800',
    badge: 'TOP',
    rating: 4.6,
  },
  {
    id: 9,
    slug: 'impresora-multifuncional',
    name: 'Impresora multifuncional láser',
    shortDescription: 'Doble cara automática, red y Wi-Fi.',
    price: peso(1190000),
    category: 'oficina',
    categoryName: 'Oficina',
    image: 'https://picsum.photos/seed/sc-prod-9/800/800',
    rating: 4.4,
  },
]

export const featuredProducts = () => products.filter((p) => p.featured)

export const formatPrice = (value: number) =>
  new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value)
