import { NavLink } from 'react-router-dom';
import { Leaf, X } from 'lucide-react';
import { MODULOS } from '../../config/modulos';
import { useAuth } from '../../context/AuthContext';
import { useNotificaciones } from '../../context/NotificacionesContext';

export default function Sidebar({ abierto, onCerrar }) {
  const { puede } = useAuth();
  const { noLeidas } = useNotificaciones();
  const visibles = MODULOS.filter((m) => puede(m.clave, 'leer'));

  return (
    <>
      {abierto && (
        <div
          className="fixed inset-0 z-30 bg-stone-900/50 backdrop-blur-sm lg:hidden"
          onClick={onCerrar}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-green-950 text-green-50 transition-transform duration-300 lg:translate-x-0 ${
          abierto ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-600">
              <Leaf className="h-5 w-5 text-white" />
            </div>
            <div className="leading-tight">
              <p className="text-base font-bold">La Querencia</p>
              <p className="text-xs text-green-300">Agenda digital</p>
            </div>
          </div>
          <button onClick={onCerrar} className="rounded-lg p-1 hover:bg-green-900 lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-4 pb-6">
          {visibles.map(({ clave, nombre, ruta, icono: Icono }) => (
            <NavLink
              key={clave}
              to={ruta}
              end={ruta === '/'}
              onClick={onCerrar}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? 'bg-green-700 text-white shadow-sm'
                    : 'text-green-200 hover:bg-green-900 hover:text-white'
                }`
              }
            >
              <Icono className="h-5 w-5 shrink-0" />
              {nombre}
              {clave === 'notificaciones' && noLeidas > 0 && (
                <span className="ml-auto rounded-full bg-amber-400 px-2 py-0.5 text-xs font-bold text-green-950">
                  {noLeidas}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <p className="px-6 pb-5 text-xs text-green-400">Hacienda La Querencia</p>
      </aside>
    </>
  );
}