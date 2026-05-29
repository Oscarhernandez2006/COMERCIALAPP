# =========================================================
#  INSITU / COMERCIALAPP - Imagen unica (Laravel + Reverb + React)
#  Build context = raiz del repo
# =========================================================

# ---------- Stage 1: build del frontend (React + Vite) ----------
FROM node:22-alpine AS frontend

WORKDIR /app/frontend

# Variables que Vite hornea en tiempo de build.
# Configuralas en Dokploy -> Build Args si necesitas otros valores.
ARG VITE_API_URL=/api
ARG VITE_REVERB_APP_KEY=insitu-prod-key
ARG VITE_REVERB_HOST=localhost
ARG VITE_REVERB_PORT=443
ARG VITE_REVERB_SCHEME=https

ENV VITE_API_URL=$VITE_API_URL \
    VITE_REVERB_APP_KEY=$VITE_REVERB_APP_KEY \
    VITE_REVERB_HOST=$VITE_REVERB_HOST \
    VITE_REVERB_PORT=$VITE_REVERB_PORT \
    VITE_REVERB_SCHEME=$VITE_REVERB_SCHEME

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build


# ---------- Stage 2: dependencias PHP (Composer) ----------
FROM composer:2 AS vendor

WORKDIR /app/backend

COPY backend/composer.json backend/composer.lock ./
RUN composer install \
    --no-dev \
    --no-scripts \
    --no-autoloader \
    --prefer-dist \
    --ignore-platform-reqs

COPY backend/ ./
RUN composer dump-autoload --optimize --no-dev


# ---------- Stage 3: runtime (PHP-FPM + Nginx + Reverb) ----------
FROM php:8.3-fpm-alpine AS runtime

# Paquetes del sistema + extensiones PHP
RUN apk add --no-cache \
        nginx \
        supervisor \
        postgresql-dev \
        libzip-dev \
        oniguruma-dev \
        bash \
    && docker-php-ext-install \
        pdo_pgsql \
        pgsql \
        pcntl \
        bcmath \
        sockets \
        opcache \
    && rm -rf /var/cache/apk/*

WORKDIR /var/www/backend

# Backend con vendor ya instalado
COPY --from=vendor /app/backend ./

# Frontend compilado
COPY --from=frontend /app/frontend/dist /var/www/frontend

# Configuracion
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/php.ini /usr/local/etc/php/conf.d/zz-app.ini
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh

RUN sed -i 's/\r$//' /usr/local/bin/entrypoint.sh \
    && chmod +x /usr/local/bin/entrypoint.sh \
    && mkdir -p /var/www/backend/storage/framework/{cache,sessions,views} \
                /var/www/backend/storage/logs \
                /var/www/backend/bootstrap/cache \
                /run/nginx \
    && chown -R www-data:www-data /var/www/backend/storage /var/www/backend/bootstrap/cache

EXPOSE 80

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
