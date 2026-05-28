import { useState } from 'react'
import { NavLink, Link, useLocation } from 'react-router-dom'
import { Menu, MessageCircle, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Logo } from './Logo'
import { cn } from '@/lib/utils'
import { useSiteSettings } from '@/hooks/usePublicData'

const NAV = [
  { to: '/', label: 'Inicio' },
  { to: '/catalogo', label: 'Catálogo' },
  { to: '/promociones', label: 'Promociones' },
  { to: '/galeria', label: 'Galería' },
  { to: '/vendedor', label: 'Hablar con vendedor' },
]

export function Header() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const { data: settings = {} } = useSiteSettings()

  const phone = settings.contact_phone || '+57 300 000 0000'
  const hours = settings.contact_hours || 'Lun – Vie · 8:00 a.m. – 6:00 p.m.'

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      {/* Top strip */}
      <div className="hidden border-b border-border/70 bg-ink text-white/90 md:block">
        <div className="container-page flex h-9 items-center justify-between text-xs">
          <div className="flex items-center gap-5">
            <span className="inline-flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-brand" />
              {phone}
            </span>
            <span className="text-white/50">{hours}</span>
          </div>
          <div className="flex items-center gap-4 text-white/70">
            <span>Envíos a todo el país</span>
            <span className="h-3 w-px bg-white/20" />
            <Link to="/vendedor" className="hover:text-brand transition-colors">
              Atención a clientes
            </Link>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <div className="container-page flex min-h-16 items-center justify-between gap-4 py-2">
        <Logo />

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'relative rounded-md px-3.5 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'text-brand-dark'
                    : 'text-ink-soft hover:text-ink hover:bg-muted',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {item.label}
                  {isActive && (
                    <span className="absolute inset-x-3 -bottom-[1px] h-[2px] rounded-full bg-brand" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            asChild
            className="hidden bg-brand text-white hover:bg-brand-hover sm:inline-flex"
          >
            <Link to="/vendedor">
              <MessageCircle className="mr-1.5 h-4 w-4" />
              Contactar vendedor
            </Link>
          </Button>

          {/* Mobile menu */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="lg:hidden"
                aria-label="Abrir menú"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] p-0">
              <SheetHeader className="border-b border-border px-5 py-4">
                <SheetTitle className="text-left">
                  <Logo />
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-1 p-4">
                {NAV.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        'rounded-lg px-3 py-2.5 text-sm font-medium',
                        isActive
                          ? 'bg-brand-soft text-brand-dark'
                          : 'text-ink hover:bg-muted',
                      )
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
                <Button
                  asChild
                  className="mt-3 bg-brand text-white hover:bg-brand-hover"
                  onClick={() => setOpen(false)}
                >
                  <Link to="/vendedor">
                    <MessageCircle className="mr-1.5 h-4 w-4" />
                    Contactar vendedor
                  </Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Route progress accent */}
      <div
        key={pathname}
        className="h-[2px] origin-left bg-gradient-to-r from-brand to-transparent animate-in slide-in-from-left"
      />
    </header>
  )
}
