import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageTitle } from '@/components/admin/AdminLayout';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { PromotionPreview } from '@/components/admin/previews/PromotionPreview';
import { usePromotions, useResourceMutations, type Promotion } from '@/hooks/useAdminResources';
import { apiErrorMessage } from '@/lib/admin-api';

type FormState = {
  title: string;
  subtitle: string;
  description: string;
  badge: string;
  discount: string;
  starts_at: string;
  ends_at: string;
  highlight: boolean;
  active: boolean;
  sort_order: number;
  image: File | null;
};

const empty: FormState = {
  title: '',
  subtitle: '',
  description: '',
  badge: '',
  discount: '',
  starts_at: '',
  ends_at: '',
  highlight: false,
  active: true,
  sort_order: 0,
  image: null,
};

export default function AdminPromotions() {
  const { data: promos = [], isLoading } = usePromotions();
  const { create, update, destroy } = useResourceMutations<Promotion>('promotions');

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [toDelete, setToDelete] = useState<Promotion | null>(null);

  const openNew = () => {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  };

  const openEdit = (p: Promotion) => {
    setEditing(p);
    setForm({
      title: p.title,
      subtitle: p.subtitle ?? '',
      description: p.description ?? '',
      badge: p.badge ?? '',
      discount: p.discount ?? '',
      starts_at: p.starts_at ?? '',
      ends_at: p.ends_at ?? '',
      highlight: p.highlight,
      active: p.active,
      sort_order: p.sort_order,
      image: null,
    });
    setOpen(true);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('title', form.title);
    fd.append('subtitle', form.subtitle);
    fd.append('description', form.description);
    if (form.badge) fd.append('badge', form.badge);
    if (form.discount) fd.append('discount', form.discount);
    if (form.starts_at) fd.append('starts_at', form.starts_at);
    if (form.ends_at) fd.append('ends_at', form.ends_at);
    fd.append('highlight', form.highlight ? '1' : '0');
    fd.append('active', form.active ? '1' : '0');
    fd.append('sort_order', String(form.sort_order));
    if (form.image) fd.append('image', form.image);

    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, data: fd });
        toast.success('Promoción actualizada');
      } else {
        await create.mutateAsync(fd);
        toast.success('Promoción creada');
      }
      setOpen(false);
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await destroy.mutateAsync(toDelete.id);
      toast.success('Promoción eliminada');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setToDelete(null);
    }
  };

  return (
    <>
      <PageTitle
        title="Promociones"
        description="Crea campañas y banners con vigencia."
        action={
          <Button onClick={openNew} className="bg-[#53AC30] hover:bg-[#468F28]">
            <Plus className="size-4" /> Nueva promoción
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Imagen</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Descuento</TableHead>
                <TableHead>Vigencia</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-24 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-neutral-500">
                    Cargando…
                  </TableCell>
                </TableRow>
              ) : promos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-neutral-500">
                    Aún no hay promociones.
                  </TableCell>
                </TableRow>
              ) : (
                promos.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.title} className="size-14 rounded object-cover" />
                      ) : (
                        <div className="grid size-14 place-items-center rounded bg-neutral-100 text-xs text-neutral-400">—</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{p.title}</p>
                      <p className="text-xs text-neutral-500">{p.subtitle}</p>
                    </TableCell>
                    <TableCell>{p.discount ?? '—'}</TableCell>
                    <TableCell className="text-sm text-neutral-500">
                      {p.starts_at ?? '—'} → {p.ends_at ?? '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.active ? 'default' : 'secondary'} className={p.active ? 'bg-[#53AC30]' : ''}>
                        {p.active ? 'Activa' : 'Pausada'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setToDelete(p)}>
                        <Trash2 className="size-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
          <form onSubmit={onSubmit}>
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar promoción' : 'Nueva promoción'}</DialogTitle>
              <DialogDescription>Así se verá el banner en el portal con su imagen, descuento y vigencia.</DialogDescription>
            </DialogHeader>

            <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
              <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="title">Título</Label>
                <Input id="title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="subtitle">Subtítulo</Label>
                <Input
                  id="subtitle"
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="desc">Descripción</Label>
                <Textarea
                  id="desc"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="badge">Badge</Label>
                <Input id="badge" value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discount">Descuento (ej. -25%)</Label>
                <Input id="discount" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="starts">Inicia</Label>
                <Input
                  id="starts"
                  type="date"
                  value={form.starts_at}
                  onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ends">Termina</Label>
                <Input
                  id="ends"
                  type="date"
                  value={form.ends_at}
                  onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
                />
              </div>

              <div className="md:col-span-2">
                <ImageUploader
                  currentUrl={editing?.image_url ?? null}
                  onChange={(file) => setForm((f) => ({ ...f, image: file }))}
                />
              </div>

              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <Label className="text-sm">Destacar</Label>
                  <p className="text-xs text-neutral-500">Más visible en el home</p>
                </div>
                <Switch checked={form.highlight} onCheckedChange={(v) => setForm({ ...form, highlight: v })} />
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <Label className="text-sm">Activa</Label>
                  <p className="text-xs text-neutral-500">Visible en portal</p>
                </div>
                <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
              </div>
              </div>

              <div className="lg:sticky lg:top-0 lg:self-start">
                <PromotionPreview
                  title={form.title}
                  subtitle={form.subtitle}
                  description={form.description}
                  badge={form.badge}
                  discount={form.discount}
                  startsAt={form.starts_at}
                  endsAt={form.ends_at}
                  highlight={form.highlight}
                  imageFile={form.image}
                  currentImageUrl={editing?.image_url ?? null}
                />
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-[#53AC30] hover:bg-[#468F28]" disabled={create.isPending || update.isPending}>
                {editing ? 'Guardar cambios' : 'Crear promoción'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar promoción?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
