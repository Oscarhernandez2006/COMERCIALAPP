import { Link } from 'react-router-dom'
import { Mail, MapPin, Phone } from 'lucide-react'
import { Logo } from './Logo'
import { useSiteSettings } from '@/hooks/usePublicData'

const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.77l-.44 2.91h-2.33V22c4.78-.79 8.44-4.94 8.44-9.94z" />
  </svg>
)

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
  </svg>
)

const LinkedinIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M19 3A2 2 0 0121 5v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14zM8.34 18V10H6v8h2.34zM7.17 8.92a1.36 1.36 0 100-2.72 1.36 1.36 0 000 2.72zM18 18v-4.39c0-2.27-1.21-3.32-2.83-3.32-1.31 0-1.89.72-2.22 1.23V10H10.6c.03.66 0 8 0 8h2.35v-4.47c0-.21.01-.42.07-.57.17-.43.56-.87 1.21-.87.86 0 1.2.65 1.2 1.6V18H18z" />
  </svg>
)

export function Footer() {
  const { data: settings = {} } = useSiteSettings()

  const siteName = settings.site_name || 'Grupo Santacruz'
  const siteDescription =
    settings.site_description ||
    'Soluciones y productos de calidad para impulsar tu negocio. Distribuidor de confianza con cobertura nacional.'
  const address = settings.contact_address || 'Cra. 00 # 00-00, Ciudad, Colombia'
  const phone = settings.contact_phone || '+57 300 000 0000'
  const email = settings.contact_email || 'ventas@gruposantacruz.com'
  const facebook = settings.social_facebook || ''
  const instagram = settings.social_instagram || ''
  const linkedin = settings.social_linkedin || ''

  const socials: { url: string; Icon: typeof FacebookIcon; label: string }[] = [
    { url: facebook, Icon: FacebookIcon, label: 'Facebook' },
    { url: instagram, Icon: InstagramIcon, label: 'Instagram' },
    { url: linkedin, Icon: LinkedinIcon, label: 'LinkedIn' },
  ].filter((s) => s.url) as typeof socials

  return (
    <footer className="border-t border-border bg-ink text-white/80">
      <div className="container-page grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <Logo variant="light" />
          <p className="text-sm leading-relaxed text-white/60">{siteDescription}</p>
          {socials.length > 0 && (
            <div className="flex gap-2">
              {socials.map(({ url, Icon, label }) => (
                <a
                  key={label}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 text-white/70 transition hover:border-brand hover:text-brand"
                  aria-label={label}
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          )}
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
            Explorar
          </h4>
          <ul className="space-y-2.5 text-sm">
            {[
              ['Catálogo', '/catalogo'],
              ['Promociones', '/promociones'],
              ['Galería', '/galeria'],
              ['Hablar con vendedor', '/vendedor'],
            ].map(([label, to]) => (
              <li key={to}>
                <Link
                  to={to}
                  className="text-white/70 transition hover:text-brand"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
            Contacto
          </h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2.5 text-white/70">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              {address}
            </li>
            <li className="flex items-start gap-2.5 text-white/70">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              {phone}
            </li>
            <li className="flex items-start gap-2.5 text-white/70">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
              {email}
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
            Boletín
          </h4>
          <p className="mb-3 text-sm text-white/60">
            Recibe novedades y promociones directo en tu correo.
          </p>
          <form className="flex overflow-hidden rounded-md border border-white/10 bg-white/5 focus-within:border-brand">
            <input
              type="email"
              placeholder="tucorreo@empresa.com"
              className="flex-1 bg-transparent px-3 py-2.5 text-sm text-white placeholder:text-white/40 outline-none"
            />
            <button
              type="submit"
              className="bg-brand px-4 text-sm font-semibold text-white transition hover:bg-brand-hover"
            >
              Suscribir
            </button>
          </form>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs text-white/50 sm:flex-row">
          <span>
            © {new Date().getFullYear()} {siteName}. Todos los derechos reservados.
          </span>
          <div className="flex gap-5">
            <a href="#" className="hover:text-brand">Términos</a>
            <a href="#" className="hover:text-brand">Privacidad</a>
            <a href="#" className="hover:text-brand">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
