import { Navigate, Outlet } from 'react-router-dom';
import { Loader2, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export function Cargando() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-green-700" />
    </div>
  );
}

// Exige haber iniciado sesión
export default function ProtectedRoute() {
  const { session, perfil, loading, signOut } = useAuth();

  if (loading) return <Cargando />;
  if (!session) return <Navigate to="/login" replace />;

  if (!perfil || !perfil.activo) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="card max-w-md p-8 text-center">
          <ShieldAlert className="mx-auto mb-4 h-10 w-10 text-amber-600" />
          <h2 className="text-lg font-bold">Cuenta no disponible</h2>
          <p className="mt-2 text-sm text-stone-600">
            Tu cuenta está inactiva o no se pudo cargar tu perfil. Contacta al administrador.
          </p>
          <button onClick={signOut} className="btn-primary mt-6">
            Cerrar sesión
          </button>
        </div>
      </div>
    );
  }

  return <Outlet />;
}

// Exige permiso de lectura sobre un módulo
export function RequirePermiso({ modulo, children }) {
  const { puede } = useAuth();

  if (!puede(modulo, 'leer')) {
    return (
      <div className="card mx-auto mt-10 max-w-md p-8 text-center">
        <ShieldAlert className="mx-auto mb-4 h-10 w-10 text-amber-600" />
        <h2 className="text-lg font-bold">Acceso restringido</h2>
        <p className="mt-2 text-sm text-stone-600">
          Tu rol no tiene permiso para ver este módulo.
        </p>
      </div>
    );
  }
  return children;
}