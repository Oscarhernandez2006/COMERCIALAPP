import { useState } from 'react';
import { Mail, Phone, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
import { PageTitle } from '@/components/admin/AdminLayout';
import { useLeads, type Lead } from '@/hooks/useAdminResources';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, apiErrorMessage } from '@/lib/admin-api';

const statusLabels: Record<Lead['status'], { label: string; color: string }> = {
  new: { label: 'Nuevo', color: 'bg-[#53AC30]' },
  contacted: { label: 'Contactado', color: 'bg-sky-500' },
  qualified: { label: 'Calificado', color: 'bg-amber-500' },
  closed: { label: 'Cerrado', color: 'bg-neutral-500' },
};

export default function AdminLeads() {
  const { data: leads = [], isLoading } = useLeads();
  const qc = useQueryClient();
  const [toDelete, setToDelete] = useState<Lead | null>(null);

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: Lead['status'] }) =>
      (await adminApi.patch(`/admin/leads/${id}`, { status })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'leads'] });
      toast.success('Estado actualizado');
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const destroy = useMutation({
    mutationFn: async (id: number) => (await adminApi.delete(`/admin/leads/${id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'leads'] });
      toast.success('Lead eliminado');
    },
  });

  return (
    <>
      <PageTitle title="Leads" description="Solicitudes de clientes que llegan desde el portal." />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Interés</TableHead>
                <TableHead>Mensaje</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-sm text-neutral-500">
                    Cargando…
                  </TableCell>
                </TableRow>
              ) : leads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-sm text-neutral-500">
                    Aún no hay leads.
                  </TableCell>
                </TableRow>
              ) : (
                leads.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>
                      <p className="font-medium">{l.name}</p>
                      {l.company ? <p className="text-xs text-neutral-500">{l.company}</p> : null}
                    </TableCell>
                    <TableCell className="text-sm">
                      <p className="flex items-center gap-1">
                        <Phone className="size-3" /> {l.phone}
                      </p>
                      <p className="flex items-center gap-1 text-neutral-500">
                        <Mail className="size-3" /> {l.email}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm">{l.interest ?? '—'}</TableCell>
                    <TableCell className="max-w-xs text-sm text-neutral-600">
                      <p className="line-clamp-2">{l.message ?? '—'}</p>
                    </TableCell>
                    <TableCell className="text-sm text-neutral-500">
                      {new Date(l.created_at).toLocaleString('es-CO')}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={l.status}
                        onValueChange={(v) => updateStatus.mutate({ id: l.id, status: v as Lead['status'] })}
                      >
                        <SelectTrigger className="h-8 w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusLabels).map(([k, v]) => (
                            <SelectItem key={k} value={k}>
                              <span className="flex items-center gap-2">
                                <span className={`size-2 rounded-full ${v.color}`} />
                                {v.label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => setToDelete(l)}>
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

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar lead?</AlertDialogTitle>
            <AlertDialogDescription>Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (toDelete) destroy.mutate(toDelete.id);
                setToDelete(null);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* hide status badge unused warning */}
      <Badge className="hidden" />
    </>
  );
}
