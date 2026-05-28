import { useState } from 'react';
import { Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { ProductCardPreview } from '@/components/admin/previews/ProductCardPreview';
import { useCategories, useProducts, useResourceMutations, type Product } from '@/hooks/useAdminResources';
import { apiErrorMessage } from '@/lib/admin-api';

type FormState = {
  name: string;
  category_id: string;
  short_description: string;
  description: string;
  price: number;
  compare_price: string;
  badge: string;
  rating: string;
  featured: boolean;
  active: boolean;
  sort_order: number;
  image: File | null;
};

const empty: FormState = {
  name: '',
  category_id: '',
  short_description: '',
  description: '',
  price: 0,
  compare_price: '',
  badge: '',
  rating: '',
  featured: false,
  active: true,
  sort_order: 0,
  image: null,
};

const formatCOP = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);

export default function AdminProducts() {
  const { data: products = [], isLoading } = useProducts();
  const { data: categories = [] } = useCategories();
  const { create, update, destroy } = useResourceMutations<Product>('products');

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [toDelete, setToDelete] = useState<Product | null>(null);

  const openNew = () => {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name,
      category_id: p.category_id ? String(p.category_id) : '',
      short_description: p.short_description ?? '',
      description: p.description ?? '',
      price: p.price,
      compare_price: p.compare_price ? String(p.compare_price) : '',
      badge: p.badge ?? '',
      rating: p.rating ? String(p.rating) : '',
      featured: p.featured,
      active: p.active,
      sort_order: p.sort_order,
      image: null,
    });
    setOpen(true);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('name', form.name);
    if (form.category_id) fd.append('category_id', form.category_id);
    fd.append('short_description', form.short_description);
    fd.append('description', form.description);
    fd.append('price', String(form.price));
    if (form.compare_price) fd.append('compare_price', form.compare_price);
    if (form.badge) fd.append('badge', form.badge);
    if (form.rating) fd.append('rating', form.rating);
    fd.append('featured', form.featured ? '1' : '0');
    fd.append('active', form.active ? '1' : '0');
    fd.append('sort_order', String(form.sort_order));
    if (form.image) fd.append('image', form.image);

    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, data: fd });
        toast.success('Producto actualizado');
      } else {
        await create.mutateAsync(fd);
        toast.success('Producto creado');
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
      toast.success('Producto eliminado');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setToDelete(null);
    }
  };

  return (
    <>
      <PageTitle
        title="Productos"
        description="Administra el catálogo visible para tus clientes."
        action={
          <Button onClick={openNew} className="bg-[#53AC30] hover:bg-[#468F28]">
            <Plus className="size-4" /> Nuevo producto
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Imagen</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Precio</TableHead>
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
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-sm text-neutral-500">
                    Aún no hay productos. Crea el primero.
                  </TableCell>
                </TableRow>
              ) : (
                products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className="size-14 rounded object-cover" />
                      ) : (
                        <div className="grid size-14 place-items-center rounded bg-neutral-100 text-xs text-neutral-400">
                          —
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{p.name}</p>
                        {p.featured ? <Star className="size-3.5 fill-amber-400 text-amber-400" /> : null}
                      </div>
                      <p className="line-clamp-1 text-xs text-neutral-500">{p.short_description}</p>
                    </TableCell>
                    <TableCell className="text-sm">
                      {p.category?.name ?? categories.find((c) => c.id === p.category_id)?.name ?? '—'}
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{formatCOP(p.price)}</p>
                      {p.compare_price ? (
                        <p className="text-xs text-neutral-400 line-through">{formatCOP(p.compare_price)}</p>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.active ? 'default' : 'secondary'} className={p.active ? 'bg-[#53AC30]' : ''}>
                        {p.active ? 'Activo' : 'Oculto'}
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
              <DialogTitle>{editing ? 'Editar producto' : 'Nuevo producto'}</DialogTitle>
              <DialogDescription>
                Define los datos comerciales y la imagen principal. La vista previa muestra cómo se verá en el portal.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
              <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name">Nombre</Label>
                <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>

              <div className="space-y-2">
                <Label>Categoría</Label>
                <Select value={form.category_id} onValueChange={(v) => setForm({ ...form, category_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona…" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="badge">Etiqueta (NUEVO, TOP, OFERTA…)</Label>
                <Input id="badge" value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="short">Descripción corta</Label>
                <Input
                  id="short"
                  value={form.short_description}
                  onChange={(e) => setForm({ ...form, short_description: e.target.value })}
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="desc">Descripción larga</Label>
                <Textarea
                  id="desc"
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Precio (COP)</Label>
                <Input
                  id="price"
                  type="number"
                  min={0}
                  required
                  value={form.price}
                  onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="compare">Precio tachado (opcional)</Label>
                <Input
                  id="compare"
                  type="number"
                  min={0}
                  value={form.compare_price}
                  onChange={(e) => setForm({ ...form, compare_price: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rating">Rating (0-5)</Label>
                <Input
                  id="rating"
                  type="number"
                  min={0}
                  max={5}
                  step="0.1"
                  value={form.rating}
                  onChange={(e) => setForm({ ...form, rating: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sort">Orden</Label>
                <Input
                  id="sort"
                  type="number"
                  value={form.sort_order}
                  onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
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
                  <Label className="text-sm">Destacado</Label>
                  <p className="text-xs text-neutral-500">Aparecerá en la home</p>
                </div>
                <Switch checked={form.featured} onCheckedChange={(v) => setForm({ ...form, featured: v })} />
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <Label className="text-sm">Visible</Label>
                  <p className="text-xs text-neutral-500">Mostrar en el catálogo</p>
                </div>
                <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
              </div>
              </div>

              <div className="lg:sticky lg:top-0 lg:self-start">
                <ProductCardPreview
                  name={form.name}
                  shortDescription={form.short_description}
                  price={form.price}
                  comparePrice={form.compare_price}
                  badge={form.badge}
                  rating={form.rating}
                  categoryName={categories.find((c) => String(c.id) === form.category_id)?.name ?? null}
                  imageFile={form.image}
                  currentImageUrl={editing?.image_url ?? null}
                  featured={form.featured}
                />
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-[#53AC30] hover:bg-[#468F28]" disabled={create.isPending || update.isPending}>
                {editing ? 'Guardar cambios' : 'Crear producto'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
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
