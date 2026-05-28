import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <section className="container-page flex flex-col items-center justify-center py-24 text-center">
      <div className="text-8xl font-extrabold text-brand">404</div>
      <h1 className="mt-4 text-2xl font-bold text-ink">
        Página no encontrada
      </h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        La ruta que buscas no existe o fue movida. Volvamos al portal.
      </p>
      <div className="mt-6 flex gap-3">
        <Button asChild className="bg-brand text-white hover:bg-brand-hover">
          <Link to="/">Ir al inicio</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/catalogo">Ver catálogo</Link>
        </Button>
      </div>
    </section>
  )
}
