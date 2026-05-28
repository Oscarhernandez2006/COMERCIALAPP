import { useEffect, useState } from 'react';
import { Loader2, Save, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PageTitle } from '@/components/admin/AdminLayout';
import { ContactPreview, HeroPreview } from '@/components/admin/previews/SitePreviews';
import { useSettings, type SiteSetting } from '@/hooks/useAdminResources';
import { adminApi, apiErrorMessage } from '@/lib/admin-api';

type Field = { key: string; label: string; group: string; multiline?: boolean; type?: string };

const FIELDS: Field[] = [
  { key: 'site_name', label: 'Nombre del sitio', group: 'general' },
  { key: 'site_tagline', label: 'Tagline', group: 'general' },
  { key: 'site_description', label: 'Descripción corta', group: 'general', multiline: true },

  { key: 'hero_eyebrow', label: 'Eyebrow del hero', group: 'hero' },
  { key: 'hero_title', label: 'Título principal', group: 'hero' },
  { key: 'hero_description', label: 'Descripción del hero', group: 'hero', multiline: true },
  { key: 'hero_cta_primary', label: 'CTA primario (texto)', group: 'hero' },
  { key: 'hero_cta_secondary', label: 'CTA secundario (texto)', group: 'hero' },

  { key: 'contact_phone', label: 'Teléfono', group: 'contact' },
  { key: 'contact_email', label: 'Correo', group: 'contact' },
  { key: 'contact_address', label: 'Dirección', group: 'contact' },
  { key: 'contact_hours', label: 'Horario', group: 'contact' },

  { key: 'social_facebook', label: 'Facebook URL', group: 'social' },
  { key: 'social_instagram', label: 'Instagram URL', group: 'social' },
  { key: 'social_linkedin', label: 'LinkedIn URL', group: 'social' },
];

const GROUP_LABELS: Record<string, string> = {
  general: 'Información general',
  hero: 'Hero / Portada',
  contact: 'Datos de contacto',
  social: 'Redes sociales',
};

export default function AdminSettings() {
  const { data: settings = [], isLoading } = useSettings();
  const qc = useQueryClient();
  const [values, setValues] = useState<Record<string, string>>({});
  const [logo, setLogo] = useState<File | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (hydrated || (settings as SiteSetting[]).length === 0) return;
    const map: Record<string, string> = {};
    (settings as SiteSetting[]).forEach((s) => {
      map[s.key] = typeof s.value === 'string' ? s.value : String(s.value ?? '');
    });
    setValues(map);
    setHydrated(true);
  }, [settings, hydrated]);

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        settings: FIELDS.map((f) => ({ key: f.key, value: values[f.key] ?? '', group: f.group })),
      };
      return (await adminApi.put('/admin/settings', payload)).data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'settings'] });
      toast.success('Ajustes guardados');
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const uploadLogo = useMutation({
    mutationFn: async () => {
      if (!logo) return;
      const fd = new FormData();
      fd.append('logo', logo);
      return (await adminApi.post('/admin/settings/logo', fd, { headers: { 'Content-Type': 'multipart/form-data' } })).data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'settings'] });
      toast.success('Logo actualizado');
      setLogo(null);
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const logoSetting = (settings as SiteSetting[]).find((s) => s.key === 'logo_path');
  const logoUrl = logoSetting?.value ? `/storage/${logoSetting.value}` : null;

  const groups = Array.from(new Set(FIELDS.map((f) => f.group)));

  return (
    <>
      <PageTitle
        title="Ajustes del sitio"
        description="Edita textos visibles en el portal y datos de contacto."
        action={
          <Button onClick={() => save.mutate()} disabled={save.isPending} className="bg-[#53AC30] hover:bg-[#468F28]">
            {save.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {save.isPending ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        }
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Logo</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="grid h-24 w-40 place-items-center rounded-md border bg-neutral-50">
            {logoUrl ? (
              <img src={logoUrl} alt="logo" className="max-h-20 object-contain" />
            ) : (
              <span className="text-xs text-neutral-400">Sin logo</span>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <Input type="file" accept="image/*" onChange={(e) => setLogo(e.target.files?.[0] ?? null)} />
            <p className="text-xs text-neutral-500">PNG con fondo transparente recomendado. Máximo 5 MB.</p>
          </div>
          <Button
            onClick={() => uploadLogo.mutate()}
            disabled={!logo || uploadLogo.isPending}
            className="bg-[#53AC30] hover:bg-[#468F28]"
          >
            <Upload className="size-4" /> Subir logo
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <p className="text-sm text-neutral-500">Cargando…</p>
      ) : (
        <div className="space-y-6">
          {groups.map((g) => (
            <Card key={g}>
              <CardHeader>
                <CardTitle>{GROUP_LABELS[g] ?? g}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                <div className="grid gap-4 md:grid-cols-2">
                  {FIELDS.filter((f) => f.group === g).map((f) => (
                    <div key={f.key} className={f.multiline ? 'space-y-2 md:col-span-2' : 'space-y-2'}>
                      <Label htmlFor={f.key}>{f.label}</Label>
                      {f.multiline ? (
                        <Textarea
                          id={f.key}
                          rows={3}
                          value={values[f.key] ?? ''}
                          onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                        />
                      ) : (
                        <Input
                          id={f.key}
                          type={f.type ?? 'text'}
                          value={values[f.key] ?? ''}
                          onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                        />
                      )}
                    </div>
                  ))}
                </div>
                <div className="lg:sticky lg:top-6 lg:self-start">
                  {g === 'general' && (
                    <HeroPreview
                      siteName={values.site_name}
                      tagline={values.site_tagline}
                      description={values.site_description}
                      title={values.site_name}
                    />
                  )}
                  {g === 'hero' && (
                    <HeroPreview
                      eyebrow={values.hero_eyebrow}
                      title={values.hero_title}
                      description={values.hero_description}
                      ctaPrimary={values.hero_cta_primary}
                      ctaSecondary={values.hero_cta_secondary}
                    />
                  )}
                  {g === 'contact' && (
                    <ContactPreview
                      phone={values.contact_phone}
                      email={values.contact_email}
                      address={values.contact_address}
                      hours={values.contact_hours}
                    />
                  )}
                  {g === 'social' && (
                    <ContactPreview
                      facebook={values.social_facebook}
                      instagram={values.social_instagram}
                      linkedin={values.social_linkedin}
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {(save.isPending || uploadLogo.isPending) && (
        <div className="fixed inset-0 z-[9999] grid place-items-center bg-black/40 backdrop-blur-sm">
          <div className="flex items-center gap-3 rounded-xl bg-white px-6 py-4 shadow-2xl">
            <Loader2 className="size-5 animate-spin text-[#53AC30]" />
            <span className="text-sm font-medium text-neutral-700">
              {save.isPending ? 'Guardando ajustes…' : 'Subiendo logo…'}
            </span>
          </div>
        </div>
      )}
    </>
  );
}
