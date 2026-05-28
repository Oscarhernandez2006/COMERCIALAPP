import { useEffect, useState } from 'react';
import { useIsFetching } from '@tanstack/react-query';
import { useSiteSettings } from '@/hooks/usePublicData';
import { applyThemeToElement, loadFont, settingsToTheme } from '@/lib/theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { data: settings, isError } = useSiteSettings();
  const fetchingCount = useIsFetching();
  const [themeReady, setThemeReady] = useState(false);
  const [assetsReady, setAssetsReady] = useState(false);

  // 1) Aplica el tema en cuanto llegan las settings.
  useEffect(() => {
    if (!settings) return;
    const theme = settingsToTheme(settings);
    if (theme.theme_font_family) loadFont(theme.theme_font_family);
    applyThemeToElement(document.documentElement, theme);

    // Precargar el logo del sitio para que entre con el splash, no después.
    const logoUrl =
      settings.logo_url || (settings.logo_path ? `/storage/${settings.logo_path}` : null);
    if (logoUrl && !document.querySelector(`link[data-preload="${logoUrl}"]`)) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = logoUrl;
      link.fetchPriority = 'high';
      link.dataset.preload = logoUrl;
      document.head.appendChild(link);
    }

    const t = setTimeout(() => setThemeReady(true), 60);
    return () => clearTimeout(t);
  }, [settings]);

  // 2) Cuando: tema listo + todas las queries de react-query terminaron,
  //    esperamos a que las <img> que React ya renderizó terminen de decodificar.
  //    Cap de 6s para no dejar al usuario colgado nunca.
  useEffect(() => {
    if (!themeReady || fetchingCount > 0 || assetsReady) return;

    let cancelled = false;
    const start = performance.now();
    const MAX_WAIT = 6000;

    const waitForImages = async () => {
      // Espera 2 frames para que React monte el DOM tras el último fetch.
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      if (cancelled) return;

      const imgs = Array.from(document.images);
      const pending = imgs.filter((img) => !img.complete || img.naturalWidth === 0);

      if (pending.length === 0) {
        setAssetsReady(true);
        return;
      }

      const remaining = Math.max(0, MAX_WAIT - (performance.now() - start));
      const timeout = new Promise<void>((resolve) => setTimeout(resolve, remaining));
      const loaded = Promise.all(
        pending.map(
          (img) =>
            new Promise<void>((resolve) => {
              const done = () => resolve();
              img.addEventListener('load', done, { once: true });
              img.addEventListener('error', done, { once: true });
            }),
        ),
      ).then(() => undefined);

      await Promise.race([loaded, timeout]);
      if (!cancelled) setAssetsReady(true);
    };

    waitForImages();
    return () => {
      cancelled = true;
    };
  }, [themeReady, fetchingCount, assetsReady]);

  // Si la API falla, no bloqueamos al usuario.
  const showSplash = (!themeReady || !assetsReady) && !isError;

  const splashLogo =
    settings?.logo_url ||
    (settings?.logo_path ? `/storage/${settings.logo_path}` : null) ||
    '/AGROPECUARIA.png';

  return (
    <>
      {showSplash && <SiteSplash logoUrl={splashLogo} />}
      <div style={{ visibility: showSplash ? 'hidden' : 'visible' }}>{children}</div>
    </>
  );
}

function SiteSplash({ logoUrl }: { logoUrl: string }) {
  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-5 bg-white"
      role="status"
      aria-live="polite"
    >
      <img
        src={logoUrl}
        alt="Cargando"
        className="h-28 w-auto max-w-[60vw] animate-pulse object-contain drop-shadow-sm sm:h-36"
      />
      <p className="text-sm font-medium text-neutral-500">Cargando portal…</p>
    </div>
  );
}

