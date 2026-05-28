import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { useSiteSettings } from '@/hooks/usePublicData'

type Props = {
  className?: string
  variant?: 'default' | 'mono' | 'light'
  showText?: boolean
}

export function Logo({ className, variant = 'default', showText = true }: Props) {
  const { data: settings = {} } = useSiteSettings()
  const text =
    variant === 'light'
      ? 'text-white'
      : variant === 'mono'
        ? 'text-ink'
        : 'text-ink'

  const siteName = settings.site_name || 'Grupo Santacruz'
  const tagline = settings.site_tagline || 'Portal de clientes'
  const logoUrl = settings.logo_url || (settings.logo_path ? `/storage/${settings.logo_path}` : null)

  // Split site name into two halves so we mantain the highlighted-second-word style
  const [firstWord, ...rest] = siteName.split(' ')
  const restWord = rest.join(' ')

  return (
    <Link to="/" className={cn('inline-flex items-center gap-2.5 group', className)}>
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={siteName}
          className="object-contain transition-transform group-hover:scale-105"
          style={{ height: 'var(--logo-size, 36px)', width: 'auto', maxWidth: 'calc(var(--logo-size, 36px) * 5)' }}
        />
      ) : (
        <span
          className="relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-brand text-white shadow-sm shadow-brand/20 transition-transform group-hover:scale-105"
          style={{ width: 'var(--logo-size, 36px)', height: 'var(--logo-size, 36px)' }}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ width: 'calc(var(--logo-size, 36px) * 0.55)', height: 'calc(var(--logo-size, 36px) * 0.55)' }}
            aria-hidden
          >
            <path
              d="M5 13.5L10 18.5L19 7"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-brand-dark ring-2 ring-white" />
        </span>
      )}
      {showText && (
        <span className={cn('flex flex-col leading-none', text)}>
          <span
            className="font-extrabold tracking-tight"
            style={{ fontSize: 'var(--logo-text-size, 15px)' }}
          >
            {restWord ? (
              <>
                {firstWord} <span className="text-brand">{restWord}</span>
              </>
            ) : (
              firstWord
            )}
          </span>
          <span
            className="font-medium uppercase tracking-[0.18em] text-muted-foreground"
            style={{ fontSize: 'var(--logo-tagline-size, 10px)' }}
          >
            {tagline}
          </span>
        </span>
      )}
    </Link>
  )
}
