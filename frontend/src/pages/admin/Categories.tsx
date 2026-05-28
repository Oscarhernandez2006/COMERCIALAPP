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
import { CategoryPreview } from '@/components/admin/previews/CategoryPreview';
import { useCategories, useResourceMutations, type Category } from '@/hooks/useAdminResources';
import { apiErrorMessage } from '@/lib/admin-api';

type FormState = {
  name: string;
  description: string;
  sort_order: number;
  active: boolean;
  image: File | null;
};

const emptyForm: FormState = { name: '', description: '', sort_order: 0, active: true, image: null };

export default function AdminCategories() {
  const { data: categories = [], isLoading } = useCategories();
  const { create, update, destroy } = useResourceMutations<Category>('categories');

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [toDelete, setToDelete] = useState<Category | null>(null);

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    setForm({
      name: c.name,
      description: c.description ?? '',
      sort_order: c.sort_order,
      active: c.active,
      image: null,
    });
    setOpen(true);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('name', form.name);
    fd.append('description', form.description);
    fd.append('sort_order', String(form.sort_order));
    fd.append('active', form.active ? '1' : '0');
    if (form.image) fd.append('image', form.image);

    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, data: fd });
        toast.success('Categoría actualizada');
      } else {
        await create.mutateAsync(fd);
        toast.success('Categoría creada');
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
      toast.success('Categoría eliminada');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setToDelete(null);
    }
  };

  return (
    <>
      <PageTitle
        title="Categorías"
        description="Organiza los productos en categorías visibles para el portal."
        action={
          <Button onClick={openNew} className="bg-[#53AC30] hover:bg-[#468F28]">
            <Plus className="size-4" /> Nueva categoría
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Imagen</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Orden</TableHead>
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
              ) : categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-neutral-500">
                    No hay categorías todavía.
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      {c.image_url ? (
                        <img src={c.image_url} alt={c.name} className="size-12 rounded object-cover" />
                      ) : (
                        <div className="grid size-12 place-items-center rounded bg-neutral-100 text-xs text-neutral-400">
                          —
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-sm text-neutral-500">{c.slug}</TableCell>
                    <TableCell>{c.sort_order}</TableCell>
                    <TableCell>
                      <Badge variant={c.active ? 'default' : 'secondary'} className={c.active ? 'bg-[#53AC30]' : ''}>
                        {c.active ? 'Activa' : 'Oculta'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(c)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setToDelete(c)}>
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
        <DialogContent className="max-w-4xl">
          <form onSubmit={onSubmit}>
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar categoría' : 'Nueva categoría'}</DialogTitle>
              <DialogDescription>
                Las categorías ayudan a los clientes a filtrar el catálogo.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                  id="description"
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <ImageUploader
                currentUrl={editing?.image_url ?? null}
                onChange={(file) => setForm((f) => ({ ...f, image: file }))}
              />
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sort">Orden</Label>
                  <Input
                    id="sort"
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
                  />
                </div>
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <Label className="text-sm">Visible</Label>
                    <p className="text-xs text-neutral-500">Mostrar en el portal</p>
                  </div>
                  <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
                </div>
              </div>
              </div>

              <div className="lg:sticky lg:top-0 lg:self-start">
                <CategoryPreview
                  name={form.name}
                  description={form.description}
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
                {editing ? 'Guardar cambios' : 'Crear categoría'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Los productos asociados quedarán sin categoría.
            </AlertDialogDescription>
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
