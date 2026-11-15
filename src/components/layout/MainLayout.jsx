import { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Bell, LogOut, Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import {
  NotificacionesProvider,
  useNotificaciones,
} from '../../context/NotificacionesContext';

function Estructura() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const { perfil, rol, signOut } = useAuth();
  const { noLeidas } = useNotificaciones();

  const iniciales = perfil.nombre_completo
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-screen">
      <Sidebar abierto={menuAbierto} onCerrar={() => setMenuAbierto(false)} />

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-stone-200 bg-white/80 px-4 py-3 backdrop-blur lg:px-8">
          <button
            onClick={() => setMenuAbierto(true)}
            className="rounded-lg p-2 text-stone-600 hover:bg-stone-100 lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="hidden lg:block" />

          <div className="flex items-center gap-2">
            <Link to="/notificaciones" className="btn-ghost relative px-3" title="Notificaciones">
              <Bell className="h-5 w-5" />
              {noLeidas > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
                  {noLeidas}
                </span>
              )}
            </Link>

            <div className="ml-2 hidden text-right sm:block">
              <p className="text-sm font-semibold leading-tight">{perfil.nombre_completo}</p>
              <p className="text-xs text-green-700">{rol}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-800">
              {iniciales}
            </div>
            <button onClick={signOut} className="btn-ghost px-3" title="Cerrar sesión">
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>

        <main className="p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function MainLayout() {
  return (
    <NotificacionesProvider>
      <Estructura />
    </NotificacionesProvider>
  );
}