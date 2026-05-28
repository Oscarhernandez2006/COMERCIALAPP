import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Boxes,
  FlaskConical,
  Headset,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  MessagesSquare,
  Package,
  Palette,
  Settings,
  Tag,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';

type NavItem = { to: string; label: string; icon: typeof LayoutDashboard; end?: boolean };
type NavSection = { title?: string; items: NavItem[] };

const sections: NavSection[] = [
  {
    items: [
      { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/admin/productos', label: 'Productos', icon: Package },
      { to: '/admin/promociones', label: 'Promociones', icon: Tag },
      { to: '/admin/categorias', label: 'Categorías', icon: Boxes },
      { to: '/admin/galeria', label: 'Galería', icon: ImageIcon },
      { to: '/admin/leads', label: 'Leads', icon: MessagesSquare },
      { to: '/admin/apariencia', label: 'Apariencia', icon: Palette },
      { to: '/admin/ajustes', label: 'Ajustes del sitio', icon: Settings },
    ],
  },
  {
    title: 'Pruebas',
    items: [
      { to: '/admin/chats', label: 'Servicio al cliente', icon: Headset },
    ],
  },
];

export function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  };

  const initials = (user?.name ?? 'AD')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-neutral-200 bg-white lg:flex">
        <div className="flex h-16 items-center gap-2 border-b border-neutral-200 px-5">
          <div className="grid size-9 place-items-center rounded-lg bg-[#53AC30] font-bold text-white">G</div>
          <div className="leading-tight">
            <p className="text-sm font-semibold">Grupo Santacruz</p>
            <p className="text-xs text-neutral-500">Panel admin</p>
          </div>
        </div>

        <nav className="flex-1 space-y-4 overflow-y-auto p-3">
          {sections.map((section, idx) => (
            <div key={section.title ?? `section-${idx}`} className="space-y-1">
              {section.title ? (
                <div className="mt-2 flex items-center gap-2 px-3 pb-1 pt-3">
                  <FlaskConical className="size-3.5 text-amber-500" />
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-600">
                    {section.title}
                  </span>
                  <div className="h-px flex-1 bg-amber-200" />
                </div>
              ) : null}
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? section.title
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-[#EAF6E4] text-[#2F6B1C]'
                        : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
                    )
                  }
                >
                  <item.icon className="size-4" />
                  {item.label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="border-t border-neutral-200 p-3">
          <div className="mb-2 flex items-center gap-3 rounded-md px-2 py-2">
            <Avatar className="size-9">
              <AvatarFallback className="bg-[#53AC30] text-white">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-semibold">{user?.name}</p>
              <p className="truncate text-xs text-neutral-500">{user?.email}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="w-full" onClick={handleLogout}>
            <LogOut className="size-4" /> Cerrar sesión
          </Button>
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-neutral-200 bg-white px-4 lg:hidden">
        <div className="flex items-center gap-2">
          <div className="grid size-8 place-items-center rounded-md bg-[#53AC30] font-bold text-white">G</div>
          <p className="font-semibold">Admin Santacruz</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="size-4" />
        </Button>
      </header>

      <main className="lg:pl-64">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <Outlet />
        </div>
      </main>

      <Toaster richColors position="top-right" />
    </div>
  );
}

export function PageTitle({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-[#EAF6E4] px-2.5 py-1 text-xs font-medium text-[#2F6B1C]">
          <BarChart3 className="size-3.5" /> Admin
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? <p className="text-sm text-neutral-500">{description}</p> : null}
      </div>
      {action ? <div className="flex gap-2">{action}</div> : null}
    </div>
  );
}
