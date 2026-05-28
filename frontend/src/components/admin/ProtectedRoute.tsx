import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-neutral-50">
        <Loader2 className="size-8 animate-spin text-[#53AC30]" />
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }
  return <>{children}</>;
}
