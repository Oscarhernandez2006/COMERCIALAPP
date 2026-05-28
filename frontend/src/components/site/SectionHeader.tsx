import { cn } from '@/lib/utils'

type Props = {
  eyebrow?: string
  title: string
  description?: string
  align?: 'left' | 'center'
  className?: string
  action?: React.ReactNode
}

export function SectionHeader({
  eyebrow,
  title,
  description,
  align = 'left',
  className,
  action,
}: Props) {
  return (
    <div
      className={cn(
        'mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between',
        align === 'center' && 'text-center md:flex-col md:items-center',
        className,
      )}
    >
      <div className={cn('max-w-2xl', align === 'center' && 'mx-auto')}>
        {eyebrow && (
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand-soft px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-brand-dark">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            {eyebrow}
          </div>
        )}
        <h2 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
          {title}
        </h2>
        {description && (
          <p className="mt-2 text-base text-muted-foreground">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

type PageHeroProps = {
  eyebrow?: string
  title: string
  description?: string
}

export function PageHero({ eyebrow, title, description }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-border bg-muted/40">
      <div className="absolute inset-0 bg-grid opacity-60" />
      <div className="container-page relative py-14 sm:py-20">
        {eyebrow && (
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand/30 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-brand-dark">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            {eyebrow}
          </div>
        )}
        <h1 className="max-w-3xl text-balance text-4xl font-extrabold tracking-tight text-ink sm:text-5xl">
          {title}
        </h1>
        {description && (
          <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            {description}
          </p>
        )}
      </div>
    </section>
  )
}
