import { useEffect, useMemo, useState } from 'react';
import { Eye, ImageIcon, Palette, RotateCcw, Save, Type } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageTitle } from '@/components/admin/AdminLayout';
import { ThemePreview } from '@/components/admin/ThemePreview';
import { useSettings, type SiteSetting } from '@/hooks/useAdminResources';
import { adminApi, apiErrorMessage } from '@/lib/admin-api';
import {
  DEFAULT_THEME,
  FONT_OPTIONS,
  FONT_SIZE_OPTIONS,
  HEADING_SCALE_OPTIONS,
  HEADING_WEIGHT_OPTIONS,
  RADIUS_OPTIONS,
  type ThemeTokens,
} from '@/lib/theme';

type ColorField = { key: keyof ThemeTokens; label: string; help?: string };

const COLOR_GROUPS: { title: string; fields: ColorField[] }[] = [
  {
    title: 'Color de marca',
    fields: [
      { key: 'theme_brand', label: 'Primario', help: 'Botones, enlaces y acentos principales.' },
      { key: 'theme_brand_hover', label: 'Primario (hover)', help: 'Estado interactivo del primario.' },
      { key: 'theme_brand_soft', label: 'Marca suave', help: 'Fondo de chips/badges y degradados suaves.' },
      { key: 'theme_brand_dark', label: 'Marca oscura', help: 'Texto sobre fondos suaves de marca.' },
    ],
  },
  {
    title: 'Textos',
    fields: [
      { key: 'theme_ink', label: 'Texto principal' },
      { key: 'theme_ink_soft', label: 'Texto secundario' },
    ],
  },
  {
    title: 'Fondos y bordes',
    fields: [
      { key: 'theme_bg', label: 'Fondo principal' },
      { key: 'theme_muted', label: 'Fondo de secciones' },
      { key: 'theme_border', label: 'Bordes' },
      { key: 'theme_destructive', label: 'Color destructivo / ofertas' },
    ],
  },
];

const ALL_KEYS: (keyof ThemeTokens)[] = Object.keys(DEFAULT_THEME) as (keyof ThemeTokens)[];

function isHex(value: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

export default function AdminAppearance() {
  const qc = useQueryClient();
  const { data: settings = [], isLoading } = useSettings();
  const [values, setValues] = useState<ThemeTokens>(DEFAULT_THEME);

  useEffect(() => {
    const map: Partial<ThemeTokens> = {};
    (settings as SiteSetting[]).forEach((s) => {
      if (ALL_KEYS.includes(s.key as keyof ThemeTokens)) {
        const v = typeof s.value === 'string' ? s.value : String(s.value ?? '');
        if (v) (map as Record<string, string>)[s.key] = v;
      }
    });
    setValues({ ...DEFAULT_THEME, ...map });
  }, [settings]);

  const previewTheme = useMemo(() => values, [values]);

  const dirty = ALL_KEYS.some((k) => {
    const original =
      (settings as SiteSetting[]).find((s) => s.key === k)?.value ?? DEFAULT_THEME[k];
    return String(original ?? '') !== values[k];
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        settings: ALL_KEYS.map((k) => ({ key: k, value: values[k], group: 'theme' })),
      };
      return (await adminApi.put('/admin/settings', payload)).data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'settings'] });
      qc.invalidateQueries({ queryKey: ['public', 'settings'] });
      toast.success('Apariencia guardada — aplicada en todo el portal');
    },
    onError: (err) => toast.error(apiErrorMessage(err)),
  });

  const reset = () => {
    setValues(DEFAULT_THEME);
    toast.message('Valores restablecidos. Recuerda guardar para aplicar.');
  };

  return (
    <>
      <PageTitle
        title="Apariencia"
        description="Personaliza colores, tipografía y tamaños de texto del portal público. Los cambios se previsualizan al instante."
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={reset} disabled={save.isPending}>
              <RotateCcw className="size-4" /> Restablecer
            </Button>
            <Button
              onClick={() => save.mutate()}
              disabled={save.isPending || !dirty}
              className="bg-[#53AC30] hover:bg-[#468F28]"
            >
              <Save className="size-4" /> Guardar y aplicar
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <p className="text-sm text-neutral-500">Cargando…</p>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,520px)]">
          {/* Panel de edición */}
          <div className="space-y-6">
            {COLOR_GROUPS.map((g) => (
              <Card key={g.title}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Palette className="size-4 text-[#53AC30]" /> {g.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  {g.fields.map((f) => (
                    <ColorRow
                      key={f.key}
                      label={f.label}
                      help={f.help}
                      value={values[f.key]}
                      onChange={(v) => setValues((s) => ({ ...s, [f.key]: v }))}
                    />
                  ))}
                </CardContent>
              </Card>
            ))}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Type className="size-4 text-[#53AC30]" /> Tipografía y tamaños
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Familia tipográfica</Label>
                  <Select
                    value={values.theme_font_family}
                    onValueChange={(v) => setValues((s) => ({ ...s, theme_font_family: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          <span style={{ fontFamily: o.value === 'system' ? 'system-ui' : `'${o.value}', sans-serif` }}>
                            {o.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-neutral-500">
                    Las fuentes externas se cargan desde Google Fonts automáticamente.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Tamaño base del texto</Label>
                  <Select
                    value={values.theme_font_size_base}
                    onValueChange={(v) => setValues((s) => ({ ...s, theme_font_size_base: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FONT_SIZE_OPTIONS.map((o) => (
                        <SelectItem key={o} value={o}>
                          {o}px {o === '16' && '(recomendado)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Escala de títulos</Label>
                  <Select
                    value={values.theme_heading_scale}
                    onValueChange={(v) => setValues((s) => ({ ...s, theme_heading_scale: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HEADING_SCALE_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-neutral-500">
                    Controla qué tan grandes son los títulos respecto al texto base.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Grosor de los títulos</Label>
                  <Select
                    value={values.theme_heading_weight}
                    onValueChange={(v) => setValues((s) => ({ ...s, theme_heading_weight: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HEADING_WEIGHT_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          <span style={{ fontWeight: Number(o.value) }}>{o.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-neutral-500">
                    Define qué tan "pesados" se ven los títulos del portal.
                  </p>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label>Radio de bordes</Label>
                  <Select
                    value={values.theme_radius}
                    onValueChange={(v) => setValues((s) => ({ ...s, theme_radius: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RADIUS_OPTIONS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ImageIcon className="size-4 text-[#53AC30]" /> Logo y componentes
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <Label>Tamaño del logo</Label>
                    <span className="text-xs font-semibold text-[#53AC30]">
                      {values.theme_logo_size}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min={24}
                    max={240}
                    step={2}
                    value={Number(values.theme_logo_size) || 36}
                    onChange={(e) => setValues((s) => ({ ...s, theme_logo_size: e.target.value }))}
                    className="w-full accent-[#53AC30]"
                  />
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={16}
                      max={400}
                      value={values.theme_logo_size}
                      onChange={(e) => setValues((s) => ({ ...s, theme_logo_size: e.target.value }))}
                      className="w-28"
                    />
                    <span className="text-xs text-neutral-500">
                      Tamaño en píxeles del logo en el header (alto). Si subiste un logo, se escala automáticamente.
                    </span>
                  </div>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <Label>Tamaño del nombre del sitio</Label>
                    <span className="text-xs font-semibold text-[#53AC30]">
                      {values.theme_logo_text_size}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={40}
                    step={1}
                    value={Number(values.theme_logo_text_size) || 15}
                    onChange={(e) => setValues((s) => ({ ...s, theme_logo_text_size: e.target.value }))}
                    className="w-full accent-[#53AC30]"
                  />
                  <p className="text-xs text-neutral-500">
                    Tipografía del nombre de tu marca junto al logo. Si subiste un logo gráfico, este texto no se ve.
                  </p>
                </div>

                <div className="sm:col-span-2 flex items-center gap-4 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-4">
                  <span
                    className="grid place-items-center rounded-xl bg-[var(--brand)] text-white"
                    style={{ width: `${values.theme_logo_size}px`, height: `${values.theme_logo_size}px` }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" style={{ width: `${Number(values.theme_logo_size) * 0.55}px`, height: `${Number(values.theme_logo_size) * 0.55}px` }}>
                      <path d="M5 13.5L10 18.5L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <div className="flex flex-col leading-none">
                    <span className="font-extrabold tracking-tight text-[var(--ink)]" style={{ fontSize: `${values.theme_logo_text_size}px` }}>
                      Tu <span style={{ color: 'var(--brand)' }}>Marca</span>
                    </span>
                    <span className="font-medium uppercase tracking-[0.18em] text-[var(--ink-soft)]" style={{ fontSize: `${Math.max(9, Math.round(Number(values.theme_logo_text_size) * 0.65))}px` }}>
                      Portal de clientes
                    </span>
                  </div>
                  <span className="ml-auto text-xs text-neutral-500">Vista previa instantánea</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview */}
          <div className="space-y-3 xl:sticky xl:top-6 xl:self-start">
            <div className="flex items-center gap-2 text-sm font-semibold text-neutral-700">
              <Eye className="size-4 text-[#53AC30]" /> Vista previa en vivo
            </div>
            <ThemePreview theme={previewTheme} />
            <p className="text-xs text-neutral-500">
              Esta vista refleja exactamente cómo se verán los componentes del portal: header,
              hero, botones, escala tipográfica, productos y badges.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

function ColorRow({
  label,
  help,
  value,
  onChange,
}: {
  label: string;
  help?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const safe = isHex(value) ? value : '#000000';
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold uppercase tracking-wider text-neutral-600">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={safe}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="h-10 w-12 cursor-pointer rounded-md border border-neutral-200 bg-white p-1"
          aria-label={label}
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="font-mono uppercase"
          maxLength={9}
        />
      </div>
      {help && <p className="text-[11px] text-neutral-500">{help}</p>}
    </div>
  );
}
