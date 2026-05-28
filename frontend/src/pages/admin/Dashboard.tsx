import { Link } from 'react-router-dom';
import { ArrowUpRight, Boxes, Image as ImageIcon, MessagesSquare, Package, Tag, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PageTitle } from '@/components/admin/AdminLayout';
import { useDashboard } from '@/hooks/useAdminResources';

const cards = [
  { key: 'products', label: 'Productos', icon: Package, color: 'text-[#53AC30]' },
  { key: 'promotions_active', label: 'Promociones activas', icon: Tag, color: 'text-amber-600' },
  { key: 'categories', label: 'Categorías', icon: Boxes, color: 'text-sky-600' },
  { key: 'media', label: 'Items galería', icon: ImageIcon, color: 'text-violet-600' },
  { key: 'leads', label: 'Leads totales', icon: MessagesSquare, color: 'text-rose-600' },
  { key: 'leads_new', label: 'Leads nuevos', icon: TrendingUp, color: 'text-[#53AC30]' },
];

export default function AdminDashboard() {
  const { data, isLoading } = useDashboard();
  const counts = data?.counts ?? {};
  const recentLeads = (data?.recent_leads ?? []) as { id: number; name: string; email: string; created_at: string; status: string }[];

  return (
    <>
      <PageTitle title="Resumen general" description="Métricas clave de tu portal." />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {cards.map((c) => (
          <Card key={c.key}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-neutral-500">{c.label}</CardTitle>
                <c.icon className={`size-4 ${c.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{isLoading ? '—' : counts[c.key] ?? 0}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Leads recientes</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin/leads">
                Ver todos <ArrowUpRight className="size-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentLeads.length === 0 ? (
              <p className="text-sm text-neutral-500">Aún no hay leads. Comparte tu portal para empezar a recibir contactos.</p>
            ) : (
              recentLeads.map((l) => (
                <div key={l.id} className="flex items-center justify-between rounded-md border border-neutral-100 p-3">
                  <div>
                    <p className="font-medium">{l.name}</p>
                    <p className="text-xs text-neutral-500">{l.email}</p>
                  </div>
                  <Badge variant="secondary">{l.status}</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Acciones rápidas</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Button asChild className="bg-[#53AC30] hover:bg-[#468F28]">
              <Link to="/admin/productos">Nuevo producto</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/admin/promociones">Nueva promoción</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/admin/galeria">Subir a galería</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/admin/ajustes">Editar textos</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
