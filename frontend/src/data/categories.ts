export type Category = {
  id: number
  slug: string
  name: string
  description: string
  image: string
}

export const categories: Category[] = [
  {
    id: 1,
    slug: 'industriales',
    name: 'Industriales',
    description: 'Equipos y soluciones para producción.',
    image: 'https://picsum.photos/seed/santacruz-industriales/800/600',
  },
  {
    id: 2,
    slug: 'oficina',
    name: 'Oficina',
    description: 'Mobiliario y suministros para tu equipo.',
    image: 'https://picsum.photos/seed/santacruz-oficina/800/600',
  },
  {
    id: 3,
    slug: 'tecnologia',
    name: 'Tecnología',
    description: 'Equipos, accesorios y dispositivos.',
    image: 'https://picsum.photos/seed/santacruz-tecnologia/800/600',
  },
  {
    id: 4,
    slug: 'seguridad',
    name: 'Seguridad',
    description: 'Dotación y protección personal.',
    image: 'https://picsum.photos/seed/santacruz-seguridad/800/600',
  },
]
