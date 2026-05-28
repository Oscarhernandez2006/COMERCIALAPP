import { useState } from 'react';
import { Image as ImageIcon, Pencil, Plus, Trash2, Video } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { PageTitle } from '@/components/admin/AdminLayout';
import { ImageUploader } from '@/components/admin/ImageUploader';
import { MediaPreview } from '@/components/admin/previews/MediaPreview';
import { useMediaItems, useResourceMutations, type MediaItem } from '@/hooks/useAdminResources';
import { apiErrorMessage } from '@/lib/admin-api';

type FormState = {
  type: 'image' | 'video';
  title: string;
  album: string;
  sort_order: number;
  active: boolean;
  file: File | null;
  thumb: File | null;
};

const empty: FormState = {
  type: 'image',
  title: '',
  album: 'Proyectos',
  sort_order: 0,
  active: true,
  file: null,
  thumb: null,
};

export default function AdminGallery() {
  const { data: items = [], isLoading } = useMediaItems();
  const { create, update, destroy } = useResourceMutations<MediaItem>('media');

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MediaItem | null>(null);
  const [form, setForm] = useState<FormState>(empty);
  const [toDelete, setToDelete] = useState<MediaItem | null>(null);

  const openNew = () => {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  };

  const openEdit = (m: MediaItem) => {
    setEditing(m);
    setForm({
      type: m.type,
      title: m.title ?? '',
      album: m.album,
      sort_order: m.sort_order,
      active: m.active,
      file: null,
      thumb: null,
    });
    setOpen(true);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('type', form.type);
    fd.append('title', form.title);
    fd.append('album', form.album);
    fd.append('sort_order', String(form.sort_order));
    fd.append('active', form.active ? '1' : '0');
    if (form.file) fd.append('file', form.file);
    if (form.thumb) fd.append('thumb', form.thumb);

    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, data: fd });
        toast.success('Item actualizado');
      } else {
        if (!form.file) {
          toast.error('Selecciona un archivo');
          return;
        }
        await create.mutateAsync(fd);
        toast.success('Item subido');
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
      toast.success('Eliminado');
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setToDelete(null);
    }
  };

  return (
    <>
      <PageTitle
        title="Galería"
        description="Sube fotos y videos para mostrar tus proyectos e instalaciones."
        action={
          <Button onClick={openNew} className="bg-[#53AC30] hover:bg-[#468F28]">
            <Plus className="size-4" /> Subir contenido
          </Button>
        }
      />

      {isLoading ? (
        <p className="text-sm text-neutral-500">Cargando…</p>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="grid place-items-center gap-3 py-16 text-center">
            <ImageIcon className="size-10 text-neutral-300" />
            <p className="text-neutral-500">Aún no hay contenido en la galería.</p>
            <Button onClick={openNew} className="bg-[#53AC30] hover:bg-[#468F28]">
              Subir el primero
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((m) => (
            <Card key={m.id} className="overflow-hidden">
              <div className="relative aspect-square bg-neutral-100">
                {m.src_url ? (
                  m.type === 'image' ? (
                    <img src={m.src_url} alt={m.title ?? ''} className="size-full object-cover" />
                  ) : (
                    <div className="grid size-full place-items-center">
                      {m.thumb_url ? (
                        <img src={m.thumb_url} alt="" className="size-full object-cover opacity-80" />
                      ) : null}
                      <Video className="absolute size-10 text-white drop-shadow" />
                    </div>
                  )
                ) : (
                  <div className="grid size-full place-items-center text-xs text-neutral-400">Sin archivo</div>
                )}
                {!m.active ? (
                  <Badge variant="secondary" className="absolute left-2 top-2">
                    Oculto
                  </Badge>
                ) : null}
              </div>
              <CardContent className="space-y-2 p-3">
                <p className="line-clamp-1 text-sm font-medium">{m.title ?? 'Sin título'}</p>
                <p className="text-xs text-neutral-500">{m.album}</p>
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(m)}>
                    <Pencil className="size-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setToDelete(m)}>
                    <Trash2 className="size-4 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl">
          <form onSubmit={onSubmit}>
            <DialogHeader>
              <DialogTitle>{editing ? 'Editar contenido' : 'Subir a galería'}</DialogTitle>
              <DialogDescription>Imágenes JPG/PNG/WebP o videos MP4.</DialogDescription>
            </DialogHeader>

            <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
              <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as 'image' | 'video' })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">Imagen</SelectItem>
                    <SelectItem value="video">Video</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="album">Álbum</Label>
                <Input id="album" value={form.album} onChange={(e) => setForm({ ...form, album: e.target.value })} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="title">Título</Label>
                <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>

              <div className="space-y-2 md:col-span-2">
                <Label>Archivo principal</Label>
                <Input
                  type="file"
                  accept={form.type === 'image' ? 'image/*' : 'video/*'}
                  onChange={(e) => setForm({ ...form, file: e.target.files?.[0] ?? null })}
                />
                {editing?.src_url ? (
                  <p className="text-xs text-neutral-500">Actual: {editing.src_path}</p>
                ) : null}
              </div>

              {form.type === 'video' ? (
                <div className="md:col-span-2">
                  <ImageUploader
                    label="Thumbnail (opcional)"
                    currentUrl={editing?.thumb_url ?? null}
                    onChange={(f) => setForm((s) => ({ ...s, thumb: f }))}
                  />
                </div>
              ) : null}

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
                  <p className="text-xs text-neutral-500">Mostrar en galería</p>
                </div>
                <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
              </div>
              </div>

              <div className="lg:sticky lg:top-0 lg:self-start">
                <MediaPreview
                  type={form.type}
                  title={form.title}
                  album={form.album}
                  file={form.file}
                  thumb={form.thumb}
                  currentSrcUrl={editing?.src_url ?? null}
                  currentThumbUrl={editing?.thumb_url ?? null}
                />
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-[#53AC30] hover:bg-[#468F28]" disabled={create.isPending || update.isPending}>
                {editing ? 'Guardar' : 'Subir'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar item?</AlertDialogTitle>
            <AlertDialogDescription>El archivo también se borrará del servidor.</AlertDialogDescription>
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
