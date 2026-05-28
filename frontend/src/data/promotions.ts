export type Promotion = {
  id: number
  slug: string
  title: string
  subtitle: string
  description: string
  image: string
  badge: string
  discount: string
  startsAt: string
  endsAt: string
  highlight?: boolean
}

export const promotions: Promotion[] = [
  {
    id: 1,
    slug: 'mes-industrial',
    title: 'Mes industrial · hasta 25% OFF',
    subtitle: 'Equipos y herramientas seleccionadas',
    description:
      'Renueva tu taller con descuentos en taladros, compresores y herramienta de precisión.',
    image: 'https://picsum.photos/seed/sc-promo-1/1200/800',
    badge: 'OFERTA',
    discount: '-25%',
    startsAt: '2026-05-01',
    endsAt: '2026-05-31',
    highlight: true,
  },
  {
    id: 2,
    slug: 'oficina-nueva',
    title: 'Oficina nueva: 2x1 en sillería',
    subtitle: 'Solo esta semana',
    description:
      'Llévate dos sillas ergonómicas pagando una en modelos seleccionados.',
    image: 'https://picsum.photos/seed/sc-promo-2/1200/800',
    badge: '2x1',
    discount: '2x1',
    startsAt: '2026-05-20',
    endsAt: '2026-05-31',
  },
  {
    id: 3,
    slug: 'tech-week',
    title: 'Tech Week · monitores y laptops',
    subtitle: 'Tecnología que se paga sola',
    description:
      'Financiación a 12 meses sin intereses con tu tarjeta corporativa.',
    image: 'https://picsum.photos/seed/sc-promo-3/1200/800',
    badge: '12 MSI',
    discount: '12 MSI',
    startsAt: '2026-05-15',
    endsAt: '2026-06-15',
  },
  {
    id: 4,
    slug: 'dotacion-segura',
    title: 'Dotación segura',
    subtitle: 'Combos de protección personal',
    description:
      'Combos para tu equipo de trabajo con descuento por volumen.',
    image: 'https://picsum.photos/seed/sc-promo-4/1200/800',
    badge: 'COMBO',
    discount: '-15%',
    startsAt: '2026-05-01',
    endsAt: '2026-06-30',
  },
]
