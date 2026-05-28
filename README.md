# INSITU

Proyecto fullstack con **Laravel** (API) y **React + Vite + TypeScript** (frontend),
usando **shadcn/ui** + **Tailwind CSS v4** como librería de diseño.

## Estructura

```
INSITU/
├── backend/    # Laravel 13 (PHP 8.5) - API REST con Sanctum
└── frontend/   # React 18 + Vite + TS + shadcn/ui + Tailwind v4
```

## Requisitos

- PHP 8.2+ y Composer
- Node 18+ y npm
- SQLite (incluido por defecto en Laravel)

## Backend (Laravel)

```powershell
cd backend
php artisan serve
```

Disponible en `http://127.0.0.1:8000`.

Endpoints incluidos:
- `GET /api/ping` → prueba pública.
- `GET /api/user` → requiere token Sanctum.

Notas:
- CORS configurado para `http://localhost:5173` (`config/cors.php`).
- `App\Models\User` ya usa el trait `HasApiTokens` para Sanctum.
- Base de datos por defecto: SQLite en `backend/database/database.sqlite`.

## Frontend (React + shadcn/ui)

```powershell
cd frontend
npm run dev
```

Disponible en `http://localhost:5173`.

Características:
- **Tailwind v4** vía `@tailwindcss/vite` (sin `tailwind.config.js`).
- **shadcn/ui** estilo *new-york* con variables CSS (light/dark).
- Alias `@/*` apuntando a `src/*`.
- Cliente `axios` en `src/lib/api.ts` con `withCredentials: true`.
- Proxy de Vite: `/api/*` → `http://127.0.0.1:8000` (no necesitas CORS en dev).

Añadir más componentes shadcn:

```powershell
cd frontend
npx shadcn@latest add dialog dropdown-menu form table ...
```

Catálogo: https://ui.shadcn.com/docs/components

## Desarrollo (dos terminales)

Terminal 1 (backend):
```powershell
cd backend; php artisan serve
```

Terminal 2 (frontend):
```powershell
cd frontend; npm run dev
```

Abre `http://localhost:5173`. La tarjeta de inicio llama a `/api/ping` y muestra
la respuesta del backend.

## Stack

| Capa | Tecnología |
|------|------------|
| Backend | Laravel 13, PHP 8.5, Sanctum 4 |
| DB | SQLite (cambia a MySQL/Postgres en `.env`) |
| Frontend | React 19, Vite 8, TypeScript |
| UI | shadcn/ui (Radix UI + Tailwind v4) |
| Iconos | lucide-react |
| HTTP | axios |
| Toasts | sonner |
