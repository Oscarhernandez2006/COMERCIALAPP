#!/bin/sh
set -e

cd /var/www/backend

# Asegurar permisos de storage/cache (volumenes montados por Dokploy)
mkdir -p storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache || true

# Generar APP_KEY si no viene definida en el entorno
if [ -z "$APP_KEY" ]; then
    echo "[entrypoint] APP_KEY vacia -> generando una temporal"
    php artisan key:generate --force || true
fi

# Enlace publico de storage
php artisan storage:link 2>/dev/null || true

# Cachear configuracion/rutas/vistas con las env vars ya disponibles
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Migraciones automaticas (opcional). Activar con RUN_MIGRATIONS=true en Dokploy.
if [ "$RUN_MIGRATIONS" = "true" ]; then
    echo "[entrypoint] Ejecutando migraciones..."
    php artisan migrate --force || true
fi

echo "[entrypoint] Arrancando supervisord (php-fpm + reverb + nginx)"
exec supervisord -c /etc/supervisor/conf.d/supervisord.conf
