import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { apiErrorMessage } from '@/lib/admin-api';

export default function AdminLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user } = useAuth();
  const [email, setEmail] = useState('admin@gruposantacruz.com');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) {
    navigate('/admin', { replace: true });
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('¡Bienvenido!');
      const dest = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/admin';
      navigate(dest, { replace: true });
    } catch (err) {
      toast.error(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex items-center justify-center bg-white p-8">
        <form onSubmit={onSubmit} className="w-full max-w-sm space-y-6">
          <div>
            <div className="mb-3 inline-flex size-12 items-center justify-center rounded-xl bg-[#53AC30] text-white">
              <Lock className="size-5" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">Panel de administración</h1>
            <p className="text-sm text-neutral-500">Ingresa con tus credenciales corporativas.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Correo</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <Button type="submit" className="w-full bg-[#53AC30] hover:bg-[#468F28]" disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />} Entrar
          </Button>

          <p className="text-center text-xs text-neutral-400">
            Demo: <code>admin@gruposantacruz.com</code> · <code>admin1234</code>
          </p>
        </form>
      </div>
      <div className="hidden bg-gradient-to-br from-[#2F6B1C] via-[#53AC30] to-[#86c46d] lg:flex lg:flex-col lg:justify-between lg:p-12 lg:text-white">
        <div>
          <p className="text-sm uppercase tracking-widest opacity-80">Grupo Santacruz</p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight">
            Administra tu portal de clientes en un solo lugar.
          </h2>
        </div>
        <ul className="space-y-3 text-sm">
          <li>✓ Productos, promociones y galería editables.</li>
          <li>✓ Subida de fotos y videos protegida.</li>
          <li>✓ Leads de vendedores en tiempo real.</li>
        </ul>
      </div>
    </div>
  );
}
